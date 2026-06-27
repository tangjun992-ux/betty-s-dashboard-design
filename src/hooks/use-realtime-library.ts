import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to realtime changes on the current user's generations + assets
 * and invalidate the relevant TanStack Query caches.
 */
export function useRealtimeLibrary(userId: string | undefined) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`library:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "generations", filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["my-generations", userId] });
          qc.invalidateQueries({ queryKey: ["recent-generations", userId] });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "assets", filter: `user_id=eq.${userId}` },
        () => {
          qc.invalidateQueries({ queryKey: ["my-assets", userId] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);
}
