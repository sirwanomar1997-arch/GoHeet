import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listNotifications, markNotificationsRead } from "@/lib/reelzy.functions";
import { useDemoMode } from "@/lib/use-demo-mode";
import { getDemoNotifications } from "@/lib/demo-data";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { timeAgo } from "@/components/reelzy/format";

export const Route = createFileRoute("/_authenticated/activity")({
  component: ActivityPage,
});

const COPY: Record<string, string> = {
  follow: "started following you",
  like: "felt your moment",
  comment: "said something on your moment",
  mention: "mentioned you",
  moderation: "· a moderation update on your account",
  system: "· a message from GoHeet",
};

function ActivityPage() {
  const demo = useDemoMode();
  const fetchNotifications = useServerFn(listNotifications);
  const markRead = useServerFn(markNotificationsRead);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", demo],
    queryFn: () =>
      demo
        ? { notifications: getDemoNotifications() }
        : fetchNotifications({ data: undefined as never }),
  });

  useEffect(() => {
    if (!demo && data?.notifications.some((n) => !n.read)) {
      void markRead({ data: undefined as never });
    }
  }, [data, markRead, demo]);

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-4 backdrop-blur-xl">
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Pulse</h1>
        <p className="text-sm text-muted-foreground">Everything people did with your moments.</p>
      </header>

      {isLoading ? (
        <LoadingRail label="Checking" />
      ) : (data?.notifications.length ?? 0) === 0 ? (
        <EmptyState title="Nothing yet." line="When people react to your moments, it shows up here." />
      ) : (
        <ul className="divide-y divide-border px-4">
          {data?.notifications.map((n) => (
            <li key={n.id} className="flex items-center gap-3 py-3.5">
              <span
                className={`size-1.5 shrink-0 rounded-full ${n.read ? "bg-transparent" : "bg-primary"}`}
              />
              <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface-raised text-sm font-bold uppercase">
                {n.actor?.avatarUrl ? (
                  <img src={n.actor.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  (n.actor?.username ?? "R").slice(0, 1)
                )}
              </span>
              <p className="flex-1 text-sm">
                {n.actor ? (
                  <Link
                    to="/u/$username"
                    params={{ username: n.actor.username }}
                    className="font-semibold"
                  >
                    @{n.actor.username}
                  </Link>
                ) : (
                  <span className="font-semibold">GoHeet</span>
                )}{" "}
                <span className="text-muted-foreground">{COPY[n.type] ?? n.type}</span>
              </p>
              <span className="data-figure shrink-0 text-[11px] text-muted-foreground">
                {timeAgo(n.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
