import { ArrowUpRight } from "lucide-react";

export function MediaCard({
  image,
  tag,
  title,
  description,
  hasExamples = false,
}: {
  image: string;
  tag: string;
  title: string;
  description: string;
  hasExamples?: boolean;
}) {
  return (
    <div className="group cursor-pointer">
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-border/60 bg-surface">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
      <div className="mt-3 px-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-500/15 text-sky-400">
            {tag}
          </span>
          {hasExamples && (
            <button className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground uppercase tracking-wide">
              Examples <ArrowUpRight className="size-3" />
            </button>
          )}
        </div>
        <h3 className="text-[15px] font-semibold leading-tight">{title}</h3>
        <p className="mt-1 text-[13px] text-muted-foreground leading-snug line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  );
}
