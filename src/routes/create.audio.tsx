import { createFileRoute } from "@tanstack/react-router";
import { AudioLines } from "lucide-react";
import { CreateLayout, FormField, PrimaryButton, EmptyPreview } from "@/components/dashboard/CreateLayout";

export const Route = createFileRoute("/create/audio")({
  head: () => ({ meta: [{ title: "Audio — Betty" }] }),
  component: AudioCreate,
});

function AudioCreate() {
  return (
    <CreateLayout
      title="Audio Generation"
      subtitle="Convert text into expressive speech with cinematic voices."
      controls={
        <>
          <FormField label="Script">
            <textarea className="w-full min-h-[160px] p-3 rounded-md bg-background border border-border text-sm resize-y" placeholder="Type the script you want spoken…" />
          </FormField>
          <FormField label="Voice">
            <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
              <option>Alloy</option><option>Echo</option><option>Fable</option><option>Onyx</option><option>Nova</option><option>Shimmer</option>
            </select>
          </FormField>
          <FormField label="Style">
            <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
              <option>Neutral</option><option>Cinematic</option><option>News</option><option>Friendly</option>
            </select>
          </FormField>
          <PrimaryButton>Generate · 3 credits</PrimaryButton>
        </>
      }
      preview={<EmptyPreview icon={<AudioLines className="size-6" />} message="Audio waveform will appear here." />}
    />
  );
}
