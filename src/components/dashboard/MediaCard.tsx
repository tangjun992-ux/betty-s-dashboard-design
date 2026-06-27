import { Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";

export function MediaCard({
  image,
  tag,
  title,
  description,
  hasExamples = false,
  to = "#",
  examplesTo,
}: {
  image: string;
  tag: string;
  title: string;
  description: string;
  hasExamples?: boolean;
  to?: string;
  examplesTo?: string;
}) {
  const isInternal = to.startsWith("/");
  const Wrapper: any = isInternal ? Link : "a";
  const wrapperProps = isInternal ? { to } : { href: to };

  return (
    <Wrapper {...wrapperProps} className="group block cursor-pointer">
      <div className="relative aspect-square rounded-xl overflow-hidden bg-surface">
        <img
          src={image}
          alt={title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/15 text-sky-400 uppercase tracking-wide">
              {tag}
            </span>
            <h3 className="text-[14px] font-semibold leading-tight group-hover:text-foreground">{title}</h3>
          </div>
          {hasExamples && (
            examplesTo ? (
              <Link
                to={examplesTo}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider shrink-0"
              >
                Examples <ArrowUpRight className="size-3" />
              </Link>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                Examples <ArrowUpRight className="size-3" />
              </span>
            )
          )}
        </div>
        <p className="mt-1 text-[12.5px] text-muted-foreground leading-snug line-clamp-2">
          {description}
        </p>
      </div>
    </Wrapper>
  );
}
