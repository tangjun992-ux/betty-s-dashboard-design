/**
 * Server-only credit helpers backed by atomic RPCs.
 * Use these inside generation handlers instead of manual ledger writes.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function consumeCredits(
  supabase: SupabaseClient,
  opts: { userId: string; amount: number; reason: string; refId?: string; idem?: string },
): Promise<number> {
  const { data, error } = await supabase.rpc("consume_credits", {
    _user_id: opts.userId,
    _amount: opts.amount,
    _reason: opts.reason,
    _ref_id: opts.refId ?? null,
    _idem: opts.idem ?? null,
  });
  if (error) {
    if (error.message?.includes("insufficient_credits")) {
      throw new Error(`Need ${opts.amount} credits — please upgrade or top up.`);
    }
    throw new Error(error.message);
  }
  return data as number;
}

export async function refundCredits(
  supabase: SupabaseClient,
  opts: { userId: string; amount: number; reason: string; refId?: string; idem?: string },
): Promise<number> {
  const { data, error } = await supabase.rpc("refund_credits", {
    _user_id: opts.userId,
    _amount: opts.amount,
    _reason: opts.reason,
    _ref_id: opts.refId ?? null,
    _idem: opts.idem ?? null,
  });
  if (error) throw new Error(error.message);
  return data as number;
}
