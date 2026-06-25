import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Image as ImageIcon, Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CreateLayout, FormField, PrimaryButton, EmptyPreview } from "@/components/dashboard/CreateLayout";
import { generateImage } from "@/lib/generations.functions";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/create/image")({
  head: () => ({ meta: [{ title: "Image Generation — Betty" }] }),
  component: ImageCreate,
});

function ImageCreate() {
  const navigate = useNavigate();
  const { user, loading } = useSession();
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState<"google/gemini-2.5-flash-image" | "google/gemini-3.1-flash-image">("google/gemini-2.5-flash-image");
  const [aspect, setAspect] = useState<"1:1" | "16:9" | "9:16" | "4:5">("1:1");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const gen = useServerFn(generateImage);

  async function onGenerate() {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!prompt.trim() || busy) return;
    setBusy(true);
    setResult(null);
    const t = toast.loading("Generating image…");
    try {
      const res = await gen({ data: { prompt: prompt.trim(), model, aspect } });
      setResult(res.url);
      toast.success("Image ready", { id: t });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed", { id: t });
    } finally {
      setBusy(false);
    }
  }

  return (
    <CreateLayout
      title="Image Generation"
      subtitle="Create photorealistic images, illustrations, product shots and more."
      controls={
        <>
          <FormField label="Prompt">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A neon-lit cyberpunk alley at night, cinematic, 35mm…"
              className="w-full min-h-[140px] p-3 rounded-md bg-background border border-border text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </FormField>
          <FormField label="Model">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as typeof model)}
              className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm"
            >
              <option value="google/gemini-2.5-flash-image">Nano Banana (Gemini 2.5 Image)</option>
              <option value="google/gemini-3.1-flash-image">Gemini 3.1 Flash Image</option>
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Aspect">
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value as typeof aspect)}
                className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm"
              >
                <option value="1:1">1:1</option>
                <option value="16:9">16:9</option>
                <option value="9:16">9:16</option>
                <option value="4:5">4:5</option>
              </select>
            </FormField>
            <FormField label="Quality">
              <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
                <option>Standard</option>
                <option>High</option>
              </select>
            </FormField>
          </div>
          <PrimaryButton onClick={onGenerate} disabled={!prompt.trim() || busy || loading}>
            {busy ? (<><Loader2 className="size-4 animate-spin" /> Generating…</>) : (user ? "Generate · 5 credits" : "Sign in to generate")}
          </PrimaryButton>
        </>
      }
      preview={
        result ? (
          <div className="w-full h-full grid place-items-center p-6">
            <img src={result} alt={prompt} className="max-h-full max-w-full rounded-xl shadow-lg" />
          </div>
        ) : busy ? (
          <div className="w-full h-full grid place-items-center text-muted-foreground">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-8 animate-spin text-brand" />
              <p className="text-sm">Painting pixels…</p>
            </div>
          </div>
        ) : (
          <EmptyPreview
            icon={<ImageIcon className="size-6" />}
            message="Your generated image will appear here."
          />
        )
      }
    />
  );
}
