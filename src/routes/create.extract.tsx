import { createFileRoute } from "@tanstack/react-router";
import { ScanLine } from "lucide-react";
import { CreateLayout, FormField, PrimaryButton, EmptyPreview } from "@/components/dashboard/CreateLayout";

export const Route = createFileRoute("/create/extract")({
  head: () => ({ meta: [{ title: "Extractor — Betty" }] }),
  component: ExtractCreate,
});

function ExtractCreate() {
  return (
    <CreateLayout
      title="Extractor"
      subtitle="Extract frames, subjects, transcripts and audio from any media."
      controls={
        <>
          <FormField label="Source video">
            <div className="h-32 rounded-md border border-dashed border-border grid place-items-center text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">Upload video</div>
          </FormField>
          <FormField label="Extract">
            <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
              <option>Subject (transparent PNG)</option>
              <option>Audio track</option>
              <option>Transcript</option>
              <option>Key frames</option>
            </select>
          </FormField>
          <PrimaryButton>Extract · 4 credits</PrimaryButton>
        </>
      }
      preview={<EmptyPreview icon={<ScanLine className="size-6" />} message="Extracted output will appear here." />}
    />
  );
}
