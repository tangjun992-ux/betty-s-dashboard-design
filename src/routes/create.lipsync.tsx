import { createFileRoute } from "@tanstack/react-router";
import { Mic2 } from "lucide-react";
import { CreateLayout, FormField, PrimaryButton, EmptyPreview } from "@/components/dashboard/CreateLayout";

export const Route = createFileRoute("/create/lipsync")({
  head: () => ({ meta: [{ title: "Lipsync — Betty" }] }),
  component: LipsyncCreate,
});

function LipsyncCreate() {
  return (
    <CreateLayout
      title="Studio Lipsync"
      subtitle="Combine any face video with any audio for studio-grade lipsync."
      controls={
        <>
          <FormField label="Source video">
            <div className="h-28 rounded-md border border-dashed border-border grid place-items-center text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">Upload portrait or talking video</div>
          </FormField>
          <FormField label="Audio">
            <div className="h-20 rounded-md border border-dashed border-border grid place-items-center text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">Upload audio (MP3/WAV)</div>
          </FormField>
          <FormField label="Quality">
            <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm"><option>Standard</option><option>Pro</option></select>
          </FormField>
          <PrimaryButton>Generate · 25 credits</PrimaryButton>
        </>
      }
      preview={<EmptyPreview icon={<Mic2 className="size-6" />} message="Lipsynced video will appear here." />}
    />
  );
}
