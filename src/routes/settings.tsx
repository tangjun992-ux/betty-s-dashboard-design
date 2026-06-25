import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Settings as SettingsIcon, LogOut, Coins, User } from "lucide-react";
import { useSession, useProfile } from "@/lib/use-session";
import { updateProfile, getMyCreditHistory } from "@/lib/social.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Betty" },
      { name: "description", content: "Manage your Betty profile, plan and credits." },
      { name: "robots", content: "noindex" },
      { property: "og:url", content: "/settings" },
    ],
    links: [{ rel: "canonical", href: "/settings" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, loading } = useSession();
  const profile = useProfile(user?.id);
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setHandle(profile.handle ?? "");
      setBio((profile as { bio?: string | null }).bio ?? "");
    }
  }, [profile]);

  const updateFn = useServerFn(updateProfile);
  const historyFn = useServerFn(getMyCreditHistory);
  const history = useQuery({
    queryKey: ["credit-history", user?.id],
    queryFn: () => historyFn(),
    enabled: !!user,
  });

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!user || busy) return;
    setBusy(true);
    try {
      await updateFn({ data: { display_name: displayName, handle, bio } });
      toast.success("Profile saved");
      router.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.invalidate();
  }

  if (!user && !loading) {
    return (
      <AppShell>
        <div className="px-6 lg:px-10 py-12 max-w-md mx-auto text-center space-y-4">
          <SettingsIcon className="size-8 mx-auto text-muted-foreground" />
          <h1 className="text-xl font-semibold">Sign in to manage your account</h1>
          <Link to="/auth" className="inline-flex h-10 px-5 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-semibold">
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-6 max-w-[900px] mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <SettingsIcon className="size-5 text-muted-foreground" />
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        </div>

        <form onSubmit={saveProfile} className="rounded-xl border border-border bg-surface">
          <div className="px-5 py-3 border-b border-border text-sm font-semibold flex items-center gap-2">
            <User className="size-4" /> Profile
          </div>
          <div className="p-5 space-y-4">
            <Field label="Email" value={user?.email ?? ""} disabled />
            <Field label="Display name" value={displayName} onChange={setDisplayName} />
            <Field label="Handle" value={handle} onChange={setHandle} prefix="@" />
            <div>
              <label className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={280}
                className="w-full px-3 py-2 rounded-md bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="h-9 px-4 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-semibold disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>

        <div className="rounded-xl border border-border bg-surface">
          <div className="px-5 py-3 border-b border-border text-sm font-semibold flex items-center gap-2">
            <Coins className="size-4 text-amber-400" /> Credits
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-semibold tabular-nums">{profile?.credits ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Available credits</p>
              </div>
              <Link to="/earn" className="h-9 px-4 rounded-md border border-border bg-background text-sm hover:bg-surface-hover">
                Earn more
              </Link>
            </div>
            <div className="border-t border-border pt-3">
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Recent activity</div>
              {history.isLoading ? (
                <div className="text-xs text-muted-foreground">Loading…</div>
              ) : (history.data?.length ?? 0) === 0 ? (
                <div className="text-xs text-muted-foreground">No transactions yet.</div>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {history.data!.slice(0, 10).map((h) => (
                    <li key={h.id} className="py-2 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="text-[13px] truncate">{h.reason}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {new Date(h.created_at).toLocaleString()}
                        </div>
                      </div>
                      <span className={`tabular-nums text-[13px] font-medium ${h.delta >= 0 ? "text-emerald-400" : "text-foreground"}`}>
                        {h.delta >= 0 ? "+" : ""}{h.delta}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface">
          <div className="px-5 py-3 border-b border-border text-sm font-semibold">Session</div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <div className="text-sm">Signed in as {profile?.display_name || user?.email}</div>
              <p className="text-xs text-muted-foreground mt-1">End your session on this device.</p>
            </div>
            <button
              onClick={signOut}
              className="h-9 px-4 rounded-md border border-destructive/60 text-destructive text-sm flex items-center gap-2 hover:bg-destructive/10"
            >
              <LogOut className="size-4" /> Sign out
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Field({
  label, value, onChange, disabled, prefix,
}: { label: string; value: string; onChange?: (v: string) => void; disabled?: boolean; prefix?: string }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">{label}</label>
      <div className={`flex items-center rounded-md border border-border bg-background ${disabled ? "opacity-60" : ""}`}>
        {prefix && <span className="pl-3 text-sm text-muted-foreground">{prefix}</span>}
        <input
          value={value}
          disabled={disabled}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none"
        />
      </div>
    </div>
  );
}
