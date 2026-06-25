import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useSidebarState } from "@/components/sidebar-state";

const isEditableTarget = (el: EventTarget | null) => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
};

/** Mounts global keyboard shortcuts:
 *  ⌘K / Ctrl+K → command palette
 *  G then H/E/L → home / explore / library
 *  N → new agent session
 *  ? → open palette (help proxy)
 */
export function GlobalShortcuts() {
  const navigate = useNavigate();
  const { setPaletteOpen, toggle } = useSidebarState();
  const gPressedAt = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // ⌘K / Ctrl+K — always intercepted (even inside inputs).
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setPaletteOpen(true);
        return;
      }

      if (isEditableTarget(e.target)) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;

      // [ → toggle sidebar collapsed
      if (e.key === "[") {
        e.preventDefault();
        toggle();
        return;
      }

      // G then [H|E|L] sequence
      if (e.key === "g" || e.key === "G") {
        gPressedAt.current = Date.now();
        return;
      }
      if (Date.now() - gPressedAt.current < 900) {
        const k = e.key.toLowerCase();
        if (k === "h") { e.preventDefault(); gPressedAt.current = 0; navigate({ to: "/" }); return; }
        if (k === "e") { e.preventDefault(); gPressedAt.current = 0; navigate({ to: "/explore" }); return; }
        if (k === "l") { e.preventDefault(); gPressedAt.current = 0; navigate({ to: "/library" }); return; }
        if (k === "s") { e.preventDefault(); gPressedAt.current = 0; navigate({ to: "/settings" }); return; }
      }

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        navigate({ to: "/create/agent" });
        return;
      }

      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, setPaletteOpen, toggle]);

  return null;
}
