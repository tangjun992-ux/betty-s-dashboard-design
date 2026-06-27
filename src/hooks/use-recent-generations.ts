import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyGenerations } from "@/lib/generations.functions";
import { useSession } from "@/lib/use-session";

export type RecentGen = Awaited<ReturnType<typeof listMyGenerations>>[number];

/**
 * Recent generations for the signed-in user.
 * Polls every 5s while any item is still queued/running so that
 * status flips from "Processing" → "Completed" without a manual refresh.
 */
export function useRecentGenerations(limit = 12) {
  const { user, loading } = useSession();
  const fn = useServerFn(listMyGenerations);

  return useQuery({
    queryKey: ["recent-generations", user?.id ?? "anon"],
    enabled: !loading && !!user,
    queryFn: async () => {
      const rows = await fn();
      return rows.slice(0, limit);
    },
    refetchInterval: (q) => {
      const rows = q.state.data as RecentGen[] | undefined;
      if (!rows) return false;
      return rows.some((r) => r.status === "queued" || r.status === "running") ? 5000 : false;
    },
    staleTime: 15_000,
  });
}
