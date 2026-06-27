import { createFileRoute } from '@tanstack/react-router';
import { createClient } from '@supabase/supabase-js';
import { type StripeEnv, verifyWebhook, CREDIT_GRANTS } from '@/lib/stripe.server';

let _supabase: any = null;
function db(): any {
  if (!_supabase) {
    _supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  }
  return _supabase;
}

function resolveLookupKey(item: any): string | undefined {
  return item?.price?.lookup_key || item?.price?.metadata?.lovable_external_id;
}

async function grantCredits(opts: { userId: string; amount: number; reason: string; key: string }) {
  // insert is no-op if idempotency_key already exists
  const { error } = await db().from('credits_ledger').insert({
    user_id: opts.userId,
    delta: opts.amount,
    reason: opts.reason,
    idempotency_key: opts.key,
  } as any);
  if (error && !String(error.message).includes('duplicate')) {
    console.error('grantCredits error', error);
    return;
  }
  // bump profile credits cache
  const { data: profile } = await db()
    .from('profiles').select('credits').eq('id', opts.userId).maybeSingle();
  const current = (profile?.credits as number | undefined) ?? 0;
  await db().from('profiles').update({ credits: current + opts.amount } as any).eq('id', opts.userId);
}

async function alreadyProcessed(eventId: string, type: string): Promise<boolean> {
  const { error } = await db().from('stripe_events').insert({ event_id: eventId, type } as any);
  if (error) {
    if (String(error.message).includes('duplicate')) return true;
    console.error('stripe_events insert error', error);
  }
  return false;
}

async function handleSubscriptionUpsert(sub: any, env: StripeEnv) {
  const userId = sub.metadata?.userId;
  if (!userId) return;
  const item = sub.items?.data?.[0];
  const priceId = resolveLookupKey(item) || item?.price?.id;
  const productId = typeof item?.price?.product === 'string' ? item.price.product : item?.price?.product?.id;
  const periodStart = item?.current_period_start ?? sub.current_period_start;
  const periodEnd = item?.current_period_end ?? sub.current_period_end;

  await db().from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: sub.id,
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer?.id,
      product_id: productId,
      price_id: priceId,
      status: sub.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
      environment: env,
      updated_at: new Date().toISOString(),
    } as any,
    { onConflict: 'stripe_subscription_id' },
  );
}

async function handleInvoicePaid(invoice: any, env: StripeEnv, eventId: string) {
  const line = invoice.lines?.data?.[0];
  const priceId = resolveLookupKey(line) || line?.price?.id;
  const userId = invoice.subscription_details?.metadata?.userId || invoice.metadata?.userId;
  if (!userId || !priceId) return;
  const grant = CREDIT_GRANTS[priceId];
  if (!grant) return;
  await grantCredits({
    userId,
    amount: grant,
    reason: `subscription:${priceId}`,
    key: `invoice:${invoice.id}:${env}`,
  });
}

async function handleCheckoutCompleted(session: any, env: StripeEnv, eventId: string) {
  if (session.mode !== 'payment') return; // subscriptions handled via invoice.paid
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  if (!userId || !priceId) return;
  const grant = CREDIT_GRANTS[priceId];
  if (!grant) return;
  await grantCredits({
    userId,
    amount: grant,
    reason: `pack:${priceId}`,
    key: `checkout:${session.id}:${env}`,
  });
}

async function handle(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  if (await alreadyProcessed(event.id, event.type)) return;

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpsert(event.data.object, env);
      break;
    case 'customer.subscription.deleted':
      await db().from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() } as any)
        .eq('stripe_subscription_id', event.data.object.id)
        .eq('environment', env);
      break;
    case 'invoice.paid':
    case 'invoice.payment_succeeded':
      await handleInvoicePaid(event.data.object, env, event.id);
      break;
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object, env, event.id);
      break;
    default:
      // ignore
      break;
  }
}

export const Route = createFileRoute('/api/public/payments/webhook')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = new URL(request.url).searchParams.get('env');
        if (raw !== 'sandbox' && raw !== 'live') {
          return Response.json({ received: true, ignored: 'invalid env' });
        }
        try {
          await handle(request, raw);
          return Response.json({ received: true });
        } catch (e) {
          console.error('Webhook error:', e);
          return new Response('Webhook error', { status: 400 });
        }
      },
    },
  },
});
