import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { consumeCredits, refundCredits } from "./credits.server";
import { enforceRateLimit } from "./rate-limit.server";
import { findVideoModel, VIDEO_MODELS } from "./model-registry";

const VideoInput = z.object({
  prompt: z.string().min(2).max(2000),
  model: z.string().default(VIDEO_MODELS[0].id),
  aspect: z.string().default("9:16"),
  duration: z.number().int().min(1).max(15).default(5),
  resolution: z.enum(["480p", "720p", "1080p"]).default("720p"),
  startFrameUrl: z.string().url().optional(),
  endFrameUrl: z.string().url().optional(),
});

// Upload a reference frame (start/end) to Supabase storage and return a
// short-lived signed URL the fal provider can fetch.
const FrameInput = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1),
  dataBase64: z.string().min(10),
});

export const uploadVideoFrame = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => FrameInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (!/^image\//.test(data.contentType)) throw new Error("Frame must be an image");
    const bytes = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    if (bytes.byteLength > 10 * 1024 * 1024) throw new Error("Frame must be ≤ 10MB");
    const ext = data.filename.includes(".") ? data.filename.split(".").pop() : "png";
    const path = `${userId}/frames/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("generations")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data: signed } = await supabase.storage.from("generations")
      .createSignedUrl(path, 60 * 60 * 2);
    if (!signed?.signedUrl) throw new Error("Failed to sign frame URL");
    return { url: signed.signedUrl };
  });

// Map a text-to-video model path to its image-to-video sibling when the
// caller supplies a start frame. Falls back to the original path.
function toI2VPath(modelPath: string): string {
  return modelPath.replace("/text-to-video", "/image-to-video");
}

export const generateVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VideoInput.parse(d))
  .handler(async ({ data, context }) => {
    const falKey = process.env.FAL_KEY;
    if (!falKey) throw new Error("Video service not configured (FAL_KEY missing)");
    const { supabase, userId } = context;

    const model = findVideoModel(data.model);
    if (!model) throw new Error(`Unsupported video model: ${data.model}`);
    if (!model.aspects.includes(data.aspect as never)) {
      throw new Error(`${model.label} doesn't support aspect ${data.aspect}`);
    }
    if (!model.durations.includes(data.duration)) {
      throw new Error(`${model.label} doesn't support ${data.duration}s`);
    }
    if (!model.resolutions.includes(data.resolution)) {
      throw new Error(`${model.label} doesn't support ${data.resolution}`);
    }
    if (data.startFrameUrl && !model.supportsStartFrame) {
      throw new Error(`${model.label} doesn't support start frames`);
    }
    if (data.endFrameUrl && !model.supportsEndFrame) {
      throw new Error(`${model.label} doesn't support end frames`);
    }

    const cost = model.cost(data.duration, data.resolution);

    const { data: prof } = await supabase
      .from("profiles").select("credits").eq("id", userId).maybeSingle();
    if (!prof || prof.credits < cost) {
      throw new Error(`Need ${cost} credits to generate this video.`);
    }

    const useI2V = Boolean(data.startFrameUrl);
    const modelPath = useI2V ? toI2VPath(data.model) : data.model;

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        kind: "video",
        model: data.model,
        prompt: data.prompt,
        params: {
          aspect: data.aspect, duration: data.duration, resolution: data.resolution,
          start_frame_url: data.startFrameUrl ?? null,
          end_frame_url: data.endFrameUrl ?? null,
        },
        status: "queued",
      })
      .select("id").single();
    if (insErr || !row) throw new Error(insErr?.message ?? "Failed to start video job");

    // Build provider body per model family
    const body: Record<string, unknown> = {
      prompt: data.prompt,
      aspect_ratio: data.aspect,
      duration: String(data.duration),
    };
    if (model.vendor === "ByteDance" || model.vendor === "MiniMax") {
      body.resolution = data.resolution;
    }
    if (useI2V && data.startFrameUrl) {
      body.image_url = data.startFrameUrl;
    }
    if (data.endFrameUrl) {
      // Kling uses tail_image_url; Seedance Pro uses end_image_url.
      if (model.vendor === "Kling") body.tail_image_url = data.endFrameUrl;
      else body.end_image_url = data.endFrameUrl;
    }

    const submit = await fetch(`https://queue.fal.run/${modelPath}`, {
      method: "POST",
      headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!submit.ok) {
      const text = await submit.text();
      await supabase.from("generations").update({ status: "failed", error: text.slice(0, 300) }).eq("id", row.id);
      throw new Error(`Video provider error (${submit.status}): ${text.slice(0, 200)}`);
    }
    const submitJson = await submit.json() as { request_id?: string };
    const requestId = submitJson.request_id;
    if (!requestId) {
      await supabase.from("generations").update({ status: "failed", error: "no request_id" }).eq("id", row.id);
      throw new Error("Video provider did not return a request id");
    }

    await consumeCredits(supabase, {
      userId, amount: cost, reason: `video:${model.key}`, refId: row.id, idem: `video:${row.id}`,
    });

    await supabase.from("generations").update({
      status: "running",
      params: {
        aspect: data.aspect, duration: data.duration, resolution: data.resolution,
        start_frame_url: data.startFrameUrl ?? null,
        end_frame_url: data.endFrameUrl ?? null,
        request_id: requestId, provider: "fal", model_path: modelPath, cost,
      },
    }).eq("id", row.id);

    return { id: row.id, requestId, cost };
  });

const PollInput = z.object({ id: z.string().uuid() });

export const pollGeneration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PollInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("generations")
      .select("id,user_id,kind,status,asset_url,thumb_url,error,params,model")
      .eq("id", data.id).maybeSingle();
    if (error || !row) throw new Error("Generation not found");
    if (row.user_id !== userId) throw new Error("Forbidden");

    if (row.status === "succeeded" || row.status === "failed") {
      return { status: row.status, url: row.asset_url, error: row.error };
    }

    const params = (row.params ?? {}) as {
      request_id?: string; provider?: string; model_path?: string; cost?: number;
    };
    if (params.provider !== "fal" || !params.request_id || !params.model_path) {
      return { status: row.status, url: row.asset_url, error: row.error };
    }

    const falKey = process.env.FAL_KEY;
    if (!falKey) throw new Error("FAL_KEY missing");

    const statusUrl = `https://queue.fal.run/${params.model_path}/requests/${params.request_id}/status`;
    const sResp = await fetch(statusUrl, { headers: { Authorization: `Key ${falKey}` } });
    if (!sResp.ok) return { status: row.status, url: null, error: null };
    const sJson = await sResp.json() as { status?: string };

    if (sJson.status === "IN_QUEUE" || sJson.status === "IN_PROGRESS") {
      return { status: "running" as const, url: null, error: null };
    }
    if (sJson.status === "COMPLETED") {
      const resultUrl = `https://queue.fal.run/${params.model_path}/requests/${params.request_id}`;
      const rResp = await fetch(resultUrl, { headers: { Authorization: `Key ${falKey}` } });
      if (!rResp.ok) {
        const txt = await rResp.text();
        await supabase.from("generations").update({ status: "failed", error: `fetch result: ${txt.slice(0, 200)}` }).eq("id", row.id);
        return { status: "failed" as const, url: null, error: txt.slice(0, 200) };
      }
      const rJson = await rResp.json() as {
        video?: { url?: string; content_type?: string };
        audio?: { url?: string; content_type?: string };
        image?: { url?: string; content_type?: string };
      };
      const remote = rJson?.video ?? rJson?.audio ?? rJson?.image;
      const remoteUrl = remote?.url;
      if (!remoteUrl) {
        await supabase.from("generations").update({ status: "failed", error: "no output url" }).eq("id", row.id);
        return { status: "failed" as const, url: null, error: "no output url" };
      }
      try {
        const dl = await fetch(remoteUrl);
        if (!dl.ok) throw new Error(`download ${dl.status}`);
        const bytes = new Uint8Array(await dl.arrayBuffer());
        const ctype = remote?.content_type
          ?? dl.headers.get("content-type")
          ?? (rJson.audio ? "audio/mpeg" : rJson.image ? "image/png" : "video/mp4");
        const ext = (ctype.split("/")[1] || "bin").split(";")[0];
        const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
        const path = `${userId}/${yyyymm}/${row.id}.${ext}`;
        const { error: upErr } = await supabase.storage.from("generations")
          .upload(path, bytes, { contentType: ctype, upsert: false });
        if (upErr) throw new Error(upErr.message);
        const { data: signed } = await supabase.storage.from("generations")
          .createSignedUrl(path, 60 * 60 * 24 * 365);
        const finalUrl = signed?.signedUrl ?? remoteUrl;
        await supabase.from("generations").update({
          status: "succeeded", asset_url: finalUrl, thumb_url: finalUrl,
        }).eq("id", row.id);
        return { status: "succeeded" as const, url: finalUrl, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "persist failed";
        await supabase.from("generations").update({ status: "failed", error: msg }).eq("id", row.id);
        return { status: "failed" as const, url: null, error: msg };
      }
    }

    const errText = String(sJson.status ?? "unknown error");
    const refund = params.cost ?? 0;
    await supabase.from("generations").update({ status: "failed", error: errText }).eq("id", row.id);
    if (refund > 0) {
      await refundCredits(supabase, {
        userId, amount: refund, reason: `refund:${row.kind}`,
        refId: row.id, idem: `refund:${row.kind}:${row.id}`,
      });
    }
    return { status: "failed" as const, url: null, error: errText };
  });
