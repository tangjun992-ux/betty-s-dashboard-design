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
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2 text-foreground">
        <Icon className="size-4 text-muted-foreground" />
        <h2 className="text-[15px] font-semibold">{title}</h2>
      </div>
      {showArrows && (
        <div className="flex items-center gap-1.5">
          <button className="size-7 rounded-full bg-surface hover:bg-surface-hover grid place-items-center text-muted-foreground hover:text-foreground">
            <ChevronLeft className="size-3.5" />
          </button>
          <button className="size-7 rounded-full bg-surface hover:bg-surface-hover grid place-items-center text-muted-foreground hover:text-foreground">
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
