import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import { getStripe, getStripeEnvironment } from '@/lib/stripe';
import { createCheckoutSession } from '@/lib/payments.functions';

interface Props {
  priceId: string;
  quantity?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({ priceId, quantity, customerEmail, userId, returnUrl }: Props) {
  const fetchClientSecret = async (): Promise<string> => {
    const res = await createCheckoutSession({
      data: {
        priceId,
        quantity,
        customerEmail,
        userId,
        returnUrl: returnUrl || `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
        environment: getStripeEnvironment(),
      },
    });
    if ('error' in res) throw new Error(res.error);
    if (!res.clientSecret) throw new Error('Stripe did not return a client secret');
    return res.clientSecret;
  };

  return (
    <div id="checkout" className="rounded-2xl overflow-hidden bg-white">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
