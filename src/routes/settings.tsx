import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Betty" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-6 max-w-[900px] mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        </div>

        {[
          { title: "Profile", rows: [["Display name", "Guest"], ["Email", "not signed in"]] },
          { title: "Billing", rows: [["Plan", "Free"], ["Credits", "120"]] },
          { title: "Preferences", rows: [["Theme", "Dark"], ["Language", "English"]] },
        ].map((s) => (
          <div key={s.title} className="rounded-xl border border-border bg-surface">
            <div className="px-5 py-3 border-b border-border text-sm font-semibold">{s.title}</div>
            <div className="divide-y divide-border">
              {s.rows.map(([k, v]) => (
                <div key={k} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
