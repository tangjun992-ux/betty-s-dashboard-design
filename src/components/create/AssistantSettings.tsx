import { useState, type ReactNode } from "react";
import {
  SlidersHorizontal, ListOrdered, Settings, Image as ImageIcon, Video,
  Feather, Hand, Zap, CircleCheck, X,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type TabKey = "approval" | "variation" | "instructions" | "image" | "video";

const TABS: { key: TabKey; label: string; icon: typeof Settings }[] = [
  { key: "approval", label: "Approval Mode", icon: SlidersHorizontal },
  { key: "variation", label: "Variation Quantities", icon: ListOrdered },
  { key: "instructions", label: "Agent Instructions", icon: Settings },
  { key: "image", label: "Image Prompting", icon: ImageIcon },
  { key: "video", label: "Video Prompting", icon: Video },
];

export function AssistantSettings({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [tab, setTab] = useState<TabKey>("approval");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[980px] w-[94vw] p-0 gap-0 bg-[#0b0b0d] border-border/60 rounded-2xl overflow-hidden [&>button]:hidden"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-[18px] font-semibold">Assistant Settings</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="size-8 grid place-items-center rounded-full bg-surface/80 hover:bg-surface-hover text-muted-foreground"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex min-h-[560px] max-h-[80vh]">
          {/* Sidebar */}
          <nav className="w-[210px] shrink-0 px-3 py-2 border-r border-border/40">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`w-full flex items-center gap-2.5 h-9 px-3 rounded-md text-[13px] transition-colors ${
                    active
                      ? "bg-surface text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
                  }`}
                >
                  <Icon className="size-3.5" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            {tab === "approval" && <ApprovalPanel />}
            {tab === "variation" && <VariationPanel />}
            {tab === "instructions" && <InstructionsPanel />}
            {tab === "image" && <ImagePromptPanel />}
            {tab === "video" && <VideoPromptPanel />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Panels ---------- */

function PanelTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-[17px] font-semibold mb-2">{children}</h3>;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border/50 bg-surface/40 p-5 ${className}`}>
      {children}
    </div>
  );
}

function ApprovalPanel() {
  const [mode, setMode] = useState<"prompt" | "approval" | "auto" | "settings">("prompt");
  const [autoImages, setAutoImages] = useState(false);
  const [autoVideos, setAutoVideos] = useState(false);
  const [reviewStages, setReviewStages] = useState(true);

  const modes = [
    { key: "prompt", icon: Feather, color: "text-sky-400", title: "Prompt mode", desc: "Agent only writes prompts; you submit them" },
    { key: "approval", icon: Hand, color: "text-emerald-400", title: "Ask for approval", desc: "Review key steps and approve each generation" },
    { key: "auto", icon: Zap, color: "text-amber-400", title: "Full auto", desc: "Auto-implement the whole plan" },
    { key: "settings", icon: CircleCheck, color: "text-violet-400", title: "Approve by settings", desc: "Auto-approve within your credit limits" },
  ] as const;

  return (
    <div className="space-y-8">
      <section>
        <PanelTitle>Approval Settings</PanelTitle>
        <p className="text-[13px] text-muted-foreground leading-relaxed mb-5">
          Pick a mode to set how much the agent auto-approves. The composer mode selector applies the same presets. Adjusting anything under Advanced puts you in a Custom setup.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {modes.map((m) => {
            const Icon = m.icon;
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  active
                    ? "border-foreground/40 bg-surface"
                    : "border-border/50 bg-surface/40 hover:bg-surface/70"
                }`}
              >
                <Icon className={`size-4 mb-2.5 ${m.color}`} />
                <div className="text-[14px] font-semibold mb-1">{m.title}</div>
                <div className="text-[12.5px] text-muted-foreground leading-snug">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-[17px] font-semibold mb-4">Advanced</h3>
        <div className="space-y-4">
          <AutoGenCard
            title="Auto generate images"
            desc="If enabled, image proposals can start automatically after rendering when they stay under the per-proposal threshold and the session stays under the auto-spend cap."
            on={autoImages} setOn={setAutoImages}
            maxCredits={120} maxSpend={1000}
          />
          <AutoGenCard
            title="Auto generate videos"
            desc="If enabled, video proposals can start automatically after rendering when they stay under the per-proposal threshold and the session stays under the auto-spend cap."
            on={autoVideos} setOn={setAutoVideos}
            maxCredits={600} maxSpend={2000}
          />
          <Card>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[14px] font-semibold">Review between core plan stages</div>
                <div className="text-[12.5px] text-muted-foreground mt-1 leading-snug max-w-[520px]">
                  Require manual post-step review after continuity-defining stages like character, environment, product, or other reusable anchor generation before downstream branches continue.
                </div>
              </div>
              <Switch checked={reviewStages} onCheckedChange={setReviewStages} />
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

function AutoGenCard({
  title, desc, on, setOn, maxCredits, maxSpend,
}: { title: string; desc: string; on: boolean; setOn: (v: boolean) => void; maxCredits: number; maxSpend: number }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="text-[14px] font-semibold">{title}</div>
          <div className="text-[12.5px] text-muted-foreground mt-1 leading-snug max-w-[520px]">{desc}</div>
        </div>
        <Switch checked={on} onCheckedChange={setOn} />
      </div>
      <div className={`space-y-3 ${on ? "" : "opacity-50 pointer-events-none"}`}>
        <NumRow label="Max credits per auto-approved proposal" defaultValue={maxCredits} />
        <NumRow label="Max auto-spend per session" defaultValue={maxSpend} />
      </div>
    </Card>
  );
}

function NumRow({ label, defaultValue }: { label: string; defaultValue: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label className="text-[13px] text-muted-foreground">{label}</label>
      <input
        type="number"
        defaultValue={defaultValue}
        className="w-[110px] h-9 rounded-md bg-surface border border-border/60 px-3 text-[13px] text-right focus:outline-none focus:border-foreground/40"
      />
    </div>
  );
}

function VariationPanel() {
  const [mode, setMode] = useState<"dynamic" | "manual">("dynamic");
  const [imgCount, setImgCount] = useState(3);
  const [vidCount, setVidCount] = useState(3);

  return (
    <div className="space-y-6">
      <PanelTitle>Variation Quantities</PanelTitle>
      <Card>
        <div className="text-[14px] font-semibold mb-1">Generation Count Mode</div>
        <p className="text-[12.5px] text-muted-foreground mb-4 leading-snug">
          Choose how the agent picks suggested counts when your message does not specify a number. Dynamic currently suggests {imgCount} images and {vidCount} videos per idea.
        </p>
        <div className="border-t border-border/40 -mx-5 mb-4" />
        <div className="grid grid-cols-2 gap-3">
          {([
            { key: "dynamic", title: "Dynamic", desc: "Use credit-aware image and video counts." },
            { key: "manual", title: "Manual", desc: "Use the numbers shown below as the default suggestions." },
          ] as const).map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  active ? "border-foreground/40 bg-surface" : "border-border/50 bg-surface/40 hover:bg-surface/70"
                }`}
              >
                <div className="text-[14px] font-semibold mb-1">{m.title}</div>
                <div className="text-[12.5px] text-muted-foreground leading-snug">{m.desc}</div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="text-[14px] font-semibold mb-1">Current {mode === "dynamic" ? "Dynamic" : "Manual"} Suggestions</div>
        <p className="text-[12.5px] text-muted-foreground mb-4 leading-snug">
          These are the quantities the agent will suggest when your message does not specify a count.
        </p>
        <div className="border-t border-border/40 -mx-5 mb-2" />
        <CountRow label="Image generations per idea" sub={`${imgCount} image generations per idea`} value={imgCount} onChange={setImgCount} editable={mode === "manual"} />
        <div className="border-t border-border/40 -mx-5 my-2" />
        <CountRow label="Video generations per idea" sub={`${vidCount} video generations per idea`} value={vidCount} onChange={setVidCount} editable={mode === "manual"} />
      </Card>
    </div>
  );
}

function CountRow({
  label, sub, value, onChange, editable,
}: { label: string; sub: string; value: number; onChange: (v: number) => void; editable: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-[13.5px] font-semibold">{label}</div>
        <div className="text-[12px] text-muted-foreground">{sub}</div>
      </div>
      {editable ? (
        <input
          type="number"
          min={1} max={12}
          value={value}
          onChange={(e) => onChange(Math.max(1, Math.min(12, Number(e.target.value) || 1)))}
          className="w-[64px] h-9 rounded-md bg-surface border border-border/60 px-2 text-[18px] font-bold text-right focus:outline-none focus:border-foreground/40"
        />
      ) : (
        <div className="text-[28px] font-bold leading-none">{value}</div>
      )}
    </div>
  );
}

function InstructionsPanel() {
  return (
    <div className="space-y-5">
      <PanelTitle>Agent Instructions</PanelTitle>
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        Custom instructions the agent should always follow when planning and generating. Use this for tone, brand voice, recurring constraints, or formatting rules.
      </p>
      <Card>
        <div className="text-[14px] font-semibold mb-2">System instructions</div>
        <Textarea
          placeholder="e.g. Always respond in a warm, concise editorial voice. Prefer cinematic 16:9 framing unless told otherwise."
          className="min-h-[180px] bg-surface/60 border-border/60 text-[13px] resize-y"
        />
        <div className="mt-2 text-[11.5px] text-muted-foreground text-right">0 / 2000</div>
      </Card>
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[14px] font-semibold">Apply to every new session</div>
            <div className="text-[12.5px] text-muted-foreground mt-1 leading-snug">
              When on, these instructions are automatically loaded into each new agent session.
            </div>
          </div>
          <Switch defaultChecked />
        </div>
      </Card>
    </div>
  );
}

function ImagePromptPanel() {
  return (
    <div className="space-y-5">
      <PanelTitle>Image Prompting</PanelTitle>
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        Defaults the agent uses when writing image prompts on your behalf.
      </p>
      <Card>
        <div className="text-[14px] font-semibold mb-2">Default style guidance</div>
        <Textarea placeholder="e.g. Cinematic lighting, shallow depth of field, editorial color grading." className="min-h-[120px] bg-surface/60 border-border/60 text-[13px]" />
      </Card>
      <Card>
        <div className="text-[14px] font-semibold mb-2">Negative prompt</div>
        <Textarea placeholder="e.g. text, watermark, low quality, distorted hands" className="min-h-[90px] bg-surface/60 border-border/60 text-[13px]" />
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold">Auto-enhance prompts</div>
            <div className="text-[12.5px] text-muted-foreground mt-1">Let the agent rewrite short prompts into rich descriptions before generating.</div>
          </div>
          <Switch defaultChecked />
        </div>
      </Card>
    </div>
  );
}

function VideoPromptPanel() {
  return (
    <div className="space-y-5">
      <PanelTitle>Video Prompting</PanelTitle>
      <p className="text-[13px] text-muted-foreground leading-relaxed">
        Defaults the agent uses when writing video prompts on your behalf.
      </p>
      <Card>
        <div className="text-[14px] font-semibold mb-2">Default camera & motion</div>
        <Textarea placeholder="e.g. Slow dolly-in, handheld realism, subtle parallax." className="min-h-[120px] bg-surface/60 border-border/60 text-[13px]" />
      </Card>
      <Card>
        <div className="text-[14px] font-semibold mb-2">Default duration & pacing</div>
        <div className="grid grid-cols-2 gap-3 mt-1">
          <NumRow label="Default duration (seconds)" defaultValue={5} />
          <NumRow label="Default FPS" defaultValue={24} />
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[14px] font-semibold">Generate motion-aware prompts</div>
            <div className="text-[12.5px] text-muted-foreground mt-1">Include camera movement, subject action, and pacing cues automatically.</div>
          </div>
          <Switch defaultChecked />
        </div>
      </Card>
    </div>
  );
}
