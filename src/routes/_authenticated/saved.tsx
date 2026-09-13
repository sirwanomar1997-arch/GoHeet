import { BackLink } from "@/components/reelzy/back-link";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/reelzy.functions";
import { AppShell } from "@/components/reelzy/nav";
import { MomentStage } from "@/components/reelzy/moment-stage";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";

export const Route = createFileRoute("/_authenticated/saved")({
  component: SavedPage,
});

function SavedPage() {
  const fetchFeed = useServerFn(getFeed);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["feed", "saved"],
    queryFn: () => fetchFeed({ data: { scope: "saved" } }),
  });

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-4 backdrop-blur-xl">
        <div className="mb-3">
          <BackLink />
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Kept</h1>
        <p className="text-sm text-muted-foreground">Moments you wanted to come back to.</p>
      </header>

      {isLoading ? (
        <LoadingRail />
      ) : (data?.moments.length ?? 0) === 0 ? (
        <EmptyState
          title="Nothing kept yet."
          line="Tap the bookmark on any moment to hold on to it."
          action={
            <Link to="/feed" className="tap-target inline-flex rounded-full border border-border px-6 text-sm">
              Back to your feed
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
