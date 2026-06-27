import { createFileRoute, Link } from '@tanstack/react-router';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/AppShell';

export const Route = createFileRoute('/checkout/return')({
  validateSearch: (s: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof s.session_id === 'string' ? s.session_id : undefined,
  }),
  component: Return,
});

function Return() {
  const { session_id } = Route.useSearch();
  return (
    <AppShell>
      <div className="mx-auto max-w-lg px-6 py-20 text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 grid place-items-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h1 className="text-3xl font-bold">Payment received</h1>
        <p className="text-muted-foreground">
          {session_id
            ? 'Your credits will appear in your account within a few seconds.'
            : 'We could not find your checkout session.'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild><Link to="/">Back to dashboard</Link></Button>
          <Button asChild variant="outline"><Link to="/create/image">Start creating</Link></Button>
        </div>
      </div>
    </AppShell>
  );
}
