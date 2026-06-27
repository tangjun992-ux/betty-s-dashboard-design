import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

/**
 * Yapper-style colored chip — a solid rounded-square icon tile + label.
 * `tone` drives the per-tool accent so each tool has its own identity
 * instead of a uniform brand color.
 */
const TONES: Record<string, { bg: string; fg: string }> = {
  violet:  { bg: "bg-violet-500/18",   fg: "text-violet-300" },
  sky:     { bg: "bg-sky-500/18",      fg: "text-sky-300" },
  blue:    { bg: "bg-blue-500/18",     fg: "text-blue-300" },
  cyan:    { bg: "bg-cyan-500/18",     fg: "text-cyan-300" },
  fuchsia: { bg: "bg-fuchsia-500/18",  fg: "text-fuchsia-300" },
  zinc:    { bg: "bg-zinc-500/20",     fg: "text-zinc-300" },
  amber:   { bg: "bg-amber-500/18",    fg: "text-amber-300" },
  emerald: { bg: "bg-emerald-500/18",  fg: "text-emerald-300" },
};

export function ToolPill({
  icon: Icon,
  label,
  to = "#",
  tone = "sky",
}: {
  icon: LucideIcon;
  label: string;
  /** legacy — ignored */
  gradient?: string;
  to?: string;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone] ?? TONES.sky;
  return (
    <Link
      to={to}
      className="group flex items-center gap-2.5 h-10 pr-4 pl-1.5 rounded-full bg-surface/70 border border-border/60 hover:bg-surface-hover transition-colors"
    >
      <span className={`size-7 rounded-lg grid place-items-center shrink-0 ${t.bg}`}>
        <Icon className={`size-[15px] ${t.fg}`} />
      </span>
      <span className="text-[13.5px] font-medium text-foreground/90">{label}</span>
    </Link>
  );
}
