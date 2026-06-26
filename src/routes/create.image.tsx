import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Image as ImageIcon, Zap, LayoutPanelTop, Box, Coins, ImagePlus, Loader2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CreateHub, Composer } from "@/components/create/CreateHub";
import { ImageModelPicker } from "@/components/create/ImageModelPicker";
import { ImageResolutionPopover, ImageBatchPopover } from "@/components/create/ImageOptionPopovers";
import { AspectPopover, MorePopover, type AdvancedOptions } from "@/components/create/VideoOptionPopovers";
import { generateImage } from "@/lib/generations.functions";
import { IMAGE_MODELS, type Aspect, type ImageQuality } from "@/lib/model-registry";
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
  const gen = useServerFn(generateImage);

  useEffect(() => {
    if (!model.aspects.includes(aspect)) setAspect(model.aspects.includes("9:16") ? "9:16" : model.aspects[0]);
    if (!model.qualities.includes(quality)) {
      setQuality(model.qualities.includes("2K") ? "2K" : model.qualities[model.qualities.length - 1]);
    }
    if (batch > model.maxBatch) setBatch(model.maxBatch);
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCost = useMemo(() => model.cost * batch, [model, batch]);

  async function onSubmit() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!prompt.trim() || busy) return;
    setBusy(true); setResult(null);
    const t = toast.loading(`Generating with ${model.label}…`);
    try {
      const res = await gen({ data: { prompt: prompt.trim(), model: model.id, aspect, quality, batch } });
      setResult(res.url);
      if (advanced.clearOnSubmit) setPrompt("");
      toast.success("Image ready", { id: t });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed", { id: t });
    } finally { setBusy(false); }
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
            {(busy || result) && (
              <div className="mt-4 rounded-2xl border border-border/60 bg-surface/70 p-4 min-h-[200px] grid place-items-center">
                {busy && !result ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-brand" />
                    <p className="text-xs">Painting pixels with {model.label}…</p>
                  </div>
                ) : result ? (
                  <img src={result} alt={prompt} className="max-h-[480px] rounded-xl" />
                ) : null}
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
