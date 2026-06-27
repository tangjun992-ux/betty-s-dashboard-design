import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, Crop, Sliders, Camera, Maximize2, Eraser, Pencil, ImageIcon, Upload, FolderOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/create/image-editor")({
  head: () => ({ meta: [{ title: "Image Editor — Betty" }] }),
  component: ImageEditorPage,
});

const PANELS = [
  { key: "edit", label: "Edit Region", icon: Pencil },
  { key: "crop", label: "Crop & Expand", icon: Crop },
  { key: "color", label: "Color Adjustments", icon: Sliders },
  { key: "camera", label: "Camera Angle Adjust", icon: Camera },
  { key: "upscale", label: "Upscale", icon: Maximize2 },
  { key: "remove", label: "Remove Background", icon: Eraser },
] as const;

function ImageEditorPage() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <AppShell>
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        {/* Canvas area */}
        <section className="flex-1 grid place-items-center px-6">
          <div className="text-center max-w-md">
            <div className="size-16 mx-auto rounded-2xl bg-surface grid place-items-center mb-5">
              <ImageIcon className="size-6 text-muted-foreground/70" />
            </div>
            <h2 className="text-[19px] font-semibold">Select an image to start editing</h2>
            <p className="text-[13px] text-muted-foreground mt-1">Or drag & drop or paste an image</p>

            <div className="mt-7 space-y-3 max-w-[340px] mx-auto">
              <button className="w-full h-11 rounded-full bg-brand text-brand-foreground text-[14px] font-semibold flex items-center justify-center gap-2 hover:opacity-95">
                <Upload className="size-4" /> Upload Image
              </button>
              <button className="w-full h-11 rounded-full border border-brand/60 text-brand text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-brand/10">
                <FolderOpen className="size-4" /> Select from Assets
              </button>
            </div>
          </div>
        </section>

        {/* Right rail */}
        <aside className="w-[300px] shrink-0 border-l border-border/60 bg-background/60">
          <div className="py-4">
            {PANELS.map((p) => {
              const Icon = p.icon;
              const isOpen = open === p.key;
              return (
                <div key={p.key}>
                  <button
                    onClick={() => setOpen(isOpen ? null : p.key)}
                    className="w-full h-12 px-5 flex items-center justify-between text-[13.5px] hover:bg-surface/50 transition-colors"
                  >
                    <span className="flex items-center gap-2.5 text-foreground/90">
                      <Icon className="size-4 text-muted-foreground" />
                      {p.label}
                    </span>
                    <ChevronDown className={`size-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 text-[12.5px] text-muted-foreground">
                      Upload an image to use this tool.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
