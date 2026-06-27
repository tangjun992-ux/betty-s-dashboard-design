import { Link, useRouter } from "@tanstack/react-router";
import { Sparkles, LogOut, Sparkle, Menu, Globe, ChevronDown, Zap } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useState } from "react";
import { useSession, useProfile } from "@/lib/use-session";
import { supabase } from "@/integrations/supabase/client";
import { CreditDisplay } from "@/components/dashboard/CreditDisplay";
import { AppSidebar } from "@/components/AppSidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

const COUNTRIES = [
  { code: "US", flag: "🇺🇸", label: "United States" },
  { code: "CN", flag: "🇨🇳", label: "China" },
  { code: "JP", flag: "🇯🇵", label: "Japan" },
  { code: "GB", flag: "🇬🇧", label: "United Kingdom" },
  { code: "DE", flag: "🇩🇪", label: "Germany" },
];

export function TopBar() {
  const { user } = useSession();
  const profile = useProfile(user?.id);
  const router = useRouter();
  const [country, setCountry] = useState("US");
  const current = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];

  const credits = profile?.credits ?? 0;
  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Guest";
  const initial = (displayName[0] ?? "B").toUpperCase();

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    router.invalidate();
  }

  return (
    <header className="sticky top-0 z-30 h-14 px-3 lg:px-6 flex items-center gap-2 bg-background/75 backdrop-blur-xl border-b border-border/40">
      {/* Mobile drawer trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <button
            className="md:hidden size-9 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover"
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[260px] bg-background border-r border-border">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="h-full overflow-y-auto">
            <AppSidebar />
          </div>
        </SheetContent>
      </Sheet>

      {/* Announcement pill — hidden on small screens */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="hidden lg:flex items-center gap-2 h-9 pl-1.5 pr-3 rounded-full bg-gradient-to-r from-brand/15 via-fuchsia-500/10 to-sky-500/10 border border-brand/25"
      >
        <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-brand/25 text-[10.5px] font-semibold uppercase tracking-wide text-brand-foreground">
          <Sparkle className="size-3" /> New
        </span>
        <span className="text-[12.5px] text-foreground/90">
          Seedance 2.0 — multi-shot video is live
        </span>
        <Link to="/explore" className="text-[12.5px] font-medium text-brand hover:underline underline-offset-4">
          Try it →
        </Link>
      </motion.div>

      <div className="flex-1" />

      <div className="hidden sm:flex items-center gap-2">
        {/* Country select */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-9 px-2.5 rounded-full flex items-center gap-1.5 bg-surface/70 border border-border/60 hover:bg-surface-hover transition-colors text-[12.5px]">
              <Globe className="size-3.5 text-muted-foreground" />
              <span className="text-base leading-none">{current.flag}</span>
              <span className="font-medium hidden md:inline">{current.code}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Region</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={country} onValueChange={setCountry}>
              {COUNTRIES.map((c) => (
                <DropdownMenuRadioItem key={c.code} value={c.code} className="gap-2">
                  <span>{c.flag}</span> {c.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Create Now CTA */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/create/agent"
            className="relative h-9 pl-3 pr-3.5 rounded-full flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-foreground shadow-[var(--shadow-glow)] overflow-hidden"
            style={{ background: "var(--gradient-brand)" }}
          >
            <Zap className="size-3.5" />
            <span>Create Now</span>
            <span
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:translate-x-full transition-transform duration-700"
              aria-hidden
            />
          </Link>
        </motion.div>
      </div>

      <JobsTray />
      <CreditDisplay credits={credits} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50" aria-label="Account menu">
            <Avatar className="size-8 ring-1 ring-border/60 hover:ring-brand/50 transition">
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
            <Link to="/account/usage">Usage & credits</Link>
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
