import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateText, tool, stepCountIs } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { consumeCredits } from "./credits.server";
import { findImageModel, IMAGE_MODELS } from "./model-registry";

type Msg = { role: "user" | "assistant" | "system"; content: string };

export const listSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("sessions")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data;
  });

export const getSession = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: messages, error } = await context.supabase
      .from("session_messages")
      .select("id, role, content, created_at")
      .eq("session_id", data.sessionId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return messages;
  });

export const deleteSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string }) => d)
  .handler(async ({ data, context }) => {
    await context.supabase.from("session_messages").delete().eq("session_id", data.sessionId);
    await context.supabase.from("sessions").delete().eq("id", data.sessionId);
    return { ok: true };
  });

const SYSTEM = `You are Betty, an autonomous creative assistant.

You can chat normally AND call tools when the user asks for something visual:
- Use generate_image when the user wants an image created. Pick a sensible aspect ratio.
- Use refine_prompt to expand a vague idea into a vivid generation prompt before calling generate_image — but skip it when the user already gave a detailed prompt.
- Use suggest_models to recommend creation tools/models for a given task.

After tools run, summarize what you made in 1–2 sentences. Reference generated images naturally — they will render inline. Never invent image URLs; only mention images you actually produced. Be concise.`;

export const sendAgentMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { sessionId: string | null; message: string; model?: string }) => d)
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");
    const { supabase, userId } = context;

    let sessionId = data.sessionId;
    if (!sessionId) {
      const title = data.message.slice(0, 60);
      const { data: s, error } = await supabase
        .from("sessions")
        .insert({ user_id: userId, title })
        .select("id").single();
      if (error) throw error;
      sessionId = s.id;
    }

    const { data: history } = await supabase
      .from("session_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    await supabase.from("session_messages").insert({
      session_id: sessionId, user_id: userId, role: "user", content: data.message,
    });

    const messages: Msg[] = [
      ...((history ?? []) as Msg[]),
      { role: "user", content: data.message },
    ];

    const gateway = createLovableAiGatewayProvider(apiKey);
    const model = gateway(data.model ?? "google/gemini-3-flash-preview");

    const generateImageTool = tool({
      description: "Generate an image from a text prompt. Returns a public URL.",
      inputSchema: z.object({
        prompt: z.string().min(2).max(2000).describe("Detailed image description"),
        aspect: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).default("1:1"),
      }),
      execute: async ({ prompt, aspect }) => {
        const modelId = IMAGE_MODELS[0].id;
        const m = findImageModel(modelId)!;
        const cost = m.cost;
        const { data: prof } = await supabase
          .from("profiles").select("credits").eq("id", userId).maybeSingle();
        if (!prof || prof.credits < cost) {
          return { ok: false, error: `Need ${cost} credits to generate an image.` };
        }

        const { data: row } = await supabase
          .from("generations")
          .insert({
            user_id: userId, kind: "image", model: modelId, prompt,
            params: { aspect, quality: "1K", batch: 1, source: "agent" },
            status: "running",
          })
          .select("id").single();
        if (!row) return { ok: false, error: "Failed to start generation" };

        try {
          const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: modelId,
              messages: [{ role: "user", content: prompt }],
              modalities: ["image", "text"],
            }),
          });
          if (!resp.ok) {
            const t = await resp.text();
            throw new Error(`AI error ${resp.status}: ${t.slice(0, 160)}`);
          }
          const json = await resp.json();
          const dataUrl: string | undefined = json?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          if (!dataUrl?.startsWith("data:")) throw new Error("No image returned");

          const commaIdx = dataUrl.indexOf(",");
          const meta = dataUrl.slice(5, commaIdx);
          const b64 = dataUrl.slice(commaIdx + 1);
          const mime = meta.split(";")[0] || "image/png";
          const ext = mime.split("/")[1] || "png";
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const yyyymm = new Date().toISOString().slice(0, 7).replace("-", "");
          const path = `${userId}/${yyyymm}/${row.id}.${ext}`;
          const { error: upErr } = await supabase.storage.from("generations")
            .upload(path, bytes, { contentType: mime, upsert: false });
          if (upErr) throw new Error(upErr.message);
          const { data: signed } = await supabase.storage.from("generations")
            .createSignedUrl(path, 60 * 60 * 24 * 365);
          const url = signed?.signedUrl ?? null;

          await supabase.from("generations")
            .update({ status: "succeeded", asset_url: url, thumb_url: url })
            .eq("id", row.id);
          await consumeCredits(supabase, {
            userId, amount: cost, reason: `agent:image`, refId: row.id, idem: `agent:image:${row.id}`,
          });
          return { ok: true, url, id: row.id, prompt, aspect };
        } catch (err) {
          const message = err instanceof Error ? err.message : "Generation failed";
          await supabase.from("generations").update({ status: "failed", error: message }).eq("id", row.id);
          return { ok: false, error: message };
        }
      },
    });

    const refinePromptTool = tool({
      description: "Expand a short idea into a vivid, specific generation prompt (subject, lighting, composition, style). Returns the refined prompt.",
      inputSchema: z.object({ idea: z.string().min(2).max(500) }),
      execute: async ({ idea }) => {
        const r = await generateText({
          model,
          system: "Rewrite the user's idea as a single vivid image prompt under 80 words. Output only the prompt.",
          prompt: idea,
        });
        return { prompt: r.text.trim() };
      },
    });

    const suggestModelsTool = tool({
      description: "Recommend Betty creation tools/models for a task.",
      inputSchema: z.object({ task: z.string().min(2).max(300) }),
      execute: async ({ task }) => {
        const t = task.toLowerCase();
        const recs: { id: string; label: string; why: string }[] = [];
        if (/video|motion|clip|animate/.test(t))
          recs.push({ id: "/create/video", label: "Video", why: "Best for short cinematic clips." });
        if (/lip ?sync|talk|speech/.test(t))
          recs.push({ id: "/create/lipsync", label: "Lipsync", why: "Sync a face to audio or script." });
        if (/upscal|enhanc|hd|4k/.test(t))
          recs.push({ id: "/create/upscale", label: "Upscaler", why: "Increase resolution & detail." });
        if (/edit|change|replace|inpaint/.test(t))
          recs.push({ id: "/create/image-editor", label: "Image Editor", why: "Targeted edits on an image." });
        if (!recs.length)
          recs.push({ id: "/create/image", label: "Image", why: "Generate a still image." });
        return { recs };
      },
    });

    const result = await generateText({
      model,
      system: SYSTEM,
      messages,
      tools: { generate_image: generateImageTool, refine_prompt: refinePromptTool, suggest_models: suggestModelsTool },
      stopWhen: stepCountIs(50),
    });

    // Compose assistant content: final text + markdown for any images produced
    const imageBlocks: string[] = [];
    for (const step of result.steps ?? []) {
      for (const tc of step.toolResults ?? []) {
        const out: any = (tc as any).output;
        if (tc.toolName === "generate_image" && out?.ok && out?.url) {
          imageBlocks.push(`![${(out.prompt ?? "").slice(0, 80)}](${out.url})`);
        }
      }
    }
    const reply = [result.text?.trim(), ...imageBlocks].filter(Boolean).join("\n\n");

    await supabase.from("session_messages").insert({
      session_id: sessionId, user_id: userId, role: "assistant", content: reply || "(no response)",
    });
    await supabase.from("sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);

    return { sessionId, reply };
  });
