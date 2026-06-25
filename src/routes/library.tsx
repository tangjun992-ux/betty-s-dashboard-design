import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { AppShell } from "@/components/AppShell";
import { FolderOpen, Image as ImageIcon, Video, Mic2, Sparkles, AlertCircle } from "lucide-react";
import { listMyGenerations } from "@/lib/generations.functions";
import { useSession } from "@/lib/use-session";

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

type Kind = "all" | "image" | "video" | "audio";

const TABS: { kind: Kind; icon: typeof ImageIcon; label: string }[] = [
  { kind: "all", icon: Sparkles, label: "All" },
  { kind: "video", icon: Video, label: "Videos" },
  { kind: "image", icon: ImageIcon, label: "Images" },
  { kind: "audio", icon: Mic2, label: "Audio" },
];

function LibraryPage() {
  const { user, loading } = useSession();
  const [tab, setTab] = useState<Kind>("all");
  const fetcher = useServerFn(listMyGenerations);

  const q = useQuery({
    queryKey: ["my-generations", user?.id],
    queryFn: () => fetcher(),
    enabled: !!user,
  });

  const items = useMemo(() => {
    const all = q.data ?? [];
    return tab === "all" ? all : all.filter((g) => g.kind === tab);
  }, [q.data, tab]);

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-6 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">My Library</h1>
        </div>

        <div className="flex gap-2 flex-wrap">
          {TABS.map((t) => {
            const active = tab === t.kind;
            return (
              <button
                key={t.kind}
                onClick={() => setTab(t.kind)}
                className={`h-9 px-4 rounded-md text-sm border flex items-center gap-2 transition-colors ${
                  active
                    ? "bg-surface border-border text-foreground"
                    : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-surface"
                }`}
              >
                <t.icon className="size-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {!user && !loading ? (
          <EmptyState
            title="Sign in to see your library"
            body="Your generations are tied to your account."
            cta={{ label: "Sign in", to: "/auth" }}
          />
        ) : q.isLoading ? (
          <SkeletonGrid />
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
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((g) => (
              <div key={g.id} className="group rounded-xl overflow-hidden bg-surface border border-border">
                <div className="aspect-square bg-background relative">
                  {g.thumb_url || g.asset_url ? (
                    <img
                      src={g.thumb_url ?? g.asset_url ?? ""}
                      alt={g.prompt ?? ""}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">
                      {g.status}
                    </div>
                  )}
                </div>
                <div className="p-2.5 space-y-1">
                  <p className="text-[12px] leading-snug line-clamp-2">{g.prompt ?? "Untitled"}</p>
                  <div className="flex items-center justify-between text-[10.5px] text-muted-foreground uppercase tracking-wide">
                    <span>{g.kind}</span>
                    <span>{g.like_count ?? 0} ♥</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-xl bg-surface border border-border animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({
  title, body, cta, icon: Icon = FolderOpen,
}: {
  title: string; body: string; cta?: { label: string; to: string }; icon?: typeof FolderOpen;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/50 p-16 text-center">
      <div className="mx-auto size-14 rounded-2xl bg-[image:var(--gradient-brand-soft)] border border-border grid place-items-center mb-4">
        <Icon className="size-6 text-foreground/70" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
      {cta && (
        <Link to={cta.to} className="inline-flex mt-5 h-9 px-4 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-medium items-center shadow-[var(--shadow-glow)]">
          {cta.label}
        </Link>
      )}
    </div>
  );
}
