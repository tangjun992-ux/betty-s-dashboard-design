import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getUsageSummary, getCreditHistory } from "@/lib/credits.functions";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/account/usage")({
  component: UsagePage,
  head: () => ({ meta: [{ title: "Usage · Betty" }] }),
});

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </Card>
  );
}

function UsagePage() {
  const router = useRouter();
  const summaryFn = useServerFn(getUsageSummary);
  const historyFn = useServerFn(getCreditHistory);

  const summary = useQuery({ queryKey: ["usage-summary"], queryFn: () => summaryFn() });
  const history = useQuery({ queryKey: ["credit-history"], queryFn: () => historyFn() });

  const s = summary.data;
  const sub = s?.subscription;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Usage & Credits</h1>
            <p className="mt-1 text-sm text-muted-foreground">Track your balance, spending, and plan.</p>
          </div>
          <Button onClick={() => router.navigate({ to: "/pricing" })}>Upgrade plan</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Current balance" value={s?.balance ?? "—"} sub="credits available" />
          <StatCard label="Spent (30d)" value={s?.spent_30d ?? "—"} />
          <StatCard label="Granted (30d)" value={s?.granted_30d ?? "—"} />
          <StatCard label="Generations (30d)" value={s?.generations_30d ?? "—"} />
        </div>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Subscription</div>
              <div className="mt-1 text-sm text-muted-foreground">
                {sub ? sub.price_id : "No active subscription"}
              </div>
            </div>
            {sub && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{sub.status}</Badge>
                {sub.period_end && (
                  <span className="text-xs text-muted-foreground">
                    {sub.cancel_at_period_end ? "Ends" : "Renews"}{" "}
                    {new Date(sub.period_end).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-border/60 text-sm font-medium">Recent activity</div>
          <div className="divide-y divide-border/60">
            {history.data?.length ? history.data.map((row) => (
              <div key={row.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <div className="font-medium">{row.reason}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </div>
                </div>
                <div className={row.delta > 0 ? "text-emerald-500 font-medium" : "text-foreground font-medium"}>
                  {row.delta > 0 ? "+" : ""}{row.delta}
                </div>
              </div>
            )) : (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                {history.isLoading ? "Loading…" : "No activity yet."}
              </div>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
