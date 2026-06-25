import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Mic2,
  Activity,
  AudioLines,
  ScanLine,
  Maximize2,
  Bookmark,
  Film,
  Brush,
  Wand2,
} from "lucide-react";

import { AppShell } from "@/components/AppShell";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ToolPill } from "@/components/dashboard/ToolPill";
import { MediaCard } from "@/components/dashboard/MediaCard";

import bannerEarn from "@/assets/banner-earn.jpg";
import bannerInfluencers from "@/assets/banner-influencers.jpg";
import bannerTutorial from "@/assets/banner-tutorial.jpg";
import toolSeedance from "@/assets/tool-seedance.jpg";
import toolMotion from "@/assets/tool-motion.jpg";
import toolAvatar from "@/assets/tool-avatar.jpg";
import toolVideogen from "@/assets/tool-videogen.jpg";
import toolProduct from "@/assets/tool-product.jpg";
import toolHeadshot from "@/assets/tool-headshot.jpg";
import toolImagegen from "@/assets/tool-imagegen.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Betty — Create AI videos, images & avatars" },
      {
        name: "description",
        content:
          "Betty is your AI creative studio. Generate videos, images, lipsync, motion control and more — all in one place.",
      },
    ],
  }),
  component: Dashboard,
});

const banners = [
  { image: bannerEarn, tag: "New", tagClass: "bg-emerald-500/15 text-emerald-400", title: "Get paid to create — join a Betty Earn campaign" },
  { image: bannerInfluencers, tag: "Tutorial", tagClass: "bg-sky-500/15 text-sky-400", title: "Learn how to create realistic AI UGC" },
  { image: bannerTutorial, tag: "Tutorial", tagClass: "bg-sky-500/15 text-sky-400", title: "Learn to create consistent long-form videos" },
];

const popularTools = [
  { icon: Sparkles, label: "Agent", gradient: "from-violet-500 to-indigo-600" },
  { icon: ImageIcon, label: "Image", gradient: "from-sky-500 to-blue-600" },
  { icon: Video, label: "Video", gradient: "from-blue-500 to-indigo-600" },
  { icon: Mic2, label: "Lipsync", gradient: "from-cyan-500 to-sky-600" },
  { icon: Activity, label: "Motion Sync", gradient: "from-fuchsia-500 to-pink-600" },
  { icon: AudioLines, label: "Audio", gradient: "from-zinc-400 to-zinc-600" },
  { icon: ScanLine, label: "Extractor", gradient: "from-zinc-500 to-zinc-700" },
  { icon: Maximize2, label: "Upscaler", gradient: "from-amber-500 to-orange-600" },
];

const videoTools = [
  { image: toolSeedance, tag: "Video", title: "Seedance 2.0 Omni-Video", description: "Generate videos with multi-modal input, lip sync, and multi-shot narrative." },
  { image: bannerTutorial, tag: "Video", title: "Studio Lip-Syncing", description: "Create satire clips, avatar videos, or a personal clone with our lip-syncing technology.", hasExamples: true },
  { image: toolMotion, tag: "Video", title: "Motion Control", description: "Generate videos with precise motion guidance using reference videos and characters." },
  { image: toolAvatar, tag: "Video", title: "Talking Avatar", description: "Image and audio to video creation. Turn any image into a talking avatar with lip-sync." },
  { image: toolVideogen, tag: "Video", title: "Video Generation", description: "Create viral content, advertisements, and more with our AI-powered video generator.", hasExamples: true },
];

const imageTools = [
  { image: toolImagegen, tag: "Image", title: "Pro Image Editor", description: "Advanced AI-powered image editing tools for professional results." },
  { image: toolProduct, tag: "Image", title: "Stunning Product Shots", description: "Generate a batch of professional images of your product with AI in minutes." },
  { image: toolHeadshot, tag: "Image", title: "Professional Headshots", description: "Generate polished, professional headshots perfect for LinkedIn and resumes." },
  { image: toolAvatar, tag: "Image", title: "AI Photo Packs", description: "Choose from a variety of photo packs to generate a set of photos tailored to your needs." },
  { image: toolImagegen, tag: "Image", title: "Pro Image Generation", description: "Create realistic UGC content and product visuals for your social media.", hasExamples: true },
];

const creatorExamples = [
  toolSeedance, toolMotion, toolAvatar, toolVideogen, toolProduct,
  toolHeadshot, toolImagegen, bannerInfluencers, bannerTutorial, toolSeedance,
  toolMotion, toolAvatar,
];

function Dashboard() {
  return (
    <AppShell>
      <div className="pt-4 pb-12 space-y-10">
        {/* Banner carousel — flush to top, peeks next slide */}
        <section>
          <div className="flex gap-5 overflow-x-auto scrollbar-hide pl-6 lg:pl-8 pr-6 lg:pr-8 pb-1">
            {banners.map((b) => (
              <a key={b.title} href="#" className="group shrink-0 w-[min(760px,calc(100vw-260px))]">
                <div className="relative aspect-[16/6] rounded-2xl overflow-hidden">
                  <img src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                </div>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold uppercase tracking-wide ${b.tagClass}`}>{b.tag}</span>
                  <h3 className="text-[14px] font-medium text-foreground/90 group-hover:text-foreground">{b.title}</h3>
                </div>
              </a>
            ))}
          </div>
        </section>

        <div className="px-6 lg:px-8 space-y-10">
          <section>
            <SectionHeader icon={Bookmark} title="Popular Tools" />
            <div className="flex flex-wrap gap-x-10 gap-y-4">
              {popularTools.map((t) => <ToolPill key={t.label} {...t} />)}
            </div>
          </section>

          <section>
            <SectionHeader icon={Film} title="Video Tools" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {videoTools.map((t) => <MediaCard key={t.title} {...t} />)}
            </div>
          </section>

          <section>
            <SectionHeader icon={Brush} title="Image Tools" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              {imageTools.map((t) => <MediaCard key={t.title} {...t} />)}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Wand2 className="size-4 text-muted-foreground" />
                <h2 className="text-[15px] font-semibold">Creator Examples</h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex p-0.5 rounded-lg bg-surface text-[13px]">
                  {["All", "Videos", "Images"].map((t, i) => (
                    <button key={t} className={`px-3 h-7 rounded-md transition-colors ${i === 0 ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground"}`}>{t}</button>
                  ))}
                </div>
                <button className="h-8 px-3 rounded-md bg-surface text-[13px] text-muted-foreground hover:text-foreground">All Filters</button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {creatorExamples.map((img, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface">
                    <img src={img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
                    <div className="absolute top-2 left-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 backdrop-blur text-white/90">
                        {i % 3 === 0 ? "Seedance" : i % 3 === 1 ? "Kling" : "Agent"}
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 text-[11px] font-medium text-white/85">
                      {i % 4 === 0 ? "1:00" : `0:${8 + (i % 3) * 5}`}
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    <button className="flex-1 h-7 rounded-md bg-surface hover:bg-surface-hover text-[11px] font-medium">Recreate</button>
                    <button className="flex-1 h-7 rounded-md bg-surface hover:bg-surface-hover text-[11px] font-medium text-muted-foreground">Reuse Inputs</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
