import type { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";

export function AppShell({ children, showTopBar = false }: { children: ReactNode; showTopBar?: boolean }) {
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <AppSidebar />
      <main className="flex-1 min-w-0 flex flex-col">
        {showTopBar && <TopBar />}
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
