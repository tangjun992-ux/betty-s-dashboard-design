import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { consumeCredits, refundCredits } from "./credits.server";
import { enforceRateLimit } from "./rate-limit.server";

const REMOVE_BG_MODEL = "fal-ai/birefnet/v2";
const UPSCALE_MODEL = "fal-ai/clarity-upscaler";
const INPAINT_MODEL = "fal-ai/flux-pro/v1/fill";

const COST = { remove_bg: 8, upscale: 20, inpaint: 30 } as const;

const UploadInput = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  base64: z.string().min(10),
});

export const uploadEditorImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bin = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bin.byteLength > 15 * 1024 * 1024) throw new Error("Image too large (max 15MB)");
    const ext = data.filename.includes(".") ? data.filename.split(".").pop() : "png";
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
    const path = `${userId}/editor/${yyyymm}/${Date.now()}-${safe}.${ext}`;
    const { error } = await supabase.storage.from("generations")
      .upload(path, bin, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data: signed } = await supabase.storage.from("generations").createSignedUrl(path, 60 * 60);
    return { path, url: signed?.signedUrl ?? null };
  });

const EditInput = z.object({
  action: z.enum(["remove_bg", "upscale", "inpaint"]),
  imagePath: z.string().min(1),
  // inpaint extras
  maskPath: z.string().optional(),
  prompt: z.string().max(800).optional().default(""),
  // upscale extras
  scale: z.number().min(1).max(4).optional().default(2),
});

async function fetchAsBlob(url: string): Promise<{ bin: Uint8Array; contentType: string }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Failed to fetch result image (${r.status})`);
  const contentType = r.headers.get("content-type") || "image/png";
  const buf = new Uint8Array(await r.arrayBuffer());
  return { bin: buf, contentType };
}

export const runImageEdit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => EditInput.parse(d))
  .handler(async ({ data, context }) => {
    const falKey = process.env.FAL_KEY;
    if (!falKey) throw new Error("Image editor not configured (FAL_KEY missing)");
    const { supabase, userId } = context;
    if (!data.imagePath.startsWith(`${userId}/`)) throw new Error("Invalid file path");

    await enforceRateLimit(supabase, userId, "editor:submit", 20, 60);

    const cost = COST[data.action];

    const { data: signed } = await supabase.storage.from("generations")
      .createSignedUrl(data.imagePath, 60 * 60);
    const imageUrl = signed?.signedUrl;
    if (!imageUrl) throw new Error("Could not read source image");

    let modelPath = "";
    let body: Record<string, unknown> = {};
    if (data.action === "remove_bg") {
      modelPath = REMOVE_BG_MODEL;
      body = { image_url: imageUrl };
    } else if (data.action === "upscale") {
      modelPath = UPSCALE_MODEL;
      body = { image_url: imageUrl, upscale_factor: data.scale, creativity: 0.35, resemblance: 0.6 };
    } else {
      modelPath = INPAINT_MODEL;
      if (!data.maskPath) throw new Error("Mask required for inpainting");
      if (!data.maskPath.startsWith(`${userId}/`)) throw new Error("Invalid mask path");
      const { data: ms } = await supabase.storage.from("generations").createSignedUrl(data.maskPath, 60 * 60);
      if (!ms?.signedUrl) throw new Error("Could not read mask image");
      body = { image_url: imageUrl, mask_url: ms.signedUrl, prompt: data.prompt };
    }

    const editKind = data.action === "upscale" ? "upscale" : "image";
    const { data: row, error: insErr } = await supabase
      .from("generations").insert({
        user_id: userId,
        kind: editKind,
        model: modelPath,
        prompt: data.prompt ?? "",
        params: { action: data.action, provider: "fal", model_path: modelPath, cost },
        status: "queued",
      }).select("id").single();
    if (insErr || !row) throw new Error(insErr?.message ?? "Failed to start job");

    // Atomic: charge first, refund on downstream failure.
    await consumeCredits(supabase, {
      userId, amount: cost, reason: `editor:${data.action}`, refId: row.id, idem: `editor:${row.id}`,
    });

    try {
      const r = await fetch(`https://fal.run/${modelPath}`, {
        method: "POST",
        headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`Image editor error (${r.status}): ${t.slice(0, 200)}`);
      }
      const json = await r.json() as { image?: { url: string }; images?: { url: string }[] };
      const outUrl = json.image?.url ?? json.images?.[0]?.url;
      if (!outUrl) throw new Error("Editor returned no image");

      const { bin, contentType } = await fetchAsBlob(outUrl);
      const ext = (contentType.split("/")[1] || "png").split(";")[0];
      const outPath = `${userId}/editor/out/${Date.now()}-${data.action}.${ext}`;
      const { error: upErr } = await supabase.storage.from("generations")
        .upload(outPath, bin, { contentType, upsert: false });
      let finalUrl = outUrl;
      if (!upErr) {
        const { data: pub } = await supabase.storage.from("generations").createSignedUrl(outPath, 60 * 60 * 24 * 7);
        if (pub?.signedUrl) finalUrl = pub.signedUrl;
      }

      await supabase.from("generations").update({
        status: "succeeded",
        asset_url: finalUrl,
        thumb_url: finalUrl,
        params: { action: data.action, provider: "fal", model_path: modelPath, cost, source_path: data.imagePath },
      }).eq("id", row.id);

      return { id: row.id, url: finalUrl, cost };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "editor failed";
      await refundCredits(supabase, {
        userId, amount: cost, reason: `editor:${data.action}:refund`, refId: row.id, idem: `editor:refund:${row.id}`,
      });
      await supabase.from("generations").update({ status: "failed", error: msg.slice(0, 300) }).eq("id", row.id);
      throw err;
    }
  });

export const EDITOR_COSTS = COST;
