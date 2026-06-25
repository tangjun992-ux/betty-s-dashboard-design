import { createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { CreateLayout, FormField, PrimaryButton, EmptyPreview } from "@/components/dashboard/CreateLayout";

export const Route = createFileRoute("/create/motion")({
  head: () => ({ meta: [{ title: "Motion Control — Betty" }] }),
  component: MotionCreate,
});

function MotionCreate() {
  return (
    <CreateLayout
      title="Motion Control"
      subtitle="Drive a character with a reference motion video."
      controls={
        <>
          <FormField label="Reference motion video">
            <div className="h-28 rounded-md border border-dashed border-border grid place-items-center text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">Upload motion source</div>
          </FormField>
          <FormField label="Character image">
            <div className="h-28 rounded-md border border-dashed border-border grid place-items-center text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">Upload character</div>
          </FormField>
          <FormField label="Prompt (optional)">
            <textarea className="w-full min-h-[80px] p-3 rounded-md bg-background border border-border text-sm resize-y" placeholder="Cinematic lighting, urban backdrop…" />
          </FormField>
          <PrimaryButton>Generate · 35 credits</PrimaryButton>
        </>
      }
      preview={<EmptyPreview icon={<Activity className="size-6" />} message="Motion-controlled video will render here." />}
    />
  );
}
