import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Upload, Sparkles, Mic, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { generateLipsync, uploadLipsyncAsset } from "@/lib/lipsync.functions";
import { pollGeneration } from "@/lib/video.functions";
import { generateAudio } from "@/lib/audio.functions";

export type LipsyncSource =
  | { kind: "url"; value: string; label?: string }
  | { kind: "storage"; value: string; label?: string };

type Phase = "idle" | "uploading" | "submitting" | "queued" | "running" | "succeeded" | "failed";
type AudioTab = "upload" | "tts";

const VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"] as const;

export function LipsyncStep2({
  open, onOpenChange, video,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  video: LipsyncSource | null;
}) {
  const [tab, setTab] = useState<AudioTab>("upload");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [ttsText, setTtsText] = useState("");
  const [voice, setVoice] = useState<typeof VOICES[number]>("nova");
  const [audioSource, setAudioSource] = useState<LipsyncSource | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const upload = useServerFn(uploadLipsyncAsset);
  const submit = useServerFn(generateLipsync);
  const poll = useServerFn(pollGeneration);
  const tts = useServerFn(generateAudio);
  const stopRef = useRef(false);

  useEffect(() => {
    if (!open) {
      stopRef.current = true;
      setTimeout(() => {
        setPhase("idle"); setProgress(0); setResultUrl(null); setErrMsg(null);
        setAudioFile(null); setTtsText(""); setAudioSource(null);
      }, 200);
    } else {
      stopRef.current = false;
    }
  }, [open]);

  async function buildAudioSource(): Promise<LipsyncSource | null> {
    if (audioSource) return audioSource;
    if (tab === "upload") {
      if (!audioFile) { toast.error("Choose an audio file"); return null; }
      if (audioFile.size > 10 * 1024 * 1024) { toast.error("Audio file too large (max 10MB)"); return null; }
      setPhase("uploading");
      const base64 = await fileToBase64(audioFile);
      const res = await upload({ data: { filename: audioFile.name, contentType: audioFile.type || "audio/mpeg", base64, kind: "audio" } });
      const src: LipsyncSource = { kind: "storage", value: res.path, label: audioFile.name };
      setAudioSource(src);
      return src;
    }
    // TTS
    if (ttsText.trim().length < 2) { toast.error("Enter some text to speak"); return null; }
    setPhase("uploading");
    const res = await tts({ data: { text: ttsText.trim(), voice, speed: 1 } });
    if (!res.url) { toast.error("TTS failed"); return null; }
    const src: LipsyncSource = { kind: "url", value: res.url, label: `TTS · ${voice}` };
    setAudioSource(src);
    return src;
  }

  async function onGenerate() {
    if (!video) { toast.error("No base video"); return; }
    setErrMsg(null); setResultUrl(null);
    try {
      const audio = await buildAudioSource();
      if (!audio) { setPhase("idle"); return; }

      setPhase("submitting");
      setProgress(8);
      const job = await submit({
        data: {
          videoSource: { kind: video.kind, value: video.value },
          audioSource: { kind: audio.kind, value: audio.value },
          prompt: "",
        },
      });
      toast.success(`Job queued · ${job.cost} credits`);
      setPhase("queued");
      setProgress(15);

      const started = Date.now();
      while (!stopRef.current) {
        const status = await poll({ data: { id: job.id } });
        const elapsed = (Date.now() - started) / 1000;
        if (status.status === "running" || status.status === "queued") {
          setPhase("running");
          setProgress(Math.min(85, 20 + Math.floor(elapsed * 2)));
        }
        if (status.status === "succeeded" && status.url) {
          setPhase("succeeded"); setProgress(100); setResultUrl(status.url);
          toast.success("Lipsync ready");
          return;
        }
        if (status.status === "failed") {
          setPhase("failed"); setErrMsg(status.error ?? "Lipsync failed");
          toast.error(status.error ?? "Lipsync failed");
          return;
        }
        await new Promise((r) => setTimeout(r, 3500));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lipsync failed";
      setPhase("failed"); setErrMsg(msg); toast.error(msg);
    }
  }

  const busy = phase === "uploading" || phase === "submitting" || phase === "queued" || phase === "running";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-background border-border">
        <DialogHeader className="px-6 pt-6 pb-3 border-b border-border/60">
          <DialogTitle className="text-[16px]">Step 2 · Add voice</DialogTitle>
          <p className="text-[12.5px] text-muted-foreground">Upload an audio clip or generate one from text. We'll lipsync your base video to it.</p>
        </DialogHeader>

        {phase === "succeeded" && resultUrl ? (
          <div className="p-6 space-y-4">
            <div className="rounded-xl overflow-hidden bg-black aspect-video">
              <video src={resultUrl} controls autoPlay className="w-full h-full" />
            </div>
            <div className="flex items-center gap-2 text-[12.5px] text-emerald-500">
              <CheckCircle2 className="size-4" /> Lipsync complete
            </div>
            <div className="flex justify-end gap-2">
              <a href={resultUrl} download className="h-9 px-4 rounded-md border border-border text-[13px] inline-flex items-center">Download</a>
              <button onClick={() => onOpenChange(false)} className="h-9 px-4 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-[13px] font-semibold">Done</button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div className="inline-flex p-1 rounded-full bg-surface/70 border border-border/60">
              <TabBtn active={tab === "upload"} onClick={() => { setTab("upload"); setAudioSource(null); }} icon={<Upload className="size-3.5" />}>Upload audio</TabBtn>
              <TabBtn active={tab === "tts"} onClick={() => { setTab("tts"); setAudioSource(null); }} icon={<Sparkles className="size-3.5" />}>Text to speech</TabBtn>
              <TabBtn active={false} disabled icon={<Mic className="size-3.5" />}>Record (soon)</TabBtn>
            </div>

            {tab === "upload" ? (
              <label className="block">
                <div className="rounded-xl border border-dashed border-border bg-surface/50 hover:bg-surface px-5 py-8 text-center cursor-pointer transition-colors">
                  {audioFile ? (
                    <div className="text-[13px]">
                      <div className="font-medium">{audioFile.name}</div>
                      <div className="text-muted-foreground text-[12px] mt-0.5">{(audioFile.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  ) : (
                    <>
                      <Upload className="size-5 mx-auto text-muted-foreground mb-2" />
                      <div className="text-[13px]">Click to upload audio</div>
                      <div className="text-[11.5px] text-muted-foreground mt-1">MP3 / WAV / M4A · up to 10MB</div>
                    </>
                  )}
                </div>
                <input
                  type="file" accept="audio/*" hidden
                  onChange={(e) => { setAudioFile(e.target.files?.[0] ?? null); setAudioSource(null); }}
                />
              </label>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={ttsText}
                  onChange={(e) => { setTtsText(e.target.value); setAudioSource(null); }}
                  rows={5}
                  maxLength={2000}
                  placeholder="What should they say?"
                  className="w-full p-3 rounded-md bg-surface border border-border/60 text-[13.5px] resize-y focus:outline-none focus:border-border"
                />
                <div className="flex items-center justify-between">
                  <select
                    value={voice}
                    onChange={(e) => { setVoice(e.target.value as typeof VOICES[number]); setAudioSource(null); }}
                    className="h-9 px-3 rounded-md bg-surface border border-border/60 text-[13px]"
                  >
                    {VOICES.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  <span className="text-[11.5px] text-muted-foreground">{ttsText.length}/2000 · TTS costs 3 credits</span>
                </div>
              </div>
            )}

            {busy && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11.5px] text-muted-foreground">
                  <span>
                    {phase === "uploading" && "Preparing audio…"}
                    {phase === "submitting" && "Submitting job…"}
                    {phase === "queued" && "Queued at provider…"}
                    {phase === "running" && "Lipsync rendering…"}
                  </span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                  <div className="h-full bg-[image:var(--gradient-brand)] transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {phase === "failed" && errMsg && (
              <div className="flex items-start gap-2 text-[12.5px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
                <AlertCircle className="size-4 mt-px" /> {errMsg}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 rounded-md text-[13px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
              >
                <X className="size-3.5" /> Cancel
              </button>
              <button
                onClick={onGenerate}
                disabled={busy}
                className="inline-flex items-center gap-1.5 h-10 px-5 rounded-full bg-[image:var(--gradient-brand)] text-brand-foreground text-[13.5px] font-semibold disabled:opacity-50"
              >
                {busy && <Loader2 className="size-4 animate-spin" />}
                Generate lipsync · 60 credits
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TabBtn({ active, onClick, icon, children, disabled }: { active: boolean; onClick?: () => void; icon: React.ReactNode; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[12.5px] font-medium transition-colors ${
        active ? "bg-surface-hover text-foreground" : "text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
      }`}
    >
      {icon}{children}
    </button>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = r.result as string;
      resolve(s.split(",")[1] ?? "");
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}
