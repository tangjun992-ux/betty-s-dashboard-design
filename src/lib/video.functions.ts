import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const VideoInput = z.object({
  prompt: z.string().min(2).max(2000),
  aspect: z.enum(["16:9", "9:16", "1:1"]).default("9:16"),
  duration: z.enum(["5", "10"]).default("5"),
  model: z.enum(["fal-ai/bytedance/seedance/v1/lite/text-to-video"])
    .default("fal-ai/bytedance/seedance/v1/lite/text-to-video"),
});

const COST_VIDEO = 50;

export const generateVideo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => VideoInput.parse(d))
  .handler(async ({ data, context }) => {
    const falKey = process.env.FAL_KEY;
    if (!falKey) throw new Error("Video service not configured (FAL_KEY missing)");
    const { supabase, userId } = context;

    const { data: prof } = await supabase
      .from("profiles").select("credits").eq("id", userId).maybeSingle();
    if (!prof || prof.credits < COST_VIDEO) {
      throw new Error("Not enough credits. Need " + COST_VIDEO + " to generate video.");
    }

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        kind: "video",
        model: data.model,
        prompt: data.prompt,
        params: { aspect: data.aspect, duration: data.duration },
        status: "queued",
      })
      .select("id").single();
    if (insErr || !row) throw new Error(insErr?.message ?? "Failed to start video job");

    // Submit to fal queue
    const submit = await fetch(`https://queue.fal.run/${data.model}`, {
      method: "POST",
      headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: data.prompt,
        aspect_ratio: data.aspect,
        duration: data.duration,
      }),
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

    // Reserve credits up-front; refund on failure during poll.
    await supabase.from("credits_ledger").insert({
      user_id: userId, delta: -COST_VIDEO, reason: "video_generation", ref_id: row.id,
    });
    await supabase.from("profiles").update({ credits: prof.credits - COST_VIDEO }).eq("id", userId);

    await supabase.from("generations").update({
      status: "running",
      params: { aspect: data.aspect, duration: data.duration, request_id: requestId, provider: "fal", model_path: data.model },
    }).eq("id", row.id);

    return { id: row.id, requestId };
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

    const params = (row.params ?? {}) as { request_id?: string; provider?: string; model_path?: string };
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
      // Fetch the result
      const resultUrl = `https://queue.fal.run/${params.model_path}/requests/${params.request_id}`;
      const rResp = await fetch(resultUrl, { headers: { Authorization: `Key ${falKey}` } });
      if (!rResp.ok) {
        const txt = await rResp.text();
        await supabase.from("generations").update({ status: "failed", error: `fetch result: ${txt.slice(0, 200)}` }).eq("id", row.id);
        return { status: "failed" as const, url: null, error: txt.slice(0, 200) };
      }
      const rJson = await rResp.json() as { video?: { url?: string } };
      const remoteUrl = rJson?.video?.url;
      if (!remoteUrl) {
        await supabase.from("generations").update({ status: "failed", error: "no video url" }).eq("id", row.id);
        return { status: "failed" as const, url: null, error: "no video url" };
      }

      // Persist to storage (fal CDN URLs expire)
      try {
        const dl = await fetch(remoteUrl);
        if (!dl.ok) throw new Error(`download ${dl.status}`);
        const bytes = new Uint8Array(await dl.arrayBuffer());
        const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
        const path = `${userId}/${yyyymm}/${row.id}.mp4`;
        const { error: upErr } = await supabase.storage.from("generations")
          .upload(path, bytes, { contentType: "video/mp4", upsert: false });
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

    // Anything else — treat as failed, refund credits.
    const errText = String(sJson.status ?? "unknown error");
    await supabase.from("generations").update({ status: "failed", error: errText }).eq("id", row.id);
    await supabase.from("credits_ledger").insert({
      user_id: userId, delta: COST_VIDEO, reason: "refund_video", ref_id: row.id,
    });
    const { data: p2 } = await supabase.from("profiles").select("credits").eq("id", userId).maybeSingle();
    if (p2) await supabase.from("profiles").update({ credits: p2.credits + COST_VIDEO }).eq("id", userId);
    return { status: "failed" as const, url: null, error: errText };
  });
