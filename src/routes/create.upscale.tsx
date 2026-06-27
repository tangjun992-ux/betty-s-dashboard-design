import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Maximize2, Upload, X, Download, Loader2, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreateLayout, FormField, PrimaryButton } from "@/components/dashboard/CreateLayout";
import { uploadUpscaleAsset, startUpscale, pollUpscale, UPSCALE_COSTS } from "@/lib/upscale.functions";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/create/upscale")({
  head: () => ({ meta: [{ title: "Upscaler — Betty" }] }),
  component: UpscaleCreate,
});

const MAX_IMAGE = 20 * 1024 * 1024;
const MAX_VIDEO = 80 * 1024 * 1024;

type Phase = "idle" | "uploading" | "running" | "succeeded" | "failed";

function readFileAsBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      resolve(s.split(",")[1] ?? "");
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}

function UpscaleCreate() {
  const session = useSession();
  const navigate = useNavigate();
  const upload = useServerFn(uploadUpscaleAsset);
  const start = useServerFn(startUpscale);
  const poll = useServerFn(pollUpscale);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [kind, setKind] = useState<"image" | "video">("image");
  const [scale, setScale] = useState<2 | 3 | 4>(2);
  const [phase, setPhase] = useState<Phase>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { if (pollRef.current) window.clearInterval(pollRef.current); }, []);

  function onPick(f: File | null) {
    if (!f) return;
    const isVideo = f.type.startsWith("video/");
    const isImage = f.type.startsWith("image/");
    if (!isVideo && !isImage) { toast.error("Choose an image or video"); return; }
    if (isVideo && f.size > MAX_VIDEO) { toast.error("Video too large (max 80MB)"); return; }
    if (isImage && f.size > MAX_IMAGE) { toast.error("Image too large (max 20MB)"); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setKind(isVideo ? "video" : "image");
    setPreview(URL.createObjectURL(f));
    setResultUrl(null);
    setPhase("idle");
  }

  async function onRun() {
    if (!session.user) { toast.message("Sign in to upscale", { action: { label: "Sign in", onClick: () => navigate({ to: "/auth" }) } }); return; }
    if (!file) { toast.error("Upload an image or video"); return; }
    try {
      setPhase("uploading");
      const base64 = await readFileAsBase64(file);
      const up = await upload({ data: { filename: file.name, contentType: file.type, base64, kind } });
      setPhase("running");
      const res = await start({ data: { assetPath: up.path, kind, scale } });
      setJobId(res.id);
      if (res.status === "succeeded" && "url" in res && res.url) {
        setResultUrl(res.url);
        setPhase("succeeded");
        toast.success(`Upscaled · -${res.cost} credits`);
        return;
      }
      // poll video
      pollRef.current = window.setInterval(async () => {
        try {
          const p = await poll({ data: { id: res.id } });
          if (p.status === "succeeded") {
            window.clearInterval(pollRef.current!); pollRef.current = null;
            setResultUrl(p.url ?? null);
            setPhase("succeeded");
            toast.success("Upscale complete");
          } else if (p.status === "failed") {
            window.clearInterval(pollRef.current!); pollRef.current = null;
            setPhase("failed");
            toast.error("Upscale failed (credits refunded)");
          }
        } catch (e) { /* keep polling */ }
      }, 5000);
    } catch (e: any) {
      setPhase("failed");
      toast.error(e?.message ?? "Upscale failed");
    }
  }

  const cost = UPSCALE_COSTS[kind];
  const busy = phase === "uploading" || phase === "running";

  return (
    <CreateLayout
      title="Upscaler"
      subtitle="Upscale your images and videos with AI clarity."
      controls={
        <>
          <FormField label="Source">
            {!file ? (
              <button
                onClick={() => inputRef.current?.click()}
                className="h-36 w-full rounded-md border border-dashed border-border grid place-items-center text-xs text-muted-foreground hover:bg-surface-hover"
              >
                <div className="flex flex-col items-center gap-2">
                  <Upload className="size-5" />
                  <span>Click to upload image or video</span>
                  <span className="text-[10px]">Image ≤ 20MB · Video ≤ 80MB</span>
                </div>
              </button>
            ) : (
              <div className="relative rounded-md border border-border overflow-hidden bg-background">
                {kind === "video"
                  ? <video src={preview ?? ""} className="w-full max-h-48 object-contain" muted playsInline />
                  : <img src={preview ?? ""} alt="" className="w-full max-h-48 object-contain" />}
                <button onClick={() => { setFile(null); setPreview(null); setResultUrl(null); setPhase("idle"); }} className="absolute top-2 right-2 size-7 rounded-full bg-black/60 grid place-items-center text-white hover:bg-black/80"><X className="size-3.5" /></button>
              </div>
            )}
            <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
          </FormField>
          <FormField label="Scale">
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((s) => (
                <button key={s} onClick={() => setScale(s as 2|3|4)} className={`h-9 rounded-md border text-sm ${scale === s ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-surface-hover"}`}>{s}x</button>
              ))}
            </div>
          </FormField>
          <PrimaryButton onClick={onRun} disabled={busy}>
            {busy ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> {phase === "uploading" ? "Uploading…" : "Upscaling…"}</span> : `Upscale · ${cost} credits`}
          </PrimaryButton>
          {phase === "failed" && (
            <button onClick={onRun} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 mx-auto"><RefreshCw className="size-3" /> Retry</button>
          )}
        </>
      }
      preview={
        <div className="w-full h-full grid place-items-center p-6">
          {!resultUrl && !busy && (
            <div className="text-center text-muted-foreground text-sm">
              <Maximize2 className="size-6 mx-auto mb-2 opacity-60" />
              Upscaled result appears here.
            </div>
          )}
          {busy && (
            <div className="text-center text-muted-foreground text-sm flex flex-col items-center gap-3">
              <Loader2 className="size-6 animate-spin text-primary" />
              {phase === "uploading" ? "Uploading source…" : "Running clarity model…"}
            </div>
          )}
          {resultUrl && (
            <div className="w-full max-w-2xl space-y-3">
              {kind === "video"
                ? <video src={resultUrl} controls autoPlay loop muted className="w-full rounded-lg border border-border" />
                : <img src={resultUrl} alt="upscaled" className="w-full rounded-lg border border-border" />}
              <div className="flex justify-end">
                <a href={resultUrl} download className="h-9 px-3 rounded-md bg-surface border border-border text-sm flex items-center gap-2 hover:bg-surface-hover"><Download className="size-4" /> Download</a>
              </div>
            </div>
          )}
        </div>
      }
    />
  );
}
