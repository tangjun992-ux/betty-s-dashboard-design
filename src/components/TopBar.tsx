import { Link, useRouter } from "@tanstack/react-router";
import { Coins, Sparkles, LogOut } from "lucide-react";
import { toast } from "sonner";
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

export function TopBar() {
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
    <header className="sticky top-0 z-30 h-14 px-4 lg:px-6 flex items-center justify-end gap-2 bg-background/80 backdrop-blur">
      <Link
        to="/earn"
        className="h-8 px-2.5 rounded-full text-[12px] flex items-center gap-1.5 text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors"
        aria-label={`${credits} credits`}
      >
        <Coins className="size-3.5 text-amber-400" />
        <span className="font-medium tabular-nums text-foreground">{credits}</span>
      </Link>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50" aria-label="Account menu">
            <Avatar className="size-8">
              {profile?.avatar_url ? <AvatarImage src={profile.avatar_url} alt="" /> : null}
              <AvatarFallback className="bg-[image:var(--gradient-brand)] text-brand-foreground text-[11px] font-semibold">
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
    </header>
  );
}
