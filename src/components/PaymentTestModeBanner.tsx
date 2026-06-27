const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full bg-red-500/10 border-b border-red-500/30 px-4 py-2 text-center text-xs text-red-300">
        Production checkout not configured. Complete Stripe go-live to accept real payments.
      </div>
    );
  }
  if (clientToken.startsWith('pk_test_')) {
    return (
      <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-200">
        Preview is in test mode — use Stripe test card 4242 4242 4242 4242.
      </div>
    );
  }
  return null;
}
