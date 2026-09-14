import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getFeed } from "@/lib/reelzy.functions";
import { useMe } from "@/lib/use-me";
import { useDemoMode } from "@/lib/use-demo-mode";
import { getDemoFeed } from "@/lib/demo-data";
import { AppShell } from "@/components/reelzy/nav";
import { MomentStage } from "@/components/reelzy/moment-stage";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";

export const Route = createFileRoute("/_authenticated/feed")({
  component: FeedPage,
});

function FeedPage() {
  const demo = useDemoMode();
  const [scope, setScope] = useState<"following" | "discover">("discover");
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const { data: me, isLoading: meLoading } = useMe();
  const fetchFeed = useServerFn(getFeed);

  const showProfileBanner = !demo && !meLoading && !!me && !me.profile && !bannerDismissed;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["feed", scope, demo],
    queryFn: () => (demo ? getDemoFeed(scope) : fetchFeed({ data: { scope } })),
  });

  // Real accounts may return to the previous video once. A second consecutive
  // backward step refreshes the feed instead. Demo mode stays freely scrollable.
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const lastTopRef = useRef(0);
  const backStepsRef = useRef(0);
  const refreshingRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onFeedScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const top = el.scrollTop;
    const step = el.clientHeight * 0.6;
    const delta = top - lastTopRef.current;
    if (Math.abs(delta) < step) return;

    if (delta > 0) {
      backStepsRef.current = 0;
      lastTopRef.current = top;
      return;
    }

    if (demo) {
      lastTopRef.current = top;
      return;
    }

    backStepsRef.current += 1;
    if (backStepsRef.current >= 2 && !refreshingRef.current) {
      backStepsRef.current = 0;
      refreshingRef.current = true;
      const previousVideoTop = lastTopRef.current;
      el.scrollTo({ top: previousVideoTop, behavior: "auto" });
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = setTimeout(() => {
        void refetch().finally(() => {
          el.scrollTo({ top: 0, behavior: "smooth" });
          lastTopRef.current = 0;
          refreshingRef.current = false;
        });
      }, 180);
      return;
    }

    lastTopRef.current = top;
  };


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
              : "GoHeet only shows what people actually captured. Be the reason there's something here."
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
        <div
          ref={scrollerRef}
          onScroll={onFeedScroll}
          className="h-[calc(100svh-6.5rem)] touch-pan-y snap-y snap-mandatory space-y-3 overflow-y-auto overscroll-y-contain px-3 pb-3 [-webkit-overflow-scrolling:touch]"
        >
          {data?.moments.map((m) => (
            <MomentStage key={m.id} moment={m} onGone={() => void refetch()} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
