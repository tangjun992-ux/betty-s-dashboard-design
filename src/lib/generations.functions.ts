import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { consumeCredits, refundCredits } from "./credits.server";
import { enforceRateLimit } from "./rate-limit.server";
import { findImageModel, IMAGE_MODELS } from "./model-registry";

const ImageInput = z.object({
  prompt: z.string().min(2).max(2000),
  model: z.string().default(IMAGE_MODELS[0].id),
  aspect: z.string().default("1:1"),
  quality: z.enum(["720p", "1K", "2K", "4K"]).default("1K"),
  batch: z.number().int().min(1).max(8).default(1),
});

function aspectToSize(aspect: string, quality: "720p" | "1K" | "2K" | "4K"): string {
  const base = quality === "4K" ? 2048 : quality === "2K" ? 1536 : quality === "720p" ? 768 : 1024;
  const map: Record<string, [number, number]> = {
    "1:1": [base, base],
    "16:9": [Math.round(base * 16 / 9 / 64) * 64, base],
    "9:16": [base, Math.round(base * 16 / 9 / 64) * 64],
    "4:3": [Math.round(base * 4 / 3 / 64) * 64, base],
    "3:4": [base, Math.round(base * 4 / 3 / 64) * 64],
    "3:2": [Math.round(base * 3 / 2 / 64) * 64, base],
    "2:3": [base, Math.round(base * 3 / 2 / 64) * 64],
    "4:5": [base, Math.round(base * 5 / 4 / 64) * 64],
    "21:9": [Math.round(base * 21 / 9 / 64) * 64, base],
  };
  const [w, h] = map[aspect] ?? [base, base];
  return `${w}x${h}`;
}

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ImageInput.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");
    const { supabase, userId } = context;

    const model = findImageModel(data.model);
    if (!model) throw new Error(`Unsupported image model: ${data.model}`);
    if (!model.aspects.includes(data.aspect as never)) {
      throw new Error(`${model.label} doesn't support aspect ${data.aspect}`);
    }
    if (!model.qualities.includes(data.quality)) {
      throw new Error(`${model.label} doesn't support quality ${data.quality}`);
    }
    if (data.batch > model.maxBatch) {
      throw new Error(`${model.label} supports max ${model.maxBatch} per run`);
    }

    // Rate limit: protects against runaway loops, bots, and credit-burn scripts.
    await enforceRateLimit(supabase, userId, "image:submit", 20, 60);

    const totalCost = model.cost * data.batch;

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        kind: "image",
        model: data.model,
        prompt: data.prompt,
        params: { aspect: data.aspect, quality: data.quality, batch: data.batch },
        status: "running",
      })
      .select("id").single();
    if (insErr || !row) throw new Error(insErr?.message ?? "Failed to start generation");

    // Atomic reserve: consume up-front so concurrent jobs cannot race past balance.
    await consumeCredits(supabase, {
      userId, amount: totalCost, reason: `image:${model.key}`, refId: row.id, idem: `image:${row.id}`,
    });

    try {
      let dataUrl: string | undefined;
      let mime = "image/png";

      if (model.endpoint === "chat") {
        // Gemini image family — chat completions with image modality
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: data.model,
            messages: [{ role: "user", content: data.prompt }],
            modalities: ["image", "text"],
          }),
        });
        if (!resp.ok) {
          const t = await resp.text();
          if (resp.status === 429) throw new Error("Rate limited. Try again shortly.");
          if (resp.status === 402) throw new Error("AI credits exhausted.");
          throw new Error(`AI error: ${t.slice(0, 200)}`);
        }
        const json = await resp.json();
        dataUrl = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      } else {
        // OpenAI image route — /v1/images/generations
        const size = aspectToSize(data.aspect, data.quality);
        const resp = await fetch("https://ai.gateway.lovable.dev/v1/images/generations", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: data.model,
            prompt: data.prompt,
            size,
            quality: data.quality === "2K" || data.quality === "4K" ? "high" : "low",
            n: 1,
          }),
        });
        if (!resp.ok) {
          const t = await resp.text();
          if (resp.status === 429) throw new Error("Rate limited.");
          if (resp.status === 402) throw new Error("AI credits exhausted.");
          throw new Error(`AI error: ${t.slice(0, 200)}`);
        }
        const json = await resp.json();
        const b64 = json?.data?.[0]?.b64_json;
        const url = json?.data?.[0]?.url;
        if (b64) dataUrl = `data:image/png;base64,${b64}`;
        else if (url) {
          const dl = await fetch(url);
          const buf = new Uint8Array(await dl.arrayBuffer());
          const bin = Array.from(buf, (b) => String.fromCharCode(b)).join("");
          dataUrl = `data:image/png;base64,${btoa(bin)}`;
        }
      }

      if (!dataUrl || !dataUrl.startsWith("data:")) {
        throw new Error("No image returned from model");
      }
      const commaIdx = dataUrl.indexOf(",");
      const meta = dataUrl.slice(5, commaIdx);
      const b64 = dataUrl.slice(commaIdx + 1);
      mime = meta.split(";")[0] || "image/png";
      const ext = mime.split("/")[1] || "png";
      const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

      const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
      const path = `${userId}/${yyyymm}/${row.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("generations")
        .upload(path, bytes, { contentType: mime, upsert: false });
      if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);

      const { data: signed } = await supabase.storage
        .from("generations")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      const assetUrl = signed?.signedUrl ?? null;

      await supabase.from("generations")
        .update({ status: "succeeded", asset_url: assetUrl, thumb_url: assetUrl })
        .eq("id", row.id);

      return { id: row.id, url: assetUrl };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      await supabase.from("generations")
        .update({ status: "failed", error: message }).eq("id", row.id);
      // Refund the up-front reservation on failure (idempotent).
      await refundCredits(supabase, {
        userId, amount: totalCost, reason: `refund:image:${model.key}`,
        refId: row.id, idem: `refund:image:${row.id}`,
      });
      throw new Error(message);
    }
  });

export const listMyGenerations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("generations")
      .select("id,kind,model,prompt,status,asset_url,thumb_url,created_at,like_count,is_favorite,folder_id,width,height,duration_ms")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(120);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
