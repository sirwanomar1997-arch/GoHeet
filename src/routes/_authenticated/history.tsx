import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Play } from "lucide-react";
import { listWatchHistory } from "@/lib/reelzy.functions";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { timeAgo } from "@/components/reelzy/format";

export const Route = createFileRoute("/_authenticated/history")({
  component: HistoryPage,
  head: () => ({
    meta: [
      { title: "Your history · GoHeet" },
      {
        name: "description",
        content: "Every Reel you have watched on GoHeet, newest first.",
      },
      { property: "og:title", content: "Your history · GoHeet" },
      {
        property: "og:description",
        content: "Every Reel you have watched on GoHeet, newest first.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function HistoryPage() {
  const fetchHistory = useServerFn(listWatchHistory);
  const { data, isLoading } = useQuery({
    queryKey: ["watch-history"],
    queryFn: () => fetchHistory({ data: undefined as never }),
  });
  const items = data?.items ?? [];

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-4 backdrop-blur-xl">
        <Link
          to="/settings"
          className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground"
        >
          <ChevronLeft className="size-3.5" /> Settings
        </Link>
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Your history</h1>
        <p className="text-sm text-muted-foreground">
          Everything you have watched, the most recent first.
        </p>
      </header>

      {isLoading ? (
        <LoadingRail />
      ) : items.length === 0 ? (
        <EmptyState
          title="Nothing watched yet."
          line="Reelz you watch in the feed show up here."
          action={
            <Link
              to="/feed"
              className="tap-target inline-flex rounded-full border border-border px-6 text-sm"
            >
              Open the feed
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2 px-4 pb-6">
          {items.map((m) => (
            <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
              <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-raised">
                {m.thumbnailUrl ? (
                  <img src={m.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover" />
                ) : (
                  <Play className="size-4 text-muted-foreground" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {m.caption || "Untitled moment"}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {m.author ? `@${m.author.username}` : "GoHeet"} · watched {timeAgo(m.watchedAt)}
                </span>
              </span>
              {m.author ? (
                <Link
                  to="/u/$username"
                  params={{ username: m.author.username }}
                  className="shrink-0 text-xs text-muted-foreground underline"
                >
                  Profile
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
