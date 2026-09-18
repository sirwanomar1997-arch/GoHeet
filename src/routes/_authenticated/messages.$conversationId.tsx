import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Mic, Send, Trash2, X } from "lucide-react";
import {
  getConversation,
  reactToMessage,
  respondToMessageRequest,
  sendMessage,
  sendVoiceMessage,
  unsendMessage,
} from "@/lib/reelzy.functions";
import { useI18n } from "@/lib/i18n";

/** Quick reactions offered on long-press; "+" opens the phone's own emoji keyboard. */
const QUICK_REACTIONS = ["😂", "😍", "😢", "❤️"];


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
  const { t } = useI18n();
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

  // --- Voice messages: record with the microphone, send as an audio note. ---
  const postVoice = useServerFn(sendVoiceMessage);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const keepRef = useRef(true);
  const startedAtRef = useRef(0);

  const voice = useMutation({
    mutationFn: (v: { audioBase64: string; mimeType: string; durationMs: number }) =>
      postVoice({ data: { conversationId, ...v } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  useEffect(() => {
    if (!recording) return;
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 500);
    return () => window.clearInterval(id);
  }, [recording]);

  async function startRecording() {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast.error(t("msg.voiceMicDenied"));
      return;
    }
    const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const rec = new MediaRecorder(stream, { mimeType: mime });
    chunksRef.current = [];
    keepRef.current = true;
    rec.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    rec.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const durationMs = Date.now() - startedAtRef.current;
      const blob = new Blob(chunksRef.current, { type: mime });
      chunksRef.current = [];
      setRecording(false);
      setElapsed(0);
      if (!keepRef.current) return;
      if (durationMs < 700 || blob.size < 1024) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = String(reader.result).split(",")[1] ?? "";
        voice.mutate({ audioBase64: base64, mimeType: mime, durationMs });
      };
      reader.readAsDataURL(blob);
    };
    recorderRef.current = rec;
    startedAtRef.current = Date.now();
    setElapsed(0);
    setRecording(true);
    rec.start();
    // Keep voice notes short so they upload quickly on mobile networks.
    window.setTimeout(() => {
      if (recorderRef.current === rec && rec.state === "recording") rec.stop();
    }, 120_000);
  }

  function stopRecording(keep: boolean) {
    keepRef.current = keep;
    const rec = recorderRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
    else setRecording(false);
  }

  // --- Emoji reactions: hold a message to pick one, "+" opens the phone keyboard. ---
  const postReaction = useServerFn(reactToMessage);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [customFor, setCustomFor] = useState<string | null>(null);
  const [customEmoji, setCustomEmoji] = useState("");
  const holdRef = useRef<number | null>(null);

  const react = useMutation({
    mutationFn: (v: { messageId: string; emoji: string | null }) => postReaction({ data: v }),
    onSuccess: () => {
      setPickerFor(null);
      setCustomFor(null);
      setCustomEmoji("");
      void qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const postUnsend = useServerFn(unsendMessage);
  const unsend = useMutation({
    mutationFn: (messageId: string) => postUnsend({ data: { messageId } }),
    onSuccess: () => {
      setPickerFor(null);
      toast.success(t("msg.unsent"));
      void qc.invalidateQueries({ queryKey: ["conversation", conversationId] });
      void qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function holdStart(messageId: string) {
    holdRef.current = window.setTimeout(() => setPickerFor(messageId), 400);
  }
  function holdEnd() {
    if (holdRef.current) window.clearTimeout(holdRef.current);
    holdRef.current = null;
  }
  function pick(messageId: string, emoji: string) {
    const mine = data?.reactions.find((r) => r.messageId === messageId && r.mine);
    react.mutate({ messageId, emoji: mine?.emoji === emoji ? null : emoji });
  }

  const pending = data?.status === "pending";
  const rejected = data?.status === "rejected";
  const canWrite = data ? data.status === "accepted" || (pending && data.isRequester) : false;

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/90 px-4 py-3 backdrop-blur">
        <Link to="/feed" replace aria-label="Back to home" className="grid size-9 place-items-center rounded-xl border border-border">
          <ArrowLeft className="size-4" />
        </Link>
        {data ? (
          <Link
            to="/u/$username"
            params={{ username: data.person.username }}
            replace
            className="flex min-w-0 items-center gap-3"
          >
            <span className="size-9 shrink-0 overflow-hidden rounded-xl bg-surface-raised">
              {data.person.avatarUrl ? (
                <img src={data.person.avatarUrl} alt="" className="size-full object-cover" />
              ) : null}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold" data-no-translate translate="no">{data.person.displayName}</span>
              <span className="block truncate text-xs text-muted-foreground">
                <span data-no-translate>@{data.person.username}</span>
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
            const msgReactions = data.reactions.filter((r) => r.messageId === m.id);
            const myReaction = msgReactions.find((r) => r.mine)?.emoji ?? null;
            return (
              <div key={m.id} className={m.mine ? "flex flex-col items-end" : ""}>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={t("msg.react")}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setPickerFor(m.id);
                  }}
                  onPointerDown={() => holdStart(m.id)}
                  onPointerUp={holdEnd}
                  onPointerLeave={holdEnd}
                  onPointerCancel={holdEnd}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest("audio")) return;
                    if (pickerFor === m.id) return;
                    pick(m.id, QUICK_REACTIONS[3]!);
                  }}
                  className={`max-w-[78%] select-none rounded-2xl px-3.5 py-2.5 text-start text-sm ${
                    m.mine
                      ? "ember-fill text-primary-foreground"
                      : "border border-border bg-surface"
                  }`}
                  data-no-translate
                >
                  {m.audioUrl ? (
                    <span className="flex flex-col gap-1">
                      <audio
                        src={m.audioUrl}
                        controls
                        preload="none"
                        aria-label={t("msg.voiceNote")}
                        className="h-10 w-[220px] max-w-full"
                      />
                      {m.audioDurationMs ? (
                        <span className="text-[11px] opacity-80">
                          {Math.max(1, Math.round(m.audioDurationMs / 1000))}s
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    m.body
                  )}
                </div>

                {msgReactions.length ? (
                  <div className="-mt-1 flex gap-1" data-no-translate>
                    {msgReactions.map((r, idx) => (
                      <button
                        key={`${m.id}-${idx}`}
                        type="button"
                        aria-label={t("msg.react")}
                        onClick={() => r.mine && pick(m.id, r.emoji)}
                        className="rounded-full border border-border bg-surface px-2 py-0.5 text-sm leading-none shadow-sm"
                      >
                        {r.emoji}
                      </button>
                    ))}
                  </div>
                ) : null}

                {pickerFor === m.id ? (
                  <div
                    className={`mt-1 flex items-center gap-1 rounded-full border border-border bg-surface px-2 py-1 shadow-lg ${
                      m.mine ? "self-end" : "self-start"
                    }`}
                    data-no-translate
                  >
                    {QUICK_REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        aria-label={emoji}
                        disabled={react.isPending}
                        onClick={() => pick(m.id, emoji)}
                        className={`grid size-9 place-items-center rounded-full text-xl ${
                          myReaction === emoji ? "bg-surface-raised" : ""
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                    {customFor === m.id ? (
                      <input
                        autoFocus
                        value={customEmoji}
                        maxLength={8}
                        aria-label={t("msg.reactOther")}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          setCustomEmoji(v);
                          if (v) pick(m.id, v);
                        }}
                        className="h-9 w-16 rounded-full border border-border bg-background px-2 text-center text-xl outline-none"
                      />
                    ) : (
                      <button
                        type="button"
                        aria-label={t("msg.reactOther")}
                        onClick={() => {
                          setCustomFor(m.id);
                          setCustomEmoji("");
                        }}
                        className="grid size-9 place-items-center rounded-full border border-border text-lg"
                      >
                        +
                      </button>
                    )}
                    {m.mine ? (
                      <button
                        type="button"
                        disabled={unsend.isPending}
                        onClick={() => unsend.mutate(m.id)}
                        className="flex h-9 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-destructive"
                      >
                        <Trash2 className="size-3.5" /> {t("msg.unsend")}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      aria-label={t("msg.closePicker")}
                      onClick={() => {
                        setPickerFor(null);
                        setCustomFor(null);
                      }}
                      className="grid size-9 place-items-center rounded-full text-muted-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ) : null}
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
          {recording ? (
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
              <span className="size-2.5 animate-pulse rounded-full bg-destructive" />
              <span className="text-sm font-semibold">{t("msg.voiceRecording")}</span>
              <span className="text-sm tabular-nums text-muted-foreground">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
              </span>
              <button
                type="button"
                aria-label={t("msg.voiceDelete")}
                onClick={() => stopRecording(false)}
                className="ms-auto grid size-9 place-items-center rounded-xl border border-border"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ) : (
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
          )}
          {recording || (!body.trim() && !send.isPending) ? (
            <button
              type="button"
              aria-label={recording ? t("msg.voiceSend") : t("msg.voiceRecord")}
              disabled={!canWrite || voice.isPending}
              onClick={() => (recording ? stopRecording(true) : startRecording())}
              className="ember-fill grid size-11 shrink-0 place-items-center rounded-2xl text-primary-foreground disabled:opacity-50"
            >
              {recording ? <Send className="size-4" /> : <Mic className="size-5" />}
            </button>
          ) : (
            <button
              type="submit"
              aria-label={t("common.send")}
              disabled={!canWrite || !body.trim() || send.isPending}
              className="ember-fill grid size-11 shrink-0 place-items-center rounded-2xl text-primary-foreground disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          )}
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
