import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { generateMotion, listMyMotion } from "@/lib/motion.functions";
import { pollGeneration } from "@/lib/video.functions";
import {
  Activity, Film, Image as ImageIcon, ChevronDown, ChevronRight,
  History, BookOpen, Info, Sparkles, Upload, X, Loader2, Download, RotateCcw,
} from "lucide-react";

export const Route = createFileRoute("/create/motion")({
  head: () => ({ meta: [{ title: "Motion Control — Betty" }] }),
  component: MotionCreate,
});

type Tab = "history" | "examples" | "about";
type Phase = "idle" | "uploading" | "queued" | "running" | "succeeded" | "failed";

type HistoryItem = {
  id: string;
  status: string;
  asset_url: string | null;
  thumb_url: string | null;
  prompt: string | null;
  created_at: string;
  error: string | null;
};

function MotionCreate() {
  const { user } = useSession();
  const generate = useServerFn(generateMotion);
  const poll = useServerFn(pollGeneration);
  const listHistory = useServerFn(listMyMotion);

  const [tab, setTab] = useState<Tab>("about");
  const [video, setVideo] = useState<{ file: File; url: string } | null>(null);
  const [character, setCharacter] = useState<{ file: File; url: string } | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [orientation, setOrientation] = useState<"Video" | "Portrait" | "Landscape" | "Square">("Video");
  const [mode, setMode] = useState<"Standard" | "Pro">("Standard");
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const videoRef = useRef<HTMLInputElement>(null);
  const charRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);

  const navigate = useNavigate();
  const cost = mode === "Pro" ? 120 : 80;
  const busy = phase === "uploading" || phase === "queued" || phase === "running";
  const MAX_VIDEO = 50 * 1024 * 1024; // 50MB
  const MAX_IMAGE = 10 * 1024 * 1024; // 10MB
  const MAX_PROMPT = 2000;
  const promptTooLong = prompt.length > MAX_PROMPT;
  const videoTooBig = !!video && video.file.size > MAX_VIDEO;
  const imageTooBig = !!character && character.file.size > MAX_IMAGE;
  const blockReason: string | null =
    busy ? null
    : !user ? "Sign in to generate"
    : !video ? "Upload a motion video to continue"
    : !character ? "Upload a character image to continue"
    : videoTooBig ? "Motion video exceeds 50 MB"
    : imageTooBig ? "Character image exceeds 10 MB"
    : promptTooLong ? `Prompt is too long (${prompt.length}/${MAX_PROMPT})`
    : null;
  const canGenerate = !busy && blockReason === null;

  // Load history
  useEffect(() => {
    if (!user) return;
    listHistory().then((r) => setHistory(r as HistoryItem[])).catch(() => {});
  }, [user, listHistory, output]);

  // Progress ticker
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setProgress((p) => Math.min(92, p + 1.6)), 800);
    return () => clearInterval(t);
  }, [busy]);

  useEffect(() => () => {
    if (pollRef.current) window.clearInterval(pollRef.current);
  }, []);

  async function uploadFile(file: File, kind: "video" | "image"): Promise<string> {
    if (!user) throw new Error("Sign in to continue");
    const ext = file.name.split(".").pop() || (kind === "video" ? "mp4" : "png");
    const path = `${user.id}/uploads/motion/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("generations")
      .upload(path, file, { contentType: file.type || undefined, upsert: false });
    if (error) throw new Error(error.message);
    return path;
  }

  async function onGenerate() {
    if (!user) {
      toast.message("Sign in to generate motion videos", {
        id: "motion",
        action: { label: "Sign in", onClick: () => navigate({ to: "/auth" }) },
      });
      navigate({ to: "/auth" });
      return;
    }
    if (!video) { toast.error("Please upload a motion video first", { id: "motion" }); return; }
    if (!character) { toast.error("Please upload a character image first", { id: "motion" }); return; }
    if (videoTooBig) { toast.error("Motion video must be ≤ 50 MB", { id: "motion" }); return; }
    if (imageTooBig) { toast.error("Character image must be ≤ 10 MB", { id: "motion" }); return; }
    if (promptTooLong) { toast.error(`Prompt too long (max ${MAX_PROMPT} chars)`, { id: "motion" }); return; }
    if (!canGenerate) return;
    setError(null);

    setOutput(null);
    setProgress(2);
    setPhase("uploading");
    try {
      toast.loading("Uploading references...", { id: "motion" });
      const [videoPath, imagePath] = await Promise.all([
        uploadFile(video.file, "video"),
        uploadFile(character.file, "image"),
      ]);
      setProgress(20);
      setPhase("queued");
      toast.loading("Submitting motion job...", { id: "motion" });
      const { id } = await generate({
        data: { videoPath, imagePath, prompt, orientation, mode },
      });
      setPhase("running");
      toast.loading("Generating — this can take 1-3 minutes", { id: "motion" });
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(async () => {
        try {
          const res = await poll({ data: { id } });
          if (res.status === "succeeded") {
            window.clearInterval(pollRef.current!);
            pollRef.current = null;
            setProgress(100);
            setPhase("succeeded");
            setOutput(res.url ?? null);
            toast.success("Motion video ready!", { id: "motion" });
          } else if (res.status === "failed") {
            window.clearInterval(pollRef.current!);
            pollRef.current = null;
            setPhase("failed");
            setError(res.error ?? "Generation failed");
            toast.error(res.error ?? "Generation failed", { id: "motion" });
          }
        } catch (e) {
          // transient, keep polling
          console.warn("poll error", e);
        }
      }, 4000);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      setPhase("failed");
      setError(msg);
      toast.error(msg, { id: "motion" });
    }
  }

  function reset() {
    setOutput(null);
    setError(null);
    setProgress(0);
    setPhase("idle");
  }

  return (
    <AppShell>
      <div className="relative h-[calc(100vh-0px)] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div>
            <h1 className="flex items-center gap-2 text-[18px] font-semibold tracking-tight">
              <Activity className="size-4 text-brand" />
              Motion Control
            </h1>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">Generate videos with motion guidance</p>
          </div>
          <TabSwitcher tab={tab} onChange={setTab} />
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-[380px_1fr] gap-0 overflow-hidden px-6 pb-28">
          {/* Left panel */}
          <div className="overflow-y-auto pr-4 space-y-3">
            <UploadTile
              icon={<Film className="size-5" />}
              title="Motion Video"
              subtitle="Used as motion reference (3-30s)"
              filled={!!video}
              fileName={video?.file.name}
              previewUrl={video?.url}
              isVideo
              onPick={() => videoRef.current?.click()}
              onClear={() => { if (video) URL.revokeObjectURL(video.url); setVideo(null); }}
            />
            <input ref={videoRef} type="file" accept="video/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setVideo({ file: f, url: URL.createObjectURL(f) });
              }} />

            <UploadTile
              icon={<ImageIcon className="size-5" />}
              title="Character Image"
              subtitle="Character image to replace the motion"
              filled={!!character}
              previewUrl={character?.url}
              onPick={() => charRef.current?.click()}
              onClear={() => { if (character) URL.revokeObjectURL(character.url); setCharacter(null); }}
            />
            <input ref={charRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setCharacter({ file: f, url: URL.createObjectURL(f) });
              }} />

            {/* Advanced Settings */}
            <div className="pt-3">
              <button
                onClick={() => setAdvancedOpen((v) => !v)}
                className="w-full flex items-center justify-between text-[13.5px] font-semibold py-1.5"
              >
                <span>Advanced Settings</span>
                <ChevronDown className={`size-4 transition-transform ${advancedOpen ? "" : "-rotate-90"}`} />
              </button>
              {advancedOpen && (
                <div className="mt-2 space-y-2">
                  <SelectRow label="Orientation" value={orientation}
                    options={["Video", "Portrait", "Landscape", "Square"]}
                    onChange={(v) => setOrientation(v as typeof orientation)} />
                  <SelectRow label="Mode" value={mode}
                    options={["Standard", "Pro"]}
                    onChange={(v) => setMode(v as typeof mode)} />
                  <div className="rounded-xl border border-white/8 bg-surface/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold">Guiding Prompt</span>
                      <span className="text-[10.5px] text-brand font-medium">Optional</span>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the background details or leave blank to use the image's background. Motion is controlled by the source video."
                      className="mt-2 w-full min-h-[96px] bg-transparent text-[12.5px] text-foreground/90 placeholder:text-muted-foreground/70 resize-none focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right preview */}
          <div className="overflow-y-auto">
            {(busy || output || error) ? (
              <ResultPanel
                phase={phase}
                progress={progress}
                output={output}
                baseUrl={video?.url ?? null}
                error={error}
                onReset={reset}
                onRetry={onGenerate}
              />
            ) : (
              <>
                {tab === "about" && <AboutPanel baseUrl={video?.url ?? null} charUrl={character?.url ?? null} />}
                {tab === "history" && <HistoryPanel items={history} />}
                {tab === "examples" && <ExamplesPanel />}
              </>
            )}
          </div>
        </div>

        {/* Floating Generate Bar */}
        <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
          <div className="pointer-events-auto max-w-[680px] mx-auto">
            <button
              disabled={!canGenerate}
              onClick={onGenerate}
              className="w-full h-12 rounded-2xl bg-[image:var(--gradient-brand)] text-brand-foreground text-[14px] font-semibold shadow-[var(--shadow-glow)] hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {busy ? (
                <><Loader2 className="size-4 animate-spin" /> {phase === "uploading" ? "Uploading..." : "Generating..."}</>
              ) : (
                <><Sparkles className="size-4" /> Generate Video · {cost} credits</>
              )}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TabSwitcher({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "history",  label: "History",  icon: <History className="size-3.5" /> },
    { id: "examples", label: "Examples", icon: <BookOpen className="size-3.5" /> },
    { id: "about",    label: "About",    icon: <Info className="size-3.5" /> },
  ];
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-black/40 border border-white/8">
      {items.map((it) => {
        const active = tab === it.id;
        return (
          <button key={it.id} onClick={() => onChange(it.id)}
            className={`flex items-center gap-1.5 px-3.5 h-8 rounded-full text-[12.5px] font-medium transition ${
              active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            {it.icon}{it.label}
          </button>
        );
      })}
    </div>
  );
}

function UploadTile({
  icon, title, subtitle, filled, fileName, previewUrl, isVideo, onPick, onClear,
}: {
  icon: React.ReactNode; title: string; subtitle: string;
  filled: boolean; fileName?: string; previewUrl?: string; isVideo?: boolean;
  onPick: () => void; onClear: () => void;
}) {
  return (
    <button type="button" onClick={onPick}
      className="group relative w-full rounded-xl border border-white/8 bg-surface/60 hover:border-white/15 hover:bg-white/[0.03] transition aspect-[1.55/1] overflow-hidden">
      {previewUrl && (isVideo
        ? <video src={previewUrl} className="absolute inset-0 size-full object-cover opacity-70" muted />
        : <img src={previewUrl} alt="" className="absolute inset-0 size-full object-cover opacity-80" />
      )}
      {previewUrl && <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center px-4">
        {!previewUrl && (
          <div className="size-8 rounded-md grid place-items-center text-muted-foreground/80 group-hover:text-foreground/90">
            {icon}
          </div>
        )}
        <div className="text-[13px] font-semibold text-foreground">{title}</div>
        <div className="text-[11.5px] text-muted-foreground line-clamp-1 max-w-[260px]">
          {fileName ?? subtitle}
        </div>
      </div>
      {filled && (
        <span role="button"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="absolute top-2 right-2 size-6 rounded-full bg-black/70 border border-white/10 grid place-items-center text-muted-foreground hover:text-foreground">
          <X className="size-3.5" />
        </span>
      )}
      {!filled && (
        <span className="absolute bottom-2 right-2 size-6 rounded-full bg-black/40 border border-white/10 grid place-items-center text-muted-foreground/70">
          <Upload className="size-3" />
        </span>
      )}
    </button>
  );
}

function SelectRow({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-xl border border-white/8 bg-surface/60 px-3.5 py-2.5 hover:border-white/15 transition">
        <div className="text-left">
          <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-[13px] font-semibold">{value}</div>
        </div>
        <ChevronRight className={`size-4 text-muted-foreground transition ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-[#0e0e12] p-1 shadow-xl">
          {options.map((o) => (
            <button key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 h-8 rounded-md text-[12.5px] ${o === value ? "bg-brand/15 text-brand" : "hover:bg-white/5"}`}>
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AboutPanel({ baseUrl, charUrl }: { baseUrl: string | null; charUrl: string | null }) {
  return (
    <div className="h-full flex flex-col gap-5">
      <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-black/40 aspect-[16/9]">
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="relative bg-gradient-to-br from-zinc-700 to-zinc-900 overflow-hidden">
            <span className="absolute top-3 left-3 z-10 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-black/60 border border-white/10">Base</span>
            {baseUrl ? <video src={baseUrl} className="size-full object-cover" muted loop autoPlay />
              : <div className="absolute inset-0 grid place-items-center text-muted-foreground/40"><Film className="size-12" /></div>}
          </div>
          <div className="relative bg-gradient-to-br from-orange-900/40 to-rose-950/60 overflow-hidden">
            <span className="absolute top-3 right-3 z-10 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-black/60 border border-white/10">Output</span>
            {charUrl ? <img src={charUrl} alt="" className="size-full object-cover" />
              : <div className="absolute inset-0 grid place-items-center text-muted-foreground/40"><Sparkles className="size-12" /></div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-10 gap-y-5">
        <Step n={1} title="Select Base Video" desc="The video's movement will be used to animate the reference image." />
        <Step n={2} title="Add Reference Image" desc="Upload an image of a character to be animated by the base video." />
        <Step n={3} title="Describe Your Vision" desc="Write a prompt that guides the background of the output video." />
        <Step n={4} title="Generate" desc="Select your model and the output video will be generated in real-time." />
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 size-7 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[12px] font-semibold text-muted-foreground">{n}</div>
      <div>
        <div className="text-[13.5px] font-semibold">{title}</div>
        <p className="text-[12.5px] text-muted-foreground leading-relaxed mt-0.5 max-w-[280px]">{desc}</p>
      </div>
    </div>
  );
}

function ResultPanel({
  phase, progress, output, baseUrl, error, onReset, onRetry,
}: {
  phase: Phase; progress: number; output: string | null; baseUrl: string | null;
  error: string | null; onReset: () => void; onRetry: () => void;
}) {
  const label =
    phase === "uploading" ? "Uploading references" :
    phase === "queued"    ? "Queued at provider" :
    phase === "running"   ? "Animating character" :
    phase === "succeeded" ? "Completed" :
    phase === "failed"    ? "Failed" : "Idle";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/8 bg-surface/60 overflow-hidden">
        <div className="aspect-[16/9] bg-black grid place-items-center relative">
          {output ? (
            <video src={output} className="size-full object-contain" controls autoPlay loop />
          ) : baseUrl ? (
            <video src={baseUrl} className="size-full object-cover opacity-30" muted loop autoPlay />
          ) : null}
          {!output && (
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center space-y-2">
                {phase === "failed"
                  ? <X className="size-8 mx-auto text-rose-400" />
                  : <Loader2 className="size-8 mx-auto animate-spin text-brand" />}
                <div className="text-[13px] font-semibold">{label}</div>
                {error && <div className="text-[11.5px] text-rose-300 max-w-[320px]">{error}</div>}
              </div>
            </div>
          )}
        </div>
        <div className="p-3 flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${phase === "failed" ? "bg-rose-500" : "bg-[image:var(--gradient-brand)]"}`}
              style={{ width: `${phase === "failed" ? 100 : progress}%` }}
            />
          </div>
          <span className="text-[11px] tabular-nums text-muted-foreground w-10 text-right">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {output && (
          <a href={output} download className="h-9 px-3 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-[12.5px] inline-flex items-center gap-1.5">
            <Download className="size-3.5" /> Download
          </a>
        )}
        {(phase === "failed" || phase === "succeeded") && (
          <button onClick={phase === "failed" ? onRetry : onReset}
            className="h-9 px-3 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-[12.5px] inline-flex items-center gap-1.5">
            <RotateCcw className="size-3.5" /> {phase === "failed" ? "Retry" : "New run"}
          </button>
        )}
      </div>
    </div>
  );
}

function HistoryPanel({ items }: { items: HistoryItem[] }) {
  if (!items.length) {
    return (
      <div className="h-full min-h-[400px] grid place-items-center text-center">
        <div className="max-w-xs space-y-3">
          <div className="mx-auto size-12 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-muted-foreground"><History className="size-6" /></div>
          <div className="text-[14px] font-semibold">No history yet</div>
          <p className="text-[12.5px] text-muted-foreground">Your motion control runs will appear here.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((it) => (
        <div key={it.id} className="rounded-xl overflow-hidden border border-white/8 bg-surface/60">
          <div className="aspect-[3/4] bg-black relative">
            {it.asset_url
              ? <video src={it.asset_url} className="size-full object-cover" muted loop onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()} />
              : <div className="absolute inset-0 grid place-items-center text-muted-foreground/50">
                  {it.status === "running" || it.status === "queued"
                    ? <Loader2 className="size-6 animate-spin" />
                    : <X className="size-6" />}
                </div>}
            <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 border border-white/10 capitalize">{it.status}</span>
          </div>
          {it.prompt && <div className="p-2 text-[11px] text-muted-foreground line-clamp-2">{it.prompt}</div>}
        </div>
      ))}
    </div>
  );
}

function ExamplesPanel() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/8" />
      ))}
    </div>
  );
}
