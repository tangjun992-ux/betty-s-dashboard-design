import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function SectionHeader({
  icon: Icon,
  title,
  showArrows = true,
}: {
  icon: LucideIcon;
  title: string;
  showArrows?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 text-foreground">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      {showArrows && (
        <div className="flex items-center gap-1.5">
          <button className="size-8 rounded-full border border-border bg-surface hover:bg-surface-hover grid place-items-center text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-4" />
          </button>
          <button className="size-8 rounded-full border border-border bg-surface hover:bg-surface-hover grid place-items-center text-muted-foreground hover:text-foreground">
            <ChevronRight className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
