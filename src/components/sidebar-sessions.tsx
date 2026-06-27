import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";

type Session = { id: string; title: string | null; updated_at: string };

// Deterministic gradient per session id so thumbnails feel distinct yet stable.
const GRADIENTS = [
  "linear-gradient(135deg, oklch(0.55 0.18 18),  oklch(0.40 0.16 28))",
  "linear-gradient(135deg, oklch(0.55 0.18 268), oklch(0.40 0.16 295))",
  "linear-gradient(135deg, oklch(0.55 0.18 195), oklch(0.40 0.16 230))",
  "linear-gradient(135deg, oklch(0.55 0.18 150), oklch(0.40 0.14 180))",
  "linear-gradient(135deg, oklch(0.55 0.18 330), oklch(0.40 0.16 295))",
  "linear-gradient(135deg, oklch(0.50 0.10 270), oklch(0.30 0.08 270))",
];
function hashIdx(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % GRADIENTS.length;
}

export function SidebarSessions({ collapsed }: { collapsed: boolean }) {
  const { user } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }
    let cancelled = false;
    supabase
      .from("sessions")
      .select("id, title, updated_at")
      .order("updated_at", { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (!cancelled && data) setSessions(data as Session[]);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (collapsed) {
    return (
      <div className="space-y-1.5 px-1">
        {sessions.slice(0, 5).map((s) => (
          <Link
            key={s.id}
            to="/sessions"
            title={s.title ?? "Untitled session"}
            className="block size-9 mx-auto rounded-lg border border-hairline hover:scale-[1.04] transition-transform"
            style={{ background: GRADIENTS[hashIdx(s.id)] }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Link
        to="/sessions"
        className="w-full flex items-center gap-2 px-2.5 h-9 rounded-lg text-[13px] text-muted-foreground hover:bg-surface-hover hover:text-foreground transition-colors border border-hairline border-dashed"
      >
        <Plus className="size-3.5" />
        <span>New Session</span>
      </Link>
      {sessions.length > 0 && (
        <div className="pt-1 space-y-0.5">
          {sessions.map((s) => (
            <Link
              key={s.id}
              to="/sessions"
              className="group w-full flex items-center gap-2.5 px-2 h-9 rounded-md hover:bg-surface-hover transition-colors"
            >
              <span
                className="size-6 rounded-md shrink-0 border border-hairline"
                style={{ background: GRADIENTS[hashIdx(s.id)] }}
                aria-hidden
              />
              <span className="truncate text-[12.5px] text-muted-foreground group-hover:text-foreground">
                {s.title?.trim() || "Untitled session"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
