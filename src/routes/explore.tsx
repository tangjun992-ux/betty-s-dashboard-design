import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Wand2 } from "lucide-react";

import toolSeedance from "@/assets/tool-seedance.jpg";
import toolMotion from "@/assets/tool-motion.jpg";
import toolAvatar from "@/assets/tool-avatar.jpg";
import toolVideogen from "@/assets/tool-videogen.jpg";
import toolProduct from "@/assets/tool-product.jpg";
import toolHeadshot from "@/assets/tool-headshot.jpg";
import toolImagegen from "@/assets/tool-imagegen.jpg";
import bannerInfluencers from "@/assets/banner-influencers.jpg";
import bannerTutorial from "@/assets/banner-tutorial.jpg";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [{ title: "Explore — Betty" }] }),
  component: ExplorePage,
});

const images = [
  toolSeedance, toolMotion, toolAvatar, toolVideogen, toolProduct, toolHeadshot,
  toolImagegen, bannerInfluencers, bannerTutorial, toolSeedance, toolMotion,
  toolAvatar, toolProduct, toolImagegen, toolHeadshot, toolVideogen, toolMotion, toolSeedance,
];

const filters = ["All", "Videos", "Images", "Lipsync", "Motion", "Avatar", "Audio"];
const models = ["All Models", "Seedance 2.0", "Kling 3.0", "Veo 3.1", "Sora 2", "Hailuo", "GPT Image 2"];

function ExplorePage() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-6 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Wand2 className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Explore</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex p-0.5 rounded-lg bg-surface border border-border text-[13px]">
            {filters.map((t, i) => (
              <button key={t} className={`px-3 h-8 rounded-md transition-colors ${i === 0 ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
          <select className="h-8 px-3 rounded-md bg-surface border border-border text-[13px]">
            {models.map((m) => <option key={m}>{m}</option>)}
          </select>
          <select className="h-8 px-3 rounded-md bg-surface border border-border text-[13px]">
            <option>Trending</option><option>Newest</option><option>Most Liked</option>
          </select>
        </div>

        <div className="columns-2 sm:columns-3 md:columns-4 lg:columns-5 xl:columns-6 gap-3 space-y-3">
          {images.map((img, i) => (
            <div key={i} className="break-inside-avoid group cursor-pointer">
              <div className="relative rounded-xl overflow-hidden border border-border/60 bg-surface">
                <img src={img} alt="" loading="lazy" className="w-full transition-transform duration-500 group-hover:scale-105" style={{ aspectRatio: i % 3 === 0 ? "3/4" : i % 3 === 1 ? "4/5" : "1/1" }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-2 left-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex-1 h-7 rounded-md bg-white/10 backdrop-blur border border-white/20 text-[11px] font-medium text-white">Recreate</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
