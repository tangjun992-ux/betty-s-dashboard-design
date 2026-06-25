import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Heart, UserPlus, UserCheck, CalendarDays } from "lucide-react";
import { getProfileByHandle, getFollowState, toggleFollow } from "@/lib/social.functions";
import { useSession } from "@/lib/use-session";

export const Route = createFileRoute("/u/$handle")({
  loader: async ({ params }) => {
    const data = await getProfileByHandle({ data: { handle: params.handle } });
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    const name = p?.display_name ?? p?.handle ?? "Creator";
    const title = `@${p?.handle ?? "creator"} — Betty`;
    const desc = p?.bio ?? `${name}'s public creations on Betty.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: `/u/${p?.handle ?? ""}` },
        ...(p?.avatar_url ? [{ property: "og:image", content: p.avatar_url }] : []),
      ],
      links: [{ rel: "canonical", href: `/u/${p?.handle ?? ""}` }],
    };
  },
  notFoundComponent: () => (
    <AppShell>
      <div className="px-6 lg:px-10 py-16 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-semibold">Creator not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This profile doesn't exist or has been removed.</p>
        <Link to="/feed" className="inline-flex mt-6 h-9 px-4 rounded-md bg-surface border border-border text-sm items-center">Back to feed</Link>
      </div>
    </AppShell>
  ),
  errorComponent: ({ error, reset }) => (
    <AppShell>
      <div className="px-6 lg:px-10 py-16 max-w-2xl mx-auto text-center">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Failed to load profile."}</p>
        <button onClick={reset} className="inline-flex mt-6 h-9 px-4 rounded-md bg-surface border border-border text-sm items-center">Try again</button>
      </div>
    </AppShell>
  ),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, followerCount, followingCount, generations } = Route.useLoaderData();
  const { user } = useSession();
  const qc = useQueryClient();
  const fetchState = useServerFn(getFollowState);
  const followFn = useServerFn(toggleFollow);

  const followState = useQuery({
    queryKey: ["follow-state", profile.id, user?.id],
    queryFn: () => fetchState({ data: { userId: profile.id } }),
    enabled: !!user,
  });
  const isSelf = followState.data?.isSelf ?? user?.id === profile.id;
  const isFollowing = followState.data?.following ?? false;

  const follow = useMutation({
    mutationFn: () => followFn({ data: { userId: profile.id } }),
    onSuccess: (r) => {
      toast.success(r.following ? `Following @${profile.handle}` : `Unfollowed @${profile.handle}`);
      qc.invalidateQueries({ queryKey: ["follow-state", profile.id] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Couldn't update follow"),
  });

  const joined = useMemo(
    () => new Date(profile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" }),
    [profile.created_at],
  );

  return (
    <AppShell>
      <div className="px-6 lg:px-10 py-6 max-w-[1600px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-start gap-5 flex-wrap">
          <div className="size-24 rounded-full bg-surface border border-border overflow-hidden shrink-0">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.handle ?? ""} className="size-full object-cover" />
            ) : (
              <div className="size-full grid place-items-center text-2xl font-semibold text-muted-foreground">
                {(profile.display_name ?? profile.handle ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-[240px]">
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile.display_name ?? profile.handle}
            </h1>
            <p className="text-sm text-muted-foreground">@{profile.handle}</p>
            {profile.bio ? (
              <p className="mt-3 text-sm leading-relaxed max-w-2xl">{profile.bio}</p>
            ) : null}
            <div className="mt-4 flex items-center gap-5 text-sm">
              <span><span className="font-semibold tabular-nums">{followerCount}</span> <span className="text-muted-foreground">Followers</span></span>
              <span><span className="font-semibold tabular-nums">{followingCount}</span> <span className="text-muted-foreground">Following</span></span>
              <span><span className="font-semibold tabular-nums">{generations.length}</span> <span className="text-muted-foreground">Creations</span></span>
              <span className="hidden md:inline-flex items-center gap-1 text-muted-foreground">
                <CalendarDays className="size-3.5" /> Joined {joined}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {isSelf ? (
              <Link to="/settings" className="inline-flex h-9 px-4 rounded-md bg-surface border border-border text-sm items-center">
                Edit profile
              </Link>
            ) : !user ? (
              <Link to="/auth" className="inline-flex h-9 px-4 rounded-md bg-[image:var(--gradient-brand)] text-brand-foreground text-sm font-medium items-center shadow-[var(--shadow-glow)]">
                Sign in to follow
              </Link>
            ) : (
              <Button
                onClick={() => follow.mutate()}
                disabled={follow.isPending || followState.isLoading}
                className={isFollowing
                  ? "h-9 px-4 bg-surface border border-border text-foreground hover:bg-surface/80"
                  : "h-9 px-4 bg-[image:var(--gradient-brand)] text-brand-foreground shadow-[var(--shadow-glow)]"}
              >
                {isFollowing ? (
                  <><UserCheck className="size-4 mr-1.5" /> Following</>
                ) : (
                  <><UserPlus className="size-4 mr-1.5" /> Follow</>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Generations */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold tracking-tight">Creations</h2>
          {generations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface/50 p-16 text-center">
              <h3 className="text-base font-semibold">No public creations yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">When @{profile.handle} shares creations, they'll appear here.</p>
            </div>
          ) : (
            <div className="columns-2 sm:columns-3 md:columns-4 xl:columns-5 gap-3 [column-fill:_balance]">
              {generations.map((g) => (
                <div key={g.id} className="break-inside-avoid mb-3 rounded-xl overflow-hidden bg-surface border border-border">
                  {g.thumb_url || g.asset_url ? (
                    <img
                      src={g.thumb_url ?? g.asset_url ?? ""}
                      alt={g.prompt ?? ""}
                      loading="lazy"
                      className="w-full h-auto block"
                    />
                  ) : null}
                  <div className="p-3 space-y-2">
                    <p className="text-[12.5px] leading-snug line-clamp-2">{g.prompt ?? "Untitled"}</p>
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">{g.kind}</span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="size-3.5" />
                        <span className="tabular-nums">{g.like_count}</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
