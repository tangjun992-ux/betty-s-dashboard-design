import { Link } from "@tanstack/react-router";
import { Clock, Sparkles } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import { SkeletonLoader } from "./SkeletonLoader";
import { EmptyState } from "./EmptyState";
import { GenerationCard } from "./GenerationCard";
import { useRecentGenerations } from "@/hooks/use-recent-generations";
import { useRealtimeLibrary } from "@/hooks/use-realtime-library";
import { useSession } from "@/lib/use-session";

export function RecentGenerations() {
  const { user, loading: authLoading } = useSession();
  useRealtimeLibrary(user?.id);
  const { data, isLoading, isError, refetch } = useRecentGenerations(12);

  // Not signed in — soft prompt instead of empty grid
  if (!authLoading && !user) {
    return (
      <section>
        <SectionHeader icon={Clock} title="Recent Generations" showArrows={false} />
        <EmptyState
          icon={Sparkles}
          title="Sign in to see your creations"
          description="Your generations stay in sync across devices once you're signed in."
          ctaLabel="Sign in"
          ctaTo="/auth"
        />
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <Clock className="size-[18px] text-muted-foreground" />
          <h2 className="text-[17px] font-semibold tracking-tight">Recent Generations</h2>
        </div>
        <Link to="/library" className="text-[12.5px] text-muted-foreground hover:text-foreground transition-colors">
          View all →
        </Link>
      </div>

      {isLoading || authLoading ? (
        <SkeletonLoader count={6} />
      ) : isError ? (
        <div className="rounded-xl border border-hairline p-6 text-center text-[13px] text-muted-foreground">
          Couldn't load recent generations.{" "}
          <button onClick={() => refetch()} className="text-foreground underline-offset-4 hover:underline">
            Retry
          </button>
        </div>
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="No generations yet"
          description="Create your first image, video, or agent run — it'll appear here instantly."
          ctaLabel="Start creating"
          ctaTo="/create/agent"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5 animate-fade-in">
          {data.map((g) => (
            <GenerationCard key={g.id} gen={g} />
          ))}
        </div>
      )}
    </section>
  );
}
