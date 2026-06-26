import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AudioLines, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CreateLayout, FormField, PrimaryButton, EmptyPreview } from "@/components/dashboard/CreateLayout";
import { generateAudio } from "@/lib/audio.functions";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/create/audio")({
  head: () => ({ meta: [{ title: "Audio — Betty" }] }),
  component: AudioCreate,
});

type Voice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";

function AudioCreate() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [text, setText] = useState("");
  const [voice, setVoice] = useState<Voice>("nova");
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const gen = useServerFn(generateAudio);

  async function onSubmit() {
    if (!user) { navigate({ to: "/auth" }); return; }
    if (!text.trim() || busy) return;
    setBusy(true); setUrl(null);
    const t = toast.loading("Synthesizing voice…");
    try {
      const r = await gen({ data: { text: text.trim(), voice, speed: 1 } });
      setUrl(r.url);
      toast.success("Audio ready", { id: t });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "TTS failed", { id: t });
    } finally { setBusy(false); }
  }

  return (
    <CreateLayout
      title="Audio Generation"
      subtitle="Convert text into expressive speech with cinematic voices."
      controls={
        <>
          <FormField label="Script">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[160px] p-3 rounded-md bg-background border border-border text-sm resize-y"
              placeholder="Type the script you want spoken…"
            />
          </FormField>
          <FormField label="Voice">
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value as Voice)}
              className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm"
            >
              <option value="alloy">Alloy</option><option value="echo">Echo</option>
              <option value="fable">Fable</option><option value="onyx">Onyx</option>
              <option value="nova">Nova</option><option value="shimmer">Shimmer</option>
            </select>
          </FormField>
          <PrimaryButton onClick={onSubmit} disabled={busy || loading || !text.trim()}>
            {busy ? "Generating…" : "Generate · 3 credits"}
          </PrimaryButton>
        </>
      }
      preview={
        url ? (
          <div className="h-full grid place-items-center p-6">
            <audio controls src={url} className="w-full max-w-md" />
          </div>
        ) : busy ? (
          <div className="h-full grid place-items-center text-muted-foreground">
            <Loader2 className="size-6 animate-spin text-brand" />
          </div>
        ) : (
          <EmptyPreview icon={<AudioLines className="size-6" />} message="Audio waveform will appear here." />
        )
      }
    />
  );
}
