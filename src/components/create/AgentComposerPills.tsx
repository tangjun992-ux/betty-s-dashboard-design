import { useState } from "react";
import { Check, Feather, Hand, Zap, CircleCheck, Sun, Sparkles, Stars, Cpu } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Mode = "prompt" | "approval" | "auto" | "settings";
type Model = "sonnet-4.6" | "gpt-5" | "gemini-3-pro" | "haiku-4";

const MODES: { key: Mode; label: string; desc: string; icon: typeof Feather; color: string }[] = [
  { key: "prompt", label: "Prompt mode", desc: "Agent writes prompts; you submit", icon: Feather, color: "text-sky-400" },
  { key: "approval", label: "Ask for approval", desc: "Approve each generation", icon: Hand, color: "text-emerald-400" },
  { key: "auto", label: "Full auto", desc: "Auto-implement entire plan", icon: Zap, color: "text-amber-400" },
  { key: "settings", label: "Approve by settings", desc: "Auto-approve within limits", icon: CircleCheck, color: "text-violet-400" },
];

const MODELS: { key: Model; label: string; desc: string; icon: typeof Sun; tag?: string }[] = [
  { key: "sonnet-4.6", label: "Sonnet 4.6", desc: "Balanced reasoning and speed", icon: Sun, tag: "Default" },
  { key: "gpt-5", label: "GPT-5", desc: "Powerful general-purpose model", icon: Sparkles },
  { key: "gemini-3-pro", label: "Gemini 3 Pro", desc: "Long context multimodal", icon: Stars },
  { key: "haiku-4", label: "Haiku 4", desc: "Fast, cost-efficient", icon: Cpu, tag: "Fast" },
];

export function ModePill({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const [open, setOpen] = useState(false);
  const current = MODES.find((m) => m.key === mode)!;
  const Icon = current.icon;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-8 px-2.5 rounded-md hover:bg-surface-hover text-foreground/90 flex items-center gap-1.5 transition-colors"
        >
          <Icon className={`size-3.5 ${current.color}`} />
          <span className="font-medium text-[12.5px]">{current.label}</span>
          <svg viewBox="0 0 24 24" className="size-3 opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="w-[300px] p-1.5 rounded-xl bg-[#101013] border-border/60 shadow-2xl">
        <div className="px-2.5 pt-1.5 pb-1 text-[10.5px] uppercase tracking-wider text-muted-foreground/80">Approval mode</div>
        {MODES.map((m) => {
          const I = m.icon;
          const active = m.key === mode;
          return (
            <button
              key={m.key}
              onClick={() => { onChange(m.key); setOpen(false); }}
              className="w-full flex items-start gap-3 px-2.5 py-2 rounded-lg hover:bg-surface-hover text-left"
            >
              <I className={`size-4 mt-0.5 shrink-0 ${m.color}`} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium">{m.label}</div>
                <div className="text-[11.5px] text-muted-foreground leading-snug">{m.desc}</div>
              </div>
              {active && <Check className="size-3.5 mt-1 text-foreground" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export function ModelPill({ model, onChange }: { model: Model; onChange: (m: Model) => void }) {
  const [open, setOpen] = useState(false);
  const current = MODELS.find((m) => m.key === model)!;
  const Icon = current.icon;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-8 px-2.5 rounded-md hover:bg-surface-hover text-foreground/90 flex items-center gap-1.5 transition-colors"
        >
          <Icon className="size-3.5 text-muted-foreground" />
          <span className="font-medium text-[12.5px]">{current.label}</span>
          <svg viewBox="0 0 24 24" className="size-3 opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" sideOffset={8} className="w-[300px] p-1.5 rounded-xl bg-[#101013] border-border/60 shadow-2xl">
        <div className="px-2.5 pt-1.5 pb-1 text-[10.5px] uppercase tracking-wider text-muted-foreground/80">Agent model</div>
        {MODELS.map((m) => {
          const I = m.icon;
          const active = m.key === model;
          return (
            <button
              key={m.key}
              onClick={() => { onChange(m.key); setOpen(false); }}
              className="w-full flex items-start gap-3 px-2.5 py-2 rounded-lg hover:bg-surface-hover text-left"
            >
              <I className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium flex items-center gap-2">
                  {m.label}
                  {m.tag && <span className="px-1.5 py-0.5 rounded text-[9.5px] font-semibold bg-surface text-muted-foreground">{m.tag}</span>}
                </div>
                <div className="text-[11.5px] text-muted-foreground leading-snug">{m.desc}</div>
              </div>
              {active && <Check className="size-3.5 mt-1 text-foreground" />}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

export type { Mode as AgentMode, Model as AgentModel };
