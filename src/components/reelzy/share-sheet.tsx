import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Link2, Mail, MessageSquare, Send, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { listConversations, listFollowing, sendMessage } from "@/lib/reelzy.functions";
import { useMe } from "@/lib/use-me";

type Target = {
  key: string;
  label: string;
  href: (url: string, text: string) => string;
  tint: string;
  glyph: string;
};

/** Outside-the-app destinations. Each opens that app's own share flow. */
const TARGETS: Target[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    tint: "bg-[oklch(0.72_0.17_150)]",
    glyph: "W",
    href: (url, text) => `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  {
    key: "snapchat",
    label: "Snapchat",
    tint: "bg-[oklch(0.9_0.19_100)]",
    glyph: "S",
    href: (url) => `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
  },
  {
    key: "messenger",
    label: "Messenger",
    tint: "bg-[oklch(0.62_0.2_265)]",
    glyph: "M",
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    key: "telegram",
    label: "Telegram",
    tint: "bg-[oklch(0.7_0.13_235)]",
    glyph: "T",
    href: (url, text) =>
      `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    key: "x",
    label: "X",
    tint: "bg-[oklch(0.3_0_0)]",
    glyph: "X",
    href: (url, text) =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
];

export function ShareSheet({
  open,
  onOpenChange,
  url,
  text,
  title = "Share this reel",
  description = "Send it to someone on GoHeet, or out to any other app.",
  qr = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  url: string;
  text: string;
  title?: string;
  description?: string;
  /** Show a scannable code for this link. */
  qr?: boolean;
}) {
  const fetchConversations = useServerFn(listConversations);
  const send = useServerFn(sendMessage);
  const [sent, setSent] = useState<Record<string, boolean>>({});

  const { data } = useQuery({
    queryKey: ["share-people"],
    queryFn: () => fetchConversations({ data: undefined }),
    enabled: open,
  });

  const sendMutation = useMutation({
    mutationFn: (toUserId: string) => send({ data: { toUserId, body: `${text} ${url}` } }),
    onSuccess: (_r, toUserId) => {
      setSent((s) => ({ ...s, [toUserId]: true }));
      toast.success("Sent.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const people = (data?.chats ?? []).map((c) => c.person);

  const copy = async () => {
    await navigator.clipboard?.writeText(url);
    toast.success("Link copied.");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-border bg-surface pb-8">
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-lg">{title}</SheetTitle>
          <SheetDescription className="text-xs">{description}</SheetDescription>
        </SheetHeader>

        {qr ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="rounded-2xl bg-white p-3">
              <QRCodeSVG value={url} size={132} level="M" />
            </div>
            <p className="text-[11px] text-muted-foreground">Scan this code to open the profile.</p>
          </div>
        ) : null}


        {people.length > 0 ? (
          <div className="mt-4">
            <p className="data-figure text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              On GoHeet
            </p>
            <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
              {people.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => sendMutation.mutate(p.id)}
                  disabled={sendMutation.isPending || sent[p.id]}
                  className="flex w-16 shrink-0 flex-col items-center gap-1.5"
                >
                  <span className="ember-fill grid size-14 place-items-center rounded-2xl p-[2px]">
                    <span className="grid size-full place-items-center overflow-hidden rounded-[14px] bg-surface-raised">
                      {p.avatarUrl ? (
                        <img src={p.avatarUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="font-display text-sm font-bold uppercase">
                          {p.username.slice(0, 1)}
                        </span>
                      )}
                    </span>
                  </span>
                  <span className="w-full truncate text-center text-[11px] text-muted-foreground">
                    {sent[p.id] ? "Sent" : p.username}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-5">
          <p className="data-figure text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            Anywhere else
          </p>
          <div className="mt-2 flex gap-3 overflow-x-auto pb-1">
            {TARGETS.map((t) => (
              <a
                key={t.key}
                href={t.href(url, text)}
                target="_blank"
                rel="noreferrer"
                className="flex w-16 shrink-0 flex-col items-center gap-1.5"
              >
                <span
                  className={`grid size-14 place-items-center rounded-2xl font-display text-lg font-bold text-white ${t.tint}`}
                >
                  {t.glyph}
                </span>
                <span className="w-full truncate text-center text-[11px] text-muted-foreground">
                  {t.label}
                </span>
              </a>
            ))}
            <a
              href={`sms:?&body=${encodeURIComponent(`${text} ${url}`)}`}
              className="flex w-16 shrink-0 flex-col items-center gap-1.5"
            >
              <span className="grid size-14 place-items-center rounded-2xl border border-border bg-surface-raised">
                <MessageSquare className="size-5" strokeWidth={1.8} />
              </span>
              <span className="text-[11px] text-muted-foreground">Message</span>
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`}
              className="flex w-16 shrink-0 flex-col items-center gap-1.5"
            >
              <span className="grid size-14 place-items-center rounded-2xl border border-border bg-surface-raised">
                <Mail className="size-5" strokeWidth={1.8} />
              </span>
              <span className="text-[11px] text-muted-foreground">Email</span>
            </a>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={copy}
            className="tap-target flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-sm font-medium active:scale-[0.97]"
          >
            <Copy className="size-4" strokeWidth={1.8} />
            Copy link
          </button>
          <button
            type="button"
            onClick={async () => {
              if (navigator.share) {
                try {
                  await navigator.share({ title: text, url });
                } catch {
                  /* dismissed */
                }
                return;
              }
              await copy();
            }}
            className="ember-fill tap-target flex flex-1 items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-primary-foreground active:scale-[0.97]"
          >
            <Share2 className="size-4" strokeWidth={2} />
            More
          </button>
        </div>

        <p className="mt-3 flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
          <Link2 className="size-3 shrink-0" />
          <span className="truncate">{url}</span>
          <Send className="hidden" />
        </p>
      </SheetContent>
    </Sheet>
  );
}
