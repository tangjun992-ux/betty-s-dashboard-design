import { useNavigate } from "@tanstack/react-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useSidebarState } from "@/components/sidebar-state";
import {
  Home, Compass, FolderOpen, Sparkles, Image as ImageIcon, Video, Mic2,
  Activity, AudioLines, Maximize2, ScanLine, Settings, Gift, Wrench, PlayCircle,
} from "lucide-react";

const navItems: { to: string; label: string; icon: typeof Home; hint?: string }[] = [
  { to: "/", label: "Home", icon: Home, hint: "G H" },
  { to: "/explore", label: "Explore", icon: Compass, hint: "G E" },
  { to: "/library", label: "My Library", icon: FolderOpen, hint: "G L" },
  { to: "/sessions", label: "Sessions", icon: PlayCircle },
  { to: "/tools", label: "All Tools", icon: Wrench },
  { to: "/earn", label: "Earn", icon: Gift },
  { to: "/settings", label: "Settings", icon: Settings, hint: "G S" },
];

const toolItems = [
  { to: "/create/agent", label: "Agent", icon: Sparkles },
  { to: "/create/image", label: "Image", icon: ImageIcon },
  { to: "/create/video", label: "Video", icon: Video },
  { to: "/create/lipsync", label: "Lipsync", icon: Mic2 },
  { to: "/create/motion", label: "Motion", icon: Activity },
  { to: "/create/avatar", label: "Avatar", icon: Sparkles },
  { to: "/create/audio", label: "Audio", icon: AudioLines },
  { to: "/create/upscale", label: "Upscaler", icon: Maximize2 },
  { to: "/create/extract", label: "Extractor", icon: ScanLine },
] as const;

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useSidebarState();
  const navigate = useNavigate();

  const go = (to: string) => {
    setPaletteOpen(false);
    // Defer navigation a tick so the dialog can finish closing animation cleanly.
    setTimeout(() => navigate({ to }), 0);
  };

  return (
    <CommandDialog open={paletteOpen} onOpenChange={setPaletteOpen}>
      <CommandInput placeholder="Jump to page or tool…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Navigate">
          {navItems.map((it) => (
            <CommandItem key={it.to} value={`nav ${it.label}`} onSelect={() => go(it.to)}>
              <it.icon className="size-4" />
              <span>{it.label}</span>
              {it.hint && <span className="ml-auto text-[10px] tracking-wider text-muted-foreground">{it.hint}</span>}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Create">
          {toolItems.map((it) => (
            <CommandItem key={it.to} value={`tool ${it.label}`} onSelect={() => go(it.to)}>
              <it.icon className="size-4" />
              <span>New {it.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
