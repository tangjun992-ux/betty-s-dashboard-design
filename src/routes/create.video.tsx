import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Video, Zap, Mic2, Activity, ImageIcon, Cpu, Smartphone, Clock, Hash,
  SlidersHorizontal, Coins, Edit3,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CreateHub, Composer, OptionPill } from "@/components/create/CreateHub";
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
  const [prompt, setPrompt] = useState("");

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
          <Composer
            placeholder="Prompt a video or add references"
            value={prompt}
            onChange={setPrompt}
            leading={
              <div className="flex gap-2">
                <FrameSlot label="Start frame" />
                <FrameSlot label="End frame" />
              </div>
            }
            options={
              <>
                <OptionPill icon={Cpu} label="Models" value={<span className="flex items-center gap-1"><span className="size-3 rounded-full bg-gradient-to-br from-rose-400 to-fuchsia-500" />Grok Imagine</span>} />
                <OptionPill icon={Smartphone} value="9:16" />
                <OptionPill icon={Clock} value="15s" />
                <OptionPill icon={Hash} value="1" />
                <OptionPill icon={SlidersHorizontal} value="More" />
                <div className="ml-auto flex items-center gap-1.5 text-muted-foreground pr-1">
                  <Coins className="size-3.5 text-amber-400" />
                  <span className="text-[12px] font-medium tabular-nums">135</span>
                </div>
              </>
            }
          />
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
