import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const AudioInput = z.object({
  text: z.string().min(2).max(4000),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).default("nova"),
  speed: z.number().min(0.5).max(2).default(1),
});

const COST_AUDIO = 3;

export const generateAudio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => AudioInput.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");
    const { supabase, userId } = context;

    const { data: prof } = await supabase
      .from("profiles").select("credits").eq("id", userId).maybeSingle();
    if (!prof || prof.credits < COST_AUDIO) {
      throw new Error("Not enough credits.");
    }

    const { data: row, error: insErr } = await supabase
      .from("generations")
      .insert({
        user_id: userId, kind: "audio",
        model: "openai/gpt-4o-mini-tts",
        prompt: data.text,
        params: { voice: data.voice, speed: data.speed },
        status: "running",
      })
      .select("id").single();
    if (insErr || !row) throw new Error(insErr?.message ?? "Failed to start");

    try {
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini-tts",
          input: data.text,
          voice: data.voice,
          speed: data.speed,
          response_format: "mp3",
        }),
      });
      if (!resp.ok) {
        const t = await resp.text();
        if (resp.status === 429) throw new Error("Rate limited.");
        if (resp.status === 402) throw new Error("AI credits exhausted.");
        throw new Error(`TTS error: ${t.slice(0, 200)}`);
      }
      const bytes = new Uint8Array(await resp.arrayBuffer());
      const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
      const path = `${userId}/${yyyymm}/${row.id}.mp3`;
      const { error: upErr } = await supabase.storage.from("generations")
        .upload(path, bytes, { contentType: "audio/mpeg", upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data: signed } = await supabase.storage.from("generations")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      const url = signed?.signedUrl ?? null;

      await supabase.from("generations").update({
        status: "succeeded", asset_url: url, thumb_url: url,
      }).eq("id", row.id);

      await supabase.from("credits_ledger").insert({
        user_id: userId, delta: -COST_AUDIO, reason: "audio_generation", ref_id: row.id,
      });
      await supabase.from("profiles").update({ credits: prof.credits - COST_AUDIO }).eq("id", userId);

      return { id: row.id, url };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Audio failed";
      await supabase.from("generations").update({ status: "failed", error: msg }).eq("id", row.id);
      throw new Error(msg);
    }
  });
