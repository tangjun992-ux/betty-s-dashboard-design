import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Coins, Clock } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { useSession, useProfile } from "@/lib/use-session";

const LOW_CREDIT_THRESHOLD = 50;

export function SubscriptionBanner() {
  const { user } = useSession();
  const profile = useProfile(user?.id);
  const { subscription: sub } = useSubscription();

  const variant = useMemo(() => {
    if (!user) return null;
    if (sub?.status === "past_due") return "past_due" as const;
    if (sub?.cancel_at_period_end && sub.current_period_end) return "ending" as const;
    if ((profile?.credits ?? 0) < LOW_CREDIT_THRESHOLD) return "low_credit" as const;
    return null;
  }, [user, sub, profile?.credits]);

  if (!variant) return null;

  if (variant === "past_due") {
    return (
      <Banner tone="danger" icon={<AlertTriangle className="size-4" />}>
        <span>
          Your last payment failed. We're retrying — please update your payment method to keep your plan active.
        </span>
        <Action to="/account/usage">Manage billing</Action>
      </Banner>
    );
  }
  if (variant === "ending") {
    const end = sub!.current_period_end ? new Date(sub!.current_period_end).toLocaleDateString() : "";
    return (
      <Banner tone="warning" icon={<Clock className="size-4" />}>
        <span>Your plan ends on {end}. You can resume anytime before then.</span>
        <Action to="/account/usage">Resume plan</Action>
      </Banner>
    );
  }
  return (
    <Banner tone="info" icon={<Coins className="size-4" />}>
      <span>Only <b className="tabular-nums">{profile?.credits ?? 0}</b> credits left. Top up to avoid interruptions.</span>
      <Action to="/pricing">Top up</Action>
    </Banner>
  );
}

function Banner({ tone, icon, children }: { tone: "danger" | "warning" | "info"; icon: React.ReactNode; children: React.ReactNode }) {
  const cls =
    tone === "danger" ? "bg-red-500/10 border-red-500/30 text-red-200"
    : tone === "warning" ? "bg-amber-500/10 border-amber-500/30 text-amber-100"
    : "bg-brand/10 border-brand/30 text-foreground";
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-2 border-b text-[12.5px] ${cls}`}>
      <div className="flex items-center gap-2 min-w-0">{icon}<div className="truncate">{children}</div></div>
    </div>
  );
}

function Action({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="shrink-0 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-foreground text-[12px] font-medium">
      {children}
    </Link>
  );
}
