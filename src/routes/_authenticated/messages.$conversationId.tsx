import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Send, X } from "lucide-react";
import {
  getConversation,
  respondToMessageRequest,
  sendMessage,
} from "@/lib/reelzy.functions";

export const Route = createFileRoute("/_authenticated/messages/$conversationId")({
  component: ThreadPage,
  head: () => ({
    meta: [
      { title: "Chat — GoHeet" },
      { name: "description", content: "A private GoHeet conversation." },
      { property: "og:title", content: "Chat — GoHeet" },
      { property: "og:description", content: "A private GoHeet conversation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ThreadPage() {
  const { conversationId } = useParams({ from: "/_authenticated/messages/$conversationId" });
  const qc = useQueryClient();
  const load = useServerFn(getConversation);
  const post = useServerFn(sendMessage);
  const respond = useServerFn(respondToMessageRequest);
  const [body, setBody] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => load({ data: { conversationId } }),
    refetchInterval: 10000,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [data?.messages.length]);

  const send = useMutation({
    mutationFn: () => post({ data: { conversationId, body } }),
    onSuccess: () => {
      setBody("");
      void qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const answer = useMutation({
    mutationFn: (accept: boolean) => respond({ data: { conversationId, accept } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = data?.status === "pending";
  const rejected = data?.status === "rejected";
  const canWrite = data ? data.status === "accepted" || (pending && data.isRequester) : false;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link to="/messages" aria-label="Back to messages" className="grid size-9 place-items-center rounded-xl border border-border">
          <ArrowLeft className="size-4" />
        </Link>
        {data ? (
          <Link
            to="/u/$username"
            params={{ username: data.person.username }}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="size-9 shrink-0 overflow-hidden rounded-xl bg-surface-raised">
              {data.person.avatarUrl ? (
                <img src={data.person.avatarUrl} alt="" className="size-full object-cover" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{data.person.displayName}</span>
              <span className="block truncate text-xs text-muted-foreground">
                @{data.person.username}
              </span>
            </span>
          </Link>
        ) : null}
      </header>

      <div className="flex-1 space-y-2 px-4 py-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
        ) : (
          data?.messages.map((m, i) => {
            const lastMine =
              m.mine && !data.messages.slice(i + 1).some((n) => n.mine);
            return (
              <div key={m.id} className={m.mine ? "flex flex-col items-end" : ""}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.mine
                      ? "ember-fill text-primary-foreground"
                      : "border border-border bg-surface"
                  }`}
                >
                  {m.body}
                </div>
                {lastMine ? (
                  <span className="mt-1 pe-1 text-[11px] text-muted-foreground">
                    {m.readByThem ? t("msg.read") : t("msg.sent")}
                  </span>
                ) : null}
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {pending && data && !data.isRequester ? (
        <div className="border-t border-border bg-surface p-4">
          <p className="text-sm">
            {t("msg.wantsToMessage", { name: data.person.displayName })}
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={answer.isPending}
              onClick={() => answer.mutate(true)}
              className="ember-fill tap-target flex-1 rounded-2xl text-sm font-semibold text-primary-foreground"
            >
              <Check className="mr-1 inline size-4" /> {t("common.accept")}
            </button>
            <button
              type="button"
              disabled={answer.isPending}
              onClick={() => answer.mutate(false)}
              className="tap-target flex-1 rounded-2xl border border-border text-sm font-semibold"
            >
              <X className="mr-1 inline size-4" /> {t("common.decline")}
            </button>
          </div>
        </div>
      ) : rejected ? (
        <p className="border-t border-border bg-surface p-4 text-center text-sm text-muted-foreground">
          {t("msg.wasDeclined")}
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim()) send.mutate();
          }}
          className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-background/95 p-3 backdrop-blur"
        >
          <textarea
            value={body}
            rows={1}
            disabled={!canWrite || send.isPending}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              pending
                ? t("msg.waitingAccept")
                : t("msg.placeholder", { username: data?.person.username ?? "" })
            }
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none"
          />
          <button
            type="submit"
            aria-label={t("common.send")}
            disabled={!canWrite || !body.trim() || send.isPending}
            className="ember-fill grid size-11 shrink-0 place-items-center rounded-2xl text-primary-foreground disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
      )}
      {pending && data?.isRequester ? (
        <p className="px-4 pb-4 text-center text-xs text-muted-foreground">
          {t("msg.requestNote")}
        </p>
      ) : null}

    </div>
  );
}
