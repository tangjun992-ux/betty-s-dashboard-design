import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Boxes, Plus, Search, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listElements } from "@/lib/elements.functions";
import { useSession } from "@/lib/use-session";

export type ElementRow = {
  id: string;
  name: string;
  thumb_url: string | null;
  image_url: string | null;
};

/**
 * Composer pill that lets users insert @element-name tokens into the prompt
 * so generation calls can reference saved Reference Elements.
 */
export function ElementPicker({
  selected,
  onToggle,
}: {
  selected: ElementRow[];
  onToggle: (el: ElementRow) => void;
}) {
  const { user } = useSession();
  const list = useServerFn(listElements);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ElementRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    list()
      .then((r) => setItems(r as ElementRow[]))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [open, user, list]);

  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase())),
    [items, q],
  );

  const selectedIds = new Set(selected.map((s) => s.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="h-8 px-2.5 rounded-md hover:bg-surface-hover text-foreground/90 flex items-center gap-1.5 transition-colors"
        >
          <Boxes className="size-3.5 text-muted-foreground" />
          <span className="font-medium">
            {selected.length > 0 ? `${selected.length} element${selected.length > 1 ? "s" : ""}` : "Elements"}
          </span>
          <svg viewBox="0 0 24 24" className="size-3 opacity-60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[320px] p-0 bg-popover">
        <div className="p-3 border-b border-border/60">
          <div className="relative">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search elements…"
              className="w-full h-8 pl-7 pr-2 rounded-md bg-surface border border-border/60 text-[12.5px] focus:outline-none"
            />
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto p-2 space-y-1">
          {!user && (
            <div className="px-2 py-6 text-center text-[12.5px] text-muted-foreground">
              <Link to="/auth" className="underline">Sign in</Link> to use elements
            </div>
          )}
          {user && loading && (
            <div className="px-2 py-6 text-center text-[12.5px] text-muted-foreground">Loading…</div>
          )}
          {user && !loading && filtered.length === 0 && (
            <div className="px-2 py-6 text-center text-[12.5px] text-muted-foreground space-y-2">
              <div>No elements yet</div>
              <Link
                to="/create/elements"
                className="inline-flex items-center gap-1 text-foreground hover:underline"
              >
                <Plus className="size-3" /> Create one
              </Link>
            </div>
          )}
          {user && !loading && filtered.map((el) => {
            const isSel = selectedIds.has(el.id);
            return (
              <button
                key={el.id}
                type="button"
                onClick={() => onToggle(el)}
                className={`w-full flex items-center gap-2.5 p-1.5 rounded-md text-left transition-colors ${
                  isSel ? "bg-brand/10 ring-1 ring-brand/40" : "hover:bg-surface-hover"
                }`}
              >
                <div className="size-9 rounded-md overflow-hidden bg-surface shrink-0 grid place-items-center">
                  {el.thumb_url ? (
                    <img src={el.thumb_url} alt={el.name} className="w-full h-full object-cover" />
                  ) : (
                    <Boxes className="size-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-medium truncate">@{el.name}</div>
                </div>
                {isSel && <span className="text-[10px] text-brand font-semibold">SELECTED</span>}
              </button>
            );
          })}
        </div>
        <div className="border-t border-border/60 p-2">
          <Link
            to="/create/elements"
            className="w-full inline-flex items-center justify-center gap-1.5 h-8 rounded-md text-[12.5px] hover:bg-surface-hover text-muted-foreground hover:text-foreground"
          >
            <Plus className="size-3.5" /> Manage elements
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ElementChips({
  selected,
  onRemove,
}: {
  selected: ElementRow[];
  onRemove: (el: ElementRow) => void;
}) {
  if (selected.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 px-1 pb-1">
      {selected.map((el) => (
        <span
          key={el.id}
          className="inline-flex items-center gap-1.5 h-6 pl-1 pr-1.5 rounded-full bg-brand/10 border border-brand/30 text-[11.5px]"
        >
          <span className="size-4 rounded-full overflow-hidden bg-surface grid place-items-center">
            {el.thumb_url ? <img src={el.thumb_url} alt="" className="w-full h-full object-cover" /> : null}
          </span>
          <span className="font-medium">@{el.name}</span>
          <button
            type="button"
            onClick={() => onRemove(el)}
            className="size-3.5 grid place-items-center rounded-full hover:bg-brand/20 text-muted-foreground hover:text-foreground"
            aria-label={`Remove ${el.name}`}
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}
    </div>
  );
}

/** Append a `@name` token to the end of the prompt if not already present. */
export function injectElementToken(prompt: string, name: string): string {
  const token = `@${name}`;
  if (new RegExp(`(^|\\s)${token}(\\s|$)`, "i").test(prompt)) return prompt;
  return prompt.trim().length ? `${prompt.trim()} ${token}` : token;
}

export function removeElementToken(prompt: string, name: string): string {
  return prompt.replace(new RegExp(`\\s*@${name}\\b`, "gi"), "").replace(/\s+/g, " ").trim();
}
