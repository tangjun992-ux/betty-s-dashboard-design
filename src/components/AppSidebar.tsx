import { Link } from "@tanstack/react-router";
import {
  Home,
  Compass,
  FolderOpen,
  Sparkles,
  Image as ImageIcon,
  Video,
  ChevronDown,
  Plus,
  Search,
  PanelLeft,
  HelpCircle,
  Languages,
  MessageCircle,
} from "lucide-react";

export function AppSidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-background h-screen sticky top-0">
      {/* Brand */}
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
          <NavItem icon={Home} label="Home" active />
          <NavItem icon={Compass} label="Explore" />
          <NavItem icon={FolderOpen} label="My Library" />
        </div>

        <Section title="Tools" action={<Search className="size-3.5" />}>
          <NavItem icon={Sparkles} label="Agent" />
          <NavItem icon={ImageIcon} label="Image" />
          <NavItem icon={Video} label="Video" />
          <button className="w-full flex items-center gap-3 px-3 h-9 rounded-md text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors">
            <ChevronDown className="size-4" />
            <span>Show More</span>
          </button>
        </Section>

        <Section title="Sessions" action={<Plus className="size-3.5" />}>
          <button className="w-full flex items-center gap-3 px-3 h-9 rounded-md text-sm text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors">
            <Plus className="size-4" />
            <span>New Session</span>
          </button>
        </Section>
      </nav>

      <div className="border-t border-border/60 p-3 space-y-3">
        <div className="flex items-center justify-between px-1 text-muted-foreground">
          <button className="hover:text-foreground"><MessageCircle className="size-4" /></button>
          <button className="hover:text-foreground"><svg viewBox="0 0 24 24" className="size-4" fill="currentColor"><path d="M18.244 2H21l-6.52 7.45L22 22h-6.79l-4.74-6.21L4.94 22H2.18l6.98-7.98L2 2h6.94l4.3 5.66L18.24 2Zm-2.38 18h1.88L7.22 4H5.22l10.64 16Z"/></svg></button>
          <button className="hover:text-foreground"><Search className="size-4" /></button>
          <button className="hover:text-foreground"><HelpCircle className="size-4" /></button>
          <button className="hover:text-foreground"><Languages className="size-4" /></button>
        </div>
        <button className="w-full h-10 rounded-md bg-surface hover:bg-surface-hover border border-border text-sm font-medium flex items-center justify-center gap-2 transition-colors">
          <span className="size-5 rounded-full bg-foreground/10 grid place-items-center text-[10px]">b</span>
          Login
        </button>
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

function NavItem({
  icon: Icon,
  label,
  active,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      className={`w-full flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors ${
        active
          ? "bg-surface text-foreground"
          : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </button>
  );
}
