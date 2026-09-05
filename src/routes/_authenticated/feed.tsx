import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/reelzy.functions";
import { useMe } from "@/lib/use-me";
import { AppShell } from "@/components/reelzy/nav";
import { MomentStage } from "@/components/reelzy/moment-stage";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { ReelzyMark } from "@/components/reelzy/logo";

export const Route = createFileRoute("/_authenticated/feed")({
  component: FeedPage,
});

function FeedPage() {
  const [scope, setScope] = useState<"following" | "discover">("following");
  const navigate = useNavigate();
  const { data: me, isLoading: meLoading } = useMe();
  const fetchFeed = useServerFn(getFeed);

  useEffect(() => {
    if (!meLoading && me && !me.profile) void navigate({ to: "/onboarding" });
  }, [me, meLoading, navigate]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["feed", scope],
    queryFn: () => fetchFeed({ data: { scope } }),
    enabled: !!me?.profile,
  });

  return (
    <AppShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <ReelzyMark className="size-7" />
        <div className="flex flex-1 gap-1 rounded-full border border-border p-1">
          {(["following", "discover"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold capitalize transition-colors ${
                scope === s ? "bg-surface-raised text-foreground" : "text-muted-foreground"
              }`}
            >
              {s === "following" ? "Following" : "Out there"}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <LoadingRail label="Gathering moments" />
      ) : (data?.moments.length ?? 0) === 0 ? (
        <EmptyState
          title={scope === "following" ? "Quiet in here." : "Nothing new yet."}
          line={
            scope === "following"
              ? "Follow a few people, or capture the first moment yourself."
              : "Reelzy only shows what people actually captured. Be the reason there's something here."
          }
          action={
            <Link
              to="/camera"
              className="ember-fill tap-target inline-flex items-center rounded-full px-6 text-sm font-semibold text-primary-foreground"
            >
              Open the camera
            </Link>
          }
        />
      ) : (
        <div className="h-[calc(100svh-6.5rem)] snap-y snap-mandatory space-y-3 overflow-y-auto px-3 pb-3">
          {data?.moments.map((m) => (
            <MomentStage key={m.id} moment={m} onGone={() => void refetch()} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
