import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { toast } from "sonner";
import {
  FolderOpen, Image as ImageIcon, Video, Mic2, Sparkles, AlertCircle,
  Download, Heart, LayoutGrid, Rows3, Search, Upload as UploadIcon, X,
  Folder, FolderPlus, Trash2, FolderInput, CheckSquare, Square, Star, Pencil,
} from "lucide-react";
import { listMyGenerations } from "@/lib/generations.functions";
import { listMyAssets } from "@/lib/assets.functions";
import {
  listFolders, createFolder, renameFolder, deleteFolder,
  toggleFavorite, moveToFolder, deleteItems,
} from "@/lib/library.functions";
import { useSession } from "@/lib/use-session";
import { useRealtimeLibrary } from "@/hooks/use-realtime-library";
import { useUploader } from "@/lib/use-uploader";
import { UploadButton, GlobalDropOverlay, UploadsPanel } from "@/components/library/UploadDropzone";
import { PreviewModal, type PreviewItem } from "@/components/library/PreviewModal";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "My Library — Betty" },
      { name: "description", content: "All your AI generations in one place — images, videos and audio." },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/library" }],
  }),
  component: LibraryPage,
});

type Kind = "all" | "image" | "video" | "audio" | "upload" | "favorites";
type View = "grid" | "masonry";

const TABS: { kind: Kind; icon: typeof ImageIcon; label: string }[] = [
  { kind: "all", icon: Sparkles, label: "All" },
  { kind: "favorites", icon: Star, label: "Favorites" },
  { kind: "image", icon: ImageIcon, label: "Images" },
  { kind: "video", icon: Video, label: "Videos" },
  { kind: "audio", icon: Mic2, label: "Audio" },
  { kind: "upload", icon: UploadIcon, label: "Uploads" },
];

type Item = PreviewItem & { like_count?: number | null; status?: string | null; folder_id?: string | null };

function LibraryPage() {
  const { user, loading } = useSession();
  const [tab, setTab] = useState<Kind>("all");
  const [view, setView] = useState<View>("grid");
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [folderId, setFolderId] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Record<string, Item>>({});
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [showMove, setShowMove] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const fetchGens = useServerFn(listMyGenerations);
  const fetchAssets = useServerFn(listMyAssets);
  const fetchFolders = useServerFn(listFolders);
  const createFolderFn = useServerFn(createFolder);
  const renameFolderFn = useServerFn(renameFolder);
  const deleteFolderFn = useServerFn(deleteFolder);
  const toggleFavFn = useServerFn(toggleFavorite);
  const moveFn = useServerFn(moveToFolder);
  const deleteFn = useServerFn(deleteItems);
  const qc = useQueryClient();

  useEffect(() => { const t = setTimeout(() => setDebounced(query.trim().toLowerCase()), 180); return () => clearTimeout(t); }, [query]);

  const qg = useQuery({ queryKey: ["my-generations", user?.id], queryFn: () => fetchGens(), enabled: !!user });
  const qa = useQuery({ queryKey: ["my-assets", user?.id], queryFn: () => fetchAssets(), enabled: !!user });
  const qf = useQuery({ queryKey: ["my-folders", user?.id], queryFn: () => fetchFolders(), enabled: !!user });

  const uploader = useUploader();
  const onFiles = useCallback((files: File[]) => uploader.start(files), [uploader]);
  const doneIds = uploader.items.filter((i) => i.status === "done").map((i) => i.generationId ?? i.id).join(",");
  useEffect(() => {
    if (doneIds) {
      qc.invalidateQueries({ queryKey: ["my-generations", user?.id] });
      qc.invalidateQueries({ queryKey: ["my-assets", user?.id] });
    }
  }, [doneIds, qc, user?.id]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["my-generations", user?.id] });
    qc.invalidateQueries({ queryKey: ["my-assets", user?.id] });
  };

  const all: Item[] = useMemo(() => {
    const gens = (qg.data ?? []).map<Item>((g: any) => ({
      id: g.id, source: "generation", kind: g.kind, prompt: g.prompt, status: g.status,
      thumb_url: g.thumb_url, asset_url: g.asset_url, like_count: g.like_count,
      is_favorite: g.is_favorite, folder_id: g.folder_id, model: g.model,
      width: g.width, height: g.height, duration_ms: g.duration_ms, created_at: g.created_at,
    }));
    const ups = (qa.data ?? []).map<Item>((a: any) => ({
      id: a.id, source: "upload", kind: a.kind === "other" ? "image" : a.kind,
      prompt: a.metadata?.original_name ?? null, status: "succeeded",
      thumb_url: a.thumb_url, asset_url: a.url, like_count: 0,
      is_favorite: a.is_favorite, folder_id: a.folder_id,
      created_at: a.created_at,
    }));
    return [...gens, ...ups].sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
  }, [qg.data, qa.data]);

  const counts = useMemo(() => {
    const c: Record<Kind, number> = { all: all.length, image: 0, video: 0, audio: 0, upload: 0, favorites: 0 };
    for (const g of all) {
      if (g.source === "upload") c.upload++;
      if (g.kind === "image" || g.kind === "video" || g.kind === "audio") c[g.kind as Kind]++;
      if (g.is_favorite) c.favorites++;
    }
    return c;
  }, [all]);

  const items = useMemo(() => {
    let list = all;
    if (folderId) list = list.filter((g) => g.folder_id === folderId);
    if (tab === "upload") list = list.filter((g) => g.source === "upload");
    else if (tab === "favorites") list = list.filter((g) => g.is_favorite);
    else if (tab !== "all") list = list.filter((g) => g.kind === tab);
    if (debounced) {
      list = list.filter((g) => `${g.prompt ?? ""} ${g.kind ?? ""} ${g.model ?? ""}`.toLowerCase().includes(debounced));
    }
    return list;
  }, [all, tab, debounced, folderId]);

  const selectedList = Object.values(selected);
  const selCount = selectedList.length;
  const toggleSelect = (it: Item) => setSelected((s) => {
    const next = { ...s };
    if (next[it.id]) delete next[it.id]; else next[it.id] = it;
    return next;
  });
  const clearSelection = () => setSelected({});

  // Actions
  const bulkFavorite = async (value: boolean) => {
    if (!selCount) return;
    await toggleFavFn({ data: { targets: selectedList.map((i) => ({ source: i.source, id: i.id })), value } });
    toast.success(value ? `Favorited ${selCount}` : `Unfavorited ${selCount}`);
    clearSelection(); refresh();
  };
  const bulkDelete = async () => {
    if (!selCount) return;
    if (!confirm(`Delete ${selCount} item${selCount > 1 ? "s" : ""}? This can't be undone.`)) return;
    await deleteFn({ data: { targets: selectedList.map((i) => ({ source: i.source, id: i.id })) } });
    toast.success(`Deleted ${selCount}`); clearSelection(); refresh();
  };
  const bulkMove = async (target: string | null) => {
    if (!selCount) return;
    await moveFn({ data: { targets: selectedList.map((i) => ({ source: i.source, id: i.id })), folder_id: target } });
    toast.success(target ? "Moved to folder" : "Removed from folder");
    setShowMove(false); clearSelection(); refresh();
  };
  const singleFavorite = async (it: Item) => {
    await toggleFavFn({ data: { targets: [{ source: it.source, id: it.id }], value: !it.is_favorite } });
    refresh();
  };
  const singleDelete = async (it: Item) => {
    if (!confirm("Delete this item?")) return;
    await deleteFn({ data: { targets: [{ source: it.source, id: it.id }] } });
    setPreviewIndex(null); refresh();
  };
  const newFolder = async () => {
    const name = newFolderName.trim(); if (!name) return;
    await createFolderFn({ data: { name } });
    setNewFolderName(""); setShowNewFolder(false);
    qc.invalidateQueries({ queryKey: ["my-folders", user?.id] });
    toast.success("Folder created");
  };
  const removeFolder = async (id: string) => {
    if (!confirm("Delete this folder? Items inside will be unfiled.")) return;
    await deleteFolderFn({ data: { id } });
    if (folderId === id) setFolderId(null);
    qc.invalidateQueries({ queryKey: ["my-folders", user?.id] });
    refresh();
  };
  const editFolder = async (id: string, current: string) => {
    const name = prompt("Rename folder", current);
    if (!name || name === current) return;
    await renameFolderFn({ data: { id, name: name.trim() } });
    qc.invalidateQueries({ queryKey: ["my-folders", user?.id] });
  };

  return (
    <AppShell>
      <div className="relative">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border">
          <div aria-hidden className="absolute inset-0 opacity-50" style={{
            background: "radial-gradient(ellipse 70% 50% at 15% 0%, color-mix(in oklab, var(--brand) 22%, transparent), transparent 70%)",
          }}/>
          <div className="relative max-w-[1600px] mx-auto px-6 lg:px-10 pt-10 pb-7 flex items-end justify-between gap-6 flex-wrap">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Workspace</div>
              <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
                <span className="bg-clip-text text-transparent bg-[image:var(--gradient-brand)]">My Library</span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">Everything you've generated and uploaded, organized.</p>
            </div>
            <div className="flex items-center gap-2">
              <UploadButton onFiles={onFiles} />
              <Link to="/create/image" className="h-9 px-4 rounded-full bg-[image:var(--gradient-brand)] text-brand-foreground text-[13px] font-semibold inline-flex items-center shadow-[var(--shadow-glow)]">
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
                  <button key={t.kind} onClick={() => setTab(t.kind)}
                    className={`shrink-0 inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12.5px] font-medium transition-colors ${
                      active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-surface"
                    }`}>
                    <t.icon className="size-3.5" />{t.label}
                    <span className={`ml-0.5 tabular-nums text-[10.5px] ${active ? "text-background/70" : "text-muted-foreground/70"}`}>{n}</span>
                  </button>
                );
              })}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search prompts, models…"
                  className="h-8 w-56 md:w-72 pl-8 pr-7 rounded-full bg-surface border border-border text-[12.5px] placeholder:text-muted-foreground/70 focus:outline-none focus:border-foreground/30 focus:bg-background transition-colors"/>
                {query && (
                  <button onClick={() => setQuery("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 size-5 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-background" aria-label="Clear search">
                    <X className="size-3" />
                  </button>
                )}
              </div>
              <button
                onClick={() => { setSelectMode((m) => !m); clearSelection(); }}
                className={`h-8 px-3 inline-flex items-center gap-1.5 rounded-full border text-[12.5px] transition-colors ${
                  selectMode ? "bg-foreground text-background border-transparent" : "border-border text-muted-foreground hover:text-foreground"
                }`}>
                {selectMode ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />} Select
              </button>
              <div className="inline-flex rounded-full border border-border p-0.5 bg-surface">
                <button onClick={() => setView("grid")} aria-pressed={view === "grid"} className={`size-7 grid place-items-center rounded-full transition-colors ${view === "grid" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}><LayoutGrid className="size-3.5" /></button>
                <button onClick={() => setView("masonry")} aria-pressed={view === "masonry"} className={`size-7 grid place-items-center rounded-full transition-colors ${view === "masonry" ? "bg-background text-foreground" : "text-muted-foreground hover:text-foreground"}`}><Rows3 className="size-3.5" /></button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
          {/* Folders sidebar */}
          <aside className="hidden lg:block">
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Folders</h3>
              <button onClick={() => setShowNewFolder(true)} className="size-6 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface" aria-label="New folder">
                <FolderPlus className="size-3.5" />
              </button>
            </div>
            <ul className="space-y-0.5">
              <li>
                <button onClick={() => setFolderId(null)} className={`w-full text-left flex items-center gap-2 h-8 px-2.5 rounded-md text-[12.5px] ${folderId === null ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface/50 hover:text-foreground"}`}>
                  <FolderOpen className="size-3.5" /> All items
                  <span className="ml-auto text-[10.5px] tabular-nums text-muted-foreground/70">{all.length}</span>
                </button>
              </li>
              {(qf.data ?? []).map((f: any) => {
                const n = all.filter((it) => it.folder_id === f.id).length;
                const active = folderId === f.id;
                return (
                  <li key={f.id} className="group">
                    <div className={`flex items-center gap-2 h-8 px-2.5 rounded-md text-[12.5px] ${active ? "bg-surface text-foreground" : "text-muted-foreground hover:bg-surface/50 hover:text-foreground"}`}>
                      <button onClick={() => setFolderId(f.id)} className="flex-1 text-left flex items-center gap-2 min-w-0">
                        <Folder className="size-3.5 shrink-0" />
                        <span className="truncate">{f.name}</span>
                      </button>
                      <span className="text-[10.5px] tabular-nums text-muted-foreground/70">{n}</span>
                      <button onClick={() => editFolder(f.id, f.name)} className="opacity-0 group-hover:opacity-100 size-5 grid place-items-center rounded text-muted-foreground hover:text-foreground" aria-label="Rename">
                        <Pencil className="size-3" />
                      </button>
                      <button onClick={() => removeFolder(f.id)} className="opacity-0 group-hover:opacity-100 size-5 grid place-items-center rounded text-muted-foreground hover:text-destructive" aria-label="Delete">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </li>
                );
              })}
              {(qf.data ?? []).length === 0 && (
                <li className="text-[12px] text-muted-foreground/70 px-2.5 py-2">No folders yet.</li>
              )}
            </ul>
          </aside>

          {/* Grid */}
          <div>
            {!user && !loading ? (
              <EmptyState title="Sign in to see your library" body="Your generations are tied to your account." cta={{ label: "Sign in", to: "/auth" }} />
            ) : qg.isLoading ? (
              view === "grid" ? <SkeletonGrid /> : <SkeletonMasonry />
            ) : qg.isError ? (
              <EmptyState title="Couldn't load your library" body={qg.error instanceof Error ? qg.error.message : "Try refreshing"} icon={AlertCircle} />
            ) : items.length === 0 ? (
              <EmptyState title="Nothing here yet" body="Generated images, videos and audio will show up in your library." cta={{ label: "Browse tools", to: "/tools" }} />
            ) : view === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {items.map((g, i) => (
                  <Card key={`${g.source}:${g.id}`} g={g} selectMode={selectMode}
                    selected={!!selected[g.id]} onToggle={() => toggleSelect(g)}
                    onOpen={() => setPreviewIndex(i)} onFavorite={() => singleFavorite(g)} />
                ))}
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 md:columns-4 xl:columns-5 gap-3 [column-fill:_balance]">
                {items.map((g, i) => (
                  <div key={`${g.source}:${g.id}`} className="break-inside-avoid mb-3">
                    <Card g={g} masonry selectMode={selectMode}
                      selected={!!selected[g.id]} onToggle={() => toggleSelect(g)}
                      onOpen={() => setPreviewIndex(i)} onFavorite={() => singleFavorite(g)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selCount > 0 && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 h-12 px-3 rounded-full bg-background/95 backdrop-blur-xl border border-border shadow-2xl">
          <span className="text-[12.5px] text-muted-foreground pl-2">{selCount} selected</span>
          <span className="h-5 w-px bg-border mx-1" />
          <button onClick={() => bulkFavorite(true)} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-full hover:bg-surface text-[12.5px]"><Heart className="size-3.5" /> Favorite</button>
          <button onClick={() => setShowMove(true)} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-full hover:bg-surface text-[12.5px]"><FolderInput className="size-3.5" /> Move</button>
          <button onClick={bulkDelete} className="h-8 px-3 inline-flex items-center gap-1.5 rounded-full text-destructive hover:bg-destructive/10 text-[12.5px]"><Trash2 className="size-3.5" /> Delete</button>
          <span className="h-5 w-px bg-border mx-1" />
          <button onClick={clearSelection} className="size-8 grid place-items-center rounded-full hover:bg-surface" aria-label="Clear"><X className="size-3.5" /></button>
        </div>
      )}

      {/* Preview modal */}
      <PreviewModal
        open={previewIndex !== null}
        items={items}
        index={previewIndex ?? 0}
        onOpenChange={(o) => { if (!o) setPreviewIndex(null); }}
        onIndex={(i) => setPreviewIndex(i)}
        onToggleFavorite={(it) => singleFavorite(it as Item)}
        onDelete={(it) => singleDelete(it as Item)}
        onMove={(it) => { setSelected({ [it.id]: it as Item }); setShowMove(true); }}
      />

      {/* Move dialog */}
      <Dialog open={showMove} onOpenChange={setShowMove}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Move to folder</DialogTitle></DialogHeader>
          <div className="max-h-80 overflow-y-auto -mx-2">
            <button onClick={() => bulkMove(null)} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface text-[13px]">
              <FolderOpen className="size-4 text-muted-foreground" /> No folder (root)
            </button>
            {(qf.data ?? []).map((f: any) => (
              <button key={f.id} onClick={() => bulkMove(f.id)} className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-md hover:bg-surface text-[13px]">
                <Folder className="size-4 text-muted-foreground" /> {f.name}
              </button>
            ))}
            {(qf.data ?? []).length === 0 && <p className="text-sm text-muted-foreground px-3 py-2">No folders yet. Create one from the sidebar.</p>}
          </div>
        </DialogContent>
      </Dialog>

      {/* New folder dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>New folder</DialogTitle></DialogHeader>
          <input
            autoFocus value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && newFolder()}
            placeholder="Folder name"
            className="h-10 w-full rounded-lg bg-surface border border-border px-3 text-sm focus:outline-none focus:border-foreground/30"
          />
          <DialogFooter>
            <button onClick={() => setShowNewFolder(false)} className="h-9 px-4 rounded-full hover:bg-surface text-[13px]">Cancel</button>
            <button onClick={newFolder} className="h-9 px-4 rounded-full bg-foreground text-background text-[13px] font-medium">Create</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {user && <GlobalDropOverlay onFiles={onFiles} />}
      <UploadsPanel items={uploader.items} onRemove={uploader.remove} onClearDone={uploader.clearDone} />
    </AppShell>
  );
}

function Card({
  g, masonry, selectMode, selected, onToggle, onOpen, onFavorite,
}: {
  g: Item; masonry?: boolean; selectMode: boolean; selected: boolean;
  onToggle: () => void; onOpen: () => void; onFavorite: () => void;
}) {
  const src = g.thumb_url ?? g.asset_url ?? "";
  const onClick = () => { if (selectMode) onToggle(); else onOpen(); };
  return (
    <div className={`group relative rounded-2xl overflow-hidden bg-surface border transition-colors cursor-pointer ${selected ? "border-brand ring-2 ring-brand/40" : "border-border hover:border-foreground/20"}`} onClick={onClick}>
      <div className={masonry ? "relative" : "aspect-square relative bg-background"}>
        {src ? (
          <img src={src} alt={g.prompt ?? ""} loading="lazy"
            className={`${masonry ? "w-full h-auto block" : "w-full h-full object-cover"} transition-transform duration-500 group-hover:scale-[1.02]`}/>
        ) : (
          <div className={`${masonry ? "aspect-square" : "absolute inset-0"} grid place-items-center text-muted-foreground text-xs`}>{g.status}</div>
        )}

        <span className="absolute top-2 left-2 inline-flex items-center h-6 px-2 rounded-full bg-black/55 backdrop-blur-md text-[10.5px] uppercase tracking-wide text-white/90">{g.kind}</span>

        {/* Select checkbox */}
        {(selectMode || selected) && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
            className={`absolute top-2 right-2 size-6 grid place-items-center rounded-full backdrop-blur-md transition-colors ${selected ? "bg-brand text-brand-foreground" : "bg-black/55 text-white/90 hover:bg-black/75"}`}
            aria-label={selected ? "Deselect" : "Select"}
          >
            {selected ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
          </button>
        )}

        {/* Hover bar */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all">
          <p className="text-[12px] leading-snug text-white line-clamp-2">{g.prompt ?? "Untitled"}</p>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-white/70">
            <button
              onClick={(e) => { e.stopPropagation(); onFavorite(); }}
              className={`pointer-events-auto inline-flex items-center gap-1 hover:text-white ${g.is_favorite ? "text-rose-300" : ""}`}
              aria-label="Favorite"
            >
              <Heart className={`size-3 ${g.is_favorite ? "fill-current" : ""}`} /> {g.like_count ?? 0}
            </button>
            {g.asset_url && (
              <a href={g.asset_url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="pointer-events-auto inline-flex items-center gap-1 hover:text-white">
                <Download className="size-3" /> Save
              </a>
            )}
          </div>
        </div>

        {/* Favorite badge (always visible) */}
        {g.is_favorite && !selectMode && (
          <span className="absolute top-2 right-2 size-6 grid place-items-center rounded-full bg-rose-500/85 text-white">
            <Heart className="size-3 fill-current" />
          </span>
        )}
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
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
        <div key={i} className="break-inside-avoid mb-3 rounded-2xl bg-surface border border-border animate-pulse" style={{ height: 180 + (i % 4) * 80 }}/>
      ))}
    </div>
  );
}
function EmptyState({ title, body, cta, icon: Icon = FolderOpen }: {
  title: string; body: string; cta?: { label: string; to: string }; icon?: typeof FolderOpen;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-16 text-center">
      <div className="mx-auto size-14 rounded-2xl bg-[image:var(--gradient-brand-soft)] border border-border grid place-items-center mb-4">
        <Icon className="size-6 text-foreground/70" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">{body}</p>
      {cta && <Link to={cta.to} className="inline-flex mt-5 h-9 px-4 rounded-full bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-medium items-center shadow-[var(--shadow-glow)]">{cta.label}</Link>}
    </div>
  );
}
