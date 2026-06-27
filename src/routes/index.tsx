import { createFileRoute, Link } from "@tanstack/react-router";
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
import { RecentGenerations } from "@/components/dashboard/RecentGenerations";
import { DashboardMotion } from "@/components/dashboard/DashboardMotion";


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
  { image: bannerEarn, tag: "New", tagClass: "bg-emerald-500/15 text-emerald-400", title: "Get paid to create — join a Betty Earn campaign", to: "/earn" },
  { image: bannerInfluencers, tag: "Tutorial", tagClass: "bg-sky-500/15 text-sky-400", title: "Learn how to create realistic AI UGC", to: "/explore" },
  { image: bannerTutorial, tag: "Tutorial", tagClass: "bg-sky-500/15 text-sky-400", title: "Learn to create consistent long-form videos", to: "/explore" },
];

const popularTools = [
  { icon: Sparkles, label: "Agent", tone: "violet" as const, to: "/create/agent" },
  { icon: ImageIcon, label: "Image", tone: "sky" as const, to: "/create/image" },
  { icon: Video, label: "Video", tone: "blue" as const, to: "/create/video" },
  { icon: Mic2, label: "Lipsync", tone: "cyan" as const, to: "/create/lipsync" },
  { icon: Activity, label: "Motion Sync", tone: "fuchsia" as const, to: "/create/motion" },
  { icon: AudioLines, label: "Audio", tone: "zinc" as const, to: "/create/audio" },
  { icon: ScanLine, label: "Extractor", tone: "zinc" as const, to: "/create/extract" },
  { icon: Maximize2, label: "Upscaler", tone: "amber" as const, to: "/create/upscale" },
  { icon: Scissors, label: "BG Remover", tone: "emerald" as const, to: "/create/bg-remove" },
];

const videoTools = [
  { image: toolSeedance, tag: "Video", title: "Seedance 2.0 Omni-Video", description: "Generate videos with multi-modal input, lip sync, and multi-shot narrative.", to: "/create/video" },
  { image: bannerTutorial, tag: "Video", title: "Studio Lip-Syncing", description: "Create satire clips, avatar videos, or a personal clone with our lip-syncing technology.", hasExamples: true, to: "/create/lipsync", examplesTo: "/explore" },
  { image: toolMotion, tag: "Video", title: "Motion Control", description: "Generate videos with precise motion guidance using reference videos and characters.", to: "/create/motion" },
  { image: toolAvatar, tag: "Video", title: "Talking Avatar", description: "Image and audio to video creation. Turn any image into a talking avatar with lip-sync.", to: "/create/avatar" },
  { image: toolVideogen, tag: "Video", title: "Video Generation", description: "Create viral content, advertisements, and more with our AI-powered video generator.", hasExamples: true, to: "/create/video", examplesTo: "/explore" },
];

const imageTools = [
  { image: toolImagegen, tag: "Image", title: "Pro Image Editor", description: "Advanced AI-powered image editing tools for professional results.", to: "/create/image" },
  { image: toolProduct, tag: "Image", title: "Stunning Product Shots", description: "Generate a batch of professional images of your product with AI in minutes.", to: "/create/image" },
  { image: toolHeadshot, tag: "Image", title: "Professional Headshots", description: "Generate polished, professional headshots perfect for LinkedIn and resumes.", to: "/create/image" },
  { image: toolAvatar, tag: "Image", title: "AI Photo Packs", description: "Choose from a variety of photo packs to generate a set of photos tailored to your needs.", to: "/create/image" },
  { image: toolImagegen, tag: "Image", title: "Pro Image Generation", description: "Create realistic UGC content and product visuals for your social media.", hasExamples: true, to: "/create/image", examplesTo: "/explore" },
];

const creatorExamples = [
  toolSeedance, toolMotion, toolAvatar, toolVideogen, toolProduct,
  toolHeadshot, toolImagegen, bannerInfluencers, bannerTutorial, toolSeedance,
  toolMotion, toolAvatar,
];

function Dashboard() {
  return (
    <AppShell>
      <DashboardMotion><div className="pt-6 pb-14 space-y-14">


        {/* Banner carousel — peeks next slide */}
        <section>
          <div className="flex gap-5 overflow-x-auto scrollbar-hide pl-6 lg:pl-8 pr-6 lg:pr-8 pb-1">
            {banners.map((b) => (
              <Link key={b.title} to={b.to} className="group shrink-0 w-[min(760px,calc(100vw-260px))]">
                <div className="relative aspect-[16/6] rounded-2xl overflow-hidden">
                  <img src={b.image} alt={b.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
                </div>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-semibold uppercase tracking-wide ${b.tagClass}`}>{b.tag}</span>
                  <h3 className="text-[14px] font-medium text-foreground/90 group-hover:text-foreground">{b.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="px-6 lg:px-8 space-y-14">
          <RecentGenerations />

          <section>
            <SectionHeader icon={Bookmark} title="Popular Tools" showArrows={false} />
            <div className="flex flex-wrap gap-x-3 gap-y-3">
              {popularTools.map((t) => <ToolPill key={t.label} {...t} />)}
            </div>
          </section>

          <section>
            <SectionHeader icon={Film} title="Video Tools" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-7">
              {videoTools.map((t) => <MediaCard key={t.title} {...t} />)}
            </div>
          </section>

          <section>
            <SectionHeader icon={Brush} title="Image Tools" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-7">
              {imageTools.map((t) => <MediaCard key={t.title} {...t} />)}
            </div>
          </section>


          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <Wand2 className="size-[18px] text-muted-foreground" />
                <h2 className="text-[17px] font-semibold tracking-tight">Creator Examples</h2>
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

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
              {creatorExamples.map((img, i) => {
                const handles = ["mira", "kenji", "luna", "atlas", "nova", "rio"];
                const handle = handles[i % handles.length];
                const likes = 240 + ((i * 137) % 1800);
                const remixes = 12 + ((i * 47) % 320);
                return (
                  <div key={i} className="group cursor-pointer">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-surface">
                      <img src={img} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90" />
                      <div className="absolute top-2 left-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 backdrop-blur text-white/90">
                          {i % 3 === 0 ? "Seedance" : i % 3 === 1 ? "Kling" : "Agent"}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between gap-2">
                        <Link
                          to="/u/$handle"
                          params={{ handle }}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 px-1.5 h-6 rounded-md bg-black/55 backdrop-blur-sm text-[11px] font-medium text-white/90 hover:text-white"
                        >
                          <span className="size-4 rounded-full bg-gradient-to-br from-sky-400 to-indigo-500 grid place-items-center text-[8px] font-bold uppercase">{handle[0]}</span>
                          @{handle}
                        </Link>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[10.5px] font-medium text-white/90">
                          <span className="inline-flex items-center gap-0.5 px-1.5 h-6 rounded-md bg-black/55 backdrop-blur-sm">♥ {likes >= 1000 ? `${(likes / 1000).toFixed(1)}k` : likes}</span>
                          <span className="inline-flex items-center gap-0.5 px-1.5 h-6 rounded-md bg-black/55 backdrop-blur-sm">⟲ {remixes}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <button className="flex-1 h-7 rounded-md bg-surface hover:bg-surface-hover text-[11px] font-medium">Recreate</button>
                      <button className="flex-1 h-7 rounded-md bg-surface hover:bg-surface-hover text-[11px] font-medium text-muted-foreground">Reuse Inputs</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div></DashboardMotion>
    </AppShell>
  );
}
