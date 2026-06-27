import { useCallback, useState } from 'react';
import { StripeEmbeddedCheckout } from '@/components/StripeEmbeddedCheckout';

interface Opts {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function useStripeCheckout() {
  const [opts, setOpts] = useState<Opts | null>(null);
  const open = useCallback((o: Opts) => setOpts(o), []);
  const close = useCallback(() => setOpts(null), []);
  const element = opts ? <StripeEmbeddedCheckout {...opts} /> : null;
  return { openCheckout: open, closeCheckout: close, isOpen: !!opts, checkoutElement: element };
}
