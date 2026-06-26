import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown, Gem, Hash } from "lucide-react";
import type { ImageQuality } from "@/lib/model-registry";

export function ImageResolutionPopover({ options, value, onChange }: { options: ImageQuality[]; value: ImageQuality; onChange: (q: ImageQuality) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 h-7 px-2 rounded-md hover:bg-surface-hover text-[12px] text-muted-foreground">
          <Gem className="size-3.5" />
          <span className="font-medium text-foreground">{value}</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </PopoverTrigger>
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

const BATCH_PRESETS = [1, 2, 3, 4, 6, 8];

export function ImageBatchPopover({ max, value, onChange }: { max: number; value: number; onChange: (n: number) => void }) {
  const [open, setOpen] = useState(false);
  const options = BATCH_PRESETS.filter((n) => n <= max);
  if (options.length <= 1) {
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
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1.5 pb-1">
          <Hash className="size-3" />
        </div>
        {options.map((n) => (
          <button
            key={n}
            onClick={() => { onChange(n); setOpen(false); }}
            className={`w-full flex items-center justify-between px-2.5 h-8 rounded-md text-[12.5px] ${
              n === value ? "bg-brand/15 text-brand" : "text-foreground/90 hover:bg-white/[0.04]"
            }`}
          >
            <span className="font-semibold">{n}</span>
            {n === value && <Check className="size-3.5" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
