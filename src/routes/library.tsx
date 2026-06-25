import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { FolderOpen, Image as ImageIcon, Video, Mic2 } from "lucide-react";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "My Library — Betty" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-6 max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <FolderOpen className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">My Library</h1>
        </div>

        <div className="flex gap-2">
          {[
            { icon: ImageIcon, label: "All" },
            { icon: Video, label: "Videos" },
            { icon: ImageIcon, label: "Images" },
            { icon: Mic2, label: "Audio" },
          ].map((t, i) => (
            <button key={t.label} className={`h-9 px-4 rounded-md text-sm border flex items-center gap-2 ${i === 0 ? "bg-surface border-border text-foreground" : "bg-transparent border-border text-muted-foreground hover:text-foreground hover:bg-surface"}`}>
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-dashed border-border bg-surface/50 p-16 text-center">
          <div className="mx-auto size-14 rounded-2xl bg-[image:var(--gradient-brand-soft)] border border-border grid place-items-center mb-4">
            <FolderOpen className="size-6 text-foreground/70" />
          </div>
          <h3 className="text-base font-semibold">Your library is empty</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Generated images, videos and audio will appear here. Start by creating something with one of our AI tools.
          </p>
          <a href="/tools" className="inline-flex mt-5 h-9 px-4 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-medium items-center shadow-[var(--shadow-glow)]">
            Browse tools
          </a>
        </div>
      </div>
    </AppShell>
  );
}
