import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listFollowing } from "@/lib/reelzy.functions";
import { useDemoMode } from "@/lib/use-demo-mode";
import { demoPeople } from "@/lib/demo-data";
import { AppShell } from "@/components/reelzy/nav";
import { BackLink } from "@/components/reelzy/back-link";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { FollowButton } from "@/components/reelzy/follow-button";
import { formatCount } from "@/components/reelzy/format";

export const Route = createFileRoute("/_authenticated/u/$username/following")({
  component: FollowingPage,
});

type Person = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number;
  isFollowing: boolean;
};

function FollowingPage() {
  const { username } = Route.useParams();
  const demo = useDemoMode();
  const fetchFollowing = useServerFn(listFollowing);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ people: Person[]; isSelf: boolean; hidden: boolean }>({
    queryKey: ["following", username, demo],
    queryFn: () =>
      demo
        ? Promise.resolve({
            people: demoPeople.map((p) => ({
              id: p.id,
              username: p.username,
              displayName: p.displayName,
              avatarUrl: p.avatarUrl,
              followerCount: p.followerCount,
              isFollowing: true,
            })),
            isSelf: true,
            hidden: false,
          })
        : fetchFollowing({ data: { username } }),
    staleTime: 0,
    refetchOnMount: "always",
  });

  return (
    <AppShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <BackLink to={`/u/${username}`} label="Back to profile" />
        <div className="min-w-0">
          <h1 className="font-display text-xl font-extrabold tracking-[-0.04em]">Following</h1>
          <p className="truncate text-[11px] text-muted-foreground" data-no-translate>
            @{username}
          </p>
        </div>
      </header>

      {isLoading ? (
        <LoadingRail label="Loading following" />
      ) : data?.hidden ? (
        <EmptyState title="This list is private." line="This person keeps their following list hidden." />
      ) : (data?.people.length ?? 0) === 0 ? (
        <EmptyState title="Not following anyone yet." line="People you follow appear here." />
      ) : (
        <ul className="divide-y divide-border px-4 pb-8">
          {data?.people.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <Link to="/u/$username" params={{ username: p.username }} className="shrink-0">
                <span className="grid size-11 place-items-center overflow-hidden rounded-2xl bg-surface-raised font-display text-sm font-bold uppercase">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt=""
                      draggable={false}
                      className="untouchable-photo size-full object-cover"
                    />
                  ) : (
                    p.username.slice(0, 1)
                  )}
                </span>
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to="/u/$username"
                  params={{ username: p.username }}
                  className="block truncate font-semibold"
                  data-no-translate
                >
                  {p.displayName || p.username}
                </Link>
                <p className="data-figure truncate text-[11px] text-muted-foreground" data-no-translate>
                  @{p.username} · {formatCount(p.followerCount)} followers
                </p>
              </div>
              <FollowButton
                userId={p.id}
                isFollowing={p.isFollowing}
                demo={demo}
                className="px-4 text-xs"
                onChange={() => {
                  void qc.invalidateQueries({ queryKey: ["following"] });
                  void qc.invalidateQueries({ queryKey: ["profile", username] });
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
