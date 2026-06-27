import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Check, Sparkles, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useStripeCheckout } from '@/hooks/useStripeCheckout';
import { useSession } from '@/lib/use-session';
import { PaymentTestModeBanner } from '@/components/PaymentTestModeBanner';
import { AppShell } from '@/components/AppShell';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/pricing')({
  component: PricingPage,
  head: () => ({
    meta: [
      { title: 'Pricing — Betty' },
      { name: 'description', content: 'Plans and credit packs to power your AI creations on Betty.' },
    ],
  }),
});

type Plan = {
  id: 'starter' | 'personal' | 'creator' | 'max';
  name: string;
  tagline: string;
  monthly: { price: number; lookup: string };
  yearly: { price: number; lookup: string };
  credits: number;
  perks: string[];
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    id: 'starter', name: 'Starter', tagline: 'For curious creators',
    monthly: { price: 20, lookup: 'betty_starter_monthly' },
    yearly: { price: 16, lookup: 'betty_starter_yearly' },
    credits: 1500,
    perks: ['1,500 credits / month', 'All free models', 'Standard generation queue', 'Community support'],
  },
  {
    id: 'personal', name: 'Personal', tagline: 'Regular makers',
    monthly: { price: 40, lookup: 'betty_personal_monthly' },
    yearly: { price: 32, lookup: 'betty_personal_yearly' },
    credits: 3500,
    perks: ['3,500 credits / month', 'Premium image & video models', 'Priority queue', 'My Elements library'],
  },
  {
    id: 'creator', name: 'Creator', tagline: 'Power creators',
    monthly: { price: 80, lookup: 'betty_creator_monthly' },
    yearly: { price: 64, lookup: 'betty_creator_yearly' },
    credits: 8000,
    perks: ['8,000 credits / month', 'All Pro models', 'Highest priority queue', 'Commercial license', 'Agent multi-turn chat'],
    highlight: true,
  },
  {
    id: 'max', name: 'Max', tagline: 'Studios & agencies',
    monthly: { price: 200, lookup: 'betty_max_monthly' },
    yearly: { price: 160, lookup: 'betty_max_yearly' },
    credits: 22000,
    perks: ['22,000 credits / month', 'Concurrent generations', 'Early access to new models', 'Dedicated support'],
  },
];

const PACKS = [
  { lookup: 'betty_credits_1000', credits: 1000, price: 15 },
  { lookup: 'betty_credits_3000', credits: 3000, price: 40 },
  { lookup: 'betty_credits_10000', credits: 10000, price: 120 },
  { lookup: 'betty_credits_30000', credits: 30000, price: 300 },
];

function PricingPage() {
  const { user } = useSession();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [yearly, setYearly] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const buy = (lookup: string) => {
    if (!user) { window.location.href = '/auth?next=/pricing'; return; }
    setLoading(lookup);
    openCheckout({
      priceId: lookup,
      customerEmail: user.email ?? undefined,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
    setTimeout(() => setLoading(null), 1500);
  };

  return (
    <AppShell>
      <PaymentTestModeBanner />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs">
            <Sparkles className="w-3.5 h-3.5" /> Pricing
          </div>
          <h1 className="text-5xl font-black tracking-tight">Pick a plan that scales with you</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Every plan unlocks the full Betty studio — Image, Video, Agent, Motion, Lipsync. Choose your monthly credits.</p>

          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-white/10 bg-white/5">
            <button
              onClick={() => setYearly(false)}
              className={cn('px-4 py-1.5 rounded-full text-sm transition', !yearly && 'bg-white text-black')}
            >Monthly</button>
            <button
              onClick={() => setYearly(true)}
              className={cn('px-4 py-1.5 rounded-full text-sm transition', yearly && 'bg-white text-black')}
            >Yearly <span className="text-xs opacity-70 ml-1">−20%</span></button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((p) => {
            const price = yearly ? p.yearly.price : p.monthly.price;
            const lookup = yearly ? p.yearly.lookup : p.monthly.lookup;
            return (
              <div
                key={p.id}
                className={cn(
                  'rounded-2xl border p-6 flex flex-col gap-4 bg-white/[0.02]',
                  p.highlight ? 'border-violet-500/60 ring-1 ring-violet-500/30' : 'border-white/10',
                )}
              >
                {p.highlight && <div className="text-xs font-medium text-violet-300">MOST POPULAR</div>}
                <div>
                  <div className="text-lg font-semibold">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.tagline}</div>
                </div>
                <div className="flex items-baseline gap-1">
                  <div className="text-4xl font-black">${price}</div>
                  <div className="text-sm text-muted-foreground">/mo</div>
                </div>
                <Button
                  onClick={() => buy(lookup)}
                  disabled={loading === lookup}
                  className={cn('w-full', p.highlight && 'bg-violet-500 hover:bg-violet-400')}
                >
                  {loading === lookup ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get started'}
                </Button>
                <ul className="space-y-2 text-sm">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />{perk}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-2">One-time credit packs</h2>
          <p className="text-sm text-muted-foreground mb-6">Top up anytime. Credits never expire.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PACKS.map((pack) => (
              <div key={pack.lookup} className="rounded-xl border border-white/10 p-5 bg-white/[0.02]">
                <div className="text-2xl font-bold">{pack.credits.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground mb-3">credits</div>
                <div className="text-lg font-semibold mb-3">${pack.price}</div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => buy(pack.lookup)} disabled={loading === pack.lookup}>
                  {loading === pack.lookup ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy pack'}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={(o) => !o && closeCheckout()}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-transparent border-0">
          <button
            onClick={closeCheckout}
            className="absolute right-3 top-3 z-10 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/70"
            aria-label="Close"
          ><X className="w-4 h-4" /></button>
          {checkoutElement}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
