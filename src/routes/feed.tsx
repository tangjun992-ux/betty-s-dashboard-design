import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Heart, Loader2, Sparkles, Image as ImageIcon, Video, Mic2 } from "lucide-react";
import { listPublicFeed, toggleLike, listMyLikes } from "@/lib/social.functions";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "Community Feed — Betty" },
      { name: "description", content: "See what creators are making with Betty's AI tools and like your favorites." },
      { property: "og:title", content: "Community Feed — Betty" },
      { property: "og:description", content: "A live feed of AI creations from the Betty community." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/feed" },
    ],
    links: [{ rel: "canonical", href: "/feed" }],
  }),
  component: FeedPage,
});

type Kind = "all" | "image" | "video" | "audio";
const TABS: { k: Kind; label: string; icon: typeof Sparkles }[] = [
  { k: "all", label: "All", icon: Sparkles },
  { k: "image", label: "Images", icon: ImageIcon },
  { k: "video", label: "Videos", icon: Video },
  { k: "audio", label: "Audio", icon: Mic2 },
];

function FeedPage() {
  const [kind, setKind] = useState<Kind>("all");
  const { user } = useSession();
  const qc = useQueryClient();
  const fetchFeed = useServerFn(listPublicFeed);
  const fetchLikes = useServerFn(listMyLikes);
  const likeFn = useServerFn(toggleLike);

  const feed = useInfiniteQuery({
    queryKey: ["public-feed", kind],
    queryFn: ({ pageParam }) =>
      fetchFeed({ data: { kind, cursor: pageParam as string | null, limit: 24 } }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const items = useMemo(
    () => feed.data?.pages.flatMap((p) => p.items) ?? [],
    [feed.data],
  );
  const ids = useMemo(() => items.map((i) => i.id), [items]);

  const likes = useQuery({
    queryKey: ["my-likes", user?.id, ids.join(",")],
    queryFn: () => fetchLikes({ data: { generationIds: ids } }),
    enabled: !!user && ids.length > 0,
  });
  const likedSet = useMemo(() => new Set(likes.data?.liked ?? []), [likes.data]);

  const like = useMutation({
    mutationFn: (generationId: string) => likeFn({ data: { generationId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-likes", user?.id] });
      qc.invalidateQueries({ queryKey: ["public-feed", kind] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't like"),
  });

  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinel.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) {
          feed.fetchNextPage();
        }
      },
      { rootMargin: "800px" },
    );
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [feed]);

  return (
    <AppShell>
      <div className="relative">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in oklab, var(--brand) 22%, transparent), transparent 70%)",
            }}
          />
          <div className="relative max-w-[1600px] mx-auto px-6 lg:px-10 pt-12 pb-8">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Community</div>
            <h1 className="mt-2 text-4xl md:text-5xl font-semibold tracking-tight">
              <span className="bg-clip-text text-transparent bg-[image:var(--gradient-brand)]">
                Fresh from the feed
              </span>
            </h1>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              A live stream of AI creations made with Betty. Tap the heart to save your favorites — your likes shape what we surface next.
            </p>
          </div>
        </div>

        {/* Sticky filter bar */}
        <div className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-12 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {TABS.map((t) => {
              const active = kind === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => setKind(t.k)}
                  className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12.5px] font-medium transition-all ${
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface"
                  }`}
                >
                  <t.icon className="size-3.5" />
                  {t.label}
                </button>
              );
            })}
            {feed.isFetching && !feed.isFetchingNextPage ? (
              <div className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Loader2 className="size-3 animate-spin" /> Updating…
              </div>
            ) : null}
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
          {feed.isLoading ? (
            <Masonry>
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="break-inside-avoid mb-3 rounded-2xl bg-surface border border-border animate-pulse"
                  style={{ height: 180 + (i % 5) * 70 }}
                />
              ))}
            </Masonry>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-16 text-center">
              <h3 className="text-base font-semibold">No public creations yet</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                Be the first — generate something and it will show up here.
              </p>
              <Link
                to="/create/image"
                className="inline-flex mt-5 h-9 px-4 rounded-full bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-medium items-center shadow-[var(--shadow-glow)]"
              >
                Create now
              </Link>
            </div>
          ) : (
            <Masonry>
              {items.map((g) => {
                const liked = likedSet.has(g.id);
                const src = g.thumb_url ?? g.asset_url ?? "";
                return (
                  <div
                    key={g.id}
                    className="relative break-inside-avoid mb-3 group rounded-2xl overflow-hidden bg-surface border border-border hover:border-foreground/20 transition-colors"
                  >
                    {src ? (
                      <img
                        src={src}
                        alt={g.prompt ?? ""}
                        loading="lazy"
                        className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="aspect-square grid place-items-center text-xs text-muted-foreground">
                        {g.kind}
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
                      <p className="text-[12.5px] leading-snug text-white line-clamp-2">
                        {g.prompt ?? "Untitled"}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/70">
                        <Link
                          to="/u/$handle"
                          params={{ handle: g.author?.handle ?? "creator" }}
                          className="pointer-events-auto truncate hover:text-white"
                        >
                          @{g.author?.handle ?? "creator"}
                        </Link>
                        <span className="uppercase tracking-wide">{g.kind}</span>
                      </div>
                    </div>

                    {/* Like badge — always visible */}
                    <button
                      onClick={() => {
                        if (!user) {
                          toast.message("Sign in to like creations");
                          return;
                        }
                        like.mutate(g.id);
                      }}
                      aria-pressed={liked}
                      className={`absolute top-2 right-2 inline-flex items-center gap-1 h-7 px-2 rounded-full backdrop-blur-md text-[11px] font-medium transition-all ${
                        liked
                          ? "bg-rose-500/85 text-white shadow-[0_4px_16px_rgba(244,63,94,0.45)]"
                          : "bg-black/45 text-white/90 hover:bg-black/65"
                      }`}
                    >
                      <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} />
                      <span className="tabular-nums">{g.like_count}</span>
                    </button>
                  </div>
                );
              })}
            </Masonry>
          )}

          <div ref={sentinel} className="h-12 mt-2 flex items-center justify-center text-xs text-muted-foreground">
            {feed.isFetchingNextPage ? (
              <span className="flex items-center gap-2">
                <Loader2 className="size-3.5 animate-spin" /> Loading more…
              </span>
            ) : !feed.hasNextPage && items.length > 0 ? (
              <span>You've reached the end.</span>
            ) : null}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Masonry({ children }: { children: React.ReactNode }) {
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 xl:columns-5 gap-3 [column-fill:_balance]">
      {children}
    </div>
  );
}
