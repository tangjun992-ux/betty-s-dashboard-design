import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Video, Zap, Mic2, Activity, Coins, Loader2,
  Puzzle, Images, Film, AudioLines,
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
import { generateVideo, pollGeneration } from "@/lib/video.functions";
import { VIDEO_MODELS, type Aspect, type VideoResolution } from "@/lib/model-registry";
import { useSession } from "@/lib/use-session";
import toolSeedance from "@/assets/tool-seedance.jpg";
import bannerTutorial from "@/assets/banner-tutorial.jpg";
import toolMotion from "@/assets/tool-motion.jpg";
import toolAvatar from "@/assets/tool-avatar.jpg";
import toolVideogen from "@/assets/tool-videogen.jpg";

export const Route = createFileRoute("/create/video")({
  head: () => ({ meta: [{ title: "Video — Betty" }] }),
  component: VideoPage,
});

const DEFAULT_MODEL = VIDEO_MODELS.find((m) => m.key === "seedance-2-fast") ?? VIDEO_MODELS[0];

function VideoPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [duration, setDuration] = useState<number>(15);
  const [resolution, setResolution] = useState<VideoResolution>("720p");
  const [batch, setBatch] = useState(1);
  const [advanced, setAdvanced] = useState<AdvancedOptions>({
    clearOnSubmit: true, fallbackModels: false, autoRetries: true,
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const submit = useServerFn(generateVideo);
  const poll = useServerFn(pollGeneration);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);

  // Coerce params when model changes
  useEffect(() => {
    if (!model.aspects.includes(aspect)) setAspect(model.aspects.includes("9:16") ? "9:16" : model.aspects[0]);
    if (!model.durations.includes(duration)) setDuration(model.durations[model.durations.length - 1]);
    // Server only supports 480p/720p/1080p — clamp 4K down
    const safeRes: VideoResolution[] = model.resolutions.filter((r) => r !== "4K");
    if (!safeRes.includes(resolution)) setResolution(safeRes.includes("720p") ? "720p" : safeRes[0] ?? "720p");
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  const cost = useMemo(() => model.cost(duration, resolution) * batch, [model, duration, resolution, batch]);

  async function startPolling(id: string, toastId: string | number) {
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      try {
        const r = await poll({ data: { id } });
        if (r.status === "succeeded" && r.url) {
          setResult(r.url); setBusy(false); setJobId(null);
          toast.success("Video ready", { id: toastId });
          return;
        }
        if (r.status === "failed") {
          setBusy(false); setJobId(null);
          toast.error(r.error || "Video generation failed", { id: toastId });
          return;
        }
      } catch (e) {
        if (attempts > 80) {
          setBusy(false); setJobId(null);
          toast.error(e instanceof Error ? e.message : "Polling failed", { id: toastId });
          return;
        }
      }
      if (attempts > 80) {
        setBusy(false); setJobId(null);
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
    setBusy(true); setResult(null);
    const safeRes: VideoResolution = resolution === "4K" ? "1080p" : resolution;
    const t = toast.loading(`Queued — ${model.label} ~1–2 min…`);
    try {
      const r = await submit({ data: { prompt: prompt.trim(), model: model.id, aspect, duration, resolution: safeRes } });
      setJobId(r.id);
      if (advanced.clearOnSubmit) setPrompt("");
      startPolling(r.id, t);
    } catch (err) {
      setBusy(false);
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
                  <RefTile label="Ref Images" icon={Images} />
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
