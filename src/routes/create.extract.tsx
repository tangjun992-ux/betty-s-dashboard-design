import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowUp, Image as ImageIcon, Upload, X, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { uploadExtractAsset, extractPrompt, EXTRACT_COST } from "@/lib/extract.functions";
import { useSession } from "@/lib/use-session";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/create/extract")({
  head: () => ({ meta: [{ title: "Extractor — Betty" }] }),
  component: ExtractorPage,
});

function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1] ?? "");
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}

function ExtractorPage() {
  const { user } = useSession();
  const upload = useServerFn(uploadExtractAsset);
  const extract = useServerFn(extractPrompt);
  const fileRef = useRef<HTMLInputElement>(null);
  const [v, setV] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function pick(f: File | null) {
    if (!f) return;
    if (f.size > 20 * 1024 * 1024) { toast.error("Max 20MB"); return; }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setV("");
  }

  async function onSubmit() {
    if (!user) { toast.error("Sign in first", { action: { label: "Sign in", onClick: () => (window.location.href = "/auth") } }); return; }
    if (!file && !v.trim()) { toast.error("Paste a URL or upload media"); return; }
    setBusy(true); setResult(null);
    try {
      let imagePath: string | undefined;
      let contentType: string | undefined;
      if (file) {
        const b64 = await fileToBase64(file);
        const up = await upload({ data: { filename: file.name, contentType: file.type || "application/octet-stream", base64: b64 } });
        imagePath = up.path; contentType = file.type;
      }
      const r = await extract({
        data: file
          ? { source: "upload", imagePath, contentType }
          : { source: "url", url: v.trim() },
      });
      setResult(r.prompt);
      toast.success(`Prompt extracted (−${r.cost} credits)`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function copyOut() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const hasInput = !!file || !!v.trim();

  return (
    <AppShell>
      <div className="min-h-[calc(100vh-3.5rem)] grid place-items-center px-6 py-10">
        <div className="w-full max-w-[760px]">
          <div className="text-center">
            <div className="mx-auto size-9 rounded-full bg-surface grid place-items-center">
              <span className="text-[16px]">🥑</span>
            </div>
            <h1 className="mt-4 text-[26px] font-semibold tracking-tight">Extract a Prompt</h1>
            <p className="mt-2 text-[14px] text-muted-foreground leading-relaxed">
              We'll analyze and guess the prompt<br />used to generate an image or a video
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground/70">Costs {EXTRACT_COST} credits per run</p>
          </div>

          <div className="mt-8 rounded-2xl bg-surface/60 border border-border/60 backdrop-blur p-4 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.7)]">
            {previewUrl && (
              <div className="mb-3 relative inline-block">
                {file?.type.startsWith("video/") ? (
                  <video src={previewUrl} className="max-h-40 rounded-lg" controls />
                ) : (
                  <img src={previewUrl} className="max-h-40 rounded-lg" alt="preview" />
                )}
                <button
                  onClick={() => { setFile(null); setPreviewUrl(null); }}
                  className="absolute -top-2 -right-2 size-6 rounded-full bg-background border border-border grid place-items-center hover:bg-surface-hover"
                  aria-label="Remove"
                ><X className="size-3" /></button>
              </div>
            )}

            <div className="flex items-start gap-3">
              <textarea
                value={v}
                onChange={(e) => { setV(e.target.value); if (e.target.value) { setFile(null); setPreviewUrl(null); } }}
                disabled={!!file}
                placeholder="Upload an image or video, or paste a direct file URL (https://…/image.jpg, …/video.mp4)"
                className="flex-1 min-h-[64px] max-h-40 bg-transparent text-[13.5px] resize-none focus:outline-none placeholder:text-muted-foreground/70 leading-relaxed disabled:opacity-40"
              />
              <button
                onClick={onSubmit}
                className="size-9 rounded-full bg-gradient-to-br from-pink-500 to-fuchsia-600 text-white grid place-items-center disabled:opacity-40 hover:opacity-90"
                disabled={!hasInput || busy}
                aria-label="Submit"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
              </button>
            </div>
            <div className="mt-3 pt-3 border-t border-border/60 flex items-center gap-1">
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => pick(e.target.files?.[0] ?? null)}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="h-8 px-2.5 rounded-md text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-surface-hover flex items-center gap-2"
              >
                <Upload className="size-3.5" /> Upload image / video
              </button>
              <Link
                to="/library"
                className="h-8 px-2.5 rounded-md text-[12.5px] text-muted-foreground hover:text-foreground hover:bg-surface-hover flex items-center gap-2"
              >
                <ImageIcon className="size-3.5" /> Select media from library
              </Link>
            </div>
          </div>

          {result && (
            <div className="mt-5 rounded-2xl bg-surface/60 border border-border/60 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                  <Sparkles className="size-3.5" /> Extracted prompt
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={copyOut} className="h-7 px-2">
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    <span className="ml-1 text-[12px]">{copied ? "Copied" : "Copy"}</span>
                  </Button>
                  <Button asChild size="sm" className="h-7 px-3 bg-gradient-to-br from-pink-500 to-fuchsia-600">
                    <Link to="/create/image" search={{ prompt: result } as never}>Use in Image</Link>
                  </Button>
                </div>
              </div>
              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
