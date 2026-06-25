import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Sparkles, ArrowRight, Heart, RotateCcw, Repeat2, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

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

type Card = {
  src: string;
  ratio: string;
  kind: "image" | "video";
  model: string;
  duration?: string;
  likes: number;
};

const pool: string[] = [
  toolSeedance, toolMotion, toolAvatar, toolVideogen, toolProduct, toolHeadshot,
  toolImagegen, bannerInfluencers, bannerTutorial, bannerEarn,
];
const ratios = ["3/4", "2/3", "4/5", "1/1", "9/16"];

function makeCards(model: string, kind: "image" | "video", n: number, seed = 0): Card[] {
  return Array.from({ length: n }, (_, i) => ({
    src: pool[(i + seed) % pool.length],
    ratio: ratios[(i + seed) % ratios.length],
    kind,
    model,
    duration: kind === "video" ? `0:${String(5 + ((i * 7) % 50)).padStart(2, "0")}` : undefined,
    likes: 120 + ((i * 37 + seed * 11) % 4000),
  }));
}

const sections = [
  { id: "gpt-image-2", model: "GPT Image 2", tagline: "4K images with near-perfect text rendering", badge: "New Model", kind: "image" as const, cards: makeCards("GPT Image 2", "image", 12, 0) },
  { id: "seedance", model: "Seedance 2.0", tagline: "Multi-shot, multi-modal cinematic video", badge: "Popular", kind: "video" as const, cards: makeCards("Seedance 2.0", "video", 12, 3) },
  { id: "kling", model: "Kling 3.0", tagline: "Photoreal motion with strong character consistency", kind: "video" as const, cards: makeCards("Kling 3.0", "video", 12, 5) },
  { id: "veo", model: "Veo 3.1", tagline: "Cinematic 1080p clips with native audio", badge: "Audio", kind: "video" as const, cards: makeCards("Veo 3.1", "video", 12, 7) },
];

const filters = ["All", "Videos", "Images", "Avatars", "Audio"] as const;
const sorts = ["Trending", "Newest", "Most Liked"] as const;

function ExplorePage() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [sort, setSort] = useState<(typeof sorts)[number]>("Trending");

  const visible = useMemo(() => {
    if (filter === "All") return sections;
    if (filter === "Videos") return sections.filter((s) => s.kind === "video");
    if (filter === "Images") return sections.filter((s) => s.kind === "image");
    return sections;
  }, [filter]);

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
        {visible.map((section) => (
          <ModelRow key={section.id} section={section} />
        ))}
      </div>
    </AppShell>
  );
}

function ModelRow({ section }: { section: (typeof sections)[number] }) {
  const [scrollerRef, setScrollerRef] = useState<HTMLDivElement | null>(null);

  const scroll = (dir: 1 | -1) => {
    if (!scrollerRef) return;
    scrollerRef.scrollBy({ left: dir * scrollerRef.clientWidth * 0.85, behavior: "smooth" });
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
        ref={setScrollerRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-6 lg:-mx-8 px-6 lg:px-8 pb-2"
      >
        {section.cards.map((c, i) => (
          <ExploreCard key={i} card={c} />
        ))}
      </div>
    </section>
  );
}

function ExploreCard({ card }: { card: Card }) {
  const [liked, setLiked] = useState(false);
  return (
    <div className="snap-start shrink-0 group cursor-pointer" style={{ width: "min(260px, 60vw)" }}>
      <div
        className="relative rounded-xl overflow-hidden bg-surface"
        style={{ aspectRatio: card.ratio }}
      >
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
