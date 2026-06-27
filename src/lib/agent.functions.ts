import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
        .select("id")
        .single();
      if (error) throw error;
      sessionId = s.id;
    }

    // Load history
    const { data: history } = await supabase
      .from("session_messages")
      .select("role, content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true });

    const messages: Msg[] = [
      { role: "system", content: "You are Betty, a creative assistant that helps users plan and craft prompts for image, video, lipsync and audio generation. Be concise, specific, and offer follow-up suggestions." },
      ...((history ?? []) as Msg[]),
      { role: "user", content: data.message },
    ];

    // Save user message immediately
    await supabase.from("session_messages").insert({
      session_id: sessionId, user_id: userId, role: "user", content: data.message,
    });

    const model = data.model ?? "google/gemini-2.5-flash";
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`AI gateway ${resp.status}: ${text.slice(0, 200)}`);
    }
    const json = await resp.json();
    const reply: string = json?.choices?.[0]?.message?.content ?? "";

    await supabase.from("session_messages").insert({
      session_id: sessionId, user_id: userId, role: "assistant", content: reply,
    });
    await supabase.from("sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);

    return { sessionId, reply };
  });
