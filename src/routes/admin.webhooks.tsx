import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRight, RefreshCw, ShieldCheck, ShieldAlert, Search, Download } from "lucide-react";
import { getWebhookDebug, simulateReplay, type WebhookEventRow } from "@/lib/admin-webhooks.functions";
import { AppShell } from "@/components/AppShell";

function csvCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = typeof v === "string" ? v : typeof v === "number" || typeof v === "boolean" ? String(v) : JSON.stringify(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function buildCsv(events: WebhookEventRow[]): string {
  const header = [
    "event_id",
    "event_type",
    "processed_at",
    "ledger_id",
    "ledger_created_at",
    "user_id",
    "delta",
    "reason",
    "idempotency_key",
  ];
  const lines: string[] = [header.join(",")];
  for (const ev of events) {
    if (ev.ledger.length === 0) {
      lines.push([ev.event_id, ev.type, ev.processed_at, "", "", "", "", "", ""].map(csvCell).join(","));
    } else {
      for (const l of ev.ledger) {
        lines.push(
          [ev.event_id, ev.type, ev.processed_at, l.id, l.created_at, l.user_id, l.delta, l.reason, l.idempotency_key]
            .map(csvCell)
            .join(","),
        );
      }
    }
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const Route = createFileRoute("/admin/webhooks")({
  component: WebhookDebugPage,
});

function WebhookDebugPage() {
  const fetchDebug = useServerFn(getWebhookDebug);
  const runReplay = useServerFn(simulateReplay);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const q = useQuery({
    queryKey: ["admin-webhook-debug", search],
    queryFn: () => fetchDebug({ data: { limit: 50, search: search || undefined } }),
    refetchInterval: 15_000,
  });

  const replay = useMutation({
    mutationFn: (vars: { eventId: string; idempotencyKey: string }) => runReplay({ data: vars }),
    onSuccess: (r) => {
      const ok = r.gateA_stripeEvents === "blocked" && r.gateB_creditsLedger === "blocked";
      toast[ok ? "success" : "error"](
        ok ? "Idempotency intact ✓ both gates blocked the replay" : "Replay leaked — inspect gates below",
      );
    },
    onError: (e: any) => toast.error(e?.message ?? "Replay failed"),
  });

  const isForbidden = q.error && /forbidden/i.test(String((q.error as Error).message));

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Webhook Debug</h1>
            <p className="text-sm text-muted-foreground">
              Stripe events, idempotency outcomes, and the credits_ledger rows they produced.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => q.refetch()} disabled={q.isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${q.isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </header>

        {isForbidden ? (
          <Card className="p-6 text-sm text-muted-foreground">
            403 — admin role required. Grant your user the <code>admin</code> role in <code>user_roles</code> to view this page.
          </Card>
        ) : (
          <>
            <StatsRow stats={q.data?.stats} loading={q.isLoading} />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by event_id or type (e.g. invoice.paid)"
                className="pl-9"
              />
            </div>

            <Card className="overflow-hidden">
              <div className="grid grid-cols-12 border-b px-4 py-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <div className="col-span-1"></div>
                <div className="col-span-5">event_id</div>
                <div className="col-span-3">type</div>
                <div className="col-span-2">processed_at</div>
                <div className="col-span-1 text-right">ledger</div>
              </div>
              {q.isLoading ? (
                <div className="p-6 text-sm text-muted-foreground">Loading…</div>
              ) : (q.data?.events ?? []).length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No events yet.</div>
              ) : (
                (q.data?.events ?? []).map((ev) => (
                  <EventRow
                    key={ev.event_id}
                    ev={ev}
                    open={!!open[ev.event_id]}
                    onToggle={() => setOpen((s) => ({ ...s, [ev.event_id]: !s[ev.event_id] }))}
                    onReplay={(idem) =>
                      replay.mutate({ eventId: ev.event_id, idempotencyKey: idem })
                    }
                    replayPending={replay.isPending}
                  />
                ))
              )}
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatsRow({
  stats,
  loading,
}: {
  stats?: { totalEvents: number; totalLedgerWithKey: number; windowEvents: number; windowLedger: number; matchedLedger: number };
  loading: boolean;
}) {
  const cells = [
    { label: "Total events", value: stats?.totalEvents },
    { label: "Ledger w/ idem key", value: stats?.totalLedgerWithKey },
    { label: "Window events", value: stats?.windowEvents },
    { label: "Window ledger", value: stats?.windowLedger },
    { label: "Matched ledger", value: stats?.matchedLedger },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cells.map((c) => (
        <Card key={c.label} className="p-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</div>
          <div className="mt-1 text-xl font-semibold tabular-nums">{loading ? "—" : c.value ?? 0}</div>
        </Card>
      ))}
    </div>
  );
}

function EventRow({
  ev,
  open,
  onToggle,
  onReplay,
  replayPending,
}: {
  ev: WebhookEventRow;
  open: boolean;
  onToggle: () => void;
  onReplay: (idempotencyKey: string) => void;
  replayPending: boolean;
}) {
  const grantedCredits = useMemo(() => ev.ledger.reduce((s, l) => s + (l.delta || 0), 0), [ev.ledger]);
  const ts = new Date(ev.processed_at);
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={onToggle}
        className="grid w-full grid-cols-12 items-center gap-2 px-4 py-3 text-left text-sm transition hover:bg-muted/40"
      >
        <div className="col-span-1">
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
        <div className="col-span-5 truncate font-mono text-xs">{ev.event_id}</div>
        <div className="col-span-3">
          <Badge variant="secondary" className="font-mono text-[10px]">{ev.type}</Badge>
        </div>
        <div className="col-span-2 text-xs text-muted-foreground tabular-nums">
          {ts.toLocaleTimeString()} · {ts.toLocaleDateString()}
        </div>
        <div className="col-span-1 text-right">
          {ev.ledger.length > 0 ? (
            <Badge className="bg-emerald-600/15 text-emerald-400 hover:bg-emerald-600/15">
              +{grantedCredits}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">no-op</Badge>
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-3 bg-muted/20 px-4 py-4 text-sm">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Idempotency gate A (stripe_events PK) — passed once, future replays of{" "}
            <code className="font-mono">{ev.event_id}</code> short-circuit.
          </div>

          {ev.ledger.length === 0 ? (
            <div className="text-xs text-muted-foreground">
              No credits_ledger rows matched this event window. (Subscription lifecycle event, or no grant rule for this price.)
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <div className="grid grid-cols-12 border-b bg-muted/40 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <div className="col-span-4">idempotency_key</div>
                <div className="col-span-3">reason</div>
                <div className="col-span-2">user</div>
                <div className="col-span-1 text-right">Δ</div>
                <div className="col-span-2 text-right">replay test</div>
              </div>
              {ev.ledger.map((l) => (
                <div key={l.id} className="grid grid-cols-12 items-center gap-2 px-3 py-2 text-xs">
                  <div className="col-span-4 truncate font-mono">{l.idempotency_key ?? "—"}</div>
                  <div className="col-span-3 truncate text-muted-foreground">{l.reason}</div>
                  <div className="col-span-2 truncate font-mono text-muted-foreground">{l.user_id.slice(0, 8)}…</div>
                  <div className={`col-span-1 text-right font-semibold tabular-nums ${l.delta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {l.delta >= 0 ? "+" : ""}{l.delta}
                  </div>
                  <div className="col-span-2 text-right">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-[11px]"
                      disabled={!l.idempotency_key || replayPending}
                      onClick={() => l.idempotency_key && onReplay(l.idempotency_key)}
                    >
                      <ShieldAlert className="mr-1 h-3 w-3" />
                      Test gates
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
