import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ChevronDown, Crop, Sliders, Camera, Maximize2, Eraser, Pencil,
  ImageIcon, Upload, FolderOpen, Loader2, Download, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { uploadEditorImage, runImageEdit, EDITOR_COSTS } from "@/lib/image-editor.functions";

export const Route = createFileRoute("/create/image-editor")({
  head: () => ({ meta: [{ title: "Image Editor — Betty" }] }),
  component: ImageEditorPage,
});

type Action = "remove_bg" | "upscale" | "inpaint";

const PANELS: { key: string; label: string; icon: typeof Pencil; action?: Action; cost?: number }[] = [
  { key: "edit", label: "Edit Region", icon: Pencil, action: "inpaint", cost: EDITOR_COSTS.inpaint },
  { key: "crop", label: "Crop & Expand", icon: Crop },
  { key: "color", label: "Color Adjustments", icon: Sliders },
  { key: "camera", label: "Camera Angle Adjust", icon: Camera },
  { key: "upscale", label: "Upscale", icon: Maximize2, action: "upscale", cost: EDITOR_COSTS.upscale },
  { key: "remove", label: "Remove Background", icon: Eraser, action: "remove_bg", cost: EDITOR_COSTS.remove_bg },
];

function ImageEditorPage() {
  const [open, setOpen] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<Action | null>(null);
  const [scale, setScale] = useState<2 | 3 | 4>(2);
  const [prompt, setPrompt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = useServerFn(uploadEditorImage);
  const run = useServerFn(runImageEdit);

  async function onUpload(file: File) {
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    if (file.size > 15 * 1024 * 1024) return toast.error("Image too large (max 15MB)");
    setUploading(true);
    try {
      const b64 = await fileToBase64(file);
      const res = await upload({ data: { filename: file.name, contentType: file.type, base64: b64 } });
      setImagePath(res.path);
      setImageUrl(res.url);
      setResultUrl(null);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function runAction(action: Action) {
    if (!imagePath) return toast.error("Upload an image first");
    if (action === "inpaint") {
      return toast.error("Edit Region (mask drawing) coming soon — use Remove BG / Upscale for now");
    }
    setBusy(action);
    const tid = toast.loading(action === "upscale" ? `Upscaling ${scale}×…` : "Removing background…");
    try {
      const res = await run({ data: { action, imagePath, scale, prompt } });
      setResultUrl(res.url);
      toast.success(`Done · ${res.cost} credits used`, { id: tid });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Edit failed", { id: tid });
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setImagePath(null); setImageUrl(null); setResultUrl(null); setOpen(null);
  }

  const showImage = resultUrl ?? imageUrl;

  return (
    <AppShell>
      <input
        ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void onUpload(f); e.target.value = ""; }}
      />
      <div
        className="flex min-h-[calc(100vh-3.5rem)]"
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) void onUpload(f); }}
      >
        <section className="flex-1 grid place-items-center px-6 py-8">
          {!showImage ? (
            <div className="text-center max-w-md">
              <div className="size-16 mx-auto rounded-2xl bg-surface grid place-items-center mb-5">
                <ImageIcon className="size-6 text-muted-foreground/70" />
              </div>
              <h2 className="text-[19px] font-semibold">Select an image to start editing</h2>
              <p className="text-[13px] text-muted-foreground mt-1">Or drag & drop or paste an image</p>
              <div className="mt-7 space-y-3 max-w-[340px] mx-auto">
                <button
                  disabled={uploading}
                  onClick={() => fileRef.current?.click()}
                  className="w-full h-11 rounded-full bg-brand text-brand-foreground text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                  {uploading ? "Uploading…" : "Upload Image"}
                </button>
                <button className="w-full h-11 rounded-full border border-brand/60 text-brand text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-brand/10">
                  <FolderOpen className="size-4" /> Select from Assets
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-3xl">
              <div className="relative rounded-xl overflow-hidden border border-border/60 bg-surface">
                <img src={showImage} alt="" className="w-full max-h-[70vh] object-contain bg-[conic-gradient(at_50%_50%,#0001_25%,transparent_25%_50%,#0001_50%_75%,transparent_75%)] bg-[length:24px_24px]" />
                {busy && (
                  <div className="absolute inset-0 grid place-items-center bg-background/60 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="size-4 animate-spin" /> Processing…
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button onClick={reset} className="h-9 px-3 rounded-full border border-border/60 text-[13px] flex items-center gap-1.5 hover:bg-surface">
                  <RotateCcw className="size-3.5" /> New image
                </button>
                {resultUrl && (
                  <>
                    <a href={resultUrl} download className="h-9 px-3 rounded-full border border-border/60 text-[13px] flex items-center gap-1.5 hover:bg-surface">
                      <Download className="size-3.5" /> Download
                    </a>
                    <button
                      onClick={() => { setImageUrl(resultUrl); setResultUrl(null); }}
                      className="h-9 px-3 rounded-full bg-surface text-[13px] hover:bg-surface/80"
                    >
                      Use as source
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="w-[300px] shrink-0 border-l border-border/60 bg-background/60">
          <div className="py-4">
            {PANELS.map((p) => {
              const Icon = p.icon;
              const isOpen = open === p.key;
              const runnable = !!p.action;
              return (
                <div key={p.key}>
                  <button
                    onClick={() => setOpen(isOpen ? null : p.key)}
                    className="w-full h-12 px-5 flex items-center justify-between text-[13.5px] hover:bg-surface/50 transition-colors"
                  >
                    <span className="flex items-center gap-2.5 text-foreground/90">
                      <Icon className="size-4 text-muted-foreground" />
                      {p.label}
                    </span>
                    <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-[12.5px] text-muted-foreground space-y-3">
                      {!imagePath && <p>Upload an image to use this tool.</p>}
                      {imagePath && !runnable && <p>Coming soon.</p>}
                      {imagePath && p.action === "upscale" && (
                        <div className="space-y-2">
                          <div className="text-foreground/80">Scale factor</div>
                          <div className="flex gap-1.5">
                            {([2, 3, 4] as const).map((s) => (
                              <button
                                key={s} onClick={() => setScale(s)}
                                className={`h-8 px-3 rounded-full text-[12px] border ${scale === s ? "bg-brand text-brand-foreground border-brand" : "border-border/60 hover:bg-surface"}`}
                              >{s}×</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {imagePath && p.action === "inpaint" && (
                        <textarea
                          value={prompt} onChange={(e) => setPrompt(e.target.value)}
                          rows={3} placeholder="Describe what to put in the masked area"
                          className="w-full rounded-lg bg-surface border border-border/60 p-2 text-[12.5px] text-foreground"
                        />
                      )}
                      {imagePath && runnable && (
                        <button
                          disabled={!!busy}
                          onClick={() => runAction(p.action!)}
                          className="w-full h-9 rounded-full bg-brand text-brand-foreground text-[12.5px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {busy === p.action ? <Loader2 className="size-3.5 animate-spin" /> : null}
                          Run · {p.cost} credits
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
