import { useMemo, useState } from "react";
import {
  Search, X, Check, Sparkles, BarChart3, Compass, ChevronDown,
  Gem, Coins, Triangle,
} from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  type ImageModel, type ImageBadge, type ImageFamilyIcon,
  IMAGE_MODELS, groupImageModels,
} from "@/lib/model-registry";

function FamilyIcon({ kind, className }: { kind: ImageFamilyIcon; className?: string }) {
  const cls = className ?? "size-4";
  switch (kind) {
    case "bars": return <BarChart3 className={cls} />;
    case "compass": return <Compass className={cls} />;
    case "flux": return <Triangle className={cls} />;
    case "google":
      return (
        <span className={`${cls} grid place-items-center font-bold text-[11px]`}
              style={{ background: "conic-gradient(from 180deg,#4285F4,#34A853,#FBBC05,#EA4335,#4285F4)", WebkitBackgroundClip: "text", color: "transparent" }}>
          G
        </span>
      );
    case "openai":
    default:
      return <Sparkles className={cls} />;
  }
}

function BadgePill({ b }: { b: ImageBadge }) {
  if (b.kind === "best") {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-white bg-gradient-to-r from-fuchsia-500 to-pink-500">
        {b.label}
      </span>
    );
  }
  if (b.kind === "warn") {
    return (
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md text-rose-300 bg-rose-500/15 border border-rose-500/30 inline-flex items-center gap-1">
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

function ModelRow({ m, active, onSelect }: { m: ImageModel; active: boolean; onSelect: (m: ImageModel) => void }) {
  const badges: ImageBadge[] = [
    ...(m.bestInClass ? [{ kind: "best" as const, label: "Best In Class" }] : []),
    ...(m.badges ?? []),
  ];
  return (
    <button
      type="button"
      onClick={() => onSelect(m)}
      className={`w-full flex items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
        active ? "bg-white/[0.04] ring-1 ring-brand/50" : "hover:bg-white/[0.03]"
      }`}
    >
      <div className="shrink-0 size-9 rounded-lg grid place-items-center bg-white/5 border border-white/10">
        <FamilyIcon kind={m.familyIcon} className="size-4 text-foreground/80" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[13px] font-semibold text-foreground">{m.label}</span>
          {badges.map((b, i) => <BadgePill key={i} b={b} />)}
          <MetaChip icon={Coins}>{m.cost} credits</MetaChip>
          {m.highRes && <MetaChip icon={Gem}>High Res</MetaChip>}
        </div>
        <p className="text-[11.5px] text-muted-foreground leading-snug mt-1 pr-6">{m.description}</p>
      </div>
      <span className={`shrink-0 mt-1 size-4 rounded-[4px] border ${active ? "border-brand bg-brand" : "border-white/25"} grid place-items-center`}>
        {active && <Check className="size-2.5 text-brand-foreground" strokeWidth={3} />}
      </span>
    </button>
  );
}

export function ImageModelPicker({ value, onChange }: { value: ImageModel; onChange: (m: ImageModel) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const match = (m: ImageModel) => (q ? m.label.toLowerCase().includes(q.toLowerCase()) : true);
  const bestInClass = useMemo(() => IMAGE_MODELS.filter((m) => m.bestInClass && match(m)), [q]);
  const featured = useMemo(() => IMAGE_MODELS.filter((m) => m.featured && match(m)), [q]);
  const groups = useMemo(() => groupImageModels().map((g) => ({ ...g, models: g.models.filter(match) })), [q]);

  function pick(m: ImageModel) { onChange(m); setOpen(false); }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 h-7 px-2 rounded-md hover:bg-surface-hover text-[12px] text-foreground">
          <span className="text-muted-foreground">Models</span>
          <FamilyIcon kind={value.familyIcon} className="size-3.5 text-foreground/80" />
          <span className="font-medium">{value.label}</span>
          <ChevronDown className="size-3 opacity-60" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[820px] p-0 gap-0 bg-[#0e0e12] border-white/10 max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center gap-2 p-3 border-b border-white/5">
          <div className="flex-1 flex items-center gap-2 h-10 px-3 rounded-lg bg-white/[0.04] border border-white/10">
            <Search className="size-4 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search image models"
              className="flex-1 bg-transparent text-[13px] focus:outline-none placeholder:text-muted-foreground/60"
            />
          </div>
          <button onClick={() => setOpen(false)} className="size-10 grid place-items-center rounded-lg hover:bg-white/5 text-muted-foreground">
            <X className="size-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-3 pb-4">
          {bestInClass.length > 0 && (
            <div className="pt-4">
              <div className="text-[10.5px] font-medium tracking-wider text-muted-foreground/80 px-2 mb-2">BEST IN CLASS</div>
              <div className="flex flex-col gap-0.5">
                {bestInClass.map((m) => <ModelRow key={m.key} m={m} active={m.key === value.key} onSelect={pick} />)}
              </div>
            </div>
          )}
          {featured.length > 0 && (
            <div className="pt-4">
              <div className="text-[10.5px] font-medium tracking-wider text-muted-foreground/80 px-2 mb-2">FEATURED</div>
              <div className="flex flex-col gap-0.5">
                {featured.map((m) => <ModelRow key={m.key} m={m} active={m.key === value.key} onSelect={pick} />)}
              </div>
            </div>
          )}
          <div className="pt-4">
            <div className="text-[10.5px] font-medium tracking-wider text-muted-foreground/80 px-2 mb-2">ALL MODELS</div>
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
                      <span className="text-[11.5px] text-muted-foreground">{g.models.length} model{g.models.length === 1 ? "" : "s"}</span>
                      <ChevronDown className={`size-4 ml-auto text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="pb-2 px-1">
                        {g.models.map((m) => (
                          <ModelRow key={m.key} m={m} active={m.key === value.key} onSelect={pick} />
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
