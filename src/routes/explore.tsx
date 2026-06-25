import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Sparkles, ArrowRight, Heart, RotateCcw, Repeat2,
  ChevronLeft, ChevronRight, SlidersHorizontal, Loader2,
  AlertCircle, ImageOff, RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import toolSeedance from "@/assets/tool-seedance.jpg";
import toolMotion from "@/assets/tool-motion.jpg";
import toolAvatar from "@/assets/tool-avatar.jpg";
import toolVideogen from "@/assets/tool-videogen.jpg";
import toolProduct from "@/assets/tool-product.jpg";
import toolHeadshot from "@/assets/tool-headshot.jpg";
import toolImagegen from "@/assets/tool-imagegen.jpg";
import bannerInfluencers from "@/assets/banner-influencers.jpg";
import bannerTutorial from "@/assets/banner-tutorial.jpg";
import bannerEarn from "@/assets/banner-earn.jpg";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explore — Betty" }] }),
  component: ExplorePage,
});

type Kind = "image" | "video";
type Card = {
  id: string;
  src: string;
  ratio: string;
  kind: Kind;
  model: string;
  duration?: string;
  likes: number;
};

const pool: string[] = [
  toolSeedance, toolMotion, toolAvatar, toolVideogen, toolProduct, toolHeadshot,
  toolImagegen, bannerInfluencers, bannerTutorial, bannerEarn,
];
const ratios = ["3/4", "2/3", "4/5", "1/1", "9/16", "3/4", "4/5"];
const allModels = ["GPT Image 2", "Seedance 2.0", "Kling 3.0", "Veo 3.1", "Flux 1.1", "Nano Banana"];

// Cursor-based fake fetcher — mimics Yapper's `?cursor=…&limit=…` API shape.
// Fails ~12% of the time on attempt #1 so we can demo the retry UI.
function fetchPage(opts: {
  cursor: number;
  limit: number;
  kind?: Kind | "all";
  model?: string;
  seed?: number;
  attempt?: number;
}): Promise<{ items: Card[]; nextCursor: number | null }> {
  const { cursor, limit, kind = "all", model, seed = 0, attempt = 1 } = opts;
  return new Promise((res, rej) => setTimeout(() => {
    if (attempt === 1 && cursor > 0 && Math.random() < 0.12) {
      rej(new Error("Network error while loading more"));
      return;
    }
    const items: Card[] = Array.from({ length: limit }, (_, i) => {
      const idx = cursor + i + seed;
      const k: Kind = kind === "all" ? (idx % 3 === 0 ? "video" : "image") : kind;
      const m = model ?? allModels[idx % allModels.length];
      return {
        id: `${m}-${idx}`,
        src: pool[idx % pool.length],
        ratio: ratios[idx % ratios.length],
        kind: k,
        model: m,
        duration: k === "video" ? `0:${String(5 + ((idx * 7) % 50)).padStart(2, "0")}` : undefined,
        likes: 120 + ((idx * 37 + seed * 11) % 4000),
      };
    });
    const next = cursor + limit;
    const nextCursor = next >= 120 ? null : next;
    res({ items, nextCursor });
  }, 480));
}

function SkeletonCard({ ratio, full = false }: { ratio: string; full?: boolean }) {
  return (
    <div
      className={full ? "" : "snap-start shrink-0"}
      style={full ? undefined : { width: "min(260px, 60vw)" }}
    >
      <div
        className="relative rounded-xl overflow-hidden bg-surface animate-pulse"
        style={{ aspectRatio: ratio }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] via-white/[0.07] to-white/[0.02]" />
        <div className="absolute top-2 left-2 h-4 w-16 rounded bg-white/10" />
        <div className="absolute bottom-2 left-2 h-3 w-10 rounded bg-white/10" />
        <div className="absolute bottom-2 right-2 h-3 w-12 rounded bg-white/10" />
      </div>
    </div>
  );
}

const filters = ["All", "Videos", "Images", "Avatars", "Audio"] as const;
const sorts = ["Trending", "Newest", "Most Liked"] as const;

const featuredModels = [
  { id: "gpt-image-2", model: "GPT Image 2", tagline: "4K images with near-perfect text rendering", badge: "New Model", kind: "image" as const, seed: 0 },
  { id: "seedance", model: "Seedance 2.0", tagline: "Multi-shot, multi-modal cinematic video", badge: "Popular", kind: "video" as const, seed: 3 },
  { id: "kling", model: "Kling 3.0", tagline: "Photoreal motion with strong character consistency", kind: "video" as const, seed: 5 },
  { id: "veo", model: "Veo 3.1", tagline: "Cinematic 1080p clips with native audio", badge: "Audio", kind: "video" as const, seed: 7 },
];

function ExplorePage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [sort, setSort] = useState<(typeof sorts)[number]>("Trending");

  const visibleRows = useMemo(() => {
    if (filter === "Videos") return featuredModels.filter((s) => s.kind === "video");
    if (filter === "Images") return featuredModels.filter((s) => s.kind === "image");
    if (filter === "Avatars" || filter === "Audio") return [];
    return featuredModels;
  }, [filter]);

  const feedKind: Kind | "all" =
    filter === "Videos" ? "video" : filter === "Images" ? "image" : "all";

  return (
    <AppShell>
      <div className="px-6 lg:px-8 pt-5 pb-12 space-y-8">
        {/* Hero feature banner */}
        <section className="relative overflow-hidden rounded-2xl bg-surface">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 md:p-10 flex flex-col justify-center">
              <span className="text-[11px] font-semibold tracking-[0.18em] text-sky-400 uppercase">New Feature</span>
              <h2 className="mt-4 text-3xl md:text-[34px] font-bold leading-[1.05] tracking-tight">
                Betty Agent. <br /> Don't prompt, just direct.
              </h2>
              <p className="mt-4 text-[13.5px] text-muted-foreground max-w-md leading-relaxed">
                Describe what you want to make and let Agent plan, generate, edit, and craft your optimal creative
                workflow. Works for any task, any medium, any style.
              </p>
              <button className="mt-7 inline-flex items-center gap-2 self-start h-10 px-5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition">
                <Sparkles className="size-4" /> Try Agent
              </button>
            </div>
            <div className="relative min-h-[260px] md:min-h-[320px]">
              <div className="absolute inset-0 grid grid-cols-3 gap-2 p-4">
                {[toolAvatar, toolVideogen, toolMotion, toolSeedance, bannerInfluencers, toolHeadshot].map((s, i) => (
                  <div key={i} className="rounded-lg overflow-hidden bg-background/40">
                    <img src={s} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-surface to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <div className="sticky top-0 z-20 -mx-6 lg:-mx-8 px-6 lg:px-8 py-3 bg-background/85 backdrop-blur border-b border-border/40 flex flex-wrap items-center gap-3">
          <div className="flex p-0.5 rounded-lg bg-surface text-[13px]">
            {filters.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-3 h-8 rounded-md transition-colors ${
                  filter === t ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as (typeof sorts)[number])}
              className="h-8 px-3 rounded-md bg-surface text-[13px] focus:outline-none"
            >
              {sorts.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="h-8 px-3 rounded-md bg-surface text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
              <SlidersHorizontal className="size-3.5" /> All Filters
            </button>
          </div>
        </div>

        {/* Per-model horizontal rows */}
        {visibleRows.map((section) => (
          <ModelRow key={section.id} section={section} />
        ))}

        {/* Infinite waterfall feed */}
        <WaterfallFeed kind={feedKind} sort={sort} />
      </div>
    </AppShell>
  );
}

/* ───────────────────────── Model row with cursor pagination ──────────────── */

function ModelRow({ section }: { section: (typeof featuredModels)[number] }) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [cursor, setCursor] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptRef = useRef(1);

  const loadMore = useCallback(async () => {
    if (loading || cursor === null) return;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchPage({
        cursor, limit: 8, kind: section.kind, model: section.model, seed: section.seed,
        attempt: attemptRef.current,
      });
      attemptRef.current = 1;
      setCards((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (e) {
      attemptRef.current += 1;
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [loading, cursor, section.kind, section.model, section.seed]);

  useEffect(() => { if (cards.length === 0) loadMore(); /* eslint-disable-next-line */ }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    const root = scrollerRef.current;
    if (!el || !root || error) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && loadMore()),
      { root, rootMargin: "0px 600px 0px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, error]);

  const scroll = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-[22px] font-bold tracking-tight uppercase">{section.model}</h2>
            {section.badge && (
              <span className="px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-wide bg-sky-500/15 text-sky-400">
                {section.badge}
              </span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">{section.tagline}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 uppercase tracking-wider">
            View all <ArrowRight className="size-3" />
          </button>
          <div className="hidden sm:flex items-center gap-1.5">
            <button onClick={() => scroll(-1)} className="size-8 rounded-full bg-surface hover:bg-surface-hover grid place-items-center text-muted-foreground hover:text-foreground">
              <ChevronLeft className="size-4" />
            </button>
            <button onClick={() => scroll(1)} className="size-8 rounded-full bg-surface hover:bg-surface-hover grid place-items-center text-muted-foreground hover:text-foreground">
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={scrollerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-6 lg:-mx-8 px-6 lg:px-8 pb-2"
      >
        {cards.map((c) => <ExploreCard key={c.id} card={c} />)}

        {loading && Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={`sk-${i}`} ratio={ratios[(i + section.seed) % ratios.length]} />
        ))}

        {error && (
          <div className="shrink-0 w-64 grid place-items-center rounded-xl bg-surface border border-border/40 p-4 text-center">
            <AlertCircle className="size-5 text-rose-400 mb-2" />
            <p className="text-[12px] text-muted-foreground mb-2">{error}</p>
            <button
              onClick={loadMore}
              className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md bg-surface-hover text-[11px] font-medium hover:bg-white/10"
            >
              <RefreshCw className="size-3" /> Retry
            </button>
          </div>
        )}

        {!loading && !error && cursor !== null && (
          <div ref={sentinelRef} className="shrink-0 w-40 grid place-items-center text-muted-foreground">
            <span className="text-xs">Load more →</span>
          </div>
        )}
      </div>
    </section>
  );
}

function WaterfallFeed({ kind, sort }: { kind: Kind | "all"; sort: string }) {
  const [items, setItems] = useState<Card[]>([]);
  const [cursor, setCursor] = useState<number | null>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const attemptRef = useRef(1);

  // Reset when filters change (Yapper resets the cursor when sort/kind changes).
  useEffect(() => {
    setItems([]);
    setCursor(0);
    setError(null);
    attemptRef.current = 1;
  }, [kind, sort]);

  const loadMore = useCallback(async () => {
    if (loading || cursor === null) return;
    setLoading(true);
    setError(null);
    try {
      const page = await fetchPage({ cursor, limit: 18, kind, seed: 13, attempt: attemptRef.current });
      attemptRef.current = 1;
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch (e) {
      attemptRef.current += 1;
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [loading, cursor, kind]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || error) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && loadMore()),
      { rootMargin: "1200px 0px 1200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, error]);

  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight uppercase">For You</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">A blended feed across every model and creator.</p>
        </div>
      </div>

      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 [column-fill:_balance]">
        {items.map((c) => (
          <div key={c.id} className="mb-3 break-inside-avoid">
            <ExploreCard card={c} full />
          </div>
        ))}
        {loading && Array.from({ length: 10 }).map((_, i) => (
          <div key={`wsk-${i}`} className="mb-3 break-inside-avoid">
            <SkeletonCard ratio={ratios[(i * 3) % ratios.length]} full />
          </div>
        ))}
      </div>

      <div ref={sentinelRef} className="mt-6 min-h-16 grid place-items-center text-muted-foreground">
        {error ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <AlertCircle className="size-5 text-rose-400" />
            <p className="text-[12px]">{error}</p>
            <button
              onClick={loadMore}
              className="inline-flex items-center gap-1.5 h-8 px-4 rounded-md bg-surface hover:bg-surface-hover text-[12px] font-medium"
            >
              <RefreshCw className="size-3.5" /> Retry
            </button>
          </div>
        ) : cursor === null ? (
          <span className="text-xs">You've reached the end.</span>
        ) : loading ? (
          <span className="inline-flex items-center gap-2 text-xs"><Loader2 className="size-4 animate-spin" /> Loading…</span>
        ) : (
          <button onClick={loadMore} className="text-xs hover:text-foreground">Load more</button>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────── Card ──────────────────────────────────────────── */

function ExploreCard({ card, full = false }: { card: Card; full?: boolean }) {
  const [liked, setLiked] = useState(false);
  return (
    <div
      className={`group cursor-pointer ${full ? "" : "snap-start shrink-0"}`}
      style={full ? undefined : { width: "min(260px, 60vw)" }}
    >
      <div className="relative rounded-xl overflow-hidden bg-surface" style={{ aspectRatio: card.ratio }}>
        <img src={card.src} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0 opacity-90" />

        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/55 backdrop-blur text-white/90">
            {card.model}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); setLiked((v) => !v); }}
          className="absolute top-2 right-2 size-7 grid place-items-center rounded-full bg-black/45 backdrop-blur text-white/85 opacity-0 group-hover:opacity-100 transition"
          aria-label="Like"
        >
          <Heart className={`size-3.5 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>

        {card.duration && (
          <span className="absolute bottom-2 left-2 text-[11px] font-medium text-white/90">{card.duration}</span>
        )}
        <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[11px] text-white/85">
          <Heart className="size-3" /> {card.likes.toLocaleString()}
        </span>

        <div className="absolute inset-x-2 bottom-2 flex gap-1.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
          <button className="flex-1 h-7 rounded-md bg-white/95 text-[11px] font-semibold text-background inline-flex items-center justify-center gap-1 hover:bg-white">
            <RotateCcw className="size-3" /> Recreate
          </button>
          <button className="flex-1 h-7 rounded-md bg-white/10 backdrop-blur text-white text-[11px] font-medium inline-flex items-center justify-center gap-1 hover:bg-white/20">
            <Repeat2 className="size-3" /> Reuse
          </button>
        </div>
      </div>
    </div>
  );
}
