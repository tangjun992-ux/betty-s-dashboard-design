import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Search, Bell, Coins, ChevronRight, Sparkles, LogOut } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { useSidebarState } from "@/components/sidebar-state";
import { useSession, useProfile } from "@/lib/use-session";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Home",
  "/explore": "Explore",
  "/feed": "Feed",
  "/library": "My Library",
  "/sessions": "Sessions",
  "/tools": "All Tools",
  "/earn": "Earn",
  "/settings": "Settings",
  "/auth": "Sign in",
  "/create": "Create",
  "/create/agent": "Agent",
  "/create/image": "Image",
  "/create/video": "Video",
  "/create/lipsync": "Lipsync",
  "/create/motion": "Motion",
  "/create/avatar": "Avatar",
  "/create/audio": "Audio",
  "/create/upscale": "Upscaler",
  "/create/extract": "Extractor",
};

function useBreadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    const crumbs: { to: string; label: string }[] = [];
    let acc = "";
    for (const p of parts) {
      acc += `/${p}`;
      crumbs.push({ to: acc, label: ROUTE_LABELS[acc] ?? p.charAt(0).toUpperCase() + p.slice(1) });
    }
    return crumbs;
  }, [pathname]);
}

export function TopBar() {
  const { setPaletteOpen } = useSidebarState();
  const crumbs = useBreadcrumbs();
  const { user } = useSession();
  const profile = useProfile(user?.id);
  const router = useRouter();

  const credits = profile?.credits ?? 0;
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Guest";
  const initial = (displayName[0] ?? "B").toUpperCase();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.invalidate();
  }

  return (
    <header className="sticky top-0 z-30 h-14 px-6 lg:px-10 flex items-center gap-4 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-[13px] text-muted-foreground min-w-0">
        <Link to="/" className="hover:text-foreground transition-colors">Betty</Link>
        {crumbs.map((c, i) => (
          <span key={c.to} className="flex items-center gap-1 min-w-0">
            <ChevronRight className="size-3.5 shrink-0 opacity-60" />
            {i === crumbs.length - 1 ? (
              <span className="text-foreground truncate">{c.label}</span>
            ) : (
              <Link to={c.to} className="hover:text-foreground transition-colors truncate">{c.label}</Link>
            )}
          </span>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        className="ml-auto md:ml-0 md:flex-1 md:max-w-sm h-9 pl-9 pr-3 rounded-md bg-surface border border-border text-[13px] text-muted-foreground flex items-center relative hover:bg-surface-hover transition-colors"
        aria-label="Open command palette"
      >
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2" />
        <span className="hidden md:inline">Search or jump to…</span>
        <span className="hidden md:inline-flex ml-auto items-center gap-1 text-[10.5px] tracking-wider">
          <kbd className="px-1.5 py-0.5 rounded bg-background/60 border border-border/60">⌘</kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-background/60 border border-border/60">K</kbd>
        </span>
      </button>

      <div className="flex items-center gap-2">
        <Link
          to="/earn"
          className="h-9 px-3 rounded-md bg-surface border border-border text-[13px] flex items-center gap-1.5 hover:bg-surface-hover transition-colors"
        >
          <Coins className="size-4 text-amber-400" />
          <span className="font-medium tabular-nums">{credits}</span>
          <span className="text-muted-foreground hidden sm:inline">credits</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="size-9 grid place-items-center rounded-md bg-surface border border-border hover:bg-surface-hover transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {user && <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-brand" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <span className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{user ? "Live" : "—"}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {user ? (
              <>
                <NotifItem title="Welcome to Betty" desc="Your account is ready. You have 100 free credits to start." time="now" />
                <NotifItem title="Try the Image tool" desc="Generate your first image with Nano Banana" time="now" />
              </>
            ) : (
              <NotifItem title="Sign in to get notified" desc="Track your generations, credits and likes" time="" />
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50" aria-label="Account menu">
              <Avatar className="size-9 border border-border">
                {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
                <AvatarFallback className="bg-[image:var(--gradient-brand)] text-brand-foreground text-[12px] font-semibold">
                  {initial}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex flex-col">
              <span className="text-[13px] font-medium truncate">{displayName}</span>
              <span className="text-[11px] text-muted-foreground truncate">
                {user?.email ?? "Not signed in"}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/library"><Sparkles className="size-3.5" /> My Library</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/earn"><Coins className="size-3.5" /> Earn credits</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user ? (
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="size-3.5" /> Sign out
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link to="/auth" className="font-medium">Sign in</Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function NotifItem({ title, desc, time }: { title: string; desc: string; time: string }) {
  return (
    <DropdownMenuItem className="flex-col items-start gap-0.5 py-2.5">
      <div className="flex items-center justify-between w-full">
        <span className="text-[12.5px] font-medium">{title}</span>
        {time && <span className="text-[10.5px] text-muted-foreground">{time}</span>}
      </div>
      <span className="text-[11.5px] text-muted-foreground leading-snug">{desc}</span>
    </DropdownMenuItem>
  );
}
