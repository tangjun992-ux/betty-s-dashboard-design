import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Get usage summary (balance, 30d spend, generations, subscription). */
export const getUsageSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("get_usage_summary", {
      _user_id: context.userId,
    });
    if (error) throw new Error(error.message);
    return data as {
      balance: number;
      spent_30d: number;
      granted_30d: number;
      generations_30d: number;
      subscription: {
        price_id: string;
        status: string;
        period_end: string | null;
        cancel_at_period_end: boolean;
      } | null;
    };
  });

/** Recent ledger entries for the user. */
export const getCreditHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("credits_ledger")
      .select("id, delta, reason, ref_id, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
