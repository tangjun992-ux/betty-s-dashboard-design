import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Search, MoreHorizontal } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/create/elements")({
  head: () => ({ meta: [{ title: "My Elements — Betty" }] }),
  component: ElementsPage,
});

type Element = { id: string; name: string; thumb?: string };

function ElementsPage() {
  const [q, setQ] = useState("");
  const [items] = useState<Element[]>([
    { id: "1", name: "@untitled-element" },
  ]);

  const filtered = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppShell>
      <div className="px-6 lg:px-10 pt-10 pb-16 max-w-[1280px] mx-auto">
        <h1 className="text-[20px] font-semibold">Reference Elements</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Elements let you reference consistent characters and objects in your video prompts by name.
        </p>

        <div className="mt-6 relative w-[340px] max-w-full">
          <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search elements…"
            className="w-full h-9 pl-8 pr-3 rounded-md bg-surface border border-border/60 text-[13px] placeholder:text-muted-foreground/70 focus:outline-none"
          />
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {/* Add new */}
          <button className="aspect-square rounded-2xl bg-surface/40 border border-border/60 grid place-items-center hover:bg-surface transition-colors group">
            <div className="size-12 rounded-full bg-surface-hover grid place-items-center text-muted-foreground group-hover:text-foreground">
              <Plus className="size-5" />
            </div>
          </button>

          {filtered.map((el) => (
            <div key={el.id} className="aspect-square rounded-2xl bg-surface/60 border border-border/60 overflow-hidden relative group">
              <div className="absolute inset-0 grid place-items-center text-[12.5px] text-muted-foreground/80">
                {el.thumb ? <img src={el.thumb} alt={el.name} className="w-full h-full object-cover" /> : "No image"}
              </div>
              <div className="absolute bottom-0 inset-x-0 p-2.5 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent">
                <span className="text-[11.5px] px-2 py-0.5 rounded-md bg-black/40 text-white/90 backdrop-blur">{el.name}</span>
                <button className="size-6 grid place-items-center rounded-md text-white/80 hover:bg-white/10" aria-label="More">
                  <MoreHorizontal className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
