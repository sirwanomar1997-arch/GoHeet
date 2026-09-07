import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/reelzy.functions";
import { useMe } from "@/lib/use-me";
import { AppShell } from "@/components/reelzy/nav";
import { MomentStage } from "@/components/reelzy/moment-stage";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";

export const Route = createFileRoute("/_authenticated/feed")({
  component: FeedPage,
});

function FeedPage() {
  const [scope, setScope] = useState<"following" | "discover">("discover");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { data: me, isLoading: meLoading } = useMe();
  const fetchFeed = useServerFn(getFeed);

  const showProfileBanner = !meLoading && !!me && !me.profile && !bannerDismissed;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["feed", scope],
    queryFn: () => fetchFeed({ data: { scope } }),
  });

  return (
    <AppShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-gradient-to-b from-background via-background/90 to-transparent px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-1 items-center gap-5">
          {(["discover", "following"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              aria-pressed={scope === s}
              className={`relative pb-1.5 font-display text-[15px] font-semibold tracking-tight transition-colors ${
                scope === s ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {s === "following" ? "Following" : "Out there"}
              <span
                className={`ember-fill absolute inset-x-0 -bottom-0.5 h-[3px] rounded-full transition-opacity duration-300 ${
                  scope === s ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          ))}
        </div>
      </header>

      {showProfileBanner && (
        <div className="mx-3 mb-3 flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">Finish your profile</p>
            <p className="text-xs text-muted-foreground">
              Pick a username so people can find you.
            </p>
          </div>
          <Link
            to="/onboarding"
            className="ember-fill tap-target inline-flex items-center rounded-full px-4 text-xs font-semibold text-primary-foreground"
          >
            Set up
          </Link>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss"
            className="tap-target -mr-1 inline-flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>
      )}

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
