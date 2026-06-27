import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Plus, Search, MoreHorizontal, Trash2, Pencil, Loader2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { listElements, createElement, deleteElement, updateElement } from "@/lib/elements.functions";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/create/elements")({
  head: () => ({ meta: [{ title: "My Elements — Betty" }] }),
  component: ElementsPage,
});

type Element = {
  id: string;
  name: string;
  thumb_url: string | null;
  image_url: string | null;
  description: string | null;
  created_at: string;
};

function ElementsPage() {
  const { user, loading: authLoading } = useSession();
  const list = useServerFn(listElements);
  const create = useServerFn(createElement);
  const del = useServerFn(deleteElement);
  const upd = useServerFn(updateElement);

  const [items, setItems] = useState<Element[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState<Element | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    list()
      .then((r) => setItems(r as Element[]))
      .catch((e) => toast.error(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [user, list]);

  const filtered = items.filter((i) => i.name.toLowerCase().includes(q.toLowerCase()));

  function pickFile(f: File | null) {
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function resetCreate() {
    setName(""); setDescription(""); setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setBusy(false);
  }

  async function submitCreate() {
    if (!file) return toast.error("Choose an image");
    if (!/^[a-z0-9_-]{2,32}$/i.test(name)) return toast.error("Name: 2-32 letters, numbers, _ or -");
    if (file.size > 10 * 1024 * 1024) return toast.error("Image must be ≤ 10MB");
    setBusy(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const bin = Array.from(buf, (b) => String.fromCharCode(b)).join("");
      const dataBase64 = btoa(bin);
      const created = await create({
        data: {
          name, description: description || undefined,
          filename: file.name, contentType: file.type, dataBase64,
        },
      });
      setItems((prev) => [created as Element, ...prev]);
      toast.success(`@${created!.name} created`);
      setCreateOpen(false); resetCreate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setBusy(false);
    }
  }

  async function submitDelete(el: Element) {
    if (!confirm(`Delete @${el.name}? This can't be undone.`)) return;
    try {
      await del({ data: { id: el.id } });
      setItems((prev) => prev.filter((x) => x.id !== el.id));
      toast.success("Deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  }

  function openEdit(el: Element) {
    setEditing(el); setEditName(el.name); setEditDesc(el.description ?? "");
  }

  async function submitEdit() {
    if (!editing) return;
    if (!/^[a-z0-9_-]{2,32}$/i.test(editName)) return toast.error("Name: 2-32 letters, numbers, _ or -");
    try {
      await upd({ data: { id: editing.id, name: editName, description: editDesc || undefined } });
      setItems((prev) => prev.map((x) => x.id === editing.id ? { ...x, name: editName, description: editDesc } : x));
      toast.success("Updated");
      setEditing(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  }

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
          <button
            onClick={() => { if (!user) { toast.error("Sign in first"); return; } setCreateOpen(true); }}
            className="aspect-square rounded-2xl bg-surface/40 border border-border/60 grid place-items-center hover:bg-surface transition-colors group"
          >
            <div className="size-12 rounded-full bg-surface-hover grid place-items-center text-muted-foreground group-hover:text-foreground">
              <Plus className="size-5" />
            </div>
          </button>

          {(authLoading || loading) && (
            <div className="aspect-square rounded-2xl bg-surface/30 border border-border/60 grid place-items-center text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
            </div>
          )}

          {!loading && filtered.map((el) => (
            <div key={el.id} className="aspect-square rounded-2xl bg-surface/60 border border-border/60 overflow-hidden relative group">
              {el.thumb_url ? (
                <img src={el.thumb_url} alt={el.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full grid place-items-center text-[12.5px] text-muted-foreground/80">No image</div>
              )}
              <div className="absolute bottom-0 inset-x-0 p-2.5 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent">
                <span className="text-[11.5px] px-2 py-0.5 rounded-md bg-black/40 text-white/90 backdrop-blur truncate max-w-[70%]">@{el.name}</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="size-6 grid place-items-center rounded-md text-white/80 hover:bg-white/10" aria-label="More">
                      <MoreHorizontal className="size-3.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-40 p-1">
                    <button onClick={() => openEdit(el)} className="w-full flex items-center gap-2 px-2 h-8 rounded text-[12.5px] hover:bg-surface-hover">
                      <Pencil className="size-3.5" /> Rename
                    </button>
                    <button onClick={() => submitDelete(el)} className="w-full flex items-center gap-2 px-2 h-8 rounded text-[12.5px] hover:bg-surface-hover text-red-400">
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetCreate(); }}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>New Reference Element</DialogTitle>
            <DialogDescription>Upload a clear image and pick a unique handle.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div
              onClick={() => fileRef.current?.click()}
              className="aspect-video rounded-lg border border-dashed border-border/60 bg-surface/40 grid place-items-center cursor-pointer hover:bg-surface relative overflow-hidden"
            >
              {preview ? (
                <>
                  <img src={preview} alt="" className="w-full h-full object-contain" />
                  <button
                    onClick={(e) => { e.stopPropagation(); pickFile(null); }}
                    className="absolute top-2 right-2 size-6 rounded-full bg-black/60 grid place-items-center text-white"
                  >
                    <X className="size-3.5" />
                  </button>
                </>
              ) : (
                <div className="text-center text-[12.5px] text-muted-foreground">
                  <Plus className="size-5 mx-auto mb-1" />
                  Click to upload (≤10MB)
                </div>
              )}
              <input
                ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <div>
              <label className="block text-[11.5px] text-muted-foreground mb-1">Handle</label>
              <div className="flex items-center h-9 rounded-md bg-surface border border-border/60 px-2.5 text-[13px]">
                <span className="text-muted-foreground">@</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                  placeholder="my_character"
                  className="flex-1 bg-transparent focus:outline-none"
                  maxLength={32}
                />
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">2-32 letters, numbers, _ or -</div>
            </div>
            <div>
              <label className="block text-[11.5px] text-muted-foreground mb-1">Description (optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="e.g. red-haired woman in denim jacket"
                className="w-full rounded-md bg-surface border border-border/60 px-2.5 py-2 text-[13px] focus:outline-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={submitCreate} disabled={busy || !file || !name}>
              {busy ? <><Loader2 className="size-3.5 animate-spin" /> Creating…</> : "Create element"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent className="max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Rename element</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center h-9 rounded-md bg-surface border border-border/60 px-2.5 text-[13px]">
              <span className="text-muted-foreground">@</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
                className="flex-1 bg-transparent focus:outline-none"
                maxLength={32}
              />
            </div>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="Description (optional)"
              className="w-full rounded-md bg-surface border border-border/60 px-2.5 py-2 text-[13px] focus:outline-none"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={submitEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
