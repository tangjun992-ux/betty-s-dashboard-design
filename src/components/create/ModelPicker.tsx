import { useState } from "react";
import { Check, Cpu } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { ImageModel, VideoModel } from "@/lib/model-registry";

type AnyModel = ImageModel | VideoModel;

export function ModelPicker<T extends AnyModel>({
  models, value, onChange,
}: { models: T[]; value: T; onChange: (m: T) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1.5 h-7 px-2 rounded-md hover:bg-surface-hover text-[12px] text-foreground">
          <Cpu className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Model</span>
          <span className={`size-2.5 rounded-full bg-gradient-to-br ${value.swatch}`} />
          <span className="font-medium">{value.label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-1.5">
        <div className="text-[11px] uppercase tracking-wide text-muted-foreground px-2 py-1.5">Models</div>
        <div className="flex flex-col">
          {models.map((m) => {
            const active = m.id === value.id;
            return (
              <button
                key={m.id}
                onClick={() => { onChange(m); setOpen(false); }}
                className={`flex items-start gap-2.5 rounded-md px-2 py-2 text-left hover:bg-surface-hover ${active ? "bg-surface-hover" : ""}`}
              >
                <span className={`mt-1 size-3 rounded-full bg-gradient-to-br ${m.swatch ?? "from-zinc-400 to-zinc-600"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium">{m.label}</span>
                  </div>
                  <p className="text-[11.5px] text-muted-foreground leading-snug mt-0.5">{m.description}</p>
                </div>
                {active && <Check className="size-3.5 text-brand mt-1" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ChoicePill<T extends string | number>({
  icon: Icon, options, value, onChange, format,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  format?: (v: T) => string;
}) {
  const [open, setOpen] = useState(false);
  if (options.length <= 1) {
    return (
      <span className="flex items-center gap-1 h-7 px-2 rounded-md text-[12px] text-muted-foreground/70">
        {Icon && <Icon className="size-3.5" />}{format ? format(value) : String(value)}
      </span>
    );
  }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 h-7 px-2 rounded-md hover:bg-surface-hover text-[12px] text-muted-foreground">
          {Icon && <Icon className="size-3.5" />}
          <span>{format ? format(value) : String(value)}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[140px] p-1">
        {options.map((o) => (
          <button
            key={String(o)}
            onClick={() => { onChange(o); setOpen(false); }}
            className={`w-full text-left px-2 py-1.5 rounded-md text-[12.5px] hover:bg-surface-hover flex items-center justify-between ${o === value ? "text-foreground" : "text-muted-foreground"}`}
          >
            {format ? format(o) : String(o)}
            {o === value && <Check className="size-3.5 text-brand" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
