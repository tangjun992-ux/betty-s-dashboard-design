import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  Settings as SettingsIcon,
  LogOut,
  Coins,
  User,
  Shield,
  Sparkles,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
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

type Section = "profile" | "credits" | "security";

const NAV: { id: Section; icon: typeof User; label: string; hint: string }[] = [
  { id: "profile", icon: User, label: "Profile", hint: "How you appear" },
  { id: "credits", icon: Coins, label: "Credits", hint: "Balance & activity" },
  { id: "security", icon: Shield, label: "Security", hint: "Account & session" },
];

function SettingsPage() {
  const { user, loading } = useSession();
  const profile = useProfile(user?.id);
  const router = useRouter();

  const [section, setSection] = useState<Section>("profile");
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
        <div className="max-w-md mx-auto py-24 px-6 text-center space-y-4">
          <div className="mx-auto size-14 rounded-2xl bg-[image:var(--gradient-brand-soft)] border border-border grid place-items-center">
            <SettingsIcon className="size-6 text-foreground/70" />
          </div>
          <h1 className="text-xl font-semibold">Sign in to manage your account</h1>
          <p className="text-sm text-muted-foreground">
            Your profile, credits and history live with your Betty account.
          </p>
          <Link
            to="/auth"
            className="inline-flex h-10 px-5 rounded-full bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-semibold shadow-[var(--shadow-glow)] items-center"
          >
            Sign in
          </Link>
        </div>
      </AppShell>
    );
  }

  const initials =
    (profile?.display_name || user?.email || "U")
      .split(/\s+/)
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <AppShell>
      <div className="relative">
        {/* Hero */}
        <div className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 0% 0%, color-mix(in oklab, var(--brand) 22%, transparent), transparent 70%)",
            }}
          />
          <div className="relative max-w-[1100px] mx-auto px-6 lg:px-10 pt-10 pb-7 flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-[image:var(--gradient-brand)] grid place-items-center text-brand-foreground font-semibold text-lg shadow-[var(--shadow-glow)]">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Account</div>
              <h1 className="mt-1 text-2xl md:text-3xl font-semibold tracking-tight truncate">
                {profile?.display_name || user?.email}
              </h1>
              <div className="text-sm text-muted-foreground">
                {profile?.handle ? `@${profile.handle}` : user?.email}
              </div>
            </div>
            <div className="ml-auto hidden md:flex items-center gap-2">
              <div className="rounded-2xl border border-border bg-surface px-4 py-2 flex items-center gap-2">
                <Coins className="size-4 text-amber-400" />
                <div className="tabular-nums text-base font-semibold">{profile?.credits ?? 0}</div>
                <div className="text-[11px] text-muted-foreground">credits</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1100px] mx-auto px-6 lg:px-10 py-6 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
          {/* Side nav */}
          <aside className="md:sticky md:top-4 h-fit">
            <nav className="rounded-2xl border border-border bg-surface p-1.5 flex md:flex-col gap-1">
              {NAV.map((n) => {
                const active = section === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => setSection(n.id)}
                    className={`flex-1 md:flex-none flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors ${
                      active
                        ? "bg-background text-foreground shadow-[0_1px_0_0_color-mix(in_oklab,var(--foreground)_8%,transparent)]"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                    }`}
                  >
                    <n.icon className={`size-4 ${active ? "text-foreground" : "text-muted-foreground"}`} />
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium">{n.label}</div>
                      <div className="hidden md:block text-[11px] text-muted-foreground">{n.hint}</div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Sections */}
          <div className="space-y-6 min-w-0">
            {section === "profile" && (
              <form onSubmit={saveProfile} className="rounded-2xl border border-border bg-surface">
                <SectionHead icon={User} title="Profile" subtitle="Public information shown on your creator page." />
                <div className="p-5 space-y-4">
                  <Field label="Email" value={user?.email ?? ""} disabled />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Display name" value={displayName} onChange={setDisplayName} />
                    <Field label="Handle" value={handle} onChange={setHandle} prefix="@" />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      rows={3}
                      maxLength={280}
                      placeholder="Tell the community what you make…"
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                    <div className="mt-1 text-[11px] text-muted-foreground text-right tabular-nums">
                      {bio.length}/280
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    {profile?.handle ? (
                      <Link
                        to="/u/$handle"
                        params={{ handle: profile.handle }}
                        className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                      >
                        View public profile <ExternalLink className="size-3" />
                      </Link>
                    ) : (
                      <span />
                    )}
                    <button
                      type="submit"
                      disabled={busy}
                      className="h-9 px-4 rounded-full bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-semibold disabled:opacity-60 shadow-[var(--shadow-glow)]"
                    >
                      {busy ? "Saving…" : "Save changes"}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {section === "credits" && (
              <>
                <div className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div className="relative p-5 flex items-end justify-between gap-4">
                    <div
                      aria-hidden
                      className="absolute inset-0 opacity-60"
                      style={{
                        background:
                          "radial-gradient(ellipse 50% 100% at 100% 100%, color-mix(in oklab, var(--brand) 28%, transparent), transparent 70%)",
                      }}
                    />
                    <div className="relative">
                      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Balance</div>
                      <div className="mt-1 text-4xl font-semibold tabular-nums flex items-baseline gap-2">
                        {profile?.credits ?? 0}
                        <span className="text-sm text-muted-foreground font-normal">credits</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Used for generation across image, video and audio tools.
                      </p>
                    </div>
                    <div className="relative flex gap-2">
                      <Link
                        to="/earn"
                        className="h-9 px-4 rounded-full border border-border bg-background text-sm hover:bg-surface-hover inline-flex items-center gap-1.5"
                      >
                        <Sparkles className="size-3.5" /> Earn
                      </Link>
                      <Link
                        to="/earn"
                        className="h-9 px-4 rounded-full bg-foreground text-background text-sm font-medium inline-flex items-center"
                      >
                        Top up
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface">
                  <SectionHead icon={Coins} title="Recent activity" subtitle="Latest credit transactions on your account." />
                  <div className="p-5">
                    {history.isLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="h-10 rounded-lg bg-background animate-pulse" />
                        ))}
                      </div>
                    ) : (history.data?.length ?? 0) === 0 ? (
                      <div className="text-sm text-muted-foreground py-6 text-center">
                        No transactions yet.
                      </div>
                    ) : (
                      <ul className="divide-y divide-border">
                        {history.data!.slice(0, 12).map((h) => {
                          const pos = h.delta >= 0;
                          return (
                            <li key={h.id} className="py-2.5 flex items-center gap-3">
                              <div
                                className={`size-8 rounded-full grid place-items-center ${
                                  pos ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                                }`}
                              >
                                {pos ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-[13px] truncate">{h.reason}</div>
                                <div className="text-[11px] text-muted-foreground">
                                  {new Date(h.created_at).toLocaleString()}
                                </div>
                              </div>
                              <span
                                className={`tabular-nums text-[13px] font-medium ${
                                  pos ? "text-emerald-400" : "text-foreground"
                                }`}
                              >
                                {pos ? "+" : ""}
                                {h.delta}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              </>
            )}

            {section === "security" && (
              <div className="rounded-2xl border border-border bg-surface">
                <SectionHead icon={Shield} title="Security" subtitle="Account session and sign-out." />
                <div className="p-5 space-y-4">
                  <Row
                    label="Signed in as"
                    value={profile?.display_name || user?.email || ""}
                    hint={user?.email ?? ""}
                  />
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <div className="text-sm font-medium">End session</div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You'll be signed out on this device.
                      </p>
                    </div>
                    <button
                      onClick={signOut}
                      className="h-9 px-4 rounded-full border border-destructive/60 text-destructive text-sm flex items-center gap-2 hover:bg-destructive/10"
                    >
                      <LogOut className="size-4" /> Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function SectionHead({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof User;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="px-5 py-3.5 border-b border-border flex items-center gap-2.5">
      <div className="size-7 rounded-lg bg-background border border-border grid place-items-center">
        <Icon className="size-3.5 text-foreground/70" />
      </div>
      <div className="min-w-0">
        <div className="text-[13px] font-semibold leading-tight">{title}</div>
        {subtitle ? <div className="text-[11.5px] text-muted-foreground">{subtitle}</div> : null}
      </div>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-[12px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-right min-w-0">
        <div className="text-sm truncate">{value}</div>
        {hint ? <div className="text-[11px] text-muted-foreground truncate">{hint}</div> : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  prefix,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  prefix?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">{label}</label>
      <div
        className={`flex items-center rounded-lg border border-border bg-background focus-within:ring-1 focus-within:ring-ring ${
          disabled ? "opacity-60" : ""
        }`}
      >
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
