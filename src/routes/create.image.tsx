import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image as ImageIcon, Zap, LayoutPanelTop, Box, Coins, ImagePlus, Loader2,
  CheckCircle2, XCircle, Clock, Square,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CreateHub, Composer } from "@/components/create/CreateHub";
import { ImageModelPicker } from "@/components/create/ImageModelPicker";
import { ImageResolutionPopover, ImageBatchPopover } from "@/components/create/ImageOptionPopovers";
import { AspectPopover, MorePopover, type AdvancedOptions } from "@/components/create/VideoOptionPopovers";
import { generateImage } from "@/lib/generations.functions";
import { IMAGE_MODELS, type Aspect, type ImageQuality, type ImageModel } from "@/lib/model-registry";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/use-session";
import toolHeadshot from "@/assets/tool-headshot.jpg";
import toolSeedance from "@/assets/tool-seedance.jpg";
import toolProduct from "@/assets/tool-product.jpg";
import toolAvatar from "@/assets/tool-avatar.jpg";
import bannerInfluencers from "@/assets/banner-influencers.jpg";

export const Route = createFileRoute("/create/image")({
  head: () => ({ meta: [{ title: "Image — Betty" }] }),
  component: ImagePage,
});

const DEFAULT_MODEL = IMAGE_MODELS.find((m) => m.key === "gpt-image-2") ?? IMAGE_MODELS[0];

function ImagePage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState(DEFAULT_MODEL);
  const [aspect, setAspect] = useState<Aspect>(model.aspects.includes("9:16") ? "9:16" : model.aspects[0]);
  const [quality, setQuality] = useState<ImageQuality>(
    model.qualities.includes("2K") ? "2K" : model.qualities[model.qualities.length - 1],
  );
  const [batch, setBatch] = useState(1);
  const [advanced, setAdvanced] = useState<AdvancedOptions>({
    clearOnSubmit: true, fallbackModels: true, autoRetries: true,
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  type Phase = "idle" | "queued" | "running" | "finalizing" | "completed" | "failed" | "cancelled";
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const gen = useServerFn(generateImage);
  const [lastParams, setLastParams] = useState<{
    prompt: string;
    model: typeof DEFAULT_MODEL;
    aspect: Aspect;
    quality: ImageQuality;
    batch: number;
  } | null>(null);
  const [retryOpen, setRetryOpen] = useState(false);
  const [retryDraft, setRetryDraft] = useState<{
    prompt: string; model: ImageModel; aspect: Aspect; quality: ImageQuality; batch: number;
  } | null>(null);

  function openRetryDialog() {
    const base = lastParams ?? { prompt, model, aspect, quality, batch };
    setRetryDraft({
      prompt: base.prompt,
      model: base.model,
      aspect: base.aspect,
      quality: base.quality,
      batch: base.batch,
    });
    setRetryOpen(true);
  }

  function submitRetry() {
    if (!retryDraft) return;
    const d = retryDraft;
    // Sync UI controls to chosen params
    setPrompt(d.prompt);
    setModel(d.model);
    setAspect(d.aspect);
    setQuality(d.quality);
    setBatch(d.batch);
    setRetryOpen(false);
    onSubmit(d);
  }

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    abortRef.current?.abort();
  }, []);

  function startProgress() {
    setPhase("queued"); setProgress(4); setElapsed(0); setErrMsg(null);
    const startedAt = Date.now();
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      const secs = (Date.now() - startedAt) / 1000;
      setElapsed(secs);
      setPhase((p) => (p === "queued" && secs > 1.2 ? "running" : p));
      setProgress((prev) => {
        const target = 92;
        const next = prev + Math.max(0.3, (target - prev) * 0.045);
        return Math.min(next, target);
      });
    }, 180);
  }
  function endProgress(result: "ok" | "fail" | "cancel", message?: string) {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    if (result === "ok") {
      setPhase("finalizing"); setProgress(97);
      setTimeout(() => { setPhase("completed"); setProgress(100); }, 280);
    } else if (result === "cancel") {
      setPhase("cancelled"); setErrMsg(message ?? "Cancelled by you");
    } else {
      setPhase("failed"); setErrMsg(message ?? "Generation failed");
    }
  }

  function onCancel() {
    if (!busy) return;
    abortRef.current?.abort();
    endProgress("cancel");
    toast.message("Generation cancelled");
  }

  useEffect(() => {
    if (!model.aspects.includes(aspect)) setAspect(model.aspects.includes("9:16") ? "9:16" : model.aspects[0]);
    if (!model.qualities.includes(quality)) {
      setQuality(model.qualities.includes("2K") ? "2K" : model.qualities[model.qualities.length - 1]);
    }
    if (batch > model.maxBatch) setBatch(model.maxBatch);
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCost = useMemo(() => model.cost * batch, [model, batch]);

  async function onSubmit(paramsToUse?: typeof lastParams | React.FormEvent | React.MouseEvent) {
    if (!user) { navigate({ to: "/auth" }); return; }
    
    // Check if paramsToUse is an event
    const isEvent = paramsToUse && (typeof paramsToUse === "object" && ("preventDefault" in paramsToUse || "target" in paramsToUse));
    const actualParams = isEvent ? undefined : paramsToUse;

    const activePrompt = actualParams ? actualParams.prompt : prompt;
    const activeModel = actualParams ? actualParams.model : model;
    const activeAspect = actualParams ? actualParams.aspect : aspect;
    const activeQuality = actualParams ? actualParams.quality : quality;
    const activeBatch = actualParams ? actualParams.batch : batch;

    if (!activePrompt.trim() || busy) return;
    setBusy(true); setResult(null);
    
    // Save these parameters as the last used parameters
    setLastParams({
      prompt: activePrompt,
      model: activeModel,
      aspect: activeAspect,
      quality: activeQuality,
      batch: activeBatch
    });

    startProgress();
    const controller = new AbortController();
    abortRef.current = controller;
    const t = toast.loading(`Queued · ${activeModel.label}`);
    try {
      toast.loading(`Generating with ${activeModel.label}…`, { id: t });
      const res = await gen({
        data: { prompt: activePrompt.trim(), model: activeModel.id, aspect: activeAspect, quality: activeQuality, batch: activeBatch },
        signal: controller.signal,
      });
      if (controller.signal.aborted) { toast.dismiss(t); return; }
      setResult(res.url);
      endProgress("ok");
      if (advanced.clearOnSubmit && !actualParams) setPrompt("");
      toast.success("Image ready", { id: t });
    } catch (err) {
      if (controller.signal.aborted) {
        toast.message("Generation cancelled", { id: t });
      } else {
        const msg = err instanceof Error ? err.message : "Generation failed";
        endProgress("fail", msg);
        toast.error(msg, { id: t });
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setBusy(false);
    }
  }



  return (
    <AppShell>
      <CreateHub
        title="Create • Edit • Combine Pro Images"
        chips={[
          { label: "Image Ideas", icon: Zap },
          { label: "Image Editor", icon: LayoutPanelTop, badge: "App" },
          { label: "Product Shots", icon: Box, badge: "App" },
        ]}
        composer={
          <>
            <Composer
              placeholder="Prompt or add images to edit"
              value={prompt}
              onChange={setPrompt}
              onSubmit={onSubmit}
              busy={busy}
              disabled={loading}
              leading={
                <button className="size-9 grid place-items-center rounded-md border border-dashed border-border/70 text-muted-foreground hover:bg-surface-hover" aria-label="Add image">
                  <ImagePlus className="size-4" />
                </button>
              }
              options={
                <>
                  <ImageModelPicker value={model} onChange={setModel} />
                  <span className="text-muted-foreground/30">·</span>
                  <AspectPopover options={model.aspects} value={aspect} onChange={setAspect} />
                  <ImageResolutionPopover options={model.qualities} value={quality} onChange={setQuality} />
                  <ImageBatchPopover max={model.maxBatch} value={batch} onChange={setBatch} />
                  <MorePopover value={advanced} onChange={setAdvanced} />
                  <div className="ml-auto flex items-center gap-1.5 text-foreground pr-1">
                    <Coins className="size-3.5 text-amber-400" />
                    <span className="text-[12px] font-medium tabular-nums">{totalCost}</span>
                  </div>
                </>
              }
            />
            {(phase !== "idle" || result) && (
              <div className="mt-4 rounded-2xl border border-border/60 bg-surface/70 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 text-xs">
                    {phase === "queued" && <><Clock className="size-3.5 text-muted-foreground" /><span className="text-muted-foreground">Queued · waiting for {model.label}</span></>}
                    {phase === "running" && <><Loader2 className="size-3.5 animate-spin text-brand" /><span>Running · {model.label}</span></>}
                    {phase === "finalizing" && <><Loader2 className="size-3.5 animate-spin text-brand" /><span>Finalizing & saving…</span></>}
                    {phase === "completed" && <><CheckCircle2 className="size-3.5 text-emerald-400" /><span className="text-emerald-300">Completed</span></>}
                    {phase === "failed" && <><XCircle className="size-3.5 text-red-400" /><span className="text-red-300">{errMsg}</span></>}
                    {phase === "cancelled" && <><XCircle className="size-3.5 text-amber-400" /><span className="text-amber-300">Cancelled</span></>}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground tabular-nums">
                    <span>{elapsed.toFixed(1)}s</span>
                    <span>{Math.round(progress)}%</span>
                    {busy && (
                      <button
                        onClick={onCancel}
                        className="ml-1 inline-flex items-center gap-1 rounded-md border border-border/60 bg-surface px-2 py-1 text-[11px] text-foreground hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300 transition-colors"
                        aria-label="Cancel generation"
                      >
                        <Square className="size-3 fill-current" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                  <div
                    className={`h-full rounded-full transition-[width] duration-200 ease-out ${
                      phase === "failed" ? "bg-red-500"
                      : phase === "cancelled" ? "bg-amber-500"
                      : phase === "completed" ? "bg-emerald-500"
                      : "bg-gradient-to-r from-brand to-pink-500"
                    } ${phase === "queued" || phase === "running" ? "animate-pulse" : ""}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-4 min-h-[180px] grid place-items-center">
                  {result ? (
                    <img src={result} alt={prompt} className="max-h-[480px] rounded-xl" />
                  ) : phase === "failed" || phase === "cancelled" ? (
                    <div className="flex items-center gap-2">
                      <button onClick={openRetryDialog} className="text-xs px-3 py-1.5 rounded-md border border-border/60 hover:bg-surface-hover">
                        Retry…
                      </button>
                      {phase === "cancelled" && lastParams && (
                        <button onClick={() => onSubmit(lastParams)} className="text-xs px-3 py-1.5 rounded-md bg-brand text-white hover:opacity-90">
                          Retry with same settings
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-6 animate-spin text-brand" />
                      <p className="text-xs">Painting pixels with {model.label}…</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </>
        }
        appsTitle="Image Apps"
        appsIcon={ImageIcon}
        apps={[
          { image: toolHeadshot, title: "Pro Headshots", tag: "App" },
          { image: toolSeedance, title: "Tokyo Street Style", tag: "App" },
          { image: toolProduct, title: "Coffee Mug Mock", tag: "App" },
          { image: toolAvatar, title: "Smiling Portrait", tag: "App" },
          { image: bannerInfluencers, title: "Party Influencers", tag: "App" },
        ]}
      />
    </AppShell>
  );
}
