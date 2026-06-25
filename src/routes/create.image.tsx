import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { CreateLayout, FormField, PrimaryButton, EmptyPreview } from "@/components/dashboard/CreateLayout";

export const Route = createFileRoute("/create/image")({
  head: () => ({ meta: [{ title: "Image Generation — Betty" }] }),
  component: ImageCreate,
});

function ImageCreate() {
  const [prompt, setPrompt] = useState("");
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
            <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
              <option>GPT Image 2 (default)</option>
              <option>Nano Banana 2 (Gemini)</option>
              <option>GPT Image 1 Mini</option>
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Aspect">
              <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
                <option>1:1</option><option>16:9</option><option>9:16</option><option>4:5</option>
              </select>
            </FormField>
            <FormField label="Quality">
              <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </FormField>
          </div>
          <PrimaryButton disabled={!prompt.trim()}>Generate · 5 credits</PrimaryButton>
        </>
      }
      preview={
        <EmptyPreview
          icon={<ImageIcon className="size-6" />}
          message="Your generated image will appear here. Connect Lovable Cloud in the next phase to start creating."
        />
      }
    />
  );
}
