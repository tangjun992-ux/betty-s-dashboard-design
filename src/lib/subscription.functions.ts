import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { type StripeEnv, createStripeClient, getStripeErrorMessage } from "@/lib/stripe.server";

type Result = { ok: true } | { error: string };

/**
 * Switch an existing subscription to a new price with proration.
 * Stripe issues a prorated invoice immediately (`always_invoice`) so the user
 * gets charged the difference up front and access flips instantly.
 */
export const changeSubscriptionPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { newPriceId: string; environment: StripeEnv }) => {
    z.object({
      newPriceId: z.string().regex(/^[a-zA-Z0-9_-]+$/),
      environment: z.enum(["sandbox", "live"]),
    }).parse(data);
    return data;
  })
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", userId)
      .eq("environment", data.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_subscription_id) return { error: "No active subscription" };
    if (!["active", "trialing", "past_due"].includes(sub.status)) {
      return { error: `Cannot change a ${sub.status} subscription` };
    }

    try {
      const stripe = createStripeClient(data.environment);
      const prices = await stripe.prices.list({ lookup_keys: [data.newPriceId] });
      if (!prices.data.length) return { error: "Target price not found" };
      const newPrice = prices.data[0];

      const current = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
      const itemId = current.items.data[0]?.id;
      if (!itemId) return { error: "Subscription item missing" };

      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        items: [{ id: itemId, price: newPrice.id }],
        proration_behavior: "always_invoice",
        cancel_at_period_end: false,
      });
      return { ok: true };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/** Cancel at period end (keep access until current_period_end). */
export const cancelSubscriptionAtPeriodEnd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions").select("stripe_subscription_id")
      .eq("user_id", userId).eq("environment", data.environment)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!sub?.stripe_subscription_id) return { error: "No subscription" };
    try {
      const stripe = createStripeClient(data.environment);
      await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: true });
      return { ok: true };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });

/** Undo a scheduled cancellation. */
export const resumeSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { environment: StripeEnv }) => data)
  .handler(async ({ data, context }): Promise<Result> => {
    const { supabase, userId } = context;
    const { data: sub } = await supabase
      .from("subscriptions").select("stripe_subscription_id")
      .eq("user_id", userId).eq("environment", data.environment)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!sub?.stripe_subscription_id) return { error: "No subscription" };
    try {
      const stripe = createStripeClient(data.environment);
      await stripe.subscriptions.update(sub.stripe_subscription_id, { cancel_at_period_end: false });
      return { ok: true };
    } catch (error) {
      return { error: getStripeErrorMessage(error) };
    }
  });
