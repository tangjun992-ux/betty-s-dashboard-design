import type { LucideIcon } from "lucide-react";

export function ToolPill({
  icon: Icon,
  label,
  gradient = "from-sky-500 to-blue-600",
}: {
  icon: LucideIcon;
  label: string;
  gradient?: string;
}) {
  return (
    <button className="group flex items-center gap-3 pr-4 h-12 rounded-xl bg-surface hover:bg-surface-hover border border-border/60 transition-colors">
      <span
        className={`size-12 rounded-xl bg-gradient-to-br ${gradient} grid place-items-center shrink-0`}
      >
        <Icon className="size-5 text-white" />
      </span>
      <span className="text-sm font-medium pl-1">{label}</span>
    </button>
  );
}
