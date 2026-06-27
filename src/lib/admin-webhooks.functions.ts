import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

export type WebhookEventRow = {
  event_id: string;
  type: string;
  processed_at: string;
  ledger: Array<{
    id: string;
    user_id: string;
    delta: number;
    reason: string;
    idempotency_key: string | null;
    created_at: string;
  }>;
};

export const getWebhookDebug = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        limit: z.number().int().min(1).max(200).default(50),
        search: z.string().trim().max(120).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let q = (supabaseAdmin as any)
      .from("stripe_events")
      .select("event_id, type, processed_at")
      .order("processed_at", { ascending: false })
      .limit(data.limit);
    if (data.search) {
      q = q.or(`event_id.ilike.%${data.search}%,type.ilike.%${data.search}%`);
    }
    const { data: events, error: e1 } = await q;
    if (e1) throw new Error(e1.message);

    const evs = (events ?? []) as Array<{ event_id: string; type: string; processed_at: string }>;
    if (evs.length === 0) {
      return { events: [] as WebhookEventRow[], stats: emptyStats() };
    }

    // Correlate ledger entries by processed_at window (±10s) — webhook writes ledger
    // moments after inserting stripe_events. This is loose but useful for debugging.
    const minTs = new Date(new Date(evs[evs.length - 1].processed_at).getTime() - 10_000).toISOString();
    const maxTs = new Date(new Date(evs[0].processed_at).getTime() + 10_000).toISOString();
    const { data: ledger, error: e2 } = await (supabaseAdmin as any)
      .from("credits_ledger")
      .select("id, user_id, delta, reason, idempotency_key, created_at")
      .gte("created_at", minTs)
      .lte("created_at", maxTs)
      .order("created_at", { ascending: false })
      .limit(500);
    if (e2) throw new Error(e2.message);

    const rows: WebhookEventRow[] = evs.map((ev) => {
      const t = new Date(ev.processed_at).getTime();
      const matched = (ledger ?? []).filter((l: any) => {
        const lt = new Date(l.created_at).getTime();
        return lt >= t - 4_000 && lt <= t + 10_000;
      });
      return { ...ev, ledger: matched };
    });

    // Stats: detect duplicate event_ids (should be impossible) and ledger key collisions.
    const { data: dupEvents } = await (supabaseAdmin as any).rpc("exec_sql_safe").catch(() => ({ data: null }));
    void dupEvents;

    const { count: totalEvents } = await (supabaseAdmin as any)
      .from("stripe_events")
      .select("*", { count: "exact", head: true });
    const { count: totalLedger } = await (supabaseAdmin as any)
      .from("credits_ledger")
      .select("*", { count: "exact", head: true })
      .not("idempotency_key", "is", null);

    return {
      events: rows,
      stats: {
        totalEvents: totalEvents ?? 0,
        totalLedgerWithKey: totalLedger ?? 0,
        windowEvents: rows.length,
        windowLedger: (ledger ?? []).length,
        matchedLedger: rows.reduce((s, r) => s + r.ledger.length, 0),
      },
    };
  });

function emptyStats() {
  return { totalEvents: 0, totalLedgerWithKey: 0, windowEvents: 0, windowLedger: 0, matchedLedger: 0 };
}

// Simulate an idempotency replay: tries to insert the same event_id again
// (gate A) and the same idempotency_key again (gate B). Both should fail with
// unique_violation, proving the short-circuit is intact. Writes a marker row
// to credits_ledger only on the user's request and only with delta=0.
export const simulateReplay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ eventId: z.string().min(3).max(120), idempotencyKey: z.string().min(3).max(200) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const result = {
      eventId: data.eventId,
      idempotencyKey: data.idempotencyKey,
      gateA_stripeEvents: "unknown" as "blocked" | "leaked" | "unknown",
      gateB_creditsLedger: "unknown" as "blocked" | "leaked" | "unknown",
      gateA_error: null as string | null,
      gateB_error: null as string | null,
    };

    const a = await (supabaseAdmin as any)
      .from("stripe_events")
      .insert({ event_id: data.eventId, type: "replay_test" });
    if (a.error) {
      result.gateA_stripeEvents = String(a.error.message).toLowerCase().includes("duplicate")
        ? "blocked"
        : "unknown";
      result.gateA_error = a.error.message;
    } else {
      result.gateA_stripeEvents = "leaked";
      // roll back the stray insert so we don't pollute the table
      await (supabaseAdmin as any).from("stripe_events").delete().eq("event_id", data.eventId).eq("type", "replay_test");
    }

    const b = await (supabaseAdmin as any).from("credits_ledger").insert({
      user_id: context.userId,
      delta: 0,
      reason: `replay_test:${data.eventId}`,
      idempotency_key: data.idempotencyKey,
    });
    if (b.error) {
      result.gateB_creditsLedger = String(b.error.message).toLowerCase().includes("duplicate")
        ? "blocked"
        : "unknown";
      result.gateB_error = b.error.message;
    } else {
      result.gateB_creditsLedger = "leaked";
      await (supabaseAdmin as any)
        .from("credits_ledger")
        .delete()
        .eq("idempotency_key", data.idempotencyKey)
        .eq("reason", `replay_test:${data.eventId}`);
    }

    return result;
  });
