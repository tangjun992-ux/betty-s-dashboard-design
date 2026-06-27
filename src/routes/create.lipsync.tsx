import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles, FolderOpen, Image as ImageIcon, Film, User2, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import bannerInfluencers from "@/assets/banner-influencers.jpg";
import bannerTutorial from "@/assets/banner-tutorial.jpg";
import bannerEarn from "@/assets/banner-earn.jpg";
import toolAvatar from "@/assets/tool-avatar.jpg";
import toolHeadshot from "@/assets/tool-headshot.jpg";
import toolMotion from "@/assets/tool-motion.jpg";
import toolProduct from "@/assets/tool-product.jpg";
import toolSeedance from "@/assets/tool-seedance.jpg";
import toolVideogen from "@/assets/tool-videogen.jpg";
import toolImagegen from "@/assets/tool-imagegen.jpg";

export const Route = createFileRoute("/create/lipsync")({
  head: () => ({ meta: [{ title: "Lipsync — Betty" }] }),
  component: LipsyncPage,
});

type Tab = "popular" | "your";
type Cat = "All" | "Videos" | "Avatars";
type Topic = "All" | "Politics" | "Tech" | "Sports" | "Motivation" | "News";

const POPULAR: { src: string; dur: string; cat: Cat; topic: Topic }[] = [
  { src: bannerInfluencers, dur: "1.63min", cat: "Videos", topic: "Politics" },
  { src: toolSeedance, dur: "58s", cat: "Videos", topic: "Politics" },
  { src: toolVideogen, dur: "30s", cat: "Videos", topic: "Tech" },
  { src: toolMotion, dur: "30s", cat: "Videos", topic: "News" },
  { src: toolAvatar, dur: "30s", cat: "Avatars", topic: "Politics" },
  { src: toolHeadshot, dur: "30s", cat: "Avatars", topic: "Tech" },
  { src: bannerTutorial, dur: "55s", cat: "Videos", topic: "Politics" },
  { src: toolProduct, dur: "55s", cat: "Videos", topic: "Motivation" },
  { src: bannerEarn, dur: "42s", cat: "Videos", topic: "Sports" },
  { src: toolImagegen, dur: "1.02min", cat: "Avatars", topic: "News" },
  { src: toolSeedance, dur: "24s", cat: "Videos", topic: "Tech" },
  { src: toolVideogen, dur: "48s", cat: "Videos", topic: "Motivation" },
];

function LipsyncPage() {
  const [tab, setTab] = useState<Tab>("popular");
  const [cat, setCat] = useState<Cat>("All");
  const [topic, setTopic] = useState<Topic>("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(4);

  const items = useMemo(
    () => POPULAR.filter(
      (i) =>
        (cat === "All" || i.cat === cat) &&
        (topic === "All" || i.topic === topic),
    ),
    [cat, topic],
  );

  return (
    <AppShell>
      <div className="px-6 lg:px-10 pt-10 pb-16 max-w-[1280px] mx-auto">
        <h1 className="text-center text-[28px] lg:text-[32px] font-semibold tracking-tight">Select your base asset</h1>
        <p className="text-center text-[14px] text-muted-foreground mt-2">The source image or video for your lipsync.</p>

        {/* Popular / Your Media segmented */}
        <div className="flex justify-center mt-7">
          <div className="inline-flex p-1 rounded-full bg-surface/70 border border-border/60">
            <Seg active={tab === "popular"} onClick={() => setTab("popular")} icon={<Sparkles className="size-3.5" />}>Popular</Seg>
            <Seg active={tab === "your"} onClick={() => setTab("your")} icon={<FolderOpen className="size-3.5" />}>Your Media</Seg>
          </div>
        </div>

        <div className="border-t border-border/60 mt-8" />

        {/* Filters row */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative w-[280px]">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search popular media"
              className="w-full h-9 pl-8 pr-3 rounded-md bg-surface border border-border/60 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:border-border"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <CatBtn active={cat === "All"} onClick={() => setCat("All")} icon={<FolderOpen className="size-3.5" />}>All</CatBtn>
            <CatBtn active={cat === "Videos"} onClick={() => setCat("Videos")} icon={<Film className="size-3.5" />}>Videos</CatBtn>
            <CatBtn active={cat === "Avatars"} onClick={() => setCat("Avatars")} icon={<User2 className="size-3.5" />}>Avatars</CatBtn>
          </div>

          <div className="h-5 w-px bg-border/60 mx-1" />

          <div className="flex flex-wrap items-center gap-1.5">
            {(["All", "Politics", "Tech", "Sports", "Motivation", "News"] as Topic[]).map((t) => (
              <button
                key={t}
                onClick={() => setTopic(t)}
                className={`h-7 px-3 rounded-full text-[12.5px] font-medium transition-colors ${
                  topic === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Masonry grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {items.map((it, i) => {
            const active = selected === i;
            return (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                  active ? "border-brand ring-2 ring-brand/30" : "border-transparent hover:border-border"
                }`}
              >
                <img src={it.src} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <span className="absolute bottom-2 left-2 flex items-center gap-1 text-[11px] text-white/95 bg-black/45 backdrop-blur px-1.5 py-0.5 rounded">
                  <Clock className="size-3" /> {it.dur}
                </span>
                {active && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-brand text-brand-foreground">
                    Select
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

function Seg({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 h-8 px-4 rounded-full text-[12.5px] font-medium transition-colors ${
        active ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}{children}
    </button>
  );
}

function CatBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-3 rounded-md text-[13px] font-medium flex items-center gap-1.5 transition-colors ${
        active ? "bg-surface border border-border/80 text-foreground" : "border border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-hover"
      }`}
    >
      {icon}{children}
    </button>
  );
}
