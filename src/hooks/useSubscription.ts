import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/use-session';
import { getStripeEnvironment } from '@/lib/stripe';

export type SubscriptionRow = {
  status: string;
  price_id: string;
  product_id: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export function useSubscription() {
  const { user } = useSession();
  const [sub, setSub] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let env: 'sandbox' | 'live' | null = null;
    try { env = getStripeEnvironment(); } catch { /* not configured */ }
    if (!user || !env) { setSub(null); setLoading(false); return; }

    let cancelled = false;
    const fetchSub = async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('status, price_id, product_id, current_period_end, cancel_at_period_end')
        .eq('user_id', user.id)
        .eq('environment', env!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) { setSub(data as SubscriptionRow | null); setLoading(false); }
    };
    fetchSub();

    const channel = supabase
      .channel(`sub:${user.id}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'subscriptions', filter: `user_id=eq.${user.id}` },
        fetchSub)
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [user]);

  const isActive = !!sub && (
    (['active', 'trialing', 'past_due'].includes(sub.status) &&
      (!sub.current_period_end || new Date(sub.current_period_end) > new Date())) ||
    (sub.status === 'canceled' && sub.current_period_end && new Date(sub.current_period_end) > new Date())
  );

  return { subscription: sub, isActive, loading };
}
