import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/create/timeline")({
  head: () => ({ meta: [{ title: "Timeline — Betty" }] }),
  component: TimelinePage,
});

function TimelinePage() {
  // Demo: no projects yet
  const projects: { id: string; title: string; thumb?: string }[] = [];

  return (
    <AppShell>
      <div className="px-6 lg:px-10 pt-10 pb-16 max-w-[1280px] mx-auto">
        <h1 className="text-[20px] font-semibold">Your Projects</h1>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          <Link
            to="/create/timeline"
            className="group block"
          >
            <div className="aspect-[4/3] rounded-2xl bg-surface/60 border border-border/60 grid place-items-center hover:bg-surface transition-colors">
              <div className="size-12 rounded-full bg-surface-hover grid place-items-center text-muted-foreground group-hover:text-foreground">
                <Plus className="size-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-[14px] font-semibold">Create a blank project</div>
              <div className="text-[12px] text-muted-foreground">Import or generate your own clips</div>
            </div>
          </Link>

          {projects.map((p) => (
            <div key={p.id} className="group">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-surface border border-border/60">
                {p.thumb && <img src={p.thumb} alt={p.title} className="w-full h-full object-cover" />}
              </div>
              <div className="mt-3 text-[14px] font-medium truncate">{p.title}</div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
