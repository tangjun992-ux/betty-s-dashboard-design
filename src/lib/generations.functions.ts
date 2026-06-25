import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ImageInput = z.object({
  prompt: z.string().min(2).max(2000),
  model: z.enum(["google/gemini-2.5-flash-image", "google/gemini-3.1-flash-image"]).default("google/gemini-2.5-flash-image"),
  aspect: z.enum(["1:1", "16:9", "9:16", "4:5"]).default("1:1"),
});

const COST_IMAGE = 5;

export const generateImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => ImageInput.parse(data))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");
    const { supabase, userId } = context;

    // Credit check
    const { data: prof } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .maybeSingle();
    if (!prof || prof.credits < COST_IMAGE) {
      throw new Error("Not enough credits. Earn or top up to keep creating.");
    }

    // Insert placeholder row
    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        user_id: userId,
        kind: "image",
        model: data.model,
        prompt: data.prompt,
        params: { aspect: data.aspect },
        status: "running",
      })
      .select("id")
      .single();
    if (insErr || !row) throw new Error(insErr?.message ?? "Failed to start generation");

    try {
      // Call Lovable AI Gateway (OpenAI-compatible chat completions with image modality)
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: data.model,
          messages: [
            { role: "user", content: data.prompt },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!resp.ok) {
        const text = await resp.text();
        if (resp.status === 429) throw new Error("Rate limited. Try again shortly.");
        if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in Settings.");
        throw new Error(`AI error: ${text.slice(0, 200)}`);
      }

      const json = await resp.json();
      // Image returned as message.images[0].image_url.url (data URL)
      const dataUrl: string | undefined =
        json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!dataUrl || !dataUrl.startsWith("data:")) {
        throw new Error("No image returned from model");
      }

      // Decode data URL -> bytes
      const commaIdx = dataUrl.indexOf(",");
      const meta = dataUrl.slice(5, commaIdx); // e.g. image/png;base64
      const b64 = dataUrl.slice(commaIdx + 1);
      const mime = meta.split(";")[0] || "image/png";
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

      await supabase
        .from("generations")
        .update({ status: "succeeded", asset_url: assetUrl, thumb_url: assetUrl })
        .eq("id", row.id);

      // Charge credits
      await supabase.from("credits_ledger").insert({
        user_id: userId,
        delta: -COST_IMAGE,
        reason: "image_generation",
        ref_id: row.id,
      });
      await supabase
        .from("profiles")
        .update({ credits: prof.credits - COST_IMAGE })
        .eq("id", userId);

      return { id: row.id, url: assetUrl };
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed";
      await supabase
        .from("generations")
        .update({ status: "failed", error: message })
        .eq("id", row.id);
      throw new Error(message);
    }
  });

export const listMyGenerations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("generations")
      .select("id,kind,model,prompt,status,asset_url,thumb_url,created_at,like_count")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(60);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
