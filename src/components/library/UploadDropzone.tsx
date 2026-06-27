import { useCallback, useEffect, useRef, useState } from "react";
import { Upload, X, CheckCircle2, AlertCircle, FileImage, FileVideo, FileAudio, FileQuestion, Loader2 } from "lucide-react";
import type { UploadItem } from "@/lib/use-uploader";

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function KindIcon({ kind }: { kind: UploadItem["kind"] }) {
  const cls = "size-4 text-muted-foreground";
  if (kind === "image") return <FileImage className={cls} />;
  if (kind === "video") return <FileVideo className={cls} />;
  if (kind === "audio") return <FileAudio className={cls} />;
  return <FileQuestion className={cls} />;
}

export function UploadButton({ onFiles }: { onFiles: (files: File[]) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="h-9 px-4 rounded-full bg-foreground text-background text-[13px] font-semibold inline-flex items-center gap-1.5 hover:opacity-90 transition-opacity"
      >
        <Upload className="size-3.5" />
        Upload
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        accept="image/*,video/*,audio/*"
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          if (files.length) onFiles(files);
          e.target.value = "";
        }}
      />
    </>
  );
}

/**
 * Full-page drag overlay. Listens to window-level dragenter/leave/drop.
 */
export function GlobalDropOverlay({ onFiles }: { onFiles: (files: File[]) => void }) {
  const [active, setActive] = useState(false);
  const counter = useRef(0);

  useEffect(() => {
    const onEnter = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes("Files")) return;
      counter.current++;
      setActive(true);
    };
    const onLeave = () => {
      counter.current = Math.max(0, counter.current - 1);
      if (counter.current === 0) setActive(false);
    };
    const onOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      counter.current = 0;
      setActive(false);
      if (!e.dataTransfer?.files?.length) return;
      e.preventDefault();
      onFiles(Array.from(e.dataTransfer.files));
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("dragover", onOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [onFiles]);

  if (!active) return null;
  return (
    <div className="fixed inset-0 z-[80] pointer-events-none">
      <div className="absolute inset-3 rounded-3xl border-2 border-dashed border-foreground/60 bg-background/70 backdrop-blur-xl grid place-items-center">
        <div className="text-center">
          <div className="mx-auto size-16 rounded-2xl bg-[image:var(--gradient-brand-soft)] border border-border grid place-items-center mb-3">
            <Upload className="size-7" />
          </div>
          <div className="text-lg font-semibold">Drop to upload</div>
          <div className="text-sm text-muted-foreground">Images, videos and audio · up to 200 MB each</div>
        </div>
      </div>
    </div>
  );
}

export function UploadsPanel({
  items,
  onRemove,
  onClearDone,
}: {
  items: UploadItem[];
  onRemove: (id: string) => void;
  onClearDone: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  if (!items.length) return null;
  const doneCount = items.filter((i) => i.status === "done").length;
  const activeCount = items.length - doneCount;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3.5 h-10 border-b border-border bg-surface/50">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-[12.5px] font-medium flex items-center gap-2"
        >
          {activeCount > 0 ? (
            <Loader2 className="size-3.5 animate-spin text-foreground/70" />
          ) : (
            <CheckCircle2 className="size-3.5 text-emerald-500" />
          )}
          {activeCount > 0 ? `Uploading ${activeCount}` : `${doneCount} uploaded`}
        </button>
        <div className="flex items-center gap-1">
          {doneCount > 0 && (
            <button
              onClick={onClearDone}
              className="text-[11px] text-muted-foreground hover:text-foreground px-2 h-6 rounded-md hover:bg-surface"
            >
              Clear done
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <ul className="max-h-[320px] overflow-y-auto divide-y divide-border">
          {items.map((it) => (
            <li key={it.id} className="px-3.5 py-2.5 flex items-center gap-3">
              <KindIcon kind={it.kind} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[12.5px] font-medium truncate">{it.name}</div>
                  <div className="text-[11px] text-muted-foreground tabular-nums">{fmtBytes(it.size)}</div>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-surface overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-200 ${
                      it.status === "error"
                        ? "bg-red-500"
                        : it.status === "done"
                        ? "bg-emerald-500"
                        : "bg-foreground"
                    }`}
                    style={{ width: `${Math.round((it.status === "done" ? 1 : it.progress) * 100)}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10.5px] text-muted-foreground">
                  <span>
                    {it.status === "queued" && "Queued"}
                    {it.status === "uploading" && `${Math.round(it.progress * 100)}%`}
                    {it.status === "saving" && "Saving…"}
                    {it.status === "done" && "Done"}
                    {it.status === "error" && (
                      <span className="text-red-500 inline-flex items-center gap-1">
                        <AlertCircle className="size-3" />
                        {it.error?.slice(0, 60) ?? "Failed"}
                      </span>
                    )}
                  </span>
                  <button
                    onClick={() => onRemove(it.id)}
                    className="hover:text-foreground"
                    aria-label="Dismiss"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
