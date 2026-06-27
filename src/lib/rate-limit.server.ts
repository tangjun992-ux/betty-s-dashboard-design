/**
 * Postgres-based fixed-window rate limiter. Server-only.
 * Throws a user-facing Error with HTTP 429-style message when over budget.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export async function enforceRateLimit(
  supabase: SupabaseClient,
  userId: string,
  bucket: string,
  max: number,
  windowSeconds: number,
) {
  const { data, error } = await supabase.rpc("rate_limit_check", {
    _user_id: userId,
    _bucket: bucket,
    _max: max,
    _window_seconds: windowSeconds,
  });
  if (error) {
    // fail-open: a limiter outage must not block paid work
    console.warn("[rate-limit] check failed:", error.message);
    return;
  }
  if (data === false) {
    throw new Error(
      `Rate limit exceeded for ${bucket}. Please wait a moment and try again.`,
    );
  }
}
