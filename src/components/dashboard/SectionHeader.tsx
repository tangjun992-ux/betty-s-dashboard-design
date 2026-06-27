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
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2.5 text-foreground">
        <Icon className="size-[18px] text-muted-foreground" />
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
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
