import { Link, useRouterState } from "@tanstack/react-router";
import { type ReactNode, type ComponentType } from "react";
import { Sparkles, Image as ImageIcon, Video, ChevronLeft, ChevronRight } from "lucide-react";

const MODES = [
  { to: "/create/agent", label: "Agent", icon: Sparkles },
  { to: "/create/image", label: "Image", icon: ImageIcon },
  { to: "/create/video", label: "Video", icon: Video },
] as const;

export type Chip = { label: string; icon?: ComponentType<{ className?: string }>; badge?: string };
export type App = { image: string; title: string; tag?: string };

export function CreateHub({
  title,
  chips,
  composer,
  appsTitle,
  appsIcon: AppsIcon,
  apps,
}: {
  title: ReactNode;
  chips: Chip[];
  composer: ReactNode;
  appsTitle: string;
  appsIcon: ComponentType<{ className?: string }>;
  apps: App[];
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative">
      {/* Center column */}
      <div className="px-6 lg:px-10 xl:pr-[120px] pt-10 lg:pt-16 pb-12">
        <div className="max-w-[820px] mx-auto">
          {/* Mode switcher */}
          <div className="flex justify-center mb-10 lg:mb-14">
            <div className="inline-flex p-1 rounded-full bg-surface/70 border border-border/60 backdrop-blur">
              {MODES.map((m) => {
                const active = pathname === m.to;
                const Icon = m.icon;
                return (
                  <Link
                    key={m.to}
                    to={m.to}
                    className={`flex items-center gap-2 h-9 px-5 rounded-full text-[13.5px] font-medium transition-colors ${
                      active
                        ? "bg-surface-hover text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className={`size-4 ${active ? "text-brand" : ""}`} />
                    {m.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Hero title */}
          <h1 className="text-center text-[34px] lg:text-[40px] font-semibold tracking-tight leading-tight">
            {title}
          </h1>

          {/* Chips */}
          {chips.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {chips.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.label}
                    type="button"
                    className="relative h-9 px-4 rounded-full bg-surface/70 border border-border/60 text-[13px] font-medium text-foreground/90 hover:bg-surface-hover transition-colors flex items-center gap-2"
                  >
                    {Icon && <Icon className="size-3.5 text-muted-foreground" />}
                    {c.label}
                    {c.badge && (
                      <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 rounded-md text-[9.5px] font-semibold bg-brand text-brand-foreground leading-none">
                        {c.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Composer */}
          <div className="mt-8">{composer}</div>
        </div>

        {/* Apps */}
        <div className="max-w-[1400px] mx-auto mt-16 lg:mt-20">
          <div className="border-t border-border/60 pt-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <AppsIcon className="size-4 text-muted-foreground" />
                <h2 className="text-[15px] font-semibold">{appsTitle}</h2>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="size-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover" aria-label="Previous">
                  <ChevronLeft className="size-4" />
                </button>
                <button className="size-8 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover" aria-label="Next">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {apps.map((a) => (
                <button
                  key={a.title}
                  className="group text-left"
                >
                  <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-surface">
                    <img src={a.image} alt={a.title} loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    {a.tag && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/55 backdrop-blur text-white">
                        {a.tag}
                      </span>
                    )}
                    <div className="absolute bottom-2.5 left-3 right-3 text-[12.5px] font-medium text-white">
                      {a.title}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sessions rail */}
      <SessionsRail />
    </div>
  );
}

function SessionsRail() {
  return (
    <aside className="hidden xl:flex absolute top-0 right-4 w-[88px] flex-col items-center pt-4 gap-3">
      <div className="text-[10.5px] uppercase tracking-wider text-muted-foreground/80">Sessions</div>
      <div className="flex flex-col gap-2">
        {SESSION_THUMBS.map((c, i) => (
          <div
            key={i}
            className={`size-[72px] rounded-lg overflow-hidden border border-border/60 ${c}`}
          />
        ))}
      </div>
    </aside>
  );
}

const SESSION_THUMBS = [
  "bg-gradient-to-br from-slate-700 to-slate-900",
  "bg-gradient-to-br from-amber-500/40 to-rose-700/60",
  "bg-gradient-to-br from-indigo-700 to-slate-900",
  "bg-gradient-to-br from-zinc-700 to-zinc-900",
  "bg-gradient-to-br from-violet-700/60 to-fuchsia-900/60",
  "bg-gradient-to-br from-sky-700/60 to-indigo-900",
];

export function Composer({
  placeholder,
  value,
  onChange,
  onSubmit,
  options,
  leading,
  busy,
  disabled,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  options?: ReactNode;
  leading?: ReactNode;
  busy?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-surface/70 border border-border/60 backdrop-blur shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]">
      <div className="flex gap-3 p-4">
        {leading}
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              onSubmit?.();
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[14px] resize-none focus:outline-none placeholder:text-muted-foreground/70 min-h-[44px] max-h-48 py-1.5"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled || busy || !value.trim()}
          className="size-9 shrink-0 grid place-items-center rounded-full bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition"
          aria-label="Submit"
        >
          <svg viewBox="0 0 24 24" className={`size-4 ${busy ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            {busy ? <circle cx="12" cy="12" r="9" strokeDasharray="40 20" /> : <><path d="M12 19V5" /><path d="m5 12 7-7 7 7" /></>}
          </svg>
        </button>
      </div>
      {options && (
        <div className="flex items-center gap-1.5 flex-wrap px-3 pb-3 pt-1 text-[12.5px]">
          {options}
        </div>
      )}
    </div>
  );
}

export function OptionPill({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon?: ComponentType<{ className?: string }>;
  label?: string;
  value: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 px-2.5 rounded-md hover:bg-surface-hover text-foreground/90 flex items-center gap-1.5 transition-colors"
    >
      {Icon && <Icon className="size-3.5 text-muted-foreground" />}
      {label && <span className="text-muted-foreground">{label}</span>}
      <span className="font-medium">{value}</span>
      <svg viewBox="0 0 24 24" className="size-3 opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  );
}
