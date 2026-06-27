import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, ListTodo, CheckCircle2, XCircle, ChevronDown, Clock } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { listMyGenerations } from "@/lib/generations.functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Row = Awaited<ReturnType<typeof listMyGenerations>>[number];

const KIND_LABEL: Record<string, string> = {
  image: "Image",
  video: "Video",
  audio: "Audio",
  lipsync: "Lipsync",
  motion: "Motion",
  upscale: "Upscale",
};

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function JobsTray() {
  const { user } = useSession();
  const qc = useQueryClient();
  const list = useServerFn(listMyGenerations);
  const [open, setOpen] = useState(false);
  const prevStatus = useRef<Map<string, string>>(new Map());

  const q = useQuery({
    queryKey: ["jobs-tray", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: () => list(),
    refetchInterval: (qs) => {
      const rows = (qs.state.data as Row[] | undefined) ?? [];
      return rows.some((r) => r.status === "queued" || r.status === "running") ? 5000 : false;
    },
    staleTime: 10_000,
  });

  // Realtime → invalidate
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`jobs-tray:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "generations", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["jobs-tray", user.id] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  // Status-transition toasts
  const rows = q.data ?? [];
  useEffect(() => {
    const prev = prevStatus.current;
    for (const r of rows) {
      const was = prev.get(r.id);
      if (was && was !== r.status) {
        const label = KIND_LABEL[r.kind] ?? r.kind;
        if (r.status === "succeeded") {
          toast.success(`${label} ready`, {
            id: `job:${r.id}`,
            description: r.prompt?.slice(0, 80) || undefined,
            action: r.asset_url ? { label: "Open", onClick: () => window.open(r.asset_url!, "_blank") } : undefined,
          });
        } else if (r.status === "failed") {
          toast.error(`${label} failed`, {
            id: `job:${r.id}`,
            description: (r.error ?? "").slice(0, 120) || "Credits were refunded.",
          });
        }
      }
      prev.set(r.id, r.status);
    }
  }, [rows]);

  const active = useMemo(() => rows.filter((r) => r.status === "queued" || r.status === "running"), [rows]);
  const recent = useMemo(() => rows.slice(0, 8), [rows]);

  if (!user) return null;

  const count = active.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative h-8 px-2.5 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface hover:bg-surface-hover text-[12.5px] font-medium"
          aria-label="Jobs"
        >
          {count > 0 ? (
            <Loader2 className="size-3.5 animate-spin text-foreground/80" />
          ) : (
            <ListTodo className="size-3.5 text-muted-foreground" />
          )}
          <span className="tabular-nums">{count > 0 ? `${count} running` : "Jobs"}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-[image:var(--gradient-brand)]" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0 overflow-hidden">
        <div className="px-3.5 py-2.5 border-b border-border flex items-center justify-between">
          <div className="text-[13px] font-semibold">Jobs</div>
          <Link to="/library" onClick={() => setOpen(false)} className="text-[12px] text-muted-foreground hover:text-foreground">
            View library →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-10 text-center text-[12.5px] text-muted-foreground">No recent jobs</div>
        ) : (
          <ul className="max-h-[380px] overflow-y-auto divide-y divide-border">
            {recent.map((r) => {
              const kind = KIND_LABEL[r.kind] ?? r.kind;
              return (
                <li key={r.id} className="px-3.5 py-2.5 flex items-center gap-3">
                  <div className="size-10 rounded-md overflow-hidden bg-surface border border-border shrink-0 grid place-items-center">
                    {r.thumb_url || r.asset_url ? (
                      <img src={r.thumb_url ?? r.asset_url!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <StatusIcon status={r.status} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12.5px] font-medium">{kind}</span>
                      <StatusBadge status={r.status} />
                    </div>
                    <div className="text-[11.5px] text-muted-foreground truncate">
                      {r.prompt?.trim() || r.model}
                    </div>
                    <div className="text-[11px] text-muted-foreground/80 mt-0.5 inline-flex items-center gap-1">
                      <Clock className="size-2.5" /> {timeAgo(r.created_at)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function StatusIcon({ status }: { status: string }) {
  if (status === "succeeded") return <CheckCircle2 className="size-4 text-emerald-400" />;
  if (status === "failed") return <XCircle className="size-4 text-destructive" />;
  return <Loader2 className="size-4 animate-spin text-muted-foreground" />;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    queued: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    running: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    succeeded: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    failed: "bg-destructive/15 text-destructive border-destructive/30",
  };
  const cls = map[status] ?? "bg-surface text-muted-foreground border-border";
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${cls} capitalize`}>{status}</span>
  );
}
