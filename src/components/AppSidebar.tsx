import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Compass,
  FolderOpen,
  Sparkles,
  Image as ImageIcon,
  Video,
  Mic2,
  Activity,
  AudioLines,
  Maximize2,
  ScanLine,
  Wrench,
  Trophy,
  Settings,
  ChevronDown,
  Plus,
  Search,
  PanelLeft,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { useState } from "react";

const mainNav = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/library", icon: FolderOpen, label: "My Library" },
  { to: "/tools", icon: Wrench, label: "All Tools" },
  { to: "/earn", icon: Trophy, label: "Earn" },
] as const;

const toolsNav = [
  { to: "/create/agent", icon: Sparkles, label: "Agent" },
  { to: "/create/image", icon: ImageIcon, label: "Image" },
  { to: "/create/video", icon: Video, label: "Video" },
  { to: "/create/lipsync", icon: Mic2, label: "Lipsync" },
  { to: "/create/motion", icon: Activity, label: "Motion" },
  { to: "/create/audio", icon: AudioLines, label: "Audio" },
  { to: "/create/upscale", icon: Maximize2, label: "Upscaler" },
  { to: "/create/extract", icon: ScanLine, label: "Extractor" },
] as const;

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [toolsExpanded, setToolsExpanded] = useState(true);

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-background h-screen sticky top-0">
      <div className="flex items-center justify-between px-4 h-14 border-b border-border/60">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-[image:var(--gradient-brand)] grid place-items-center text-brand-foreground font-bold shadow-[var(--shadow-glow)]">
            b
          </div>
          <span className="text-[17px] font-semibold tracking-tight">betty</span>
        </Link>
        <button className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover">
          <PanelLeft className="size-4" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-hide px-2 py-3 space-y-6">
        <div className="space-y-0.5">
          {mainNav.map((item) => (
            <NavLink key={item.to} {...item} active={pathname === item.to} />
          ))}
        </div>

        <Section title="Tools" action={<Search className="size-3.5" />}>
          {(toolsExpanded ? toolsNav : toolsNav.slice(0, 3)).map((item) => (
            <NavLink
              key={item.to}
              {...item}
              active={pathname === item.to}
            />
          ))}
          <button
            onClick={() => setToolsExpanded((v) => !v)}
            className="w-full flex items-center gap-3 px-3 h-9 rounded-md text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
          >
            <ChevronDown className={`size-4 transition-transform ${toolsExpanded ? "rotate-180" : ""}`} />
            <span>{toolsExpanded ? "Show Less" : "Show More"}</span>
          </button>
        </Section>

        <Section title="Sessions" action={<Plus className="size-3.5" />}>
          <Link
            to="/sessions"
            className="w-full flex items-center gap-3 px-3 h-9 rounded-md text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
          >
            <Plus className="size-4" />
            <span>New Session</span>
          </Link>
        </Section>
      </nav>

      <div className="border-t border-border/60 p-3 space-y-3">
        <div className="flex items-center justify-between px-1 text-muted-foreground">
          <button className="hover:text-foreground"><MessageCircle className="size-4" /></button>
          <button className="hover:text-foreground"><HelpCircle className="size-4" /></button>
          <Link to="/settings" className="hover:text-foreground"><Settings className="size-4" /></Link>
        </div>
        <Link
          to="/auth"
          className="w-full h-10 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-medium flex items-center justify-center gap-2 shadow-[var(--shadow-glow)] hover:opacity-95 transition"
        >
          Sign in
        </Link>
      </div>
    </aside>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between px-3 mb-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        {action && (
          <button className="size-5 grid place-items-center rounded text-muted-foreground hover:text-foreground hover:bg-surface-hover">
            {action}
          </button>
        )}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavLink({
  to,
  icon: Icon,
  label,
  active,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`w-full flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors ${
        active
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </Link>
  );
}
