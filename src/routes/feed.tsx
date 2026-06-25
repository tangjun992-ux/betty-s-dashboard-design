import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Heart, Compass, Loader2 } from "lucide-react";
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
const TABS: { k: Kind; label: string }[] = [
  { k: "all", label: "All" },
  { k: "image", label: "Images" },
  { k: "video", label: "Videos" },
  { k: "audio", label: "Audio" },
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

  // infinite scroll sentinel
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!sentinel.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && feed.hasNextPage && !feed.isFetchingNextPage) {
          feed.fetchNextPage();
        }
      },
      { rootMargin: "600px" },
    );
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [feed]);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-6 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="size-5 text-muted-foreground" />
              <h1 className="text-2xl font-semibold tracking-tight">Community Feed</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Fresh creations from the Betty community. Tap the heart to save your favorites.
            </p>
          </div>
          <div className="flex gap-2">
            {TABS.map((t) => {
              const active = kind === t.k;
              return (
                <button
                  key={t.k}
                  onClick={() => setKind(t.k)}
                  className={`h-9 px-4 rounded-md text-sm border transition-colors ${
                    active ? "bg-surface border-border text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:bg-surface"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {feed.isLoading ? (
          <Masonry>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-surface border border-border animate-pulse" style={{ height: 200 + (i % 4) * 60 }} />
            ))}
          </Masonry>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface/50 p-16 text-center">
            <h3 className="text-base font-semibold">No public creations yet</h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
              Be the first — generate something and it will show up here.
            </p>
            <Link to="/create/image" className="inline-flex mt-5 h-9 px-4 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-medium items-center shadow-[var(--shadow-glow)]">
              Create now
            </Link>
          </div>
        ) : (
          <Masonry>
            {items.map((g) => {
              const liked = likedSet.has(g.id);
              return (
                <div key={g.id} className="break-inside-avoid mb-3 group rounded-xl overflow-hidden bg-surface border border-border">
                  {g.thumb_url || g.asset_url ? (
                    <img
                      src={g.thumb_url ?? g.asset_url ?? ""}
                      alt={g.prompt ?? ""}
                      loading="lazy"
                      className="w-full h-auto block"
                    />
                  ) : null}
                  <div className="p-3 space-y-2">
                    <p className="text-[12.5px] leading-snug line-clamp-2">{g.prompt ?? "Untitled"}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">
                        @{g.author?.handle ?? "creator"} · {g.kind}
                      </span>
                      <button
                        onClick={() => {
                          if (!user) {
                            toast.message("Sign in to like creations");
                            return;
                          }
                          like.mutate(g.id);
                        }}
                        className={`flex items-center gap-1 px-2 h-7 rounded-md border transition-colors ${
                          liked ? "border-rose-500/60 text-rose-400 bg-rose-500/10" : "border-border hover:text-foreground"
                        }`}
                        aria-pressed={liked}
                      >
                        <Heart className={`size-3.5 ${liked ? "fill-current" : ""}`} />
                        <span className="tabular-nums">{g.like_count}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </Masonry>
        )}

        <div ref={sentinel} className="h-10 flex items-center justify-center text-xs text-muted-foreground">
          {feed.isFetchingNextPage ? (
            <span className="flex items-center gap-2"><Loader2 className="size-3.5 animate-spin" /> Loading more…</span>
          ) : !feed.hasNextPage && items.length > 0 ? (
            <span>You've reached the end.</span>
          ) : null}
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
