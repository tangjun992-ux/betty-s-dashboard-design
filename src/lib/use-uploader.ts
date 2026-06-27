import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type UploadItem = {
  id: string;
  file: File;
  name: string;
  size: number;
  kind: "image" | "video" | "audio" | "other";
  progress: number; // 0..1
  status: "queued" | "uploading" | "saving" | "done" | "error";
  error?: string;
  url?: string;
  generationId?: string;
};

type GenInsert = Database["public"]["Tables"]["generations"]["Insert"];

function kindOf(file: File): UploadItem["kind"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "other";
}

function rid() {
  return Math.random().toString(36).slice(2, 10);
}

const MAX_BYTES = 200 * 1024 * 1024; // 200MB hard cap per file

async function putWithProgress(url: string, file: File, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText.slice(0, 200)}`));
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(file);
  });
}

export function useUploader() {
  const [items, setItems] = useState<UploadItem[]>([]);

  const update = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  const clearDone = useCallback(() => {
    setItems((prev) => prev.filter((it) => it.status !== "done"));
  }, []);

  const start = useCallback(
    async (files: File[]) => {
      const { data: ses } = await supabase.auth.getUser();
      const user = ses.user;
      if (!user) {
        toast.error("Please sign in to upload");
        return;
      }

      const queued: UploadItem[] = [];
      for (const f of files) {
        if (f.size > MAX_BYTES) {
          toast.error(`${f.name} exceeds 200 MB`);
          continue;
        }
        queued.push({
          id: rid(),
          file: f,
          name: f.name,
          size: f.size,
          kind: kindOf(f),
          progress: 0,
          status: "queued",
        });
      }
      if (!queued.length) return;
      setItems((prev) => [...queued, ...prev]);

      // Upload in parallel (max 3)
      const queue = [...queued];
      const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
        while (queue.length) {
          const it = queue.shift()!;
          try {
            update(it.id, { status: "uploading" });
            const safeName = it.file.name.replace(/[^\w.\-]+/g, "_");
            const path = `${user.id}/uploads/${Date.now()}_${rid()}_${safeName}`;

            const { data: signed, error: signErr } = await supabase.storage
              .from("generations")
              .createSignedUploadUrl(path);
            if (signErr || !signed) throw signErr ?? new Error("Could not get upload URL");

            await putWithProgress(signed.signedUrl, it.file, (p) =>
              update(it.id, { progress: p }),
            );

            const { data: pub } = supabase.storage.from("generations").getPublicUrl(path);
            const publicUrl = pub.publicUrl;

            update(it.id, { status: "saving", progress: 1, url: publicUrl });

            const kindForDb: GenInsert["kind"] | null =
              it.kind === "image" || it.kind === "video" || it.kind === "audio" ? it.kind : null;

            if (!kindForDb) {
              update(it.id, { status: "done" });
              continue;
            }

            const insert: GenInsert = {
              user_id: user.id,
              kind: kindForDb,
              model: "upload",
              prompt: it.file.name,
              status: "succeeded",
              asset_url: publicUrl,
              thumb_url: kindForDb === "image" ? publicUrl : null,
              is_public: false,
              params: { source: "upload", size: it.size, mime: it.file.type } as GenInsert["params"],
            };

            const { data: row, error: insErr } = await supabase
              .from("generations")
              .insert(insert)
              .select("id")
              .single();
            if (insErr) throw insErr;

            update(it.id, { status: "done", generationId: row.id });
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            update(it.id, { status: "error", error: msg });
            toast.error(`Upload failed: ${it.name}`, { description: msg });
          }
        }
      });
      await Promise.all(workers);
      toast.success("Uploads complete");
    },
    [update],
  );

  return { items, start, remove, clearDone };
}
