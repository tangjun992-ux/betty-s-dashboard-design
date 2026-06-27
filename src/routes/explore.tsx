import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  Sparkles, ArrowRight, Heart, RotateCcw, Repeat2,
  ChevronLeft, ChevronRight, SlidersHorizontal, Loader2,
  AlertCircle, ImageOff, RefreshCw, X, Download, Share2,
  ImagePlus, Mic2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, KeyboardEvent as ReactKeyboardEvent } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

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

type SearchParams = { filter?: string; sort?: string };
const validFilters = ["All", "Videos", "Images", "Avatars", "Audio"] as const;
const validSorts = ["Trending", "Newest", "Most Liked"] as const;

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explore — Betty" }] }),
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    filter: validFilters.includes(search.filter as never) ? (search.filter as string) : undefined,
    sort: validSorts.includes(search.sort as never) ? (search.sort as string) : undefined,
  }),
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

const MODEL_KEY: Record<string, string> = {
  "GPT Image 2": "gpt-image-2",
  "Nano Banana": "nano-banana",
  "Flux 1.1": "flux-1-1",
  "Seedance 2.0": "seedance-2",
  "Kling 3.0": "kling-v2-1-master",
  "Veo 3.1": "veo-3-1",
};
function promptFor(card: Card) {
  return card.kind === "video"
    ? `Cinematic ${card.model} render — slow dolly-in, dramatic rim lighting, 35mm, shallow depth of field`
    : `Editorial ${card.model} render — high-detail portrait, dramatic rim lighting, magazine cover composition`;
}
function remixSearch(card: Card) {
  return {
    prompt: promptFor(card),
    model: MODEL_KEY[card.model],
    aspect: card.ratio === "9/16" ? "9:16" : card.ratio === "1/1" ? "1:1" : "16:9",
  };
}

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
  signal?: AbortSignal;
}): Promise<{ items: Card[]; nextCursor: number | null }> {
  const { cursor, limit, kind = "all", model, seed = 0, attempt = 1, signal } = opts;
  return new Promise((res, rej) => {
    if (signal?.aborted) {
      rej(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
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
    }, 480);
    const onAbort = () => {
      clearTimeout(t);
      rej(new DOMException("Aborted", "AbortError"));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

// Debounce a rapidly-changing value (e.g. filter/sort while the user is clicking around).
function useDebounced<T>(value: T, delay = 180): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
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

type Filter = (typeof validFilters)[number];
type Sort = (typeof validSorts)[number];

function ExplorePage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/explore" });

  const filter = (search.filter as Filter) ?? "All";
  const sort = (search.sort as Sort) ?? "Trending";

  const setFilter = (f: Filter) =>
    navigate({ search: (s: SearchParams) => ({ ...s, filter: f === "All" ? undefined : f }), replace: true });
  const setSort = (s: Sort) =>
    navigate({ search: (prev: SearchParams) => ({ ...prev, sort: s === "Trending" ? undefined : s }), replace: true });

  const [active, setActive] = useState<Card | null>(null);

  const filterBarRef = useRef<HTMLDivElement | null>(null);
  const onFilterKey = (e: ReactKeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const buttons = filterBarRef.current?.querySelectorAll<HTMLButtonElement>("button[data-filter]");
    if (!buttons?.length) return;
    let next = idx;
    if (e.key === "ArrowLeft") next = (idx - 1 + buttons.length) % buttons.length;
    else if (e.key === "ArrowRight") next = (idx + 1) % buttons.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = buttons.length - 1;
    buttons[next].focus();
    buttons[next].click();
  };

  const visibleRows = useMemo(() => {
    if (filter === "Videos") return featuredModels.filter((s) => s.kind === "video");
    if (filter === "Images") return featuredModels.filter((s) => s.kind === "image");
    if (filter === "Avatars" || filter === "Audio") return [];
    return featuredModels;
  }, [filter]);

  const feedKind: Kind | "all" =
    filter === "Videos" ? "video" : filter === "Images" ? "image" : "all";

  const debouncedKind = useDebounced(feedKind, 180);
  const debouncedSort = useDebounced(sort, 180);

  const emptyKind = filter === "Avatars" || filter === "Audio";

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
          <div ref={filterBarRef} role="tablist" aria-label="Content type" className="flex p-0.5 rounded-lg bg-surface text-[13px]">
            {validFilters.map((t, i) => (
              <button
                key={t}
                data-filter
                role="tab"
                aria-selected={filter === t}
                tabIndex={filter === t ? 0 : -1}
                onClick={() => setFilter(t)}
                onKeyDown={(e) => onFilterKey(e, i)}
                className={`px-3 h-8 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 ${
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
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort"
              className="h-8 px-3 rounded-md bg-surface text-[13px] focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/60"
            >
              {validSorts.map((s) => <option key={s}>{s}</option>)}
            </select>
            <button className="h-8 px-3 rounded-md bg-surface text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">
              <SlidersHorizontal className="size-3.5" /> All Filters
            </button>
          </div>
          {(feedKind !== debouncedKind || sort !== debouncedSort) && (
            <span className="basis-full sm:basis-auto inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-surface text-[11.5px] text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Switching filter…
            </span>
          )}
        </div>

        {/* Per-model horizontal rows */}
        {visibleRows.map((section) => (
          <ModelRow key={section.id} section={section} onOpen={setActive} />
        ))}

        {emptyKind && (
          <section className="rounded-2xl bg-surface/60 border border-border/40 p-10 text-center">
            <div className="mx-auto size-12 grid place-items-center rounded-full bg-surface-hover mb-4">
              {filter === "Audio" ? <Mic2 className="size-5" /> : <ImagePlus className="size-5" />}
            </div>
            <h3 className="text-base font-semibold">No {filter.toLowerCase()} to show yet</h3>
            <p className="mt-1 text-[13px] text-muted-foreground max-w-md mx-auto">
              {filter} discovery is rolling out next. In the meantime, browse the For You feed below or create your own.
            </p>
            <a href="/create" className="mt-5 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-foreground text-background text-[13px] font-medium hover:opacity-90 transition">
              <Sparkles className="size-3.5" /> Create something
            </a>
          </section>
        )}

        {/* Infinite waterfall feed */}
        <WaterfallFeed kind={debouncedKind} sort={debouncedSort} onOpen={setActive} />
      </div>

      <Sheet open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[460px] p-0 bg-background border-l border-border/60">
          {active && <DetailPanel card={active} onClose={() => setActive(null)} />}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}

function DetailPanel({ card, onClose }: { card: Card; onClose: () => void }) {
  const navigate = useNavigate();
  function recreate() {
    onClose();
    navigate({ to: card.kind === "video" ? "/create/video" : "/create/image", search: remixSearch(card) });
  }
  return (
    <div className="flex flex-col h-full">
      <div className="relative bg-surface" style={{ aspectRatio: card.ratio }}>
        <img src={card.src} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 size-8 grid place-items-center rounded-full bg-black/55 backdrop-blur text-white/90 hover:bg-black/75"
        >
          <X className="size-4" />
        </button>
        {card.duration && (
          <span className="absolute bottom-3 left-3 text-[12px] font-medium text-white/95 bg-black/55 backdrop-blur px-2 py-0.5 rounded">{card.duration}</span>
        )}
      </div>
      <SheetHeader className="px-5 pt-5 pb-3 space-y-2 text-left">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold uppercase tracking-wide bg-sky-500/15 text-sky-400">
            {card.model}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] text-muted-foreground">
            <Heart className="size-3" /> {card.likes.toLocaleString()}
          </span>
        </div>
        <SheetTitle className="text-[17px] leading-snug">
          {card.kind === "video" ? "Cinematic" : "Editorial"} {card.model} render
        </SheetTitle>
        <SheetDescription className="text-[12.5px] leading-relaxed">
          Tap Recreate to load this prompt into the {card.kind} generator, or Reuse to start a new session with the
          same reference image and parameters.
        </SheetDescription>
      </SheetHeader>
      <div className="px-5 pb-5 space-y-3">
        <div className="rounded-lg bg-surface p-3 text-[12px] leading-relaxed text-muted-foreground">
          A {card.kind === "video" ? "slow cinematic dolly-in" : "high-detail editorial portrait"}, dramatic rim
          lighting, shot on {card.model}, 35mm, shallow depth of field, magazine cover composition.
        </div>
        <div className="flex gap-2">
          <button onClick={recreate} className="flex-1 h-10 rounded-md bg-foreground text-background text-[13px] font-semibold inline-flex items-center justify-center gap-1.5 hover:opacity-90">
            <RotateCcw className="size-3.5" /> Recreate
          </button>
          <button onClick={recreate} className="flex-1 h-10 rounded-md bg-surface text-foreground text-[13px] font-medium inline-flex items-center justify-center gap-1.5 hover:bg-surface-hover">
            <Repeat2 className="size-3.5" /> Reuse
          </button>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 h-9 rounded-md bg-surface text-[12.5px] text-muted-foreground inline-flex items-center justify-center gap-1.5 hover:text-foreground">
            <Download className="size-3.5" /> Download
          </button>
          <button className="flex-1 h-9 rounded-md bg-surface text-[12.5px] text-muted-foreground inline-flex items-center justify-center gap-1.5 hover:text-foreground">
            <Share2 className="size-3.5" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── Model row with cursor pagination ──────────────── */

function ModelRow({ section, onOpen }: { section: (typeof featuredModels)[number]; onOpen: (c: Card) => void }) {
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
        {cards.map((c) => <ExploreCard key={c.id} card={c} onOpen={onOpen} />)}

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

type FeedSnapshot = {
  items: Card[];
  cursor: number | null;
  scrollY: number;
};
const feedCache = new Map<string, FeedSnapshot>();
let lastFeedKey: string | null = null;

function WaterfallFeed({ kind, sort, onOpen }: { kind: Kind | "all"; sort: string; onOpen: (c: Card) => void }) {
  const key = `${kind}|${sort}`;
  const cached = feedCache.get(key);

  const [items, setItems] = useState<Card[]>(cached?.items ?? []);
  const [cursor, setCursor] = useState<number | null>(cached?.cursor ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const attemptRef = useRef(1);
  const keyRef = useRef(key);
  const restoredRef = useRef(false);
  // Race protection: only the latest request id may write state.
  const reqIdRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  // Toast coalescing: a single trailing flush summarizes rapid filter/sort clicks.
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelCountRef = useRef(0);
  const lastCancelAtRef = useRef(0);

  // Save scroll position continuously for the *current* key.
  useEffect(() => {
    const onScroll = () => {
      const snap = feedCache.get(keyRef.current);
      if (snap) snap.scrollY = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Snapshot current state before unmount and abort any in-flight request.
  useEffect(() => () => {
    feedCache.set(keyRef.current, { items, cursor, scrollY: window.scrollY });
    abortRef.current?.abort();
  }, [items, cursor]);

  // Handle filter/sort changes within the mounted component.
  useEffect(() => {
    if (keyRef.current === key) return;
    // Cancel any in-flight fetch from the previous key — its result must not land.
    const hadInFlight = !!abortRef.current;
    abortRef.current?.abort();
    abortRef.current = null;
    reqIdRef.current += 1;
    setLoading(false);

    // Coalesce cancellations: count them, but defer the toast so a flurry of
    // clicks resolves to one summary instead of N stacked toasts.
    if (hadInFlight) {
      cancelCountRef.current += 1;
      lastCancelAtRef.current = Date.now();
    }
    toast.dismiss("feed-loading");

    // Persist outgoing key's snapshot.
    feedCache.set(keyRef.current, { items, cursor, scrollY: window.scrollY });
    keyRef.current = key;
    restoredRef.current = false;

    const next = feedCache.get(key);
    if (next) {
      setItems(next.items);
      setCursor(next.cursor);
      setError(null);
      attemptRef.current = 1;
      requestAnimationFrame(() => {
        window.scrollTo({ top: next.scrollY, behavior: "auto" });
        restoredRef.current = true;
      });
    } else {
      setItems([]);
      setCursor(0);
      setError(null);
      attemptRef.current = 1;
      requestAnimationFrame(() => {
        sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        restoredRef.current = true;
      });
    }

    // Trailing flush: only after the user stops clicking for ~320ms do we
    // surface one toast describing the final destination.
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      toastTimerRef.current = null;
      const finalKey = keyRef.current;
      const [fKind, fSort] = finalKey.split("|");
      const label = `${fKind === "all" ? "All" : fKind} · ${fSort}`;
      const n = cancelCountRef.current;
      cancelCountRef.current = 0;
      if (n > 1) {
        toast.info(`Cancelled ${n} pending requests`, { id: "feed-cancel", description: label, duration: 1600 });
      } else if (n === 1) {
        toast.info("Cancelled previous request", { id: "feed-cancel", description: label, duration: 1600 });
      }
      if (!feedCache.get(finalKey)?.items.length) {
        toast.loading(`Loading ${label}…`, { id: "feed-loading" });
      }
    }, 320);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // On first mount, restore scroll if we rehydrated from a previous visit.
  useEffect(() => {
    if (cached && lastFeedKey === key) {
      requestAnimationFrame(() => window.scrollTo({ top: cached.scrollY, behavior: "auto" }));
    }
    restoredRef.current = true;
    lastFeedKey = key;
    return () => { lastFeedKey = keyRef.current; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = useCallback(async () => {
    if (loading || cursor === null) return;
    // Cancel any prior in-flight request and claim a new id.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const myId = ++reqIdRef.current;
    const myKey = keyRef.current;
    const myCursor = cursor;

    setLoading(true);
    setError(null);
    const isFirstPage = myCursor === 0;
    // Defer "Loading more…" until the request actually feels slow (>450ms).
    // Short fetches resolve before the toast appears — no flicker.
    let slowTimer: ReturnType<typeof setTimeout> | null = null;
    if (!isFirstPage) {
      slowTimer = setTimeout(() => {
        if (myId === reqIdRef.current && myKey === keyRef.current) {
          toast.loading("Loading more…", { id: "feed-loading" });
        }
      }, 450);
    }
    const clearSlow = () => { if (slowTimer) { clearTimeout(slowTimer); slowTimer = null; } };
    try {
      const page = await fetchPage({
        cursor: myCursor, limit: 18, kind, seed: 13,
        attempt: attemptRef.current, signal: controller.signal,
      });
      clearSlow();
      // Drop stale results: the key changed or a newer request was started.
      if (myId !== reqIdRef.current || myKey !== keyRef.current) return;
      attemptRef.current = 1;
      setItems((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
      toast.dismiss("feed-loading");
      if (page.nextCursor === null) {
        toast.success("You've reached the end", { id: "feed-end", duration: 1600 });
      }
    } catch (e) {
      clearSlow();
      if ((e as DOMException)?.name === "AbortError") {
        toast.dismiss("feed-loading");
        return;
      }
      if (myId !== reqIdRef.current || myKey !== keyRef.current) return;
      attemptRef.current += 1;
      const msg = e instanceof Error ? e.message : "Failed to load";
      setError(msg);
      toast.error(msg, { id: "feed-loading", description: "Tap Retry to try again.", duration: 3500 });
    } finally {
      if (myId === reqIdRef.current) setLoading(false);
    }
  }, [loading, cursor, kind, sort]);

  // Sentinel observer — pause until any pending scroll restore has settled,
  // otherwise restoring to a far-down scrollY would auto-fire loadMore.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || error || !restoredRef.current) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && loadMore()),
      { rootMargin: "1200px 0px 1200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMore, error, items.length]);

  return (
    <section ref={sectionRef} className="scroll-mt-20">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight uppercase">For You</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">A blended feed across every model and creator.</p>
        </div>
      </div>

      <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3 [column-fill:_balance]">
        {items.map((c) => (
          <div key={c.id} className="mb-3 break-inside-avoid">
            <ExploreCard card={c} full onOpen={onOpen} />
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

function ExploreCard({ card, full = false, onOpen }: { card: Card; full?: boolean; onOpen?: (c: Card) => void }) {
  const [liked, setLiked] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [imgKey, setImgKey] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Catch "complete-before-onload" cache hits.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, [imgKey]);

  const retryImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setErrored(false);
    setLoaded(false);
    setImgKey((k) => k + 1);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(card)}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(card); } }}
      className={`group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/60 rounded-xl ${full ? "" : "snap-start shrink-0"}`}
      style={full ? undefined : { width: "min(260px, 60vw)" }}
    >
      <div className="relative rounded-xl overflow-hidden bg-surface" style={{ aspectRatio: card.ratio }}>
        {/* Skeleton shimmer until the image fires onLoad */}
        {!loaded && !errored && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-white/[0.04] via-white/[0.08] to-white/[0.02]" />
        )}

        {!errored && (
          <img
            ref={imgRef}
            key={imgKey}
            src={`${card.src}${imgKey ? `?r=${imgKey}` : ""}`}
            alt=""
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setErrored(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${
              loaded ? "opacity-100" : "opacity-0"
            }`}
          />
        )}

        {errored && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface text-muted-foreground">
            <ImageOff className="size-5" />
            <p className="text-[11px]">Couldn't load</p>
            <button
              onClick={retryImage}
              className="inline-flex items-center gap-1 h-6 px-2.5 rounded-md bg-surface-hover text-[10.5px] font-medium hover:bg-white/10"
            >
              <RefreshCw className="size-3" /> Retry
            </button>
          </div>
        )}

        {loaded && !errored && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/0 to-black/0 opacity-90 pointer-events-none" />
        )}

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

        {card.duration && loaded && (
          <span className="absolute bottom-2 left-2 text-[11px] font-medium text-white/90">{card.duration}</span>
        )}
        {loaded && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 text-[11px] text-white/85">
            <Heart className="size-3" /> {card.likes.toLocaleString()}
          </span>
        )}

        {loaded && !errored && (
          <div className="absolute inset-x-2 bottom-2 flex gap-1.5 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
            <button className="flex-1 h-7 rounded-md bg-white/95 text-[11px] font-semibold text-background inline-flex items-center justify-center gap-1 hover:bg-white">
              <RotateCcw className="size-3" /> Recreate
            </button>
            <button className="flex-1 h-7 rounded-md bg-white/10 backdrop-blur text-white text-[11px] font-medium inline-flex items-center justify-center gap-1 hover:bg-white/20">
              <Repeat2 className="size-3" /> Reuse
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
