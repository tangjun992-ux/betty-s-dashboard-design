import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/create/agent")({
  head: () => ({ meta: [{ title: "Agent — Betty" }] }),
  component: AgentChat,
});

type Msg = { role: "user" | "assistant"; content: string };

function AgentChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");

  function send() {
    if (!input.trim()) return;
    const user: Msg = { role: "user", content: input };
    const reply: Msg = {
      role: "assistant",
      content: "I'll help you plan that. Connect Lovable Cloud in phase 2 to make me fully interactive — for now this is a UI preview.",
    };
    setMsgs((m) => [...m, user, reply]);
    setInput("");
  }

  return (
    <AppShell>
      <div className="h-[calc(100vh-3.5rem)] flex flex-col max-w-[900px] mx-auto px-6 lg:px-10 py-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Agent</h1>
          <span className="ml-2 text-xs px-2 py-0.5 rounded-md bg-surface border border-border text-muted-foreground">Sonnet 4.6</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {msgs.length === 0 && (
            <div className="h-full grid place-items-center text-center">
              <div className="max-w-md">
                <div className="mx-auto size-14 rounded-2xl bg-[image:var(--gradient-brand-soft)] border border-border grid place-items-center mb-4">
                  <Sparkles className="size-6 text-foreground/70" />
                </div>
                <h2 className="text-lg font-semibold">What will you create?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Ask the agent to plan a video, brainstorm prompts, or orchestrate a full creative session.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {["Plan a 30s product ad", "Write 5 image prompts", "Storyboard a music video"].map((p) => (
                    <button key={p} onClick={() => setInput(p)} className="h-8 px-3 rounded-md bg-surface border border-border text-xs hover:bg-surface-hover">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-[image:var(--gradient-brand)] text-brand-foreground" : "bg-surface border border-border"}`}>
                {m.content}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-border bg-surface p-2 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask anything…"
            className="flex-1 bg-transparent text-sm p-2 resize-none focus:outline-none min-h-[40px] max-h-40"
          />
          <button onClick={send} className="size-9 grid place-items-center rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground shadow-[var(--shadow-glow)]">
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}
