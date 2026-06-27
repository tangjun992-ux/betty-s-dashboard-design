import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home, Compass, FolderOpen, Sparkles, Image as ImageIcon, Video, Mic2,
  Activity, AudioLines, Maximize2, ScanLine, ChevronDown, Plus, Search,
  PanelLeft, Heart, Wand2, Film, Boxes,
} from "lucide-react";
import { useState } from "react";
import { useSidebarState } from "@/components/sidebar-state";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
            <Link to="/" className="flex items-center gap-1.5">
              <div className="size-5 rounded-md bg-[image:var(--gradient-brand)] grid place-items-center text-[10px] font-bold text-brand-foreground">
                b
              </div>
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

          {!collapsed && (
            <Section title="Sessions">
              <Link
                to="/sessions"
                className="w-full flex items-center gap-2 px-2.5 h-9 rounded-lg text-[13px] text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors border border-border/60 border-dashed"
              >
                <Plus className="size-3.5" />
                <span>New Session</span>
              </Link>
            </Section>
          )}
        </nav>

        <div className="p-3">

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
