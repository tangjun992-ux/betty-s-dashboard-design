import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2, CheckCircle2, XCircle, Clock, RotateCcw, Download, ListTodo, X } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";
import { listMyGenerations } from "@/lib/generations.functions";

type Row = Awaited<ReturnType<typeof listMyGenerations>>[number];

const KIND_LABEL: Record<string, string> = {
  image: "Image", video: "Video", audio: "Audio",
  lipsync: "Lipsync", motion: "Motion", upscale: "Upscale",
};

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export type CreateJobsRailProps = {
  /** Filter to a particular kind for tighter relevance (e.g. "image" on /create/image). */
  kind?: Row["kind"] | Row["kind"][];
  /** Called when user clicks "Use again" on a completed job. Receives the prompt + model + params. */
  onReuse?: (row: Row) => void;
  /** Max number of rows visible. */
  limit?: number;
};

/** Persistent right-side job queue for Create pages. Real-time via Supabase + polling fallback. */
export function CreateJobsRail({ kind, onReuse, limit = 12 }: CreateJobsRailProps) {
  const { user } = useSession();
  const qc = useQueryClient();
  const list = useServerFn(listMyGenerations);
  const prevStatus = useRef<Map<string, string>>(new Map());
  const [collapsed, setCollapsed] = useState(false);

  const q = useQuery({
    queryKey: ["create-jobs-rail", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: () => list(),
    refetchInterval: (qs) => {
      const rows = (qs.state.data as Row[] | undefined) ?? [];
      return rows.some((r) => r.status === "queued" || r.status === "running") ? 4000 : false;
    },
    staleTime: 8_000,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`create-jobs-rail:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "generations", filter: `user_id=eq.${user.id}` },
        () => qc.invalidateQueries({ queryKey: ["create-jobs-rail", user.id] }),
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, qc]);

  const filtered = useMemo(() => {
    const rows = q.data ?? [];
    if (!kind) return rows.slice(0, limit);
    const set = new Set(Array.isArray(kind) ? kind : [kind]);
    return rows.filter((r) => set.has(r.kind)).slice(0, limit);
  }, [q.data, kind, limit]);

  // Status-flip toasts (mirrors JobsTray but scoped to the rail's filter)
  useEffect(() => {
    const prev = prevStatus.current;
    for (const r of filtered) {
      const was = prev.get(r.id);
      if (was && was !== r.status) {
        const label = KIND_LABEL[r.kind] ?? r.kind;
        if (r.status === "succeeded") {
          toast.success(`${label} ready`, {
            id: `rail:${r.id}`,
            description: r.prompt?.slice(0, 80) || undefined,
          });
        } else if (r.status === "failed") {
          toast.error(`${label} failed`, { id: `rail:${r.id}`, description: "Credits refunded." });
        }
      }
      prev.set(r.id, r.status);
    }
  }, [filtered]);

  if (!user) return null;

  const activeCount = filtered.filter((r) => r.status === "queued" || r.status === "running").length;

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="fixed right-3 top-24 z-30 h-9 px-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/90 backdrop-blur text-[12.5px] font-medium hover:bg-surface-hover shadow-lg"
        aria-label="Open job queue"
      >
        {activeCount > 0 ? <Loader2 className="size-3.5 animate-spin" /> : <ListTodo className="size-3.5" />}
        Queue {activeCount > 0 && <span className="tabular-nums opacity-80">({activeCount})</span>}
      </button>
    );
  }

  return (
    <aside className="w-[300px] shrink-0 hidden xl:flex flex-col border-l border-border bg-surface/40 sticky top-0 self-start max-h-screen">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-semibold">
          <ListTodo className="size-4 text-muted-foreground" />
          Recent jobs
          {activeCount > 0 && (
            <span className="text-[10.5px] px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 tabular-nums">
              {activeCount} running
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="size-6 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover"
          aria-label="Collapse"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-10 text-center text-[12.5px] text-muted-foreground">
            No jobs yet. Submit a generation to see live progress here.
          </div>
        ) : (
          <ul className="p-2 space-y-1.5">
            {filtered.map((r) => (
              <JobRow key={r.id} row={r} onReuse={onReuse} />
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-border">
        <Link to="/library" className="text-[12px] text-muted-foreground hover:text-foreground">
          View all in Library →
        </Link>
      </div>
    </aside>
  );
}

function JobRow({ row, onReuse }: { row: Row; onReuse?: (r: Row) => void }) {
  const kind = KIND_LABEL[row.kind] ?? row.kind;
  const running = row.status === "queued" || row.status === "running";
  return (
    <li className="group rounded-lg p-2 hover:bg-surface-hover transition-colors">
      <div className="flex gap-2.5">
        <div className="size-12 rounded-md overflow-hidden bg-surface border border-border shrink-0 grid place-items-center relative">
          {row.thumb_url || row.asset_url ? (
            <img src={row.thumb_url ?? row.asset_url!} alt="" className="w-full h-full object-cover" />
          ) : (
            <StatusIcon status={row.status} />
          )}
          {running && (row.thumb_url || row.asset_url) && (
            <div className="absolute inset-0 bg-black/50 grid place-items-center">
              <Loader2 className="size-4 animate-spin text-white" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-medium">{kind}</span>
            <StatusBadge status={row.status} />
          </div>
          <div className="text-[11.5px] text-muted-foreground line-clamp-2 leading-snug">
            {row.prompt?.trim() || row.model}
          </div>
          <div className="mt-1 flex items-center gap-2 text-[10.5px] text-muted-foreground/80">
            <span className="inline-flex items-center gap-0.5"><Clock className="size-2.5" /> {timeAgo(row.created_at)}</span>
          </div>
        </div>
      </div>

      {running && (
        <div className="mt-2 h-1 w-full rounded-full bg-surface overflow-hidden">
          <div className="h-full w-1/3 bg-[image:var(--gradient-brand)] animate-[indeterminate_1.4s_ease-in-out_infinite]" />
        </div>
      )}

      {row.status === "succeeded" && (
        <div className="mt-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {onReuse && (
            <button
              onClick={() => onReuse(row)}
              className="h-6 px-2 rounded text-[11px] inline-flex items-center gap-1 bg-surface border border-border hover:bg-surface-hover"
            >
              <RotateCcw className="size-2.5" /> Use again
            </button>
          )}
          {row.asset_url && (
            <a
              href={row.asset_url}
              target="_blank"
              rel="noreferrer"
              className="h-6 px-2 rounded text-[11px] inline-flex items-center gap-1 bg-surface border border-border hover:bg-surface-hover"
            >
              <Download className="size-2.5" /> Open
            </a>
          )}
        </div>
      )}
    </li>
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
    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full border ${cls} capitalize leading-none`}>
      {status}
    </span>
  );
}
