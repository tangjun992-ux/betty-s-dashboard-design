import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function ToolPill({
  icon: Icon,
  label,
  gradient = "from-sky-500 to-blue-600",
  to = "#",
}: {
  icon: LucideIcon;
  label: string;
  gradient?: string;
  to?: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 transition-opacity hover:opacity-80"
    >
      <span
        className={`size-10 rounded-xl bg-gradient-to-br ${gradient} grid place-items-center shrink-0 shadow-sm`}
      >
        <Icon className="size-[18px] text-white" />
      </span>
      <span className="text-[14px] font-medium">{label}</span>
    </Link>
  );
}
