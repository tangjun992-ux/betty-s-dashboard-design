import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Heart, Repeat2 } from "lucide-react";

export type MediaAuthor = { name: string; handle: string; avatar?: string };
export type MediaStats = { likes?: number; remixes?: number };

function fmt(n?: number) {
  if (!n && n !== 0) return null;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return `${n}`;
}

export function MediaCard({
  image,
  tag,
  title,
  description,
  hasExamples = false,
  to = "#",
  examplesTo,
  author,
  stats,
}: {
  image: string;
  tag: string;
  title: string;
  description: string;
  hasExamples?: boolean;
  to?: string;
  examplesTo?: string;
  author?: MediaAuthor;
  stats?: MediaStats;
}) {
  const isInternal = to.startsWith("/");
  const Wrapper: any = isInternal ? Link : "a";
  const wrapperProps = isInternal ? { to } : { href: to };
  const likes = fmt(stats?.likes);
  const remixes = fmt(stats?.remixes);

  return (
    <div className="group block">
      <Wrapper {...wrapperProps} className="block cursor-pointer">
        <div className="relative aspect-square rounded-xl overflow-hidden bg-surface">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {(likes || remixes) && (
            <div className="absolute inset-x-0 bottom-0 p-2.5 flex items-center justify-end gap-2 text-[11px] font-medium text-white opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all bg-gradient-to-t from-black/70 via-black/20 to-transparent">
              {likes && (
                <span className="inline-flex items-center gap-1 px-1.5 h-6 rounded-md bg-black/50 backdrop-blur-sm">
                  <Heart className="size-3" /> {likes}
                </span>
              )}
              {remixes && (
                <span className="inline-flex items-center gap-1 px-1.5 h-6 rounded-md bg-black/50 backdrop-blur-sm">
                  <Repeat2 className="size-3" /> {remixes}
                </span>
              )}
            </div>
          )}
        </div>
      </Wrapper>
      <div className="mt-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-sky-500/15 text-sky-400 uppercase tracking-wide shrink-0">
              {tag}
            </span>
            <h3 className="text-[14px] font-semibold leading-tight truncate group-hover:text-foreground">
              <Wrapper {...wrapperProps} className="hover:underline underline-offset-2">{title}</Wrapper>
            </h3>
          </div>
          {hasExamples && (
            examplesTo ? (
              <Link
                to={examplesTo}
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
        {author ? (
          <Link
            to="/u/$handle"
            params={{ handle: author.handle }}
            className="mt-1 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {author.avatar ? (
              <img src={author.avatar} alt="" className="size-4 rounded-full object-cover" />
            ) : (
              <span className="size-4 rounded-full bg-surface-hover grid place-items-center text-[8px] font-semibold uppercase">
                {author.name[0]}
              </span>
            )}
            <span className="truncate">@{author.handle}</span>
          </Link>
        ) : (
          <p className="mt-1 text-[12.5px] text-muted-foreground leading-snug line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
