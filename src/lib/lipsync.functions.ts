import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const LIPSYNC_MODEL = "fal-ai/sync-lipsync/v2";
const COST_LIPSYNC = 60;

const Input = z.object({
  // Either a path under user folder in `generations` bucket, or a public https URL
  videoSource: z.object({
    kind: z.enum(["storage", "url"]),
    value: z.string().min(1),
  }),
  audioSource: z.object({
    kind: z.enum(["storage", "url"]),
    value: z.string().min(1),
  }),
  prompt: z.string().max(500).optional().default(""),
});

async function resolveUrl(
  supabase: { storage: { from: (b: string) => { createSignedUrl: (p: string, n: number) => Promise<{ data: { signedUrl: string } | null }> } } },
  userId: string,
  src: { kind: "storage" | "url"; value: string },
): Promise<string> {
  if (src.kind === "url") {
    if (!/^https?:\/\//i.test(src.value)) throw new Error("Invalid URL");
    return src.value;
  }
  if (!src.value.startsWith(`${userId}/`)) throw new Error("Invalid file path");
  const { data } = await supabase.storage.from("generations").createSignedUrl(src.value, 60 * 60);
  if (!data?.signedUrl) throw new Error("Could not read uploaded file");
  return data.signedUrl;
}

export const generateLipsync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const falKey = process.env.FAL_KEY;
    if (!falKey) throw new Error("Lipsync service not configured (FAL_KEY missing)");
    const { supabase, userId } = context;

    const { data: prof } = await supabase
      .from("profiles").select("credits").eq("id", userId).maybeSingle();
    if (!prof || prof.credits < COST_LIPSYNC) {
      throw new Error(`Need ${COST_LIPSYNC} credits to generate lipsync.`);
    }

    const [videoUrl, audioUrl] = await Promise.all([
      resolveUrl(supabase, userId, data.videoSource),
      resolveUrl(supabase, userId, data.audioSource),
    ]);

    const { data: row, error: insErr } = await supabase
      .from("generations").insert({
        user_id: userId,
        kind: "lipsync",
        model: LIPSYNC_MODEL,
        prompt: data.prompt,
        params: { provider: "fal", model_path: LIPSYNC_MODEL, cost: COST_LIPSYNC },
        status: "queued",
      }).select("id").single();
    if (insErr || !row) throw new Error(insErr?.message ?? "Failed to start lipsync job");

    const submit = await fetch(`https://queue.fal.run/${LIPSYNC_MODEL}`, {
      method: "POST",
      headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        video_url: videoUrl,
        audio_url: audioUrl,
        sync_mode: "cut_off",
      }),
    });
    if (!submit.ok) {
      const text = await submit.text();
      await supabase.from("generations").update({
        status: "failed", error: text.slice(0, 300),
      }).eq("id", row.id);
      throw new Error(`Lipsync provider error (${submit.status}): ${text.slice(0, 200)}`);
    }
    const submitJson = await submit.json() as { request_id?: string };
    const requestId = submitJson.request_id;
    if (!requestId) {
      await supabase.from("generations").update({ status: "failed", error: "no request_id" }).eq("id", row.id);
      throw new Error("Lipsync provider did not return a request id");
    }

    await supabase.from("credits_ledger").insert({
      user_id: userId, delta: -COST_LIPSYNC, reason: "lipsync", ref_id: row.id,
    });
    await supabase.from("profiles").update({ credits: prof.credits - COST_LIPSYNC }).eq("id", userId);

    await supabase.from("generations").update({
      status: "running",
      params: { provider: "fal", model_path: LIPSYNC_MODEL, request_id: requestId, cost: COST_LIPSYNC },
    }).eq("id", row.id);

    return { id: row.id, cost: COST_LIPSYNC };
  });

const UploadInput = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  base64: z.string().min(10),
  kind: z.enum(["video", "audio", "image"]),
});

export const uploadLipsyncAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bin = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    const ext = data.filename.includes(".") ? data.filename.split(".").pop() : "bin";
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
    const path = `${userId}/uploads/${yyyymm}/${Date.now()}-${safe}.${ext}`;
    const { error } = await supabase.storage.from("generations")
      .upload(path, bin, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    return { path };
  });
