import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { consumeCredits, refundCredits } from "./credits.server";
import { enforceRateLimit } from "./rate-limit.server";

const MODEL = "fal-ai/birefnet/v2";
const COST = 6;

const UploadInput = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  base64: z.string().min(10),
});

export const uploadBgrSource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bin = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bin.byteLength > 20 * 1024 * 1024) throw new Error("Image too large (max 20MB)");
    const ext = data.filename.includes(".") ? data.filename.split(".").pop() : "png";
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
    const path = `${userId}/bgr/${yyyymm}/${Date.now()}-${safe}.${ext}`;
    const { error } = await supabase.storage.from("generations")
      .upload(path, bin, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { path };
  });

const RunInput = z.object({ assetPath: z.string().min(1) });

export const removeBackground = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RunInput.parse(d))
  .handler(async ({ data, context }) => {
    const falKey = process.env.FAL_KEY;
    if (!falKey) throw new Error("Background remover not configured (FAL_KEY missing)");
    const { supabase, userId } = context;
    if (!data.assetPath.startsWith(`${userId}/`)) throw new Error("Invalid path");

    const { data: prof } = await supabase
      .from("profiles").select("credits").eq("id", userId).maybeSingle();
    if (!prof || prof.credits < COST) throw new Error(`Need ${COST} credits.`);

    const { data: signed } = await supabase.storage.from("generations")
      .createSignedUrl(data.assetPath, 60 * 60);
    const srcUrl = signed?.signedUrl;
    if (!srcUrl) throw new Error("Could not read source");

    const { data: row, error: insErr } = await supabase.from("generations").insert({
      user_id: userId, kind: "image", model: MODEL, prompt: "Background removed",
      params: { provider: "fal", model_path: MODEL, source_path: data.assetPath, op: "bg-remove" },
      status: "running",
    }).select("id").single();
    if (insErr || !row) throw new Error(insErr?.message ?? "Failed to start job");

    await consumeCredits(supabase, {
      userId, amount: COST, reason: "bg-remove", refId: row.id, idem: `bgr:${row.id}`,
    });

    try {
      const r = await fetch(`https://fal.run/${MODEL}`, {
        method: "POST",
        headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ image_url: srcUrl }),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`Provider error ${r.status}: ${t.slice(0, 200)}`);
      }
      const json = await r.json() as { image?: { url: string }; images?: { url: string }[] };
      const outUrl = json.image?.url ?? json.images?.[0]?.url;
      if (!outUrl) throw new Error("No output");

      const dl = await fetch(outUrl);
      if (!dl.ok) throw new Error(`fetch result ${dl.status}`);
      const bin = new Uint8Array(await dl.arrayBuffer());
      const contentType = dl.headers.get("content-type") ?? "image/png";
      const ext = (contentType.split("/")[1] || "png").split(";")[0];
      const outPath = `${userId}/bgr/out/${Date.now()}.${ext}`;
      let finalUrl = outUrl;
      const { error: upErr } = await supabase.storage.from("generations")
        .upload(outPath, bin, { contentType, upsert: false });
      if (!upErr) {
        const { data: pub } = await supabase.storage.from("generations")
          .createSignedUrl(outPath, 60 * 60 * 24 * 365);
        if (pub?.signedUrl) finalUrl = pub.signedUrl;
      }
      await supabase.from("generations").update({
        status: "succeeded", asset_url: finalUrl, thumb_url: finalUrl,
      }).eq("id", row.id);
      return { id: row.id, url: finalUrl, cost: COST };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed";
      await supabase.from("generations").update({ status: "failed", error: message }).eq("id", row.id);
      await refundCredits(supabase, {
        userId, amount: COST, reason: "refund:bg-remove", refId: row.id, idem: `refund:bgr:${row.id}`,
      });
      throw new Error(message);
    }
  });

export const BGR_COST = COST;
