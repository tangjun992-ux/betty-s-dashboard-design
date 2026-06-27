import { Link } from "@tanstack/react-router";
import { Download, Repeat2, MoreHorizontal, Loader2, Play, AlertCircle } from "lucide-react";
import type { RecentGen } from "@/hooks/use-recent-generations";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function timeAgo(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const KIND_TO_CREATE: Record<string, string> = {
  image: "/create/image",
  video: "/create/video",
  audio: "/create/audio",
  avatar: "/create/avatar",
  motion: "/create/motion",
  lipsync: "/create/lipsync",
  upscale: "/create/upscale",
  extract: "/create/extract",
  agent: "/create/agent",
};

export function GenerationCard({ gen }: { gen: RecentGen }) {
  const isVideo = gen.kind === "video" || gen.kind === "motion" || gen.kind === "avatar" || gen.kind === "lipsync";
  const isDone = gen.status === "succeeded";
  const isFailed = gen.status === "failed";
  const isRunning = gen.status === "running" || gen.status === "queued";
  const recreateTo = KIND_TO_CREATE[gen.kind] ?? "/create/agent";

  return (
    <div className="group relative">
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface-2 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[var(--shadow-elev-2)]">
        {isDone && gen.thumb_url ? (
          isVideo ? (
            <video
              src={gen.asset_url ?? undefined}
              poster={gen.thumb_url ?? undefined}
              muted
              playsInline
              loop
              preload="metadata"
              onMouseEnter={(e) => void e.currentTarget.play().catch(() => {})}
              onMouseLeave={(e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img
              src={gen.thumb_url}
              alt={gen.prompt ?? "generation"}
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )
        ) : (
          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
            {isRunning ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="size-5 animate-spin text-brand" />
                <span className="text-[11px]">Processing…</span>
              </div>
            ) : isFailed ? (
              <div className="flex flex-col items-center gap-2 text-destructive">
                <AlertCircle className="size-5" />
                <span className="text-[11px]">Failed</span>
              </div>
            ) : null}
          </div>
        )}

        {/* gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/0 to-black/0 opacity-90 pointer-events-none" />

        {/* top-left: kind badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="inline-flex items-center px-2 h-5 rounded-md text-[10px] font-medium bg-black/55 backdrop-blur text-white/90 uppercase tracking-wide">
            {gen.kind}
          </span>
          {isVideo && isDone ? (
            <span className="inline-flex items-center justify-center size-5 rounded-md bg-black/55 backdrop-blur text-white/90">
              <Play className="size-3 fill-current" />
            </span>
          ) : null}
        </div>

        {/* top-right: status pill */}
        {!isDone ? (
          <div className="absolute top-2 right-2">
            <span
              className={`inline-flex items-center gap-1 px-2 h-5 rounded-md text-[10px] font-medium backdrop-blur ${
                isFailed
                  ? "bg-destructive/80 text-destructive-foreground"
                  : "bg-amber-500/85 text-black"
              }`}
            >
              {isRunning ? <Loader2 className="size-2.5 animate-spin" /> : null}
              {isRunning ? "Processing" : "Failed"}
            </span>
          </div>
        ) : null}

        {/* bottom row: actions (hover) */}
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
          <span className="text-[10.5px] text-white/75">{timeAgo(gen.created_at)}</span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isDone && gen.asset_url ? (
              <a
                href={gen.asset_url}
                download
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center size-6 rounded-md bg-black/55 backdrop-blur-sm text-white/90 hover:text-white"
                aria-label="Download"
              >
                <Download className="size-3" />
              </a>
            ) : null}
            <Link
              to={recreateTo}
              search={gen.prompt ? { prompt: gen.prompt } : undefined}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center justify-center size-6 rounded-md bg-black/55 backdrop-blur-sm text-white/90 hover:text-white"
              aria-label="Remix"
            >
              <Repeat2 className="size-3" />
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center size-6 rounded-md bg-black/55 backdrop-blur-sm text-white/90 hover:text-white"
                  aria-label="More"
                >
                  <MoreHorizontal className="size-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <Link to={recreateTo} search={gen.prompt ? { prompt: gen.prompt } : undefined}>Remix</Link>
                </DropdownMenuItem>
                {isDone && gen.asset_url ? (
                  <DropdownMenuItem asChild>
                    <a href={gen.asset_url} download>Download</a>
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/library">Open in Library</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* meta line */}
      <div className="mt-2 px-0.5">
        <p className="text-[12px] text-foreground/85 line-clamp-1" title={gen.prompt ?? ""}>
          {gen.prompt || <span className="text-muted-foreground italic">Untitled</span>}
        </p>
        <p className="mt-0.5 text-[10.5px] text-muted-foreground truncate">{gen.model}</p>
      </div>
    </div>
  );
}
