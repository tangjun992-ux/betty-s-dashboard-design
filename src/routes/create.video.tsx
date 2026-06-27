import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Video, Zap, Mic2, Activity, Coins, Loader2,
  Puzzle, Images, Film, AudioLines,
  Clock, CheckCircle2, XCircle, X,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CreateHub, Composer } from "@/components/create/CreateHub";
import { VideoModelPicker } from "@/components/create/VideoModelPicker";
import {
  AspectPopover, ResolutionPopover, DurationPopover, BatchPopover, MorePopover,
  type AdvancedOptions,
} from "@/components/create/VideoOptionPopovers";
import { FrameUploader } from "@/components/create/FrameUploader";
import { ElementPicker, ElementChips, injectElementToken, removeElementToken, type ElementRow } from "@/components/create/ElementPicker";
import { generateVideo, pollGeneration } from "@/lib/video.functions";
import { VIDEO_MODELS, type Aspect, type VideoResolution } from "@/lib/model-registry";
import { useSession } from "@/lib/use-session";
import { track } from "@/lib/analytics";
import toolSeedance from "@/assets/tool-seedance.jpg";
import bannerTutorial from "@/assets/banner-tutorial.jpg";
import toolMotion from "@/assets/tool-motion.jpg";
import toolAvatar from "@/assets/tool-avatar.jpg";
import toolVideogen from "@/assets/tool-videogen.jpg";

type VideoSearch = { prompt?: string; model?: string; aspect?: string };
export const Route = createFileRoute("/create/video")({
  head: () => ({ meta: [{ title: "Video — Betty" }] }),
  validateSearch: (s: Record<string, unknown>): VideoSearch => ({
    prompt: typeof s.prompt === "string" ? s.prompt : undefined,
    model: typeof s.model === "string" ? s.model : undefined,
    aspect: typeof s.aspect === "string" ? s.aspect : undefined,
  }),
  component: VideoPage,
});

const DEFAULT_MODEL = VIDEO_MODELS.find((m) => m.key === "seedance-2") ?? VIDEO_MODELS[0];

function VideoPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const search = Route.useSearch();
  const initialModel = useMemo(() => {
    const m = search.model ? VIDEO_MODELS.find((x) => x.key === search.model) : null;
    return m ?? DEFAULT_MODEL;
  }, []); // eslint-disable-line
  const [prompt, setPrompt] = useState<string>(search.prompt ?? "");
  const [model, setModel] = useState(initialModel);
  const [aspect, setAspect] = useState<Aspect>(
    (search.aspect as Aspect) ?? "16:9",
  );
  const [duration, setDuration] = useState<number>(8);

  const [resolution, setResolution] = useState<VideoResolution>("720p");
  const [batch, setBatch] = useState(1);
  const [advanced, setAdvanced] = useState<AdvancedOptions>({
    clearOnSubmit: true, fallbackModels: false, autoRetries: true,
  });
  const [startFrameUrl, setStartFrameUrl] = useState<string | null>(null);
  const [endFrameUrl, setEndFrameUrl] = useState<string | null>(null);
  const [elements, setElements] = useState<ElementRow[]>([]);
  function toggleElement(el: ElementRow) {
    setElements((prev) => {
      const has = prev.some((p) => p.id === el.id);
      if (has) { setPrompt((p) => removeElementToken(p, el.name)); return prev.filter((p) => p.id !== el.id); }
      setPrompt((p) => injectElementToken(p, el.name));
      return [...prev, el];
    });
  }
  type Phase = "idle" | "queued" | "running" | "finalizing" | "completed" | "failed" | "cancelled";
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const busy = phase === "queued" || phase === "running" || phase === "finalizing";
  const [result, setResult] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const submit = useServerFn(generateVideo);
  const poll = useServerFn(pollGeneration);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  function startTimer() {
    const startedAt = Date.now();
    setElapsed(0); setProgress(2);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const e = (Date.now() - startedAt) / 1000;
      setElapsed(e);
      // soft asymptote toward 92% over ~90s
      setProgress((p) => (p >= 92 ? 92 : Math.min(92, 2 + (90 * e) / (e + 45))));
    }, 200);
  }
  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }
  function onCancel() {
    cancelledRef.current = true;
    if (pollTimer.current) { clearTimeout(pollTimer.current); pollTimer.current = null; }
    stopTimer();
    setPhase("cancelled"); setErrMsg("Cancelled — job may still finish in Library");
    setJobId(null);
    toast.message("Cancelled");
  }

  // Coerce params when model changes
  useEffect(() => {
    if (!model.aspects.includes(aspect)) setAspect(model.aspects.includes("16:9") ? "16:9" : model.aspects[0]);
    if (!model.durations.includes(duration)) setDuration(model.durations.includes(8) ? 8 : model.durations[0]);

    // Server only supports 480p/720p/1080p — clamp 4K down
    const safeRes: VideoResolution[] = model.resolutions.filter((r) => r !== "4K");
    if (!safeRes.includes(resolution)) setResolution(safeRes.includes("720p") ? "720p" : safeRes[0] ?? "720p");
    if (!model.supportsStartFrame) setStartFrameUrl(null);
    if (!model.supportsEndFrame) setEndFrameUrl(null);
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  const cost = useMemo(() => model.cost(duration, resolution) * batch, [model, duration, resolution, batch]);

  async function startPolling(id: string, toastId: string | number) {
    let attempts = 0;
    const tick = async () => {
      if (cancelledRef.current) return;
      attempts += 1;
      try {
        const r = await poll({ data: { id } });
        if (cancelledRef.current) return;
        if (r.status === "succeeded" && r.url) {
          stopTimer();
          setResult(r.url); setProgress(100); setPhase("completed"); setJobId(null);
          track("video_generate_success", { model: model.id, elapsed_s: elapsed });
          toast.success("Video ready", { id: toastId });
          return;
        }
        if (r.status === "failed") {
          stopTimer();
          setPhase("failed"); setErrMsg(r.error || "Generation failed"); setJobId(null);
          track("video_generate_fail", { model: model.id, error: r.error });
          toast.error(r.error || "Video generation failed", { id: toastId });
          return;
        }
        if (r.status === "queued" || r.status === "running") setPhase(r.status);
      } catch (e) {
        if (attempts > 80) {
          stopTimer();
          setPhase("failed"); setErrMsg(e instanceof Error ? e.message : "Polling failed"); setJobId(null);
          toast.error(e instanceof Error ? e.message : "Polling failed", { id: toastId });
          return;
        }
      }
      if (attempts > 80) {
        stopTimer();
        setPhase("failed"); setErrMsg("Timed out"); setJobId(null);
        toast.error("Video timed out. Check Library later.", { id: toastId });
        return;
      }
      pollTimer.current = setTimeout(tick, 3000);
    };
    pollTimer.current = setTimeout(tick, 3000);
  }

  async function onSubmit() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!prompt.trim() || busy) return;
    if (endFrameUrl && !startFrameUrl) {
      toast.error("Add a Start frame before End frame");
      return;
    }
    cancelledRef.current = false;
    setResult(null); setErrMsg(null);
    setPhase("queued"); startTimer();
    const safeRes: VideoResolution = resolution === "4K" ? "1080p" : resolution;
    const t = toast.loading(`Queued — ${model.label} ~1–2 min…`);
    track("video_generate_submit", { model: model.id, aspect, duration, resolution: safeRes, cost: model.cost });
    try {
      const r = await submit({ data: {
        prompt: prompt.trim(), model: model.id, aspect, duration, resolution: safeRes,
        startFrameUrl: startFrameUrl ?? undefined,
        endFrameUrl: endFrameUrl ?? undefined,
      } });
      if (cancelledRef.current) return;
      setJobId(r.id); setPhase("running");
      if (advanced.clearOnSubmit) setPrompt("");
      startPolling(r.id, t);
    } catch (err) {
      stopTimer();
      setPhase("failed"); setErrMsg(err instanceof Error ? err.message : "Submit failed");
      track("video_generate_fail", { model: model.id, error: err instanceof Error ? err.message : String(err) });
      toast.error(err instanceof Error ? err.message : "Submit failed", { id: t });
    }
  }

  return (
    <AppShell>
      <div className="flex min-h-full">
      <div className="flex-1 min-w-0">
      <CreateHub
        title={<>Generate • Edit • Remix Pro Videos</>}
        chips={[
          { label: "Video Ideas", icon: Zap },
          { label: "Lip Sync", icon: Mic2, badge: "App" },
          { label: "Motion Sync", icon: Activity, badge: "App" },
        ]}
        composer={
          <>
            <Composer
              placeholder="Prompt a video or add references"
              value={prompt}
              onChange={setPrompt}
              onSubmit={onSubmit}
              busy={busy}
              disabled={loading}
              leading={
                <div className="flex gap-2">
                  <RefTile label="Elements" icon={Puzzle} />
                  {model.supportsStartFrame && (
                    <FrameUploader label="Ref Images" value={startFrameUrl} onChange={setStartFrameUrl} disabled={busy} />
                  )}
                  {model.supportsEndFrame && (
                    <FrameUploader label="End frame" value={endFrameUrl} onChange={setEndFrameUrl} disabled={busy} />
                  )}
                  <RefTile label="Ref Video" icon={Film} />
                  <RefTile label="Ref Audio" icon={AudioLines} />
                </div>
              }
              options={
                <>
                  <VideoModelPicker value={model} onChange={setModel} />
                  <span className="text-muted-foreground/30">·</span>
                  <AspectPopover options={model.aspects} value={aspect} onChange={setAspect} />
                  <ResolutionPopover options={model.resolutions} value={resolution} onChange={setResolution} />
                  <DurationPopover options={model.durations} value={duration} onChange={setDuration} />
                  <BatchPopover max={4} value={batch} onChange={setBatch} />
                  <ElementPicker selected={elements} onToggle={toggleElement} />
                  <MorePopover value={advanced} onChange={setAdvanced} />
                  <div className="ml-auto flex items-center gap-1.5 text-foreground pr-1">
                    <Coins className="size-3.5 text-amber-400" />
                    <span className="text-[12px] font-medium tabular-nums">{cost}</span>
                  </div>
                </>
              }
            />
            {(phase !== "idle" || result) && (
              <div className="mt-4 rounded-2xl border border-border/60 bg-surface/70 p-4">
                <div className="flex items-center justify-between text-[12.5px]">
                  <div className="flex items-center gap-1.5">
                    {phase === "queued" && <><Clock className="size-3.5 text-muted-foreground" /><span className="text-muted-foreground">Queued · {model.label}</span></>}
                    {phase === "running" && <><Loader2 className="size-3.5 animate-spin text-brand" /><span>Rendering · {model.label}</span></>}
                    {phase === "finalizing" && <><Loader2 className="size-3.5 animate-spin text-brand" /><span>Finalizing…</span></>}
                    {phase === "completed" && <><CheckCircle2 className="size-3.5 text-emerald-400" /><span className="text-emerald-300">Completed</span></>}
                    {phase === "failed" && <><XCircle className="size-3.5 text-red-400" /><span className="text-red-300">{errMsg ?? "Failed"}</span></>}
                    {phase === "cancelled" && <><XCircle className="size-3.5 text-amber-400" /><span className="text-amber-300">{errMsg ?? "Cancelled"}</span></>}
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground tabular-nums">
                    <span>{elapsed.toFixed(1)}s</span>
                    <span>{Math.round(progress)}%</span>
                    {busy && (
                      <button onClick={onCancel} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-border/60 hover:bg-white/5 text-foreground" aria-label="Cancel generation">
                        <X className="size-3" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-300 ${
                      phase === "failed" ? "bg-red-500"
                      : phase === "cancelled" ? "bg-amber-500"
                      : phase === "completed" ? "bg-emerald-500"
                      : "bg-brand"
                    } ${busy ? "animate-pulse" : ""}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {result && (
                  <div className="mt-3 grid place-items-center">
                    <video src={result} controls className="max-h-[480px] rounded-xl" />
                  </div>
                )}
              </div>
            )}
          </>
        }
        appsTitle="Video Apps"
        appsIcon={Video}
        apps={[
          { image: toolSeedance, title: "Seedance 2.0", tag: "App" },
          { image: bannerTutorial, title: "Patriotic Address", tag: "App" },
          { image: toolMotion, title: "Bow Motion Sync", tag: "App" },
          { image: toolAvatar, title: "3D Character Talk", tag: "App" },
          { image: toolVideogen, title: "4K Cinematic", tag: "4K" },
        ]}
      />
      />
      </div>
      <CreateJobsRail kind="video" onReuse={(r) => { setPrompt(r.prompt ?? ""); const m = VIDEO_MODELS.find((x) => x.id === r.model); if (m) setModel(m); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
      </div>
    </AppShell>
  );
}

function RefTile({ label, icon: Icon }: { label: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <button
      type="button"
      className="w-[88px] h-[88px] rounded-xl border border-border/60 bg-white/[0.02] hover:bg-white/[0.05] flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors"
    >
      <Icon className="size-4" />
      <span className="text-[11px] leading-tight">{label}</span>
    </button>
  );
}
