import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Sparkles, FolderOpen, Image as ImageIcon, Film, User2, Clock, Upload, AlertCircle, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { listMyGenerations } from "@/lib/generations.functions";
import { useSession } from "@/lib/use-session";
import { LipsyncStep2, type LipsyncSource } from "@/components/create/LipsyncStep2";
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
type Cat = "All" | "Videos" | "Avatars" | "Images";
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
  const [selected, setSelected] = useState<string | null>(null);
  const [committed, setCommitted] = useState<LipsyncSource | null>(null);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 pt-10 pb-16 max-w-[1280px] mx-auto">
        <h1 className="text-center text-[28px] lg:text-[32px] font-semibold tracking-tight">Select your base asset</h1>
        <p className="text-center text-[14px] text-muted-foreground mt-2">The source image or video for your lipsync.</p>

        <div className="flex justify-center mt-7">
          <div className="inline-flex p-1 rounded-full bg-surface/70 border border-border/60">
            <Seg active={tab === "popular"} onClick={() => { setTab("popular"); setCat("All"); }} icon={<Sparkles className="size-3.5" />}>Popular</Seg>
            <Seg active={tab === "your"} onClick={() => { setTab("your"); setCat("All"); }} icon={<FolderOpen className="size-3.5" />}>Your Media</Seg>
          </div>
        </div>

        <div className="border-t border-border/60 mt-8" />

        {tab === "popular" ? (
          <PopularPanel
            cat={cat} setCat={setCat}
            topic={topic} setTopic={setTopic}
            q={q} setQ={setQ}
            selected={selected} setSelected={setSelected}
          />
        ) : (
          <YourMediaPanel
            cat={cat} setCat={setCat}
            q={q} setQ={setQ}
            selected={selected} setSelected={setSelected}
            onContinue={(src) => setCommitted(src)}
          />
        )}
      </div>

      <LipsyncStep2
        open={committed !== null}
        onOpenChange={(v) => { if (!v) setCommitted(null); }}
        video={committed}
      />
    </AppShell>
  );
}

function PopularPanel({
  cat, setCat, topic, setTopic, q, setQ, selected, setSelected,
}: {
  cat: Cat; setCat: (c: Cat) => void;
  topic: Topic; setTopic: (t: Topic) => void;
  q: string; setQ: (s: string) => void;
  selected: string | null; setSelected: (s: string | null) => void;
}) {
  const items = useMemo(
    () => POPULAR.filter(
      (i) =>
        (cat === "All" || i.cat === cat) &&
        (topic === "All" || i.topic === topic),
    ),
    [cat, topic],
  );

  return (
    <>
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

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {items.map((it, i) => {
          const id = `pop-${i}`;
          const active = selected === id;
          return (
            <button
              key={id}
              onClick={() => setSelected(id)}
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
    </>
  );
}

function YourMediaPanel({
  cat, setCat, q, setQ, selected, setSelected, onContinue,
}: {
  cat: Cat; setCat: (c: Cat) => void;
  q: string; setQ: (s: string) => void;
  selected: string | null; setSelected: (s: string | null) => void;
  onContinue: (src: LipsyncSource) => void;
}) {
  const { user, loading } = useSession();
  const fetcher = useServerFn(listMyGenerations);
  const query = useQuery({
    queryKey: ["lipsync-your-media", user?.id],
    queryFn: () => fetcher(),
    enabled: !!user,
  });

  const items = useMemo(() => {
    const all = (query.data ?? []).filter(
      (g) => (g.kind === "image" || g.kind === "video") && (g.thumb_url || g.asset_url),
    );
    const byCat = all.filter((g) => {
      if (cat === "All") return true;
      if (cat === "Images") return g.kind === "image";
      if (cat === "Videos") return g.kind === "video";
      return true;
    });
    const needle = q.trim().toLowerCase();
    return needle
      ? byCat.filter((g) => (g.prompt ?? "").toLowerCase().includes(needle))
      : byCat;
  }, [query.data, cat, q]);

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-[280px]">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search your media"
            className="w-full h-9 pl-8 pr-3 rounded-md bg-surface border border-border/60 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none focus:border-border"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <CatBtn active={cat === "All"} onClick={() => setCat("All")} icon={<FolderOpen className="size-3.5" />}>All</CatBtn>
          <CatBtn active={cat === "Videos"} onClick={() => setCat("Videos")} icon={<Film className="size-3.5" />}>Videos</CatBtn>
          <CatBtn active={cat === "Images"} onClick={() => setCat("Images")} icon={<ImageIcon className="size-3.5" />}>Images</CatBtn>
        </div>
        <div className="ml-auto">
          <Link
            to="/create/image"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md text-[13px] font-medium bg-surface border border-border/80 text-foreground hover:bg-surface-hover"
          >
            <Upload className="size-3.5" /> Upload
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {!user && !loading ? (
          <Empty
            icon={FolderOpen}
            title="Sign in to use your media"
            body="Your library is tied to your account."
            cta={{ label: "Sign in", to: "/auth" }}
          />
        ) : query.isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-xl bg-surface border border-border animate-pulse" />
            ))}
          </div>
        ) : query.isError ? (
          <Empty
            icon={AlertCircle}
            title="Couldn't load your media"
            body={query.error instanceof Error ? query.error.message : "Try refreshing"}
          />
        ) : items.length === 0 ? (
          <Empty
            icon={FolderOpen}
            title={q ? "No matches" : "Nothing in your library yet"}
            body={q ? "Try a different search." : "Generated images and videos will show up here."}
            cta={!q ? { label: "Create something", to: "/create/image" } : undefined}
          />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {items.map((g) => {
              const id = g.id;
              const active = selected === id;
              const src = g.thumb_url ?? g.asset_url ?? "";
              const isVideo = g.kind === "video";
              return (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  className={`group relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ${
                    active ? "border-brand ring-2 ring-brand/30" : "border-transparent hover:border-border"
                  }`}
                >
                  {isVideo ? (
                    <video
                      src={src}
                      muted
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover"
                      onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                      onMouseLeave={(e) => { e.currentTarget.pause(); e.currentTarget.currentTime = 0; }}
                    />
                  ) : (
                    <img src={src} alt={g.prompt ?? ""} loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                  <span className="absolute top-2 left-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wide text-white/95 bg-black/55 backdrop-blur px-1.5 py-0.5 rounded">
                    {isVideo ? <Film className="size-3" /> : <ImageIcon className="size-3" />} {g.kind}
                  </span>
                  {g.prompt && (
                    <span className="absolute bottom-2 left-2 right-2 text-[11px] text-white/95 line-clamp-1 text-left">
                      {g.prompt}
                    </span>
                  )}
                  {active && (
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-brand text-brand-foreground">
                      Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selected && items.some((i) => i.id === selected) && (
        <div className="sticky bottom-6 mt-8 flex justify-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-background/85 backdrop-blur-xl px-3 py-2 shadow-[var(--shadow-glow)]">
            <span className="text-[12.5px] text-muted-foreground pl-2">Base asset selected</span>
            <button
              onClick={() => alert("Continue with this asset — next step")}
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[image:var(--gradient-brand)] text-brand-foreground text-[13px] font-semibold"
            >
              {query.isFetching && <Loader2 className="size-3.5 animate-spin" />}
              Continue
            </button>
          </div>
        </div>
      )}
    </>
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

function Empty({
  icon: Icon, title, body, cta,
}: {
  icon: typeof FolderOpen;
  title: string;
  body: string;
  cta?: { label: string; to: string };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-14 text-center">
      <div className="mx-auto size-12 rounded-2xl bg-[image:var(--gradient-brand-soft)] border border-border grid place-items-center mb-4">
        <Icon className="size-5 text-foreground/70" />
      </div>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1 text-[13px] text-muted-foreground max-w-md mx-auto">{body}</p>
      {cta && (
        <Link
          to={cta.to}
          className="inline-flex mt-5 h-9 px-4 rounded-full bg-[image:var(--gradient-brand)] text-brand-foreground text-[13px] font-medium items-center shadow-[var(--shadow-glow)]"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
