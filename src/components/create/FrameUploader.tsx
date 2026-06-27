import { useRef, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { uploadVideoFrame } from "@/lib/video.functions";

interface Props {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
}

async function fileToBase64(file: File): Promise<string> {
  const buf = new Uint8Array(await file.arrayBuffer());
  let s = "";
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
  return btoa(s);
}

export function FrameUploader({ label, value, onChange, disabled }: Props) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useServerFn(uploadVideoFrame);

  async function onPick(file: File) {
    if (file.size > 10 * 1024 * 1024) { toast.error("Frame must be ≤ 10MB"); return; }
    setBusy(true);
    setPreview(URL.createObjectURL(file));
    try {
      const dataBase64 = await fileToBase64(file);
      const r = await upload({ data: { filename: file.name, contentType: file.type || "image/png", dataBase64 } });
      onChange(r.url);
    } catch (e) {
      setPreview(null);
      onChange(null);
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      disabled={disabled || busy}
      onClick={() => inputRef.current?.click()}
      className="relative w-[88px] h-[88px] rounded-xl border border-border/60 bg-white/[0.02] hover:bg-white/[0.05] flex flex-col items-center justify-center gap-1.5 text-muted-foreground transition-colors overflow-hidden"
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) void onPick(f); e.currentTarget.value = ""; }}
      />
      {preview || value ? (
        <>
          <img src={preview ?? value!} alt={label} className="absolute inset-0 w-full h-full object-cover" />
          <span className="absolute bottom-1 left-1 right-1 text-[10px] leading-tight px-1.5 py-0.5 rounded bg-black/55 text-white text-center">{label}</span>
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); setPreview(null); onChange(null); }}
            className="absolute top-1 right-1 size-5 grid place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
          >
            <X className="size-3" />
          </span>
          {busy && <span className="absolute inset-0 grid place-items-center bg-black/40"><Loader2 className="size-4 animate-spin text-white" /></span>}
        </>
      ) : (
        <>
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          <span className="text-[11px] leading-tight">{label}</span>
        </>
      )}
    </button>
  );
}
