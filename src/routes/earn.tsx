import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Trophy } from "lucide-react";
import bannerEarn from "@/assets/banner-earn.jpg";

export const Route = createFileRoute("/earn")({
  head: () => ({ meta: [{ title: "Earn — Betty" }] }),
  component: EarnPage,
});

const campaigns = [
  { brand: "Acme Sneakers", reward: "$500", brief: "30s UGC video featuring the new Acme Drift sneakers.", spots: 12 },
  { brand: "Lumen Skincare", reward: "$300", brief: "Lipsync ad in your own voice promoting Lumen serum.", spots: 5 },
  { brand: "Nova Coffee", reward: "$150", brief: "Stylized product shots for Nova cold brew.", spots: 24 },
];

function EarnPage() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-6 max-w-[1400px] mx-auto space-y-8">
        <div className="relative rounded-2xl overflow-hidden border border-border">
          <img src={bannerEarn} className="absolute inset-0 w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          <div className="relative p-8 lg:p-12 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-3">
              <Trophy className="size-3" /> Betty Earn
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">Get paid to create with AI</h1>
            <p className="mt-2 text-sm text-muted-foreground">Pick a brand campaign, generate the deliverable in Betty, and earn rewards on approval.</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Active campaigns</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((c) => (
              <div key={c.brand} className="rounded-xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{c.brand}</div>
                  <div className="text-emerald-400 font-semibold text-sm">{c.reward}</div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{c.brief}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{c.spots} spots left</span>
                  <button className="h-8 px-3 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-xs font-medium shadow-[var(--shadow-glow)]">Apply</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
