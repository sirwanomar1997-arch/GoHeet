import { BackLink } from "@/components/reelzy/back-link";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Check, MailQuestion, MessageCircle, Trash2, X } from "lucide-react";
import { deleteConversation, listConversations, respondToMessageRequest } from "@/lib/reelzy.functions";
import { AppShell } from "@/components/reelzy/nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesPage,
  head: () => ({
    meta: [
      { title: "Messages — GoHeet" },
      {
        name: "description",
        content:
          "Your GoHeet chats and message requests. People you don't follow back land in requests first.",
      },
      { property: "og:title", content: "Messages — GoHeet" },
      {
        property: "og:description",
        content: "Chats and message requests on GoHeet.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

function MessagesPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const fetchChats = useServerFn(listConversations);
  const respond = useServerFn(respondToMessageRequest);
  const [tab, setTab] = useState<"chats" | "requests">("chats");

  const { data, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => fetchChats({ data: undefined as never }),
    refetchInterval: 15000,
  });

  const answer = useMutation({
    mutationFn: (v: { conversationId: string; accept: boolean }) => respond({ data: v }),
    onSuccess: (_r, v) => {
      toast.success(v.accept ? t("msg.accepted") : t("msg.declined"));
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requests = data?.requests ?? [];
  const chats = data?.chats ?? [];
  const sent = data?.sent ?? [];

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-6">
        <div className="mb-3">
          <BackLink />
        </div>
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">{t("msg.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("msg.subtitle")}</p>
      </header>

      <div className="grid grid-cols-2 gap-2 px-5">
        {(
          [
            ["chats", t("msg.chats"), chats.length],
            ["requests", t("msg.requests"), requests.length],
          ] as const
        ).map(([id, label, count]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`tap-target rounded-2xl text-sm font-semibold ${
              tab === id
                ? "ember-fill text-primary-foreground"
                : "border border-border text-muted-foreground"
            }`}
          >
            {label}
            {count > 0 ? ` · ${count}` : ""}
          </button>
        ))}
      </div>

      <div className="space-y-2 px-5 pb-12 pt-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : tab === "chats" ? (
          chats.length === 0 ? (
            <EmptyState
              icon={<MessageCircle className="size-5 text-amber-400" />}
              title={t("msg.noChats")}
              line={t("msg.noChatsLine")}
            />
          ) : (
            chats.map((c) => <ChatRow key={c.id} chat={c} />)
          )
        ) : requests.length === 0 && sent.length === 0 ? (
          <EmptyState
            icon={<MailQuestion className="size-5 text-sky-400" />}
            title={t("msg.noRequests")}
            line={t("msg.noRequestsLine")}
          />
        ) : (
          <>
            {requests.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-surface p-4">
                <Link
                  to="/messages/$conversationId"
                  params={{ conversationId: c.id }}
                  className="block"
                >
                  <p className="text-sm font-semibold" data-no-translate>{c.person.displayName}</p>
                  <p className="text-xs text-muted-foreground" data-no-translate>@{c.person.username}</p>
                  {c.lastMessage ? (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground" data-no-translate>
                      {c.lastMessage.body}
                    </p>
                  ) : null}
                </Link>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    disabled={answer.isPending}
                    onClick={() => answer.mutate({ conversationId: c.id, accept: true })}
                    className="ember-fill tap-target flex-1 rounded-2xl text-sm font-semibold text-primary-foreground"
                  >
                    <Check className="mr-1 inline size-4" /> {t("common.accept")}
                  </button>
                  <button
                    type="button"
                    disabled={answer.isPending}
                    onClick={() => answer.mutate({ conversationId: c.id, accept: false })}
                    className="tap-target flex-1 rounded-2xl border border-border text-sm font-semibold"
                  >
                    <X className="mr-1 inline size-4" /> {t("common.decline")}
                  </button>
                </div>
              </div>
            ))}
            {sent.length > 0 ? (
              <>
                <p className="pt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                  {t("msg.waiting")}
                </p>
                {sent.map((c) => (
                  <ChatRow key={c.id} chat={c} pendingLabel={t("msg.requestSent")} />
                ))}
              </>
            ) : null}
          </>
        )}
      </div>
    </AppShell>
  );
}

type Chat = NonNullable<Awaited<ReturnType<typeof listConversations>>>["chats"][number];

/** One chat row. Swipe it to the left to reveal a delete button. */
function ChatRow({ chat, pendingLabel }: { chat: Chat; pendingLabel?: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const remove = useServerFn(deleteConversation);
  const [open, setOpen] = useState(false);
  const startX = useRef<number | null>(null);

  const del = useMutation({
    mutationFn: () => remove({ data: { conversationId: chat.id } }),
    onSuccess: () => {
      toast.success(t("msg.chatDeleted"));
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="relative overflow-hidden rounded-2xl">
      <button
        type="button"
        disabled={del.isPending}
        onClick={() => del.mutate()}
        className="absolute inset-y-0 end-0 flex w-24 items-center justify-center gap-1 rounded-2xl bg-destructive text-sm font-semibold text-destructive-foreground"
      >
        <Trash2 className="size-4" /> {t("msg.deleteChat")}
      </button>
      <Link
      to="/messages/$conversationId"
      params={{ conversationId: chat.id }}
      onPointerDown={(e) => {
        startX.current = e.clientX;
      }}
      onPointerUp={(e) => {
        const from = startX.current;
        startX.current = null;
        if (from === null) return;
        const dx = e.clientX - from;
        if (dx < -40) {
          e.preventDefault();
          setOpen(true);
        } else if (dx > 20 && open) {
          e.preventDefault();
          setOpen(false);
        } else if (open) {
          e.preventDefault();
          setOpen(false);
        }
      }}
      style={{ transform: open ? "translateX(-6rem)" : undefined }}
      className="relative flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition-transform duration-200"
    >
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-surface-raised">
        {chat.person.avatarUrl ? (
          <img src={chat.person.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          <MessageCircle className="size-4 text-muted-foreground" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold" data-no-translate translate="no">{chat.person.displayName}</span>
          <span className="shrink-0 text-[11px] text-muted-foreground">
            {pendingLabel ?? timeAgo(chat.lastMessageAt)}
          </span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted-foreground" data-no-translate>
          {chat.lastMessage?.body ?? `@${chat.person.username}`}
        </span>
      </span>
      {chat.unread > 0 ? (
        <span className="ember-fill grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-primary-foreground">
          {chat.unread}
        </span>
      ) : null}
      </Link>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  line,
}: {
  icon: React.ReactNode;
  title: string;
  line: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 text-center">
      <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-surface-raised">
        {icon}
      </div>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{line}</p>
    </div>
  );
}
