import type { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { SidebarStateProvider } from "@/components/sidebar-state";
import { CommandPalette } from "@/components/CommandPalette";
import { GlobalShortcuts } from "@/components/GlobalShortcuts";

export function AppShell({ children, showTopBar = true }: { children: ReactNode; showTopBar?: boolean }) {
  return (
    <SidebarStateProvider>
      <div className="min-h-screen flex bg-background text-foreground">
        <AppSidebar />
        <main className="flex-1 min-w-0 flex flex-col">
          {showTopBar && <TopBar />}
          <div className="flex-1 min-w-0">{children}</div>
        </main>
      </div>
      <CommandPalette />
      <GlobalShortcuts />
    </SidebarStateProvider>
  );
}
