import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ArrowUp, Paperclip, Pencil, Cake, Flame, PartyPopper, FileEdit, ChevronsUpDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { generateAudio } from "@/lib/audio.functions";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/create/audio")({
  head: () => ({ meta: [{ title: "Audio — Betty" }] }),
  component: AudioPage,
});

type Voice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

function AudioPage() {
  const navigate = useNavigate();
  const { user } = useSession();
  const [script, setScript] = useState("");
  const [voice, setVoice] = useState<Voice>("nova");
  const [assistant, setAssistant] = useState("");
  const [tab, setTab] = useState<"assistant" | "history">("assistant");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const gen = useServerFn(generateAudio);

  async function onGenerate() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!script.trim() || busy) return;
    setBusy(true); setUrl(null);
    const t = toast.loading("Synthesizing voice…");
    try {
      const r = await gen({ data: { text: script.trim(), voice, speed: 1 } });
      setUrl(r.url);
      toast.success("Audio ready", { id: t });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "TTS failed", { id: t });
    } finally { setBusy(false); }
  }

  const PRESETS = [
    { label: "Write with AI", icon: Pencil, accent: "text-violet-400" },
    { label: "Birthday Message", icon: Cake, accent: "text-amber-300" },
    { label: "Friendly Roast", icon: Flame, accent: "text-orange-400" },
    { label: "Congrats Message", icon: PartyPopper, accent: "text-emerald-300" },
  ];

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* Left: script editor */}
        <section className="flex-1 min-w-0 flex flex-col">
          <div className="flex-1 px-8 pt-10">
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value.slice(0, 2800))}
              placeholder="Enter your script here…"
              className="w-full h-full min-h-[60vh] bg-transparent text-[15px] resize-none focus:outline-none placeholder:text-muted-foreground/70 leading-relaxed"
            />
          </div>

          <div className="px-8 pb-6">
            <div className="text-[12px] text-muted-foreground mb-2">Help me write</div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => {
                const I = p.icon;
                return (
                  <button
                    key={p.label}
                    onClick={() => setAssistant((s) => s || `${p.label}: `)}
                    className="h-9 px-3 rounded-full border border-border/60 bg-surface/50 hover:bg-surface text-[12.5px] flex items-center gap-2"
                  >
                    <I className={`size-3.5 ${p.accent}`} />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <span className="size-3.5 rounded-full border border-border/60 inline-grid place-items-center"><span className="size-1.5 rounded-full bg-muted-foreground/60" /></span>
                {script.length} / 2800 characters
              </div>
              <div className="flex items-center gap-2">
                <button className="h-9 px-3.5 rounded-full bg-surface border border-border/60 text-[12.5px] font-medium flex items-center gap-2 hover:bg-surface-hover">
                  Select Voice <ChevronsUpDown className="size-3.5 text-muted-foreground" />
                </button>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value as Voice)}
                  className="hidden"
                >
                  <option value="alloy">Alloy</option><option value="echo">Echo</option>
                  <option value="fable">Fable</option><option value="onyx">Onyx</option>
                  <option value="nova">Nova</option><option value="shimmer">Shimmer</option>
                </select>
                <button
                  onClick={onGenerate}
                  disabled={busy || !script.trim()}
                  className="h-9 px-4 rounded-full bg-brand text-brand-foreground text-[12.5px] font-semibold disabled:opacity-50"
                >
                  {busy ? "Generating…" : "Generate · 3 credits"}
                </button>
              </div>
            </div>

            {url && (
              <audio controls src={url} className="mt-4 w-full" />
            )}
          </div>
        </section>

        {/* Right: assistant rail */}
        <aside className="w-[380px] shrink-0 border-l border-border/60 flex flex-col">
          <div className="flex items-center gap-1 px-4 pt-4">
            <button
              onClick={() => setTab("assistant")}
              className={`h-9 px-4 text-[13px] font-medium rounded-md ${tab === "assistant" ? "text-foreground border-b-2 border-foreground rounded-none" : "text-muted-foreground hover:text-foreground"}`}
            >
              Writing Assistant
            </button>
            <button
              onClick={() => setTab("history")}
              className={`h-9 px-4 text-[13px] font-medium rounded-md ${tab === "history" ? "text-foreground border-b-2 border-foreground rounded-none" : "text-muted-foreground hover:text-foreground"}`}
            >
              History
            </button>
          </div>

          <div className="flex-1 grid place-items-center px-6">
            {tab === "assistant" ? (
              <div className="text-center">
                <div className="size-10 mx-auto rounded-xl bg-surface grid place-items-center mb-3">
                  <FileEdit className="size-5 text-muted-foreground" />
                </div>
                <div className="text-[14px] font-semibold leading-snug">How can I help<br />with your script?</div>
                <div className="mt-1 text-[11.5px] text-muted-foreground">
                  Use the <a className="underline" href="/create/agent">Agent</a> for best results.
                </div>
              </div>
            ) : (
              <div className="text-[12.5px] text-muted-foreground">No history yet.</div>
            )}
          </div>

          <div className="p-3 border-t border-border/60">
            <div className="rounded-2xl bg-surface/60 border border-border/60 p-3">
              <textarea
                value={assistant}
                onChange={(e) => setAssistant(e.target.value)}
                placeholder="Type your script requirements…"
                className="w-full bg-transparent text-[12.5px] resize-none focus:outline-none placeholder:text-muted-foreground/70 min-h-[40px] max-h-32"
              />
              <div className="flex items-center justify-between mt-1">
                <button className="size-7 grid place-items-center rounded-md text-muted-foreground hover:bg-surface-hover" aria-label="Attach">
                  <Paperclip className="size-3.5" />
                </button>
                <button
                  disabled={!assistant.trim()}
                  className="size-7 grid place-items-center rounded-full bg-foreground text-background disabled:opacity-30"
                  aria-label="Send"
                >
                  <ArrowUp className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
