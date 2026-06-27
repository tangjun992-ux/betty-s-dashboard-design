import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { consumeCredits, refundCredits } from "./credits.server";

const IMAGE_MODEL = "fal-ai/clarity-upscaler";
const VIDEO_MODEL = "fal-ai/topaz/upscale/video";

const COST = { image: 12, video: 60 } as const;

const UploadInput = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  base64: z.string().min(10),
  kind: z.enum(["image", "video"]),
});

export const uploadUpscaleAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bin = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const maxBytes = data.kind === "video" ? 80 * 1024 * 1024 : 20 * 1024 * 1024;
    if (bin.byteLength > maxBytes) {
      throw new Error(`File too large (max ${data.kind === "video" ? "80MB" : "20MB"})`);
    }
    const ext = data.filename.includes(".") ? data.filename.split(".").pop() : (data.kind === "video" ? "mp4" : "png");
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
    const path = `${userId}/upscale/${yyyymm}/${Date.now()}-${safe}.${ext}`;
    const { error } = await supabase.storage.from("generations")
      .upload(path, bin, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { path };
  });

const RunInput = z.object({
  assetPath: z.string().min(1),
  kind: z.enum(["image", "video"]),
  scale: z.union([z.literal(2), z.literal(3), z.literal(4)]).default(2),
});

async function fetchBin(url: string): Promise<{ bin: Uint8Array; contentType: string }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch result failed (${r.status})`);
  return { bin: new Uint8Array(await r.arrayBuffer()), contentType: r.headers.get("content-type") || "application/octet-stream" };
}

export const startUpscale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => RunInput.parse(d))
  .handler(async ({ data, context }) => {
    const falKey = process.env.FAL_KEY;
    if (!falKey) throw new Error("Upscaler not configured (FAL_KEY missing)");
    const { supabase, userId } = context;
    if (!data.assetPath.startsWith(`${userId}/`)) throw new Error("Invalid path");

    const cost = COST[data.kind];
    const { data: prof } = await supabase
      .from("profiles").select("credits").eq("id", userId).maybeSingle();
    if (!prof || prof.credits < cost) throw new Error(`Need ${cost} credits to upscale.`);

    const { data: signed } = await supabase.storage.from("generations")
      .createSignedUrl(data.assetPath, 60 * 60);
    const srcUrl = signed?.signedUrl;
    if (!srcUrl) throw new Error("Could not read source asset");

    const modelPath = data.kind === "video" ? VIDEO_MODEL : IMAGE_MODEL;
    const body: Record<string, unknown> = data.kind === "video"
      ? { video_url: srcUrl, upscale_factor: data.scale }
      : { image_url: srcUrl, upscale_factor: data.scale, creativity: 0.35, resemblance: 0.6 };

    const { data: row, error: insErr } = await supabase.from("generations").insert({
      user_id: userId,
      kind: "upscale",
      model: modelPath,
      prompt: "",
      params: { provider: "fal", model_path: modelPath, scale: data.scale, target_kind: data.kind, source_path: data.assetPath, cost },
      status: "queued",
    }).select("id").single();
    if (insErr || !row) throw new Error(insErr?.message ?? "Failed to start job");

    // Reserve credits up-front (atomic, idempotent)
    await consumeCredits(supabase, {
      userId, amount: cost, reason: `upscale:${data.kind}`, refId: row.id, idem: `upscale:${row.id}`,
    });

    if (data.kind === "image") {
      // sync
      const r = await fetch(`https://fal.run/${modelPath}`, {
        method: "POST",
        headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const t = await r.text();
        await supabase.from("generations").update({ status: "failed", error: t.slice(0, 300) }).eq("id", row.id);
        await refundCredits(supabase, { userId, amount: cost, reason: "refund:upscale", refId: row.id, idem: `refund:upscale:${row.id}` });
        throw new Error(`Upscaler error (${r.status})`);
      }
      const json = await r.json() as { image?: { url: string }; images?: { url: string }[] };
      const outUrl = json.image?.url ?? json.images?.[0]?.url;
      if (!outUrl) throw new Error("No output");
      const { bin, contentType } = await fetchBin(outUrl);
      const ext = (contentType.split("/")[1] || "png").split(";")[0];
      const outPath = `${userId}/upscale/out/${Date.now()}.${ext}`;
      let finalUrl = outUrl;
      const { error: upErr } = await supabase.storage.from("generations").upload(outPath, bin, { contentType, upsert: false });
      if (!upErr) {
        const { data: pub } = await supabase.storage.from("generations").createSignedUrl(outPath, 60 * 60 * 24 * 7);
        if (pub?.signedUrl) finalUrl = pub.signedUrl;
      }
      await supabase.from("generations").update({
        status: "succeeded", asset_url: finalUrl, thumb_url: finalUrl,
      }).eq("id", row.id);
      return { id: row.id, status: "succeeded" as const, url: finalUrl, cost };
    }

    // video → async queue
    const q = await fetch(`https://queue.fal.run/${modelPath}`, {
      method: "POST",
      headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!q.ok) {
      const t = await q.text();
      await supabase.from("generations").update({ status: "failed", error: t.slice(0, 300) }).eq("id", row.id);
      await refundCredits(supabase, { userId, amount: cost, reason: "refund:upscale", refId: row.id, idem: `refund:upscale:${row.id}` });
      throw new Error(`Upscaler queue error (${q.status})`);
    }
    const queued = await q.json() as { request_id: string };
    await supabase.from("generations").update({
      status: "running",
      params: { provider: "fal", model_path: modelPath, scale: data.scale, target_kind: data.kind, source_path: data.assetPath, cost, request_id: queued.request_id },
    }).eq("id", row.id);
    return { id: row.id, status: "running" as const, request_id: queued.request_id, cost };
  });

const PollInput = z.object({ id: z.string().uuid() });

export const pollUpscale = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PollInput.parse(d))
  .handler(async ({ data, context }) => {
    const falKey = process.env.FAL_KEY;
    if (!falKey) throw new Error("Upscaler not configured");
    const { supabase, userId } = context;
    const { data: row } = await supabase.from("generations")
      .select("id,user_id,status,asset_url,params,model")
      .eq("id", data.id).maybeSingle();
    if (!row || row.user_id !== userId) throw new Error("Not found");
    if (row.status === "succeeded" || row.status === "failed") {
      return { status: row.status, url: row.asset_url ?? null };
    }
    const p = row.params as { request_id?: string; model_path?: string; cost?: number } | null;
    const reqId = p?.request_id;
    const modelPath = p?.model_path ?? row.model;
    if (!reqId) return { status: row.status, url: null };

    const s = await fetch(`https://queue.fal.run/${modelPath}/requests/${reqId}/status`, {
      headers: { Authorization: `Key ${falKey}` },
    });
    if (!s.ok) return { status: row.status, url: null };
    const sj = await s.json() as { status: string };
    if (sj.status !== "COMPLETED") {
      if (sj.status === "FAILED") {
        await supabase.from("generations").update({ status: "failed", error: "provider failed" }).eq("id", row.id);
        if (p?.cost) {
          await refundCredits(supabase, { userId, amount: p.cost, reason: "refund:upscale", refId: row.id, idem: `refund:upscale:${row.id}` });
        }
        return { status: "failed" as const, url: null };
      }
      return { status: "running" as const, url: null };
    }
    const rr = await fetch(`https://queue.fal.run/${modelPath}/requests/${reqId}`, {
      headers: { Authorization: `Key ${falKey}` },
    });
    const rj = await rr.json() as { video?: { url: string } };
    const outUrl = rj.video?.url;
    if (!outUrl) {
      await supabase.from("generations").update({ status: "failed", error: "no output" }).eq("id", row.id);
      return { status: "failed" as const, url: null };
    }
    const { bin, contentType } = await fetchBin(outUrl);
    const ext = (contentType.split("/")[1] || "mp4").split(";")[0];
    const outPath = `${userId}/upscale/out/${Date.now()}.${ext}`;
    let finalUrl = outUrl;
    const { error: upErr } = await supabase.storage.from("generations").upload(outPath, bin, { contentType, upsert: false });
    if (!upErr) {
      const { data: pub } = await supabase.storage.from("generations").createSignedUrl(outPath, 60 * 60 * 24 * 7);
      if (pub?.signedUrl) finalUrl = pub.signedUrl;
    }
    await supabase.from("generations").update({
      status: "succeeded", asset_url: finalUrl, thumb_url: finalUrl,
    }).eq("id", row.id);
    return { status: "succeeded" as const, url: finalUrl };
  });

export const UPSCALE_COSTS = COST;
