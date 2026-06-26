import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Video, Zap, Mic2, Activity, ImageIcon, Cpu, Smartphone, Clock, Hash,
  SlidersHorizontal, Coins, Edit3, Loader2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CreateHub, Composer, OptionPill } from "@/components/create/CreateHub";
import { generateVideo, pollGeneration } from "@/lib/video.functions";
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
  const [aspect, setAspect] = useState<"9:16" | "16:9" | "1:1">("9:16");
  const [duration, setDuration] = useState<"5" | "10">("5");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const submit = useServerFn(generateVideo);
  const poll = useServerFn(pollGeneration);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
  }, []);

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
        // transient — keep polling
        if (attempts > 80) {
          setBusy(false); setJobId(null);
          toast.error(e instanceof Error ? e.message : "Polling failed", { id: toastId });
          return;
        }
      }
      if (attempts > 80) { // ~4 min cap
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
    const t = toast.loading("Queued — video takes ~1–2 minutes…");
    try {
      const r = await submit({ data: { prompt: prompt.trim(), aspect, duration } });
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
                  <FrameSlot label="Start frame" />
                  <FrameSlot label="End frame" />
                </div>
              }
              options={
                <>
                  <OptionPill icon={Cpu} label="Models" value={<span className="flex items-center gap-1"><span className="size-3 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500" />Seedance Lite</span>} />
                  <button onClick={() => setAspect(aspect === "9:16" ? "16:9" : aspect === "16:9" ? "1:1" : "9:16")} className="flex items-center gap-1 px-2 h-7 rounded-md hover:bg-surface-hover text-[12px] text-muted-foreground"><Smartphone className="size-3.5" />{aspect}</button>
                  <button onClick={() => setDuration(duration === "5" ? "10" : "5")} className="flex items-center gap-1 px-2 h-7 rounded-md hover:bg-surface-hover text-[12px] text-muted-foreground"><Clock className="size-3.5" />{duration}s</button>
                  <OptionPill icon={Hash} value="1" />
                  <OptionPill icon={SlidersHorizontal} value="More" />
                  <div className="ml-auto flex items-center gap-1.5 text-muted-foreground pr-1">
                    <Coins className="size-3.5 text-amber-400" />
                    <span className="text-[12px] font-medium tabular-nums">50</span>
                  </div>
                </>
              }
            />
            {(busy || result) && (
              <div className="mt-4 rounded-2xl border border-border/60 bg-surface/70 p-4 min-h-[200px] grid place-items-center">
                {busy && !result ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-brand" />
                    <p className="text-xs">Rendering video… {jobId ? "(polling)" : ""}</p>
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
      <span className="hidden"><Edit3 /><ImageIcon /></span>
    </AppShell>
  );
}

function FrameSlot({ label }: { label: string }) {
  return (
    <button className="w-[88px] h-[88px] rounded-xl border border-border bg-background/40 hover:bg-surface-hover flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors" type="button">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>
      </svg>
      <span className="text-[10.5px] leading-tight text-center">{label}</span>
    </button>
  );
}
