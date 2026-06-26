import { useMemo, useState } from "react";
import {
  Search, X, Check, Sparkles, BarChart3, Compass, Shuffle, ChevronDown,
  Clock, Gem, Image as ImageIcon, Cpu,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  type VideoModel, type VideoBadge, VIDEO_MODELS, groupVideoModels,
} from "@/lib/model-registry";

function FamilyIcon({ kind, className }: { kind: VideoModel["familyIcon"]; className?: string }) {
  const cls = className ?? "size-4";
  switch (kind) {
    case "bars": return <BarChart3 className={cls} />;
    case "compass": return <Compass className={cls} />;
    case "shuffle": return <Shuffle className={cls} />;
    case "google": return <span className={`${cls} grid place-items-center font-bold text-[11px]`}>G</span>;
    case "openai": return <Sparkles className={cls} />;
    default: return <Sparkles className={cls} />;
  }
}

function BadgePill({ b }: { b: VideoBadge }) {
  if (b.kind === "best") {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-white bg-gradient-to-r from-fuchsia-500 to-pink-500">
        {b.label}
      </span>
    );
  }
  if (b.kind === "warn") {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-rose-300 bg-rose-500/15 border border-rose-500/30 flex items-center gap-1">
        <svg viewBox="0 0 24 24" className="size-2.5" fill="currentColor"><path d="M12 2 1 22h22L12 2Zm0 6 7.5 13h-15L12 8Zm-1 4v4h2v-4h-2Zm0 5v2h2v-2h-2Z"/></svg>
        {b.label}
      </span>
    );
  }
  return (
    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-white bg-sky-500">
      {b.label}
    </span>
  );
}

function MetaChip({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 h-5 px-1.5 rounded-md bg-white/5 border border-white/10 text-[10.5px] text-muted-foreground">
      <Icon className="size-3" />
      {children}
    </span>
  );
}

function ModelRow({ m, active, onSelect }: { m: VideoModel; active: boolean; onSelect: (m: VideoModel) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(m)}
      className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
        active ? "bg-white/[0.04] ring-1 ring-brand/50" : "hover:bg-white/[0.03]"
      }`}
    >
      <div className={`shrink-0 size-9 rounded-lg grid place-items-center bg-white/5 border border-white/10`}>
        <FamilyIcon kind={m.familyIcon} className="size-4 text-foreground/80" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[13px] font-semibold text-foreground">{m.label}</span>
          {m.badges?.map((b, i) => <BadgePill key={i} b={b} />)}
          {m.speed && <MetaChip icon={Gem}>{m.speed}</MetaChip>}
          <MetaChip icon={Clock}>{m.durations[0]}-{m.durations[m.durations.length - 1]}s</MetaChip>
          {m.framesTag && <MetaChip icon={ImageIcon}>{m.framesTag}</MetaChip>}
        </div>
        <p className="text-[11.5px] text-muted-foreground leading-snug mt-1 pr-6">{m.description}</p>
      </div>
      <span className={`shrink-0 mt-1 size-4 rounded-full border ${active ? "border-brand bg-brand" : "border-white/25"} grid place-items-center`}>
        {active && <Check className="size-2.5 text-brand-foreground" strokeWidth={3} />}
      </span>
    </button>
  );
}

export function VideoModelPicker({ value, onChange }: { value: VideoModel; onChange: (m: VideoModel) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const featured = useMemo(() => VIDEO_MODELS.filter((m) => m.featured && m.id !== value.id && (q ? m.label.toLowerCase().includes(q.toLowerCase()) : true)), [q, value.id]);
  const groups = useMemo(() => {
    const all = groupVideoModels();
    return all.map((g) => ({
      ...g,
      models: g.models.filter((m) => q ? m.label.toLowerCase().includes(q.toLowerCase()) : true),
    }));
  }, [q]);

  function pick(m: VideoModel) { onChange(m); setOpen(false); }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 h-7 px-2 rounded-md hover:bg-surface-hover text-[12px] text-foreground">
          <Cpu className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">Models</span>
          <FamilyIcon kind={value.familyIcon} className="size-3.5 text-foreground/80" />
          <span className="font-medium">{value.label}</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[820px] p-0 gap-0 bg-[#0e0e12] border-white/10 max-h-[85vh] overflow-hidden flex flex-col">
        {/* Search header */}
        <div className="flex items-center gap-2 p-3 border-b border-white/5">
          <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-lg bg-white/[0.04] border border-white/10">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search video models"
              className="flex-1 bg-transparent text-[13px] focus:outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <button onClick={() => setOpen(false)} className="size-10 grid place-items-center rounded-lg hover:bg-white/5 text-muted-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-3 pb-4">
          {/* AUTO */}
          <div className="pt-4">
            <div className="text-[10.5px] font-medium tracking-wider text-muted-foreground/80 px-2 mb-2">AUTO</div>
            <div className="rounded-xl px-3 py-3 hover:bg-white/[0.03] flex items-start gap-3">
              <div className="size-9 rounded-lg grid place-items-center bg-white/5 border border-white/10">
                <Sparkles className="size-4 text-foreground/80" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[13px] font-semibold">Auto Mode</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-foreground/80">Pro</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-muted-foreground">Lite</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/5 text-foreground/80 inline-flex items-center gap-1">
                    <Sparkles className="size-2.5" /> AI Selection
                  </span>
                </div>
                <p className="text-[11.5px] text-muted-foreground mt-1">Premium models with the best quality output, selected automatically.</p>
              </div>
              <span className="mt-1 size-4 rounded-full border border-white/25" />
            </div>
          </div>

          {/* FEATURED */}
          {featured.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between px-2 mb-2">
                <div className="text-[10.5px] font-medium tracking-wider text-muted-foreground/80">FEATURED</div>
                <span className="text-[10px] text-muted-foreground/70 inline-flex items-center gap-1.5">
                  Multi-Select <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">⇧ Click</kbd>
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {featured.map((m) => <ModelRow key={m.key} m={m} active={false} onSelect={pick} />)}
              </div>
            </div>
          )}

          {/* OTHER SELECTED */}
          <div className="pt-4">
            <div className="text-[10.5px] font-medium tracking-wider text-muted-foreground/80 px-2 mb-2">OTHER SELECTED</div>
            <div className="rounded-xl ring-1 ring-white/10 p-1">
              <ModelRow m={value} active onSelect={pick} />
            </div>
          </div>

          {/* ALL MODELS */}
          <div className="pt-4">
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="text-[10.5px] font-medium tracking-wider text-muted-foreground/80">ALL MODELS</div>
              <span className="text-[10px] text-muted-foreground/70 inline-flex items-center gap-1.5">
                Multi-Select <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10">⇧ Click</kbd>
              </span>
            </div>
            <div className="flex flex-col">
              {groups.map((g) => {
                const isOpen = expanded[g.key] ?? false;
                return (
                  <div key={g.key} className="border-b border-white/5 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => setExpanded((s) => ({ ...s, [g.key]: !isOpen }))}
                      className="w-full flex items-center gap-2.5 px-3 py-3 hover:bg-white/[0.02] text-left"
                    >
                      <FamilyIcon kind={g.icon} className="size-4 text-foreground/80" />
                      <span className="text-[13px] font-semibold">{g.label}</span>
                      <span className="text-[11.5px] text-muted-foreground">{g.models.length} models</span>
                      <ChevronDown className={`size-4 ml-auto text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="pb-2 px-1">
                        {g.models.map((m) => (
                          <ModelRow key={m.key} m={m} active={m.id === value.id && m.key === value.key} onSelect={pick} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
