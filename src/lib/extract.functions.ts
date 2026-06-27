import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { consumeCredits } from "./credits.server";

const COST_EXTRACT = 2;
const MAX_BYTES = 20 * 1024 * 1024;

const UploadInput = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().min(1).max(120),
  base64: z.string().min(10),
});

export const uploadExtractAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UploadInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const bin = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    if (bin.byteLength > MAX_BYTES) throw new Error("File too large (max 20MB)");
    const ext = data.filename.includes(".") ? data.filename.split(".").pop() : "bin";
    const safe = data.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    const path = `${userId}/extract/${Date.now()}-${safe}.${ext}`;
    const { error } = await supabase.storage.from("generations")
      .upload(path, bin, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);
    const { data: signed } = await supabase.storage.from("generations").createSignedUrl(path, 60 * 60);
    return { path, url: signed?.signedUrl ?? null, contentType: data.contentType };
  });

const ExtractInput = z.object({
  source: z.enum(["url", "upload"]),
  url: z.string().url().optional(),
  imagePath: z.string().optional(),
  contentType: z.string().optional(),
});

const SYSTEM = `You are a prompt-engineering assistant. Given a single image (or a video frame), reverse-engineer the exact prompt that would have produced it with a modern text-to-image / text-to-video model.
Return ONLY the prompt text. No preface, no quotes, no markdown.
The prompt MUST include, in this order, separated by commas:
1) Subject and action,
2) Setting / background,
3) Composition & camera (shot type, angle, lens),
4) Lighting,
5) Color palette / mood,
6) Style / medium / artist references (if obvious),
7) Quality tags (e.g. "ultra detailed, 8k, photorealistic" when appropriate).
Keep it under 90 words.`;

async function fetchAsDataUrl(url: string): Promise<{ dataUrl: string; mime: string }> {
  const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 Betty/1.0" } });
  if (!r.ok) throw new Error(`Could not fetch URL (${r.status})`);
  const mime = (r.headers.get("content-type") || "image/jpeg").split(";")[0];
  if (!mime.startsWith("image/") && !mime.startsWith("video/")) {
    throw new Error("URL must point to an image or video file. For TikTok / Instagram / YouTube links, please download the media and upload it instead.");
  }
  const buf = new Uint8Array(await r.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) throw new Error("Remote file is too large (max 20MB)");
  let bin = "";
  for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
  return { dataUrl: `data:${mime};base64,${btoa(bin)}`, mime };
}

export const extractPrompt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ExtractInput.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");
    const { supabase, userId } = context;

    const { data: prof } = await supabase
      .from("profiles").select("credits").eq("id", userId).maybeSingle();
    if (!prof || prof.credits < COST_EXTRACT) throw new Error(`Need ${COST_EXTRACT} credits.`);

    let dataUrl = "";
    let mime = "";
    if (data.source === "url") {
      if (!data.url) throw new Error("URL required");
      const r = await fetchAsDataUrl(data.url);
      dataUrl = r.dataUrl; mime = r.mime;
    } else {
      if (!data.imagePath) throw new Error("Upload required");
      if (!data.imagePath.startsWith(`${userId}/`)) throw new Error("Invalid path");
      const { data: file, error } = await supabase.storage.from("generations").download(data.imagePath);
      if (error || !file) throw new Error("Could not read uploaded file");
      const buf = new Uint8Array(await file.arrayBuffer());
      mime = data.contentType || file.type || "image/jpeg";
      let bin = "";
      for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
      dataUrl = `data:${mime};base64,${btoa(bin)}`;
    }

    const isVideo = mime.startsWith("video/");
    const userContent: Array<Record<string, unknown>> = [
      { type: "text", text: isVideo ? "Analyze this video and return the prompt." : "Analyze this image and return the prompt." },
    ];
    if (isVideo) {
      userContent.push({ type: "image_url", image_url: { url: dataUrl } });
    } else {
      userContent.push({ type: "image_url", image_url: { url: dataUrl } });
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userContent },
        ],
        temperature: 0.4,
      }),
    });
    if (!resp.ok) {
      const t = await resp.text();
      if (resp.status === 429) throw new Error("Rate limited, try again shortly.");
      if (resp.status === 402) throw new Error("AI credits exhausted on this workspace.");
      throw new Error(`Extractor error: ${t.slice(0, 200)}`);
    }
    const json = await resp.json() as { choices?: { message?: { content?: string } }[] };
    const prompt = json.choices?.[0]?.message?.content?.trim() ?? "";
    if (!prompt) throw new Error("Model returned empty prompt");

    const { data: row } = await supabase.from("generations").insert({
      user_id: userId, kind: "extract", model: "google/gemini-2.5-flash",
      prompt, status: "succeeded",
      params: { source: data.source, url: data.url ?? null, image_path: data.imagePath ?? null, mime },
    }).select("id").single();

    await consumeCredits(supabase, {
      userId, amount: COST_EXTRACT, reason: "extract_prompt", refId: row?.id ?? undefined, idem: row?.id ? `extract:${row.id}` : undefined,
    });

    return { id: row?.id ?? null, prompt, cost: COST_EXTRACT };
  });

export const EXTRACT_COST = COST_EXTRACT;
