import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, Compass, FolderOpen, Sparkles, Image as ImageIcon, Video, Mic2,
  Activity, AudioLines, Maximize2, ScanLine, ChevronDown, Search,
  PanelLeft, Heart, Wand2, Film, Boxes, HelpCircle, Languages,
} from "lucide-react";
import { useState } from "react";
import { useSidebarState } from "@/components/sidebar-state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarSessions } from "@/components/sidebar-sessions";

const mainNav = [
  { to: "/", icon: Home, label: "Home" },
  { to: "/explore", icon: Compass, label: "Explore" },
  { to: "/feed", icon: Heart, label: "Feed" },
  { to: "/library", icon: FolderOpen, label: "My Library" },
] as const;

const toolsNav = [
  { to: "/create/agent", icon: Sparkles, label: "Agent" },
  { to: "/create/image", icon: ImageIcon, label: "Image" },
  { to: "/create/video", icon: Video, label: "Video" },
  { to: "/create/motion", icon: Activity, label: "Motion Sync" },
  { to: "/create/lipsync", icon: Mic2, label: "Lipsync" },
  { to: "/create/image-editor", icon: Wand2, label: "Image Editor" },
  { to: "/create/timeline", icon: Film, label: "Timeline" },
  { to: "/create/extract", icon: ScanLine, label: "Extractor" },
  { to: "/create/audio", icon: AudioLines, label: "Audio" },
  { to: "/create/elements", icon: Boxes, label: "My Elements" },
  { to: "/create/upscale", icon: Maximize2, label: "Upscaler" },
] as const;


export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { collapsed, toggle } = useSidebarState();
  const [toolsExpanded, setToolsExpanded] = useState(false);

  const width = collapsed ? "w-[64px]" : "w-[220px]";

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={`hidden md:flex flex-col ${width} shrink-0 border-r border-border bg-background h-screen sticky top-0 transition-[width] duration-200 ease-out`}
        data-collapsed={collapsed}
      >
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} px-3 h-14`}>
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <span className="size-6 rounded-lg grid place-items-center text-[11px] font-bold text-brand-foreground shadow-[0_4px_12px_-4px_var(--brand)]" style={{ background: "var(--gradient-brand)" }}>
                b
              </span>
              <span className="text-[15px] font-semibold tracking-tight lowercase">betty</span>
            </Link>
          )}
          <button
            onClick={toggle}
            className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-surface-hover"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <PanelLeft className="size-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-hide px-2 py-2 space-y-5">
          <div className="space-y-0.5">
            {mainNav.map((item) => (
              <NavLink key={item.to} {...item} active={pathname === item.to} collapsed={collapsed} />
            ))}
          </div>

          {!collapsed && (
            <Section title="Tools" action={<Search className="size-3.5" />}>
              {(toolsExpanded ? toolsNav : toolsNav.slice(0, 3)).map((item) => (
                <NavLink key={item.to} {...item} active={pathname === item.to} collapsed={false} />
              ))}
              <button
                onClick={() => setToolsExpanded((v) => !v)}
                className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md text-[13px] text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors"
              >
                <ChevronDown className={`size-3.5 transition-transform ${toolsExpanded ? "rotate-180" : ""}`} />
                <span>{toolsExpanded ? "Show Less" : "Show More"}</span>
              </button>
            </Section>
          )}

          {collapsed && (
            <div className="space-y-0.5">
              {toolsNav.slice(0, 6).map((item) => (
                <NavLink key={item.to} {...item} active={pathname === item.to} collapsed />
              ))}
            </div>
          )}

          {!collapsed ? (
            <Section title="Sessions">
              <SidebarSessions collapsed={false} />
            </Section>
          ) : (
            <SidebarSessions collapsed />
          )}
        </nav>

        <div className="p-3 space-y-3">
          {!collapsed && (
            <div className="flex items-center justify-between px-1 text-muted-foreground/70">
              <a href="https://discord.com" target="_blank" rel="noreferrer" aria-label="Discord" className="size-7 grid place-items-center rounded hover:text-foreground hover:bg-surface-hover">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.42 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.335-.956 2.42-2.157 2.42Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.42 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.095 2.157 2.418 0 1.335-.946 2.42-2.157 2.42Z"/></svg>
              </a>
              <a href="https://x.com" target="_blank" rel="noreferrer" aria-label="X" className="size-7 grid place-items-center rounded hover:text-foreground hover:bg-surface-hover">
                <svg viewBox="0 0 24 24" className="size-3" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <button aria-label="Search" className="size-7 grid place-items-center rounded hover:text-foreground hover:bg-surface-hover">
                <Search className="size-3.5" />
              </button>
              <button aria-label="Help" className="size-7 grid place-items-center rounded hover:text-foreground hover:bg-surface-hover">
                <HelpCircle className="size-3.5" />
              </button>
              <button aria-label="Language" className="size-7 grid place-items-center rounded hover:text-foreground hover:bg-surface-hover">
                <Languages className="size-3.5" />
              </button>
            </div>
          )}
          <Link
            to="/auth"
            className={`w-full h-10 rounded-xl bg-surface hover:bg-surface-hover border border-border text-sm font-medium flex items-center justify-center gap-2 transition ${collapsed ? "px-0" : ""}`}
          >
            <span className="size-4 rounded-full bg-muted-foreground/30 grid place-items-center text-[10px]">●</span>
            {!collapsed && <span>Login</span>}
          </Link>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function Section({
  title, action, children,
}: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between px-2.5 mb-1">
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground/70">{title}</span>
        {action && (
          <button className="size-5 grid place-items-center rounded text-muted-foreground/70 hover:text-foreground hover:bg-surface-hover">
            {action}
          </button>
        )}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavLink({
  to, icon: Icon, label, active, collapsed,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
  collapsed?: boolean;
}) {
  const inner = (
    <Link
      to={to}
      className={`relative w-full flex items-center ${collapsed ? "justify-center px-0" : "gap-2.5 px-2.5"} h-8 rounded-md text-[13px] transition-colors ${
        active
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-brand" aria-hidden />
      )}
      <Icon className="size-4 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
  if (!collapsed) return inner;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{inner}</TooltipTrigger>
      <TooltipContent side="right" className="text-[12px]">{label}</TooltipContent>
    </Tooltip>
  );
}
