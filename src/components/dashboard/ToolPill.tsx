import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ToolPill({
  icon: Icon,
  label,
  to = "#",
}: {
  icon: LucideIcon;
  label: string;
  /** kept for backward compatibility; no longer used (flat Yapper-style) */
  gradient?: string;
  to?: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-2.5 h-10 pr-4 pl-1.5 rounded-full bg-surface/70 border border-border/60 hover:bg-surface-hover transition-colors"
    >
      <span className="size-7 rounded-full grid place-items-center shrink-0" style={{ background: "var(--brand-soft)" }}>
        <Icon className="size-[15px] text-brand" />
      </span>
      <span className="text-[13.5px] font-medium text-foreground/90">{label}</span>
    </Link>
  );
}
