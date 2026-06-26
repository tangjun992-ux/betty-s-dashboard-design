import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Video, Zap, Mic2, Activity, Smartphone, Clock, Gem,
  SlidersHorizontal, Coins, Loader2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CreateHub, Composer } from "@/components/create/CreateHub";
import { ModelPicker, ChoicePill } from "@/components/create/ModelPicker";
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

function VideoPage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(VIDEO_MODELS[0]);
  const [aspect, setAspect] = useState<Aspect>(model.aspects[0]);
  const [duration, setDuration] = useState<number>(model.durations[0]);
  const [resolution, setResolution] = useState<VideoResolution>(model.resolutions[0]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const submit = useServerFn(generateVideo);
  const poll = useServerFn(pollGeneration);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (pollTimer.current) clearTimeout(pollTimer.current); }, []);

  // Coerce params when model changes
  useEffect(() => {
    if (!model.aspects.includes(aspect)) setAspect(model.aspects[0]);
    if (!model.durations.includes(duration)) setDuration(model.durations[0]);
    if (!model.resolutions.includes(resolution)) setResolution(model.resolutions[0]);
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  const cost = useMemo(() => model.cost(duration, resolution), [model, duration, resolution]);

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
    const t = toast.loading(`Queued — ${model.label} ~1–2 min…`);
    try {
      const r = await submit({ data: { prompt: prompt.trim(), model: model.id, aspect, duration, resolution } });
      setJobId(r.id);
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
                  <FrameSlot label="Start frame" enabled={model.supportsStartFrame} />
                  <FrameSlot label="End frame" enabled={model.supportsEndFrame} />
                </div>
              }
              options={
                <>
                  <ModelPicker models={VIDEO_MODELS} value={model} onChange={setModel} />
                  <ChoicePill icon={Smartphone} options={model.aspects} value={aspect} onChange={setAspect} />
                  <ChoicePill icon={Clock} options={model.durations} value={duration} onChange={setDuration} format={(v) => `${v}s`} />
                  <ChoicePill icon={Gem} options={model.resolutions} value={resolution} onChange={setResolution} />
                  <span className="flex items-center gap-1 h-7 px-2 rounded-md text-[12px] text-muted-foreground/70">
                    <SlidersHorizontal className="size-3.5" />More
                  </span>
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

function FrameSlot({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <button
      disabled={!enabled}
      title={enabled ? label : `${label} not supported by this model`}
      className={`w-[88px] h-[88px] rounded-xl border border-border bg-background/40 flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors ${enabled ? "hover:bg-surface-hover" : "opacity-40 cursor-not-allowed"}`}
      type="button"
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>
      </svg>
      <span className="text-[10.5px] leading-tight text-center">{label}</span>
    </button>
  );
}
