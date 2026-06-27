import { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, Heart, Trash2, FolderInput, Wand2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type PreviewItem = {
  id: string;
  source: "generation" | "upload";
  kind: string | null;
  prompt: string | null;
  asset_url: string | null;
  thumb_url: string | null;
  model?: string | null;
  is_favorite?: boolean | null;
  width?: number | null;
  height?: number | null;
  duration_ms?: number | null;
  created_at?: string | null;
};

export function PreviewModal({
  open,
  items,
  index,
  onOpenChange,
  onIndex,
  onToggleFavorite,
  onDelete,
  onMove,
}: {
  open: boolean;
  items: PreviewItem[];
  index: number;
  onOpenChange: (v: boolean) => void;
  onIndex: (i: number) => void;
  onToggleFavorite: (it: PreviewItem) => void;
  onDelete: (it: PreviewItem) => void;
  onMove: (it: PreviewItem) => void;
}) {
  const it = items[index];
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
      else if (e.key === "ArrowRight") onIndex(Math.min(items.length - 1, index + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, index, items.length, onIndex]);
  if (!it) return null;

  const src = it.asset_url ?? it.thumb_url ?? "";
  const isVideo = (it.kind ?? "").startsWith("video") || /\.(mp4|webm|mov)(\?|$)/i.test(src);
  const isAudio = (it.kind ?? "") === "audio" || /\.(mp3|wav|ogg|m4a)(\?|$)/i.test(src);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] w-[96vw] p-0 overflow-hidden bg-background border-border">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] min-h-[60vh]">
          <div className="relative bg-black grid place-items-center">
            {isVideo ? (
              <video src={src} controls autoPlay className="max-h-[80vh] max-w-full" />
            ) : isAudio ? (
              <div className="p-10 w-full max-w-md">
                <audio src={src} controls className="w-full" />
              </div>
            ) : (
              <img src={src} alt={it.prompt ?? ""} className="max-h-[80vh] max-w-full object-contain" />
            )}

            {index > 0 && (
              <button
                onClick={() => onIndex(index - 1)}
                className="absolute left-3 top-1/2 -translate-y-1/2 size-9 grid place-items-center rounded-full bg-black/55 hover:bg-black/75 text-white"
                aria-label="Previous"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}
            {index < items.length - 1 && (
              <button
                onClick={() => onIndex(index + 1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 size-9 grid place-items-center rounded-full bg-black/55 hover:bg-black/75 text-white"
                aria-label="Next"
              >
                <ChevronRight className="size-4" />
              </button>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-3 top-3 size-8 grid place-items-center rounded-full bg-black/55 hover:bg-black/75 text-white md:hidden"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <aside className="border-l border-border bg-surface/40 p-5 flex flex-col gap-4 overflow-y-auto">
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">{it.kind}</div>
              <p className="mt-1 text-sm leading-snug text-foreground line-clamp-6">{it.prompt ?? "Untitled"}</p>
            </div>

            <dl className="text-[12px] space-y-1.5 text-muted-foreground">
              {it.model && (<div className="flex justify-between"><dt>Model</dt><dd className="text-foreground">{it.model}</dd></div>)}
              {it.width && it.height && (<div className="flex justify-between"><dt>Size</dt><dd className="text-foreground">{it.width}×{it.height}</dd></div>)}
              {it.duration_ms ? (<div className="flex justify-between"><dt>Duration</dt><dd className="text-foreground">{(it.duration_ms/1000).toFixed(1)}s</dd></div>) : null}
              <div className="flex justify-between"><dt>Source</dt><dd className="text-foreground capitalize">{it.source}</dd></div>
              {it.created_at && (<div className="flex justify-between"><dt>Created</dt><dd className="text-foreground">{new Date(it.created_at).toLocaleString()}</dd></div>)}
            </dl>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onToggleFavorite(it)}
                className={`h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border text-[12.5px] transition-colors ${
                  it.is_favorite
                    ? "border-transparent bg-rose-500/15 text-rose-300"
                    : "border-border hover:bg-surface text-foreground"
                }`}
              >
                <Heart className={`size-3.5 ${it.is_favorite ? "fill-current" : ""}`} />
                {it.is_favorite ? "Favorited" : "Favorite"}
              </button>
              <button
                onClick={() => onMove(it)}
                className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border hover:bg-surface text-[12.5px]"
              >
                <FolderInput className="size-3.5" /> Move
              </button>
              {src && (
                <a
                  href={src}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border hover:bg-surface text-[12.5px]"
                >
                  <Download className="size-3.5" /> Download
                </a>
              )}
              {it.source === "generation" && (
                <Link
                  to="/create/image-editor"
                  search={{ url: src } as never}
                  className="h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-border hover:bg-surface text-[12.5px]"
                >
                  <Wand2 className="size-3.5" /> Edit
                </Link>
              )}
              <button
                onClick={() => onDelete(it)}
                className="col-span-2 h-9 inline-flex items-center justify-center gap-1.5 rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10 text-[12.5px]"
              >
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  );
}
