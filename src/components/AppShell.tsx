import type { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";

export function AppShell({ children, hideTopBar }: { children: ReactNode; hideTopBar?: boolean }) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        {!hideTopBar && <TopBar />}
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
