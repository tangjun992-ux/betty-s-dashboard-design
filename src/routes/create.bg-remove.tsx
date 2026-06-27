import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Scissors, Upload, X, Download, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreateLayout, FormField, PrimaryButton, EmptyPreview } from "@/components/dashboard/CreateLayout";
import { uploadBgrSource, removeBackground, BGR_COST } from "@/lib/bg-remove.functions";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/create/bg-remove")({
  head: () => ({ meta: [{ title: "Background Remover — Betty" }] }),
  component: BgRemovePage,
});

const MAX = 20 * 1024 * 1024;
type Phase = "idle" | "uploading" | "running" | "succeeded" | "failed";

function readFileAsBase64(f: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(((r.result as string).split(",")[1]) ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });
}

function BgRemovePage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const upload = useServerFn(uploadBgrSource);
  const remove = useServerFn(removeBackground);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function onPick(f: File | null) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Choose an image"); return; }
    if (f.size > MAX) { toast.error("Image too large (max 20MB)"); return; }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f); setPreview(URL.createObjectURL(f));
    setResultUrl(null); setError(null); setPhase("idle");
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null); setPreview(null); setResultUrl(null); setError(null); setPhase("idle");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onRun() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!file) { toast.error("Upload an image first"); return; }
    try {
      setPhase("uploading"); setError(null);
      const base64 = await readFileAsBase64(file);
      const { path } = await upload({ data: { filename: file.name, contentType: file.type, base64 } });
      setPhase("running");
      const r = await remove({ data: { assetPath: path } });
      setResultUrl(r.url); setPhase("succeeded");
      toast.success("Background removed");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to remove background";
      setError(msg); setPhase("failed"); toast.error(msg);
    }
  }

  const busy = phase === "uploading" || phase === "running";

  const controls = (
    <>
      <FormField label="Source image" hint="PNG, JPG, WEBP — up to 20MB">
        {!preview ? (
          <label className="block rounded-xl border border-dashed border-border bg-background/40 hover:bg-background transition-colors cursor-pointer">
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
            <div className="p-8 grid place-items-center text-center">
              <div className="size-10 rounded-lg bg-background border border-border grid place-items-center mb-2">
                <Upload className="size-4 text-muted-foreground" />
              </div>
              <div className="text-[13px] font-medium">Upload image</div>
            </div>
          </label>
        ) : (
          <div className="relative rounded-xl border border-border bg-background/40 p-2">
            <button onClick={reset} className="absolute top-2 right-2 size-6 grid place-items-center rounded-full bg-black/55 text-white hover:bg-black/75 z-10" aria-label="Remove">
              <X className="size-3" />
            </button>
            <img src={preview} alt="" className="max-h-[220px] w-auto mx-auto rounded-lg block" />
          </div>
        )}
      </FormField>
      <PrimaryButton onClick={onRun} disabled={!file || busy}>
        {phase === "uploading" ? (<span className="inline-flex items-center gap-2 justify-center"><Loader2 className="size-4 animate-spin" /> Uploading…</span>)
          : phase === "running" ? (<span className="inline-flex items-center gap-2 justify-center"><Loader2 className="size-4 animate-spin" /> Removing…</span>)
          : `Remove background · ${BGR_COST} credits`}
      </PrimaryButton>
    </>
  );

  const previewPane = resultUrl ? (
    <div className="space-y-3">
      <div className="rounded-xl border border-border p-3" style={{ backgroundImage: "conic-gradient(#27272a 25%, #18181b 0 50%, #27272a 0 75%, #18181b 0)", backgroundSize: "18px 18px" }}>
        <img src={resultUrl} alt="No background" className="max-h-[480px] w-auto mx-auto rounded-lg block" />
      </div>
      <div className="flex justify-end">
        <a href={resultUrl} target="_blank" rel="noreferrer" download className="h-9 px-4 inline-flex items-center gap-1.5 rounded-md bg-foreground text-background text-[13px] font-medium">
          <Download className="size-3.5" /> Download PNG
        </a>
      </div>
    </div>
  ) : phase === "failed" ? (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-[13px] text-destructive">{error ?? "Failed"}</div>
  ) : busy ? (
    <div className="h-full min-h-[460px] grid place-items-center text-muted-foreground text-sm">
      <span className="inline-flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> {phase === "uploading" ? "Uploading source…" : "Removing background…"}</span>
    </div>
  ) : (
    <EmptyPreview icon={<Scissors className="size-6" />} message="Upload an image to remove its background with a clean alpha cutout." />
  );

  return (
    <CreateLayout
      title="Background Remover"
      subtitle={`Cleanly cut out subjects — ${BGR_COST} credits per image.`}
      controls={controls}
      preview={previewPane}
    />
  );
}
