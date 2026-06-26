import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Check, ChevronDown, Smartphone, Tablet, Monitor, Gem, Clock, SlidersHorizontal, Hash } from "lucide-react";
import type { Aspect, VideoResolution } from "@/lib/model-registry";

const ASPECT_META: Record<Aspect, { icon: typeof Monitor; orient: "landscape" | "portrait" | "square" }> = {
  "21:9": { icon: Monitor, orient: "landscape" },
  "16:9": { icon: Monitor, orient: "landscape" },
  "3:2":  { icon: Monitor, orient: "landscape" },
  "4:3":  { icon: Tablet,  orient: "landscape" },
  "1:1":  { icon: Tablet,  orient: "square" },
  "3:4":  { icon: Smartphone, orient: "portrait" },
  "2:3":  { icon: Smartphone, orient: "portrait" },
  "4:5":  { icon: Smartphone, orient: "portrait" },
  "9:16": { icon: Smartphone, orient: "portrait" },
};

function PillTrigger({ icon: Icon, value }: { icon: React.ComponentType<{ className?: string }>; value: string }) {
  return (
    <span className="flex items-center gap-1 h-7 px-2 rounded-md hover:bg-surface-hover text-[12px] text-muted-foreground cursor-pointer">
      <Icon className="size-3.5" />
      <span className="font-medium text-foreground">{value}</span>
      <ChevronDown className="size-3 opacity-60" />
    </span>
  );
}

export function AspectPopover({ options, value, onChange }: { options: Aspect[]; value: Aspect; onChange: (a: Aspect) => void }) {
  const [open, setOpen] = useState(false);
  const TriggerIcon = ASPECT_META[value].icon;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><button><PillTrigger icon={TriggerIcon} value={value} /></button></PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] p-3 bg-[#0e0e12] border-white/10">
        <div className="text-[11px] text-muted-foreground mb-2">Aspect Ratio</div>
        <div className="grid grid-cols-2 gap-1.5">
          {options.map((o) => {
            const active = o === value;
            const Icon = ASPECT_META[o].icon;
            return (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false); }}
                className={`flex items-center justify-between gap-2 h-9 px-2.5 rounded-lg text-[12.5px] transition-colors ${
                  active ? "bg-brand/15 text-brand ring-1 ring-brand/40" : "hover:bg-white/[0.04] text-foreground/90"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-3.5" />
                  <span className="font-semibold">{o}</span>
                </span>
                {active && <Check className="size-3.5" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ResolutionPopover({ options, value, onChange }: { options: VideoResolution[]; value: VideoResolution; onChange: (r: VideoResolution) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><button><PillTrigger icon={Gem} value={value} /></button></PopoverTrigger>
      <PopoverContent align="start" className="w-[160px] p-2 bg-[#0e0e12] border-white/10">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1.5 pb-1.5">
          <Gem className="size-3" /> Resolution
        </div>
        <div className="flex flex-col gap-0.5">
          {options.map((o) => {
            const active = o === value;
            return (
              <button
                key={o}
                onClick={() => { onChange(o); setOpen(false); }}
                className={`flex items-center justify-between h-8 px-2.5 rounded-md text-[12.5px] ${
                  active ? "bg-brand/15 text-brand" : "text-foreground/90 hover:bg-white/[0.04]"
                }`}
              >
                <span className="font-semibold">{o}</span>
                {active && <Check className="size-3.5" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function DurationPopover({ options, value, onChange }: { options: number[]; value: number; onChange: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const min = options[0];
  const max = options[options.length - 1];
  // Snap helper
  const snap = (n: number) => options.reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a, options[0]);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild><button><PillTrigger icon={Clock} value={`${value}s`} /></button></PopoverTrigger>
      <PopoverContent align="start" className="w-[280px] p-3 bg-[#0e0e12] border-white/10">
        <div className="text-[11px] text-muted-foreground mb-2">Duration</div>
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-black/40 border border-white/5">
          <span className="text-[13px] font-semibold tabular-nums w-10">{value}s</span>
          <Slider
            min={min}
            max={max}
            step={1}
            value={[value]}
            onValueChange={(v) => onChange(snap(v[0]))}
            className="flex-1"
          />
        </div>
        <div className="flex justify-between mt-1.5 px-1 text-[10px] text-muted-foreground tabular-nums">
          {options.map((o) => <span key={o}>{o}s</span>)}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function BatchPopover({ max, value, onChange }: { max: number; value: number; onChange: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  if (max <= 1) {
    return (
      <span className="flex items-center gap-1 h-7 px-2 rounded-md text-[12px] text-muted-foreground/70">
        <Hash className="size-3.5" /> 1
      </span>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 h-7 px-2 rounded-md hover:bg-surface-hover text-[12px] text-muted-foreground">
          <Hash className="size-3.5" />
          <span className="font-medium text-foreground">{value}</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[120px] p-1.5 bg-[#0e0e12] border-white/10">
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => { onChange(n); setOpen(false); }}
            className={`w-full flex items-center justify-between px-2.5 h-8 rounded-md text-[12.5px] ${
              n === value ? "bg-brand/15 text-brand" : "text-foreground/90 hover:bg-white/[0.04]"
            }`}
          >
            <span className="font-semibold">× {n}</span>
            {n === value && <Check className="size-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export type AdvancedOptions = {
  clearOnSubmit: boolean;
  fallbackModels: boolean;
  autoRetries: boolean;
};

export function MorePopover({ value, onChange }: { value: AdvancedOptions; onChange: (v: AdvancedOptions) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 h-7 px-2 rounded-md hover:bg-surface-hover text-[12px] text-muted-foreground">
          <SlidersHorizontal className="size-3.5" /> More
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[300px] p-3 bg-[#0e0e12] border-white/10">
        <div className="text-[11px] text-muted-foreground mb-2">Advanced</div>
        <Row label="Clear Inputs on Submit" desc="Clear prompt and references after submitting" checked={value.clearOnSubmit} onChange={(v) => onChange({ ...value, clearOnSubmit: v })} />
        <Row label="Fallback Models" desc="Automatically retry with alternative models if the primary model fails" checked={value.fallbackModels} onChange={(v) => onChange({ ...value, fallbackModels: v })} />
        <Row label="Auto retries" desc="Retry failed generations automatically" checked={value.autoRetries} onChange={(v) => onChange({ ...value, autoRetries: v })} />
      </PopoverContent>
    </Popover>
  );
}

function Row({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (b: boolean) => void }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-t border-white/5 first:border-t-0">
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-semibold">{label}</div>
        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
