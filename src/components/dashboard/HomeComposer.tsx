import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles, Image as ImageIcon, Video, ArrowUp } from "lucide-react";

type Mode = "agent" | "image" | "video";

const MODES: { id: Mode; label: string; icon: typeof Sparkles; to: "/create/agent" | "/create/image" | "/create/video" }[] = [
  { id: "agent", label: "Agent", icon: Sparkles, to: "/create/agent" },
  { id: "image", label: "Image", icon: ImageIcon, to: "/create/image" },
  { id: "video", label: "Video", icon: Video, to: "/create/video" },
];

const SUGGESTIONS = [
  "A cinematic shot of a Tokyo street at night, neon reflections",
  "Product photo of a matte ceramic mug on linen, soft window light",
  "Turn this selfie into a 90s anime portrait",
];

export function HomeComposer() {
  const [mode, setMode] = useState<Mode>("agent");
  const [value, setValue] = useState("");
  const navigate = useNavigate();

  function submit(prompt?: string) {
    const text = (prompt ?? value).trim();
    const target = MODES.find((m) => m.id === mode)!;
    if (mode === "image") {
      navigate({ to: "/create/image", search: { prompt: text || undefined } as any });
    } else if (mode === "video") {
      navigate({ to: "/create/video", search: { prompt: text || undefined } as any });
    } else {
      navigate({ to: target.to, search: { prompt: text || undefined } as any });
    }
  }

  return (
    <div className="px-6 lg:px-8">
      <div className="max-w-[860px] mx-auto">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex p-1 rounded-full bg-surface/70 border border-border/60">
            {MODES.map((m) => {
              const active = m.id === mode;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12.5px] font-medium transition-colors ${
                    active ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
          <span className="hidden sm:block text-[11.5px] text-muted-foreground">
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border/60 text-[10px]">⌘</kbd>
            <span className="mx-1">+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-surface border border-border/60 text-[10px]">↵</kbd>
            <span className="ml-1.5">to send</span>
          </span>
        </div>

        <div className="rounded-2xl bg-surface/80 border border-border/60 backdrop-blur shadow-[0_8px_30px_-12px_rgba(0,0,0,0.5)]">
          <div className="flex gap-3 p-4">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={`Describe what you want to create with ${MODES.find((m) => m.id === mode)!.label}…`}
              rows={2}
              className="flex-1 bg-transparent text-[14px] resize-none focus:outline-none placeholder:text-muted-foreground/70 min-h-[56px] max-h-40"
            />
            <button
              type="button"
              onClick={() => submit()}
              disabled={!value.trim()}
              aria-label="Submit"
              className="size-9 self-end shrink-0 grid place-items-center rounded-full bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition"
            >
              <ArrowUp className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              className="h-7 px-3 rounded-full bg-surface/70 border border-border/60 text-[11.5px] text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
