import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { Sparkles } from "lucide-react";

export function EmptyState({
  icon: Icon = Sparkles,
  title,
  description,
  ctaLabel,
  ctaTo = "/create/agent",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: string;
}) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface-1/60 p-10 flex flex-col items-center text-center">
      <div className="size-12 rounded-2xl grid place-items-center bg-brand-soft text-brand mb-4">
        <Icon className="size-5" />
      </div>
      <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      {description ? (
        <p className="mt-1.5 text-[13px] text-muted-foreground max-w-sm">{description}</p>
      ) : null}
      {ctaLabel ? (
        <Link
          to={ctaTo}
          className="mt-5 inline-flex items-center h-9 px-4 rounded-full text-[13px] font-medium bg-[image:var(--gradient-brand)] text-brand-foreground hover:shadow-[var(--shadow-glow)] transition-shadow"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
