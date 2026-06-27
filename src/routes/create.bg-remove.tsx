import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Scissors, Upload, X, Download, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreateLayout, FormField, PrimaryButton } from "@/components/dashboard/CreateLayout";
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
    } catch (e: any) {
      const msg = e?.message ?? "Failed to remove background";
      setError(msg); setPhase("failed"); toast.error(msg);
    }
  }

  return (
    <CreateLayout
      title="Background Remover"
      subtitle={`Cleanly cut out subjects — ${BGR_COST} credits per image.`}
      icon={Scissors}
      footer={
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-muted-foreground">{BGR_COST} credits</span>
          <PrimaryButton onClick={onRun} disabled={!file || phase === "uploading" || phase === "running"}>
            {phase === "uploading" ? (<><Loader2 className="size-4 animate-spin" /> Uploading…</>)
              : phase === "running" ? (<><Loader2 className="size-4 animate-spin" /> Removing…</>)
              : "Remove background"}
          </PrimaryButton>
        </div>
      }
    >
      <FormField label="Source image">
        {!preview ? (
          <label className="block rounded-2xl border border-dashed border-border bg-surface/40 hover:bg-surface transition-colors cursor-pointer">
            <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
            <div className="p-12 grid place-items-center text-center">
              <div className="size-12 rounded-xl bg-background border border-border grid place-items-center mb-3">
                <Upload className="size-5 text-muted-foreground" />
              </div>
              <div className="text-[13.5px] font-medium">Upload image</div>
              <div className="text-[12px] text-muted-foreground mt-1">PNG, JPG, WEBP — up to 20MB</div>
            </div>
          </label>
        ) : (
          <div className="relative rounded-2xl border border-border bg-surface/40 p-3">
            <button onClick={reset} className="absolute top-3 right-3 size-7 grid place-items-center rounded-full bg-black/55 text-white hover:bg-black/75 z-10" aria-label="Remove">
              <X className="size-3.5" />
            </button>
            <img src={preview} alt="" className="max-h-[420px] w-auto mx-auto rounded-xl block" />
          </div>
        )}
      </FormField>

      {(phase === "succeeded" || phase === "failed") && (
        <FormField label="Result">
          {resultUrl ? (
            <div className="rounded-2xl border border-border bg-[repeating-conic-gradient(theme(colors.zinc.800)_0%_25%,theme(colors.zinc.900)_0%_50%)_50%_/_18px_18px] p-3">
              <img src={resultUrl} alt="No background" className="max-h-[420px] w-auto mx-auto rounded-xl block" />
              <div className="mt-3 flex justify-end">
                <a href={resultUrl} target="_blank" rel="noreferrer" download className="h-9 px-4 inline-flex items-center gap-1.5 rounded-full bg-foreground text-background text-[13px] font-medium">
                  <Download className="size-3.5" /> Download PNG
                </a>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-[13px] text-destructive">{error ?? "Failed"}</div>
          )}
        </FormField>
      )}
    </CreateLayout>
  );
}
