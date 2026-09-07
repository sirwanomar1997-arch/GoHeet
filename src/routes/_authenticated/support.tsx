import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronLeft, LifeBuoy, Send } from "lucide-react";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { timeAgo } from "@/components/reelzy/format";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/use-me";
import {
  createSupportTicket,
  getSupportTicket,
  listSupportTickets,
  replySupportTicket,
  staffListSupportTickets,
  staffSetSupportTicketStatus,
} from "@/lib/support.functions";

export const Route = createFileRoute("/_authenticated/support")({
  component: SupportPage,
  head: () => ({
    meta: [
      { title: "Help & support · GoHeet" },
      { name: "description", content: "Contact the GoHeet team about your account, safety concerns or a problem in the app." },
      { property: "og:title", content: "Help & support · GoHeet" },
      { property: "og:description", content: "Contact the GoHeet team about your account, safety concerns or a problem in the app." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const CATEGORIES = [
  { value: "general", label: "General question" },
  { value: "account", label: "My account" },
  { value: "safety", label: "Safety or abuse" },
  { value: "bug", label: "Something is broken" },
  { value: "payment", label: "Payments" },
  { value: "other", label: "Other" },
] as const;

const STATUS_LABEL: Record<string, string> = {
  open: "Waiting for us",
  awaiting_reply: "We replied",
  resolved: "Resolved",
};

const card = "rounded-2xl border border-border bg-card/60 p-4";

function SupportPage() {
  const { data: me } = useMe();
  const qc = useQueryClient();
  const [openTicket, setOpenTicket] = useState<string | null>(null);
  const [tab, setTab] = useState<"mine" | "inbox">("mine");

  const listFn = useServerFn(listSupportTickets);
  const createFn = useServerFn(createSupportTicket);
  const inboxFn = useServerFn(staffListSupportTickets);

  const tickets = useQuery({
    queryKey: ["support", "mine"],
    queryFn: () => listFn({ data: undefined as never }),
  });

  const staff = !!me?.isStaff;
  const inbox = useQuery({
    queryKey: ["support", "inbox"],
    queryFn: () => inboxFn({ data: { status: "all" as const } }),
    enabled: staff && tab === "inbox",
  });

  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["value"]>("general");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const create = useMutation({
    mutationFn: () => createFn({ data: { category, subject, body } }),
    onSuccess: (res) => {
      setSubject("");
      setBody("");
      toast.success("Sent — we'll reply here in the app");
      qc.invalidateQueries({ queryKey: ["support"] });
      setOpenTicket(res.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (openTicket) {
    return <TicketThread id={openTicket} onBack={() => setOpenTicket(null)} staff={staff} />;
  }

  return (
    <AppShell>
      <header className="px-5 pb-3 pt-6">
        <h1 className="font-display text-2xl font-extrabold tracking-[-0.04em]">Help &amp; support</h1>
        <p className="text-sm text-muted-foreground">
          Write to the GoHeet team. Safety reports are actioned within 24 hours.
        </p>
      </header>

      {staff ? (
        <div className="flex gap-2 px-5 pb-3">
          {(["mine", "inbox"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                tab === t ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
              }`}
            >
              {t === "mine" ? "My requests" : "Support inbox"}
            </button>
          ))}
        </div>
      ) : null}

      <div className="space-y-4 px-5 pb-12">
        {tab === "inbox" && staff ? (
          inbox.isLoading ? (
            <LoadingRail />
          ) : (inbox.data ?? []).length === 0 ? (
            <EmptyState title="Nothing here" line="No support requests yet." />
          ) : (
            <div className={`${card} divide-y divide-border p-0`}>
              {(inbox.data ?? []).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setOpenTicket(t.id)}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{t.subject}</span>
                    <span className="block text-xs text-muted-foreground">
                      @{t.username} · {t.category} · {timeAgo(t.last_activity_at)}
                    </span>
                  </span>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {STATUS_LABEL[t.status] ?? t.status}
                  </span>
                </button>
              ))}
            </div>
          )
        ) : (
          <>
            <section className={card}>
              <h2 className="flex items-center gap-2 font-display text-base font-semibold">
                <LifeBuoy className="size-4 text-primary" /> New request
              </h2>
              <div className="mt-3 grid gap-3">
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        category === c.value
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <Input
                  value={subject}
                  maxLength={120}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Short summary"
                />
                <Textarea
                  value={body}
                  maxLength={4000}
                  rows={5}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Tell us what happened, and what you expected instead."
                />
                <Button
                  onClick={() => create.mutate()}
                  disabled={create.isPending || subject.trim().length < 3 || body.trim().length < 10}
                >
                  {create.isPending ? "Sending…" : "Send to support"}
                </Button>
              </div>
            </section>

            <section className={`${card}`}>
              <h2 className="font-display text-base font-semibold">Your requests</h2>
              {tickets.isLoading ? (
                <LoadingRail />
              ) : (tickets.data ?? []).length === 0 ? (
                <p className="mt-2 text-sm text-muted-foreground">You haven&apos;t contacted support yet.</p>
              ) : (
                <div className="mt-2 divide-y divide-border">
                  {(tickets.data ?? []).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setOpenTicket(t.id)}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{t.subject}</span>
                        <span className="block text-xs text-muted-foreground">
                          {t.category} · {timeAgo(t.last_activity_at)}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            <p className="text-xs text-muted-foreground">
              You can also read the{" "}
              <Link to="/legal/$doc" params={{ doc: "support" }} className="underline">
                support page
              </Link>{" "}
              or the{" "}
              <Link to="/legal/$doc" params={{ doc: "safety" }} className="underline">
                safety centre
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}

function TicketThread({ id, onBack, staff }: { id: string; onBack: () => void; staff: boolean }) {
  const qc = useQueryClient();
  const getFn = useServerFn(getSupportTicket);
  const replyFn = useServerFn(replySupportTicket);
  const statusFn = useServerFn(staffSetSupportTicketStatus);
  const [text, setText] = useState("");

  const thread = useQuery({
    queryKey: ["support", "ticket", id],
    queryFn: () => getFn({ data: { ticketId: id } }),
    refetchInterval: 20000,
  });

  const reply = useMutation({
    mutationFn: () => replyFn({ data: { ticketId: id, body: text } }),
    onSuccess: () => {
      setText("");
      qc.invalidateQueries({ queryKey: ["support"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: (status: "open" | "resolved") => statusFn({ data: { ticketId: id, status } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const ticket = thread.data?.ticket;
  const resolved = ticket?.status === "resolved";

  return (
    <AppShell>
      <header className="flex items-center gap-3 px-5 pb-3 pt-6">
        <button type="button" onClick={onBack} aria-label="Back">
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-extrabold tracking-[-0.03em]">
            {ticket?.subject ?? "Request"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {ticket ? `${ticket.category} · ${STATUS_LABEL[ticket.status] ?? ticket.status}` : ""}
          </p>
        </div>
      </header>

      <div className="space-y-3 px-5 pb-40">
        {thread.isLoading ? (
          <LoadingRail />
        ) : (
          (thread.data?.messages ?? []).map((m) => (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                m.from_staff ? "bg-card/70 border border-border" : "ml-auto bg-primary text-primary-foreground"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.body}</p>
              <p className="mt-1 text-[11px] opacity-70">
                {m.from_staff ? "GoHeet support" : "You"} · {timeAgo(m.created_at)}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="fixed inset-x-0 bottom-16 border-t border-border bg-background/95 p-3 backdrop-blur">
        {resolved && !staff ? (
          <p className="text-center text-xs text-muted-foreground">
            This request is resolved. Start a new one if you still need help.
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <Textarea
              rows={1}
              value={text}
              maxLength={4000}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a reply…"
              className="min-h-11 flex-1 resize-none"
            />
            <Button
              size="icon"
              aria-label="Send reply"
              disabled={reply.isPending || text.trim().length === 0}
              onClick={() => reply.mutate()}
            >
              <Send className="size-4" />
            </Button>
          </div>
        )}
        {staff ? (
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="outline" onClick={() => setStatus.mutate(resolved ? "open" : "resolved")}>
              {resolved ? "Reopen" : "Mark resolved"}
            </Button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
