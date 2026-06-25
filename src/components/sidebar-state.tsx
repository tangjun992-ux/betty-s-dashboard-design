import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

type Ctx = {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
};

const SidebarStateContext = createContext<Ctx | null>(null);

const STORAGE_KEY = "betty:sidebar:collapsed";

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === "1") setCollapsedState(true);
    } catch {
      /* ignore */
    }
  }, []);

  const setCollapsed = useCallback((v: boolean) => {
    setCollapsedState(v);
    try {
      localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);

  const value = useMemo(
    () => ({ collapsed, toggle, setCollapsed, paletteOpen, setPaletteOpen }),
    [collapsed, toggle, setCollapsed, paletteOpen],
  );

  return <SidebarStateContext.Provider value={value}>{children}</SidebarStateContext.Provider>;
}

export function useSidebarState() {
  const ctx = useContext(SidebarStateContext);
  if (!ctx) {
    // Safe fallback so components rendered outside the provider (e.g. SSR shell) don't crash.
    return {
      collapsed: false,
      toggle: () => {},
      setCollapsed: () => {},
      paletteOpen: false,
      setPaletteOpen: () => {},
    } satisfies Ctx;
  }
  return ctx;
}
