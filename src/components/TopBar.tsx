import { Link } from "@tanstack/react-router";
import { Search, Bell, Coins } from "lucide-react";

export function TopBar() {
  return (
    <header className="sticky top-0 z-30 h-14 px-6 lg:px-10 flex items-center gap-4 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="relative flex-1 max-w-xl">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search tools, prompts, creators…"
          className="w-full h-9 pl-9 pr-3 rounded-md bg-surface border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>
      <div className="flex items-center gap-2">
        <button className="h-9 px-3 rounded-md bg-surface border border-border text-sm flex items-center gap-1.5 hover:bg-surface-hover">
          <Coins className="size-4 text-amber-400" />
          <span className="font-medium">120</span>
          <span className="text-muted-foreground">credits</span>
        </button>
        <button className="size-9 grid place-items-center rounded-md bg-surface border border-border hover:bg-surface-hover">
          <Bell className="size-4" />
        </button>
        <Link
          to="/auth"
          className="h-9 px-4 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-medium flex items-center shadow-[var(--shadow-glow)] hover:opacity-95"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
