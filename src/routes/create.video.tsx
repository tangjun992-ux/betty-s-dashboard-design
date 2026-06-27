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
          toast.success("Video ready", { id: toastId });
          return;
        }
        if (r.status === "failed") {
          stopTimer();
          setPhase("failed"); setErrMsg(r.error || "Generation failed"); setJobId(null);
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
      toast.error(err instanceof Error ? err.message : "Submit failed", { id: t });
    }
  }

  return (
    <AppShell>
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
            {(busy || result) && (
              <div className="mt-4 rounded-2xl border border-border/60 bg-surface/70 p-4 min-h-[200px] grid place-items-center">
                {busy && !result ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-brand" />
                    <p className="text-xs">Rendering with {model.label}… {jobId ? "(polling)" : ""}</p>
                  </div>
                ) : result ? (
                  <video src={result} controls className="max-h-[480px] rounded-xl" />
                ) : null}
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
