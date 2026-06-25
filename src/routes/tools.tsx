import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Sparkles, Image as ImageIcon, Video, Mic2, Activity, AudioLines, ScanLine, Maximize2, Wrench } from "lucide-react";

export const Route = createFileRoute("/tools")({
  head: () => ({ meta: [{ title: "All Tools — Betty" }] }),
  component: ToolsPage,
});

const tools = [
  { to: "/create/agent", icon: Sparkles, label: "Agent", desc: "Plan, brainstorm and orchestrate any creative task.", gradient: "from-violet-500 to-indigo-600" },
  { to: "/create/image", icon: ImageIcon, label: "Image", desc: "Generate stunning images from a single prompt.", gradient: "from-sky-500 to-blue-600" },
  { to: "/create/video", icon: Video, label: "Video", desc: "Text-to-video with multiple model engines.", gradient: "from-blue-500 to-indigo-600" },
  { to: "/create/lipsync", icon: Mic2, label: "Lipsync", desc: "Studio-grade lipsync for any face & audio.", gradient: "from-cyan-500 to-sky-600" },
  { to: "/create/motion", icon: Activity, label: "Motion Control", desc: "Precise motion guidance with reference video.", gradient: "from-fuchsia-500 to-pink-600" },
  { to: "/create/avatar", icon: ImageIcon, label: "Talking Avatar", desc: "Turn any portrait into a talking avatar.", gradient: "from-rose-500 to-pink-600" },
  { to: "/create/audio", icon: AudioLines, label: "Audio", desc: "Text to speech with cinematic voices.", gradient: "from-zinc-400 to-zinc-600" },
  { to: "/create/upscale", icon: Maximize2, label: "Upscaler", desc: "Upscale images & video to 4K.", gradient: "from-amber-500 to-orange-600" },
  { to: "/create/extract", icon: ScanLine, label: "Extractor", desc: "Extract subjects, frames, transcripts.", gradient: "from-zinc-500 to-zinc-700" },
];

function ToolsPage() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-6 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Wrench className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">All Tools</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((t) => (
            <Link key={t.to} to={t.to} className="group rounded-xl border border-border bg-surface hover:bg-surface-hover p-5 flex gap-4 transition-colors">
              <span className={`size-12 rounded-xl bg-gradient-to-br ${t.gradient} grid place-items-center shrink-0`}>
                <t.icon className="size-5 text-white" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold">{t.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t.desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
