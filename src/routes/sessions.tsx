import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { MessageCircle, Plus, Sparkles } from "lucide-react";

export const Route = createFileRoute("/sessions")({
  head: () => ({ meta: [{ title: "Sessions — Betty" }] }),
  component: SessionsPage,
});

const sample = [
  { title: "Cyberpunk skyline concepts", tool: "Image", time: "2h ago" },
  { title: "Product hero video — sneaker", tool: "Video", time: "Yesterday" },
  { title: "Studio lipsync — podcast clip", tool: "Lipsync", time: "3d ago" },
];

function SessionsPage() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-6 max-w-[1100px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="size-5 text-muted-foreground" />
            <h1 className="text-2xl font-semibold tracking-tight">Sessions</h1>
          </div>
          <Link to="/create/agent" className="h-9 px-4 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-medium flex items-center gap-2 shadow-[var(--shadow-glow)]">
            <Plus className="size-4" /> New Session
          </Link>
        </div>

        <div className="rounded-xl border border-border bg-surface divide-y divide-border">
          {sample.map((s) => (
            <button key={s.title} className="w-full px-5 py-4 flex items-center gap-4 hover:bg-surface-hover text-left">
              <div className="size-10 rounded-lg bg-[image:var(--gradient-brand-soft)] border border-border grid place-items-center">
                <Sparkles className="size-4 text-foreground/70" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{s.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.tool} · {s.time}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
