import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  FolderOpen,
  Image as ImageIcon,
  Video,
  Mic2,
  Sparkles,
  AlertCircle,
  Download,
  Heart,
  LayoutGrid,
  Rows3,
  Search,
  Upload as UploadIcon,
  X,
} from "lucide-react";
import { listMyGenerations } from "@/lib/generations.functions";
import { listMyAssets } from "@/lib/assets.functions";
import { useSession } from "@/lib/use-session";
import { useUploader } from "@/lib/use-uploader";
import { UploadButton, GlobalDropOverlay, UploadsPanel } from "@/components/library/UploadDropzone";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "My Library — Betty" },
      { name: "description", content: "All your AI generations in one place — images, videos and audio." },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: "/library" },
    ],
    links: [{ rel: "canonical", href: "/library" }],
  }),
  component: LibraryPage,
});

type Kind = "all" | "image" | "video" | "audio" | "upload";
type View = "grid" | "masonry";

const TABS: { kind: Kind; icon: typeof ImageIcon; label: string }[] = [
  { kind: "all", icon: Sparkles, label: "All" },
  { kind: "image", icon: ImageIcon, label: "Images" },
  { kind: "video", icon: Video, label: "Videos" },
  { kind: "audio", icon: Mic2, label: "Audio" },
  { kind: "upload", icon: UploadIcon, label: "Uploads" },
];

function LibraryPage() {
  const { user, loading } = useSession();
  const [tab, setTab] = useState<Kind>("all");
  const [view, setView] = useState<View>("grid");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const fetcher = useServerFn(listMyGenerations);
  const assetsFetcher = useServerFn(listMyAssets);
  const queryClient = useQueryClient();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
  }, [query]);

  const q = useQuery({
    queryKey: ["my-generations", user?.id],
    queryFn: () => fetcher(),
    enabled: !!user,
  });
  const qa = useQuery({
    queryKey: ["my-assets", user?.id],
    queryFn: () => assetsFetcher(),
    enabled: !!user,
  });

  const uploader = useUploader();
  const onFiles = useCallback((files: File[]) => uploader.start(files), [uploader]);

  // Refresh both grids when an upload completes
  const doneIds = uploader.items.filter((i) => i.status === "done").map((i) => i.generationId ?? i.id).join(",");
  useEffect(() => {
    if (doneIds) {
      queryClient.invalidateQueries({ queryKey: ["my-generations", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["my-assets", user?.id] });
    }
  }, [doneIds, queryClient, user?.id]);

  // Merge generations + uploaded assets into a single feed.
  const all = useMemo(() => {
    const gens = (q.data ?? []).map((g) => ({
      id: g.id, kind: g.kind, prompt: g.prompt, status: g.status,
      thumb_url: g.thumb_url, asset_url: g.asset_url,
      like_count: g.like_count, source: "generation" as const,
      created_at: (g as any).created_at,
    }));
    const ups = (qa.data ?? []).map((a) => ({
      id: a.id, kind: a.kind === "other" ? "image" : a.kind, prompt: (a.metadata as any)?.original_name ?? null,
      status: "succeeded", thumb_url: a.thumb_url, asset_url: a.url,
      like_count: 0, source: "upload" as const, created_at: a.created_at,
    }));
    return [...gens, ...ups].sort((a, b) =>
      (b.created_at ?? "").localeCompare(a.created_at ?? ""),
    );
  }, [q.data, qa.data]);

  const counts = useMemo(() => {
    const c: Record<Kind, number> = { all: all.length, image: 0, video: 0, audio: 0, upload: 0 };
    for (const g of all) {
      if (g.source === "upload") c.upload++;
      if (g.kind === "image" || g.kind === "video" || g.kind === "audio") c[g.kind as Kind]++;
    }
    return c;
  }, [all]);

  const items = useMemo(() => {
    let list = all;
    if (tab === "upload") list = list.filter((g) => g.source === "upload");
    else if (tab !== "all") list = list.filter((g) => g.kind === tab);
    if (debounced) {
      list = list.filter((g) => {
        const hay = `${g.prompt ?? ""} ${g.kind ?? ""}`.toLowerCase();
        return hay.includes(debounced);
      });
    }
    return list;
  }, [all, tab, debounced]);

  return (
    <AppShell>
      <div className="relative">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 15% 0%, color-mix(in oklab, var(--brand) 22%, transparent), transparent 70%)",
            }}
          />
          <div className="relative max-w-[1600px] mx-auto px-6 lg:px-10 pt-10 pb-7 flex items-end justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Workspace</div>
              <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
                <span className="bg-clip-text text-transparent bg-[image:var(--gradient-brand)]">
                  My Library
                </span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Everything you've generated, organized by type.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <UploadButton onFiles={onFiles} />
              <Link
                to="/create/image"
                className="h-9 px-4 rounded-full bg-[image:var(--gradient-brand)] text-brand-foreground text-[13px] font-semibold inline-flex items-center shadow-[var(--shadow-glow)]"
              >
                New creation
              </Link>
            </div>
          </div>
        </div>

        {/* Filter row */}
        <div className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/55">
          <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-12 flex items-center gap-2">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {TABS.map((t) => {
                const active = tab === t.kind;
                const n = counts[t.kind];
                return (
                  <button
                    key={t.kind}
                    onClick={() => setTab(t.kind)}
                    className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12.5px] font-medium transition-colors ${
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-surface"
                    }`}
                  >
                    <t.icon className="size-3.5" />
                    {t.label}
                    <span
                      className={`ml-0.5 tabular-nums text-[10.5px] ${
                        active ? "text-background/70" : "text-muted-foreground/70"
                      }`}
                    >
                      {n}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search prompts, models…"
                  className="h-8 w-56 md:w-72 pl-8 pr-7 rounded-full bg-surface border border-border text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground/30 focus:bg-background transition-colors"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 size-5 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background"
                    aria-label="Clear search"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </div>
              <div className="inline-flex rounded-full border border-border p-0.5 bg-surface">
                <button
                  onClick={() => setView("grid")}
                  aria-pressed={view === "grid"}
                  className={`size-7 grid place-items-center rounded-full transition-colors ${
                    view === "grid" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="size-3.5" />
                </button>
                <button
                  onClick={() => setView("masonry")}
                  aria-pressed={view === "masonry"}
                  className={`size-7 grid place-items-center rounded-full transition-colors ${
                    view === "masonry" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Rows3 className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6">
          {!user && !loading ? (
            <EmptyState
              title="Sign in to see your library"
              body="Your generations are tied to your account."
              cta={{ label: "Sign in", to: "/auth" }}
            />
          ) : q.isLoading ? (
            view === "grid" ? <SkeletonGrid /> : <SkeletonMasonry />
          ) : q.isError ? (
            <EmptyState
              title="Couldn't load your library"
              body={q.error instanceof Error ? q.error.message : "Try refreshing"}
              icon={AlertCircle}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              body="Generated images, videos and audio will show up in your library."
              cta={{ label: "Browse tools", to: "/tools" }}
            />
          ) : view === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {items.map((g) => (
                <Card key={g.id} g={g} />
              ))}
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 md:columns-4 xl:columns-5 gap-3 [column-fill:_balance]">
              {items.map((g) => (
                <div key={g.id} className="break-inside-avoid mb-3">
                  <Card g={g} masonry />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {user && <GlobalDropOverlay onFiles={onFiles} />}
      <UploadsPanel items={uploader.items} onRemove={uploader.remove} onClearDone={uploader.clearDone} />
    </AppShell>
  );
}

type Gen = {
  id: string;
  kind: string | null;
  prompt: string | null;
  status: string | null;
  thumb_url: string | null;
  asset_url: string | null;
  like_count?: number | null;
};

function Card({ g, masonry }: { g: Gen; masonry?: boolean }) {
  const src = g.thumb_url ?? g.asset_url ?? "";
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-surface border border-border hover:border-foreground/20 transition-colors">
      <div className={masonry ? "relative" : "aspect-square relative bg-background"}>
        {src ? (
          <img
            src={src}
            alt={g.prompt ?? ""}
            loading="lazy"
            className={`${masonry ? "w-full h-auto block" : "w-full h-full object-cover"} transition-transform duration-500 group-hover:scale-[1.02]`}
          />
        ) : (
          <div className={`${masonry ? "aspect-square" : "absolute inset-0"} grid place-items-center text-muted-foreground text-xs`}>
            {g.status}
          </div>
        )}

        {/* Kind badge */}
        <span className="absolute top-2 left-2 inline-flex items-center h-6 px-2 rounded-full bg-black/55 backdrop-blur-md text-[10.5px] uppercase tracking-wide text-white/90">
          {g.kind}
        </span>

        {/* Hover bar */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
          <p className="text-[12px] leading-snug text-white line-clamp-2">{g.prompt ?? "Untitled"}</p>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/70">
            <span className="inline-flex items-center gap-1">
              <Heart className="size-3" /> {g.like_count ?? 0}
            </span>
            {g.asset_url ? (
              <a
                href={g.asset_url}
                target="_blank"
                rel="noreferrer"
                className="pointer-events-auto inline-flex items-center gap-1 hover:text-white"
              >
                <Download className="size-3" /> Save
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-2xl bg-surface border border-border animate-pulse" />
      ))}
    </div>
  );
}
function SkeletonMasonry() {
  return (
    <div className="columns-2 sm:columns-3 md:columns-4 xl:columns-5 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="break-inside-avoid mb-3 rounded-2xl bg-surface border border-border animate-pulse"
          style={{ height: 180 + (i % 4) * 80 }}
        />
      ))}
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
  icon: Icon = FolderOpen,
}: {
  title: string;
  body: string;
  cta?: { label: string; to: string };
  icon?: typeof FolderOpen;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-16 text-center">
      <div className="mx-auto size-14 rounded-2xl bg-[image:var(--gradient-brand-soft)] border border-border grid place-items-center mb-4">
        <Icon className="size-6 text-foreground/70" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
      {cta && (
        <Link
          to={cta.to}
          className="inline-flex mt-5 h-9 px-4 rounded-full bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-medium items-center shadow-[var(--shadow-glow)]"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
