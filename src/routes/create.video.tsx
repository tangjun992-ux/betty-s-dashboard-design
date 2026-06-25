import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Video } from "lucide-react";
import { CreateLayout, FormField, PrimaryButton, EmptyPreview } from "@/components/dashboard/CreateLayout";

export const Route = createFileRoute("/create/video")({
  head: () => ({ meta: [{ title: "Video Generation — Betty" }] }),
  component: VideoCreate,
});

function VideoCreate() {
  const [prompt, setPrompt] = useState("");
  return (
    <CreateLayout
      title="Video Generation"
      subtitle="Generate cinematic videos from a prompt or reference image."
      controls={
        <>
          <FormField label="Prompt">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A tracking shot of a futuristic hover-bike weaving through Tokyo streets…"
              className="w-full min-h-[140px] p-3 rounded-md bg-background border border-border text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </FormField>
          <FormField label="Model">
            <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
              <option>Seedance 2.0</option><option>Veo 3.1</option><option>Sora 2</option>
              <option>Kling 3.0</option><option>Hailuo</option><option>WAN</option>
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Duration">
              <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
                <option>5s</option><option>8s</option><option>10s</option>
              </select>
            </FormField>
            <FormField label="Aspect">
              <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
                <option>16:9</option><option>9:16</option><option>1:1</option>
              </select>
            </FormField>
          </div>
          <FormField label="Reference image (optional)">
            <div className="h-24 rounded-md border border-dashed border-border grid place-items-center text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">
              Drop or click to upload
            </div>
          </FormField>
          <PrimaryButton disabled={!prompt.trim()}>Generate · 40 credits</PrimaryButton>
        </>
      }
      preview={<EmptyPreview icon={<Video className="size-6" />} message="Your video preview will appear here." />}
    />
  );
}
