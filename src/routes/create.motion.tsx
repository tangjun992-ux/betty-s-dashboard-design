import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Activity, Film, Image as ImageIcon, ChevronDown, ChevronRight,
  History, BookOpen, Info, Sparkles, Upload, X,
} from "lucide-react";

export const Route = createFileRoute("/create/motion")({
  head: () => ({ meta: [{ title: "Motion Control — Betty" }] }),
  component: MotionCreate,
});

type Tab = "history" | "examples" | "about";

function MotionCreate() {
  const [tab, setTab] = useState<Tab>("about");
  const [video, setVideo] = useState<File | null>(null);
  const [character, setCharacter] = useState<{ file: File; url: string } | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [orientation, setOrientation] = useState("Video");
  const [mode, setMode] = useState("Standard");
  const [prompt, setPrompt] = useState("");
  const videoRef = useRef<HTMLInputElement>(null);
  const charRef = useRef<HTMLInputElement>(null);

  const canGenerate = !!video && !!character;

  return (
    <AppShell>
      <div className="relative h-[calc(100vh-0px)] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4">
          <div>
            <h1 className="flex items-center gap-2 text-[18px] font-semibold tracking-tight">
              <Activity className="size-4 text-brand" />
              Motion Control
            </h1>
            <p className="text-[12.5px] text-muted-foreground mt-0.5">Generate videos with motion guidance</p>
          </div>
          <TabSwitcher tab={tab} onChange={setTab} />
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-[380px_1fr] gap-0 overflow-hidden px-6 pb-24">
          {/* Left panel */}
          <div className="overflow-y-auto pr-4 space-y-3 scrollbar-thin">
            <UploadTile
              icon={<Film className="size-5" />}
              title="Motion Video"
              subtitle="Used as motion reference (3-30s)"
              filled={!!video}
              fileName={video?.name}
              onPick={() => videoRef.current?.click()}
              onClear={() => setVideo(null)}
            />
            <input ref={videoRef} type="file" accept="video/*" className="hidden"
              onChange={(e) => e.target.files?.[0] && setVideo(e.target.files[0])} />

            <UploadTile
              icon={<ImageIcon className="size-5" />}
              title="Character Image"
              subtitle="Character image to replace the motion"
              filled={!!character}
              previewUrl={character?.url}
              onPick={() => charRef.current?.click()}
              onClear={() => character && (URL.revokeObjectURL(character.url), setCharacter(null))}
            />
            <input ref={charRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setCharacter({ file: f, url: URL.createObjectURL(f) });
              }} />

            {/* Advanced Settings */}
            <div className="pt-3">
              <button
                onClick={() => setAdvancedOpen((v) => !v)}
                className="w-full flex items-center justify-between text-[13.5px] font-semibold py-1.5"
              >
                <span>Advanced Settings</span>
                <ChevronDown className={`size-4 transition-transform ${advancedOpen ? "" : "-rotate-90"}`} />
              </button>
              {advancedOpen && (
                <div className="mt-2 space-y-2">
                  <SelectRow label="Orientation" value={orientation} options={["Video", "Portrait", "Landscape", "Square"]} onChange={setOrientation} />
                  <SelectRow label="Mode" value={mode} options={["Standard", "Pro"]} onChange={setMode} />
                  <div className="rounded-xl border border-white/8 bg-surface/60 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-semibold">Guiding Prompt</span>
                      <span className="text-[10.5px] text-brand font-medium">Optional</span>
                    </div>
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe the background details or leave blank to use the image's background. Motion is controlled by the source video."
                      className="mt-2 w-full min-h-[96px] bg-transparent text-[12.5px] text-foreground/90 placeholder:text-muted-foreground/70 resize-none focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right preview */}
          <div className="overflow-y-auto">
            {tab === "about" && <AboutPanel />}
            {tab === "history" && <EmptyPanel icon={<History className="size-6" />} title="No history yet" desc="Your motion control runs will appear here." />}
            {tab === "examples" && <ExamplesPanel />}
          </div>
        </div>

        {/* Floating Generate Bar */}
        <div className="absolute bottom-6 left-6 right-6 lg:left-[calc(380px+24px+24px)] lg:right-[calc(50%-340px)] pointer-events-none">
          <div className="pointer-events-auto max-w-[640px] mx-auto">
            <button
              disabled={!canGenerate}
              className="w-full h-12 rounded-2xl bg-[image:var(--gradient-brand)] text-brand-foreground text-[14px] font-semibold shadow-[var(--shadow-glow)] hover:opacity-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="size-4" /> Generate Video
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TabSwitcher({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "history",  label: "History",  icon: <History className="size-3.5" /> },
    { id: "examples", label: "Examples", icon: <BookOpen className="size-3.5" /> },
    { id: "about",    label: "About",    icon: <Info className="size-3.5" /> },
  ];
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-black/40 border border-white/8">
      {items.map((it) => {
        const active = tab === it.id;
        return (
          <button
            key={it.id}
            onClick={() => onChange(it.id)}
            className={`flex items-center gap-1.5 px-3.5 h-8 rounded-full text-[12.5px] font-medium transition ${
              active ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {it.icon}{it.label}
          </button>
        );
      })}
    </div>
  );
}

function UploadTile({
  icon, title, subtitle, filled, fileName, previewUrl, onPick, onClear,
}: {
  icon: React.ReactNode; title: string; subtitle: string;
  filled: boolean; fileName?: string; previewUrl?: string;
  onPick: () => void; onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="group relative w-full rounded-xl border border-white/8 bg-surface/60 hover:border-white/15 hover:bg-white/[0.03] transition aspect-[1.55/1] overflow-hidden"
    >
      {previewUrl ? (
        <img src={previewUrl} alt="" className="absolute inset-0 size-full object-cover opacity-80" />
      ) : null}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-4">
        <div className="size-8 rounded-md grid place-items-center text-muted-foreground/80 group-hover:text-foreground/90">
          {filled && !previewUrl ? <Upload className="size-5" /> : icon}
        </div>
        <div className="text-[13px] font-semibold text-foreground">{title}</div>
        <div className="text-[11.5px] text-muted-foreground line-clamp-1 max-w-[260px]">
          {fileName ?? subtitle}
        </div>
      </div>
      {filled && (
        <span
          role="button"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="absolute top-2 right-2 size-6 rounded-full bg-black/60 border border-white/10 grid place-items-center text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </span>
      )}
    </button>
  );
}

function SelectRow({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-xl border border-white/8 bg-surface/60 px-3.5 py-2.5 hover:border-white/15 transition"
      >
        <div className="text-left">
          <div className="text-[10.5px] uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-[13px] font-semibold">{value}</div>
        </div>
        <ChevronRight className={`size-4 text-muted-foreground transition ${open ? "rotate-90" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-white/10 bg-[#0e0e12] p-1 shadow-xl">
          {options.map((o) => (
            <button
              key={o}
              onClick={() => { onChange(o); setOpen(false); }}
              className={`w-full text-left px-3 h-8 rounded-md text-[12.5px] ${o === value ? "bg-brand/15 text-brand" : "hover:bg-white/5"}`}
            >
              {o}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AboutPanel() {
  return (
    <div className="h-full flex flex-col gap-5">
      <div className="relative rounded-2xl overflow-hidden border border-white/8 bg-black/40 aspect-[16/9]">
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="relative bg-gradient-to-br from-zinc-700 to-zinc-900">
            <span className="absolute top-3 left-3 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-black/60 border border-white/10">Base</span>
            <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
              <Film className="size-12" />
            </div>
          </div>
          <div className="relative bg-gradient-to-br from-orange-900/40 to-rose-950/60">
            <span className="absolute top-3 right-3 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-black/60 border border-white/10">Output</span>
            <div className="absolute inset-0 grid place-items-center text-muted-foreground/40">
              <Sparkles className="size-12" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-10 gap-y-5">
        <Step n={1} title="Select Base Video" desc="The video's movement will be used to animate the reference image." />
        <Step n={2} title="Add Reference Image" desc="Upload an image of a character to be animated by the base video." />
        <Step n={3} title="Describe Your Vision" desc="Write a prompt that guides the background of the output video." />
        <Step n={4} title="Generate" desc="Select your model and the output video will be generated in real-time." />
      </div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="shrink-0 size-7 rounded-full bg-white/5 border border-white/10 grid place-items-center text-[12px] font-semibold text-muted-foreground">{n}</div>
      <div>
        <div className="text-[13.5px] font-semibold">{title}</div>
        <p className="text-[12.5px] text-muted-foreground leading-relaxed mt-0.5 max-w-[260px]">{desc}</p>
      </div>
    </div>
  );
}

function ExamplesPanel() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/8" />
      ))}
    </div>
  );
}

function EmptyPanel({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="h-full min-h-[400px] grid place-items-center text-center">
      <div className="max-w-xs space-y-3">
        <div className="mx-auto size-12 rounded-2xl bg-white/5 border border-white/10 grid place-items-center text-muted-foreground">{icon}</div>
        <div className="text-[14px] font-semibold">{title}</div>
        <p className="text-[12.5px] text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
