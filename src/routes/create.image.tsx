import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Image as ImageIcon, Zap, LayoutPanelTop, Box, Cpu, Smartphone,
  Gem, Hash, SlidersHorizontal, Coins, ImagePlus, Edit3, Loader2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CreateHub, Composer, OptionPill } from "@/components/create/CreateHub";
import { generateImage } from "@/lib/generations.functions";
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

function ImagePage() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const gen = useServerFn(generateImage);

  async function onSubmit() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!prompt.trim() || busy) return;
    setBusy(true); setResult(null);
    const t = toast.loading("Generating image…");
    try {
      const res = await gen({ data: { prompt: prompt.trim(), model: "google/gemini-2.5-flash-image", aspect: "9:16" } });
      setResult(res.url);
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
                  <OptionPill icon={Cpu} label="Models" value={<span className="flex items-center gap-1"><span className="size-3 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500" />GPT Image 2</span>} />
                  <OptionPill icon={Smartphone} value="9:16" />
                  <OptionPill icon={Gem} value="2K" />
                  <OptionPill icon={Hash} value="1" />
                  <OptionPill icon={SlidersHorizontal} value="More" />
                  <div className="ml-auto flex items-center gap-1.5 text-muted-foreground pr-1">
                    <Coins className="size-3.5 text-amber-400" />
                    <span className="text-[12px] font-medium tabular-nums">10</span>
                  </div>
                </>
              }
            />
            {(busy || result) && (
              <div className="mt-4 rounded-2xl border border-border/60 bg-surface/70 p-4 min-h-[200px] grid place-items-center">
                {busy && !result ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Loader2 className="size-6 animate-spin text-brand" />
                    <p className="text-xs">Painting pixels…</p>
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
      <span className="hidden"><Edit3 /></span>
    </AppShell>
  );
}
