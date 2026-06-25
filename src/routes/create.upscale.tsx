import { createFileRoute } from "@tanstack/react-router";
import { Maximize2 } from "lucide-react";
import { CreateLayout, FormField, PrimaryButton, EmptyPreview } from "@/components/dashboard/CreateLayout";

export const Route = createFileRoute("/create/upscale")({
  head: () => ({ meta: [{ title: "Upscaler — Betty" }] }),
  component: UpscaleCreate,
});

function UpscaleCreate() {
  return (
    <CreateLayout
      title="Upscaler"
      subtitle="Upscale your images and videos to 4K with AI."
      controls={
        <>
          <FormField label="Source">
            <div className="h-32 rounded-md border border-dashed border-border grid place-items-center text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">Upload image or video</div>
          </FormField>
          <FormField label="Scale">
            <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm"><option>2x</option><option>4x</option></select>
          </FormField>
          <PrimaryButton>Upscale · 8 credits</PrimaryButton>
        </>
      }
      preview={<EmptyPreview icon={<Maximize2 className="size-6" />} message="Upscaled result appears here." />}
    />
  );
}
