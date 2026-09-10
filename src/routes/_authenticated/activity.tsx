import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, MessageCircle } from "lucide-react";
import {
  listConversations,
  listNotifications,
  markNotificationsRead,
} from "@/lib/reelzy.functions";
import { useDemoMode } from "@/lib/use-demo-mode";
import { getDemoConversations, getDemoNotifications } from "@/lib/demo-data";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { timeAgo } from "@/components/reelzy/format";


export const Route = createFileRoute("/_authenticated/activity")({
  component: ActivityPage,
});

const COPY: Record<string, string> = {
  follow: "started following you",
  like: "heeted your video",
  comment: "commented your video",
  mention: "mentioned you",
  moderation: "· a moderation update on your account",
  system: "· a message from GoHeet",
};


function ActivityPage() {
  const demo = useDemoMode();
  const fetchNotifications = useServerFn(listNotifications);
  const markRead = useServerFn(markNotificationsRead);

  const fetchChats = useServerFn(listConversations);

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", demo],
    queryFn: () =>
      demo
        ? { notifications: getDemoNotifications() }
        : fetchNotifications({ data: undefined as never }),
  });

  const { data: convos } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchChats({ data: undefined as never }),
    enabled: !demo,
    refetchInterval: 20000,
  });

  useEffect(() => {
    if (!demo && data?.notifications.some((n) => !n.read)) {
      void markRead({ data: undefined as never });
    }
  }, [data, markRead, demo]);

  const demoConvos = demo ? getDemoConversations() : null;
  const chats: any[] = demoConvos?.chats ?? convos?.chats ?? [];
  const requests: any[] = demoConvos?.requests ?? convos?.requests ?? [];
  const preview = [...requests, ...chats].slice(0, 3);
  const unread =
    chats.reduce((n, c) => n + (c.unread ?? 0), 0) + requests.length;

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/90 px-4 py-4 backdrop-blur-xl">
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Notice</h1>
      </header>

      <section className="px-4 pb-2">
        <Link
          to="/messages"
          className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3"
        >
          <span className="flex items-center gap-2">
            <MessageCircle className="size-4 text-sky-400" />
            <span className="text-sm font-semibold">Messages</span>
            {unread > 0 ? (
              <span className="ember-fill grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold text-primary-foreground">
                {unread}
              </span>
            ) : null}
          </span>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>

        <div className="mt-2 space-y-2">
          {preview.length === 0 ? (
            <p className="px-1 text-xs text-muted-foreground">
              No messages yet. Open someone&apos;s profile and tap the message icon.
            </p>
          ) : (
            preview.map((c) => (
              <Link
                key={c.id}
                to="/messages/$conversationId"
                params={{ conversationId: c.id }}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface-raised">
                  {c.person.avatarUrl ? (
                    <img src={c.person.avatarUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <MessageCircle className="size-4 text-muted-foreground" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{c.person.displayName}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {c.status === "pending" ? "Request" : timeAgo(c.lastMessageAt)}
                    </span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {c.lastMessage?.body ?? `@${c.person.username}`}
                  </span>
                </span>
              </Link>
            ))
          )}
        </div>
      </section>

      <p className="px-5 pb-1 pt-4 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        Notifications
      </p>

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
              <p className="min-w-0 flex-1 text-sm">
                {n.actor ? (
                  <Link
                    to="/u/$username"
                    params={{ username: n.actor.username }}
                    replace
                    className="font-semibold"
                  >
                    @{n.actor.username}
                  </Link>
                ) : (
                  <span className="font-semibold">GoHeet</span>
                )}{" "}
                <span className="text-muted-foreground">{COPY[n.type] ?? n.type}</span>
                {n.momentCaption ? (
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {n.momentCaption}
                  </span>
                ) : null}
              </p>
              <span className="data-figure shrink-0 text-[11px] text-muted-foreground">
                {timeAgo(n.createdAt)}
              </span>
              {n.momentId ? (
                <Link
                  to="/feed"
                  className="block size-11 shrink-0 overflow-hidden rounded-xl bg-surface-raised"
                >
                  {n.momentThumbUrl ? (
                    <img
                      src={n.momentThumbUrl}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : null}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>

      )}
    </AppShell>
  );
}
