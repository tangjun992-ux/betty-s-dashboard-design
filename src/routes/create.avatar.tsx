import { createFileRoute } from "@tanstack/react-router";
import { User } from "lucide-react";
import { CreateLayout, FormField, PrimaryButton, EmptyPreview } from "@/components/dashboard/CreateLayout";

export const Route = createFileRoute("/create/avatar")({
  head: () => ({ meta: [{ title: "Talking Avatar — Betty" }] }),
  component: AvatarCreate,
});

function AvatarCreate() {
  return (
    <CreateLayout
      title="Talking Avatar"
      subtitle="Turn a portrait + audio into a fully animated talking avatar."
      controls={
        <>
          <FormField label="Portrait">
            <div className="h-28 rounded-md border border-dashed border-border grid place-items-center text-xs text-muted-foreground hover:bg-surface-hover cursor-pointer">Upload portrait</div>
          </FormField>
          <FormField label="Audio or script">
            <textarea className="w-full min-h-[100px] p-3 rounded-md bg-background border border-border text-sm resize-y" placeholder="Type a script we'll voice for you, or upload audio." />
          </FormField>
          <FormField label="Voice">
            <select className="w-full h-10 px-3 rounded-md bg-background border border-border text-sm">
              <option>Nova (warm female)</option><option>Atlas (deep male)</option><option>Sage (neutral)</option>
            </select>
          </FormField>
          <PrimaryButton>Generate · 30 credits</PrimaryButton>
        </>
      }
      preview={<EmptyPreview icon={<User className="size-6" />} message="Your talking avatar will appear here." />}
    />
  );
}
