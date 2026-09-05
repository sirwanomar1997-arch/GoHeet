import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bookmark, ShieldAlert, Sparkles, Play, LayoutGrid, Heart, Settings, Pencil, Instagram, Youtube, Twitter, Facebook, Ghost, MessageCircle, Music2, type LucideIcon } from "lucide-react";
import { getProfile, getFeed, toggleFollow, submitReport, sendMessage, type MomentCard } from "@/lib/reelzy.functions";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { MomentStage } from "@/components/reelzy/moment-stage";
import { formatCount, dayLabel } from "@/components/reelzy/format";
import { filterCss } from "@/components/reelzy/creative";

export const Route = createFileRoute("/_authenticated/u/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const fetchProfile = useServerFn(getProfile);
  const follow = useServerFn(toggleFollow);
  const startChat = useServerFn(sendMessage);
  const [messageText, setMessageText] = useState("");
  const [composing, setComposing] = useState(false);
  const report = useServerFn(submitReport);
  const qc = useQueryClient();
  const [open, setOpen] = useState<MomentCard | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["profile", username],
    queryFn: () => fetchProfile({ data: { username } }),
  });

  const followMutation = useMutation({
    mutationFn: () => follow({ data: { userId: data!.profile!.id } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["profile", username] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const [tab, setTab] = useState<"reelz" | "liked" | "saved">("reelz");
  const fetchFeed = useServerFn(getFeed);
  const isSelf = data?.isSelf ?? false;
  const { data: likedData } = useQuery({
    queryKey: ["profile", username, "liked"],
    queryFn: () => fetchFeed({ data: { scope: "liked" } }),
    enabled: isSelf && tab === "liked",
  });
  const { data: savedData } = useQuery({
    queryKey: ["profile", username, "saved"],
    queryFn: () => fetchFeed({ data: { scope: "saved" } }),
    enabled: isSelf && tab === "saved",
  });

  if (isLoading) {
    return (
      <AppShell>
        <LoadingRail label="Opening timeline" />
      </AppShell>
    );
  }

  if (!data?.profile) {
    return (
      <AppShell>
        <EmptyState title="No one by that name." line={`@${username} doesn't exist on Reelzy.`} />
      </AppShell>
    );
  }

  const p = data.profile;



  if (open) {
    return (
      <AppShell>
        <div className="px-3 pt-3">
          <button type="button" onClick={() => setOpen(null)} className="mb-3 text-sm underline">
            ← Back to timeline
          </button>
          <MomentStage
            moment={open}
            onGone={() => {
              setOpen(null);
              void refetch();
            }}
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      {/* --- Avatar stage: the character is the page, not a tiny circle --- */}
      <section className="relative overflow-hidden px-5 pb-2 pt-8">
        <div
          aria-hidden
          className="ember-fill absolute left-1/2 top-4 size-72 -translate-x-1/2 rounded-full opacity-25 blur-[90px]"
        />
        {data.isSelf ? (
          <Link
            to="/settings"
            aria-label="Settings"
            className="absolute right-5 top-5 grid size-10 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
          >
            <Settings className="size-4" />
          </Link>
        ) : null}
        <div className="relative flex flex-col items-center">
          <div className="key-glow relative size-44 overflow-hidden rounded-[44px] border border-border bg-surface">
            {p.avatarUrl ? (
              <img src={p.avatarUrl} alt={`${p.username}'s avatar`} className="size-full object-cover" />
            ) : (
              <span className="grid size-full place-items-center font-display text-6xl font-extrabold uppercase text-muted-foreground">
                {p.username.slice(0, 1)}
              </span>
            )}
          </div>

          {data.isSelf ? (
            <div className="mt-3 flex items-center gap-2">
              <Link
                to="/edit-profile"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <Pencil className="size-3" /> Edit profile
              </Link>
              <Link
                to="/avatar"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                <Sparkles className="size-3" /> {p.avatarUrl ? "Remake your avatar" : "Create your avatar"}
              </Link>
            </div>
          ) : null}

          <h1 className="mt-4 text-center font-display text-3xl font-extrabold tracking-[-0.045em]">
            {p.displayName || p.username}
          </h1>
          <p className="data-figure text-xs text-muted-foreground">@{p.username}</p>
          {p.bio ? (
            <p className="mt-3 max-w-[19rem] text-center text-sm leading-relaxed text-foreground/85">
              {p.bio}
            </p>
          ) : null}

          {Object.keys(p.socialLinks ?? {}).length > 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              {Object.entries(p.socialLinks ?? {}).map(([key, url]) => {
                const icons: Record<string, { Icon: LucideIcon; label: string; color: string }> = {
                  instagram: { Icon: Instagram, label: "Instagram", color: "oklch(0.65 0.24 350)" },
                  tiktok: { Icon: Music2, label: "TikTok", color: "oklch(0.72 0.15 195)" },
                  youtube: { Icon: Youtube, label: "YouTube", color: "oklch(0.6 0.22 25)" },
                  twitter: { Icon: Twitter, label: "X (Twitter)", color: "oklch(0.75 0.02 250)" },
                  facebook: { Icon: Facebook, label: "Facebook", color: "oklch(0.6 0.18 255)" },
                  snapchat: { Icon: Ghost, label: "Snapchat", color: "oklch(0.88 0.16 100)" },
                  whatsapp: { Icon: MessageCircle, label: "WhatsApp", color: "oklch(0.72 0.17 150)" },
                };
                const meta = icons[key];
                if (!meta) return null;
                return (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={`${meta.label} profile`}
                    title={meta.label}
                    className="grid size-11 place-items-center rounded-2xl border border-border bg-surface transition-transform hover:scale-105 active:scale-95"
                    style={{ color: meta.color }}
                  >
                    <meta.Icon className="size-5" />
                  </a>
                );
              })}
            </div>
          ) : null}


          {/* stat band — a premium segmented strip, brand accent on REELZ */}
          <div className="mt-6 grid w-full grid-cols-5 overflow-hidden rounded-2xl border border-border bg-surface">
            {[
              ["Reelz", formatCount(p.momentCount), true],
              ["Followers", formatCount(p.followerCount), false],
              ["Following", formatCount(p.followingCount), false],
              ["Views", formatCount(p.totalViews), false],
              ["Likes", formatCount(p.totalLikes), false],
            ].map(([k, v, accent]) => (
              <div
                key={k as string}
                className="relative flex flex-col items-center gap-1 px-1 py-3.5 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-border"
              >
                {accent ? (
                  <span
                    aria-hidden
                    className="ember-fill absolute inset-x-0 top-0 h-[3px]"
                  />
                ) : null}
                <p
                  className={`data-figure text-lg leading-none tabular-nums ${
                    accent ? "text-primary" : "text-foreground"
                  }`}
                >
                  {v}
                </p>
                <p className="data-figure text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
                  {k}
                </p>
              </div>
            ))}
          </div>

          {data.isSelf ? (
            <div className="mt-5 grid w-full grid-cols-3 gap-2">
              {([
                { id: "reelz", label: "Your Reelz", Icon: LayoutGrid, color: "oklch(0.82 0.16 75)", glow: "oklch(0.82 0.16 75 / 60%)" },
                { id: "liked", label: "Liked", Icon: Heart, color: "oklch(0.64 0.22 18)", glow: "oklch(0.64 0.22 18 / 60%)" },
                { id: "saved", label: "Saved", Icon: Bookmark, color: "oklch(0.74 0.15 150)", glow: "oklch(0.74 0.15 150 / 60%)" },
              ] as const).map(({ id, label, Icon, color, glow }) => {
                const activeTab = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    aria-label={label}
                    className="relative flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-surface py-3 transition-colors"
                  >
                    <Icon
                      className="size-5"
                      strokeWidth={activeTab ? 2.4 : 1.7}
                      style={{
                        color,
                        opacity: activeTab ? 1 : 0.45,
                        filter: activeTab ? `drop-shadow(0 0 7px ${glow})` : "none",
                      }}
                    />
                    <span className="data-figure text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                      {label}
                    </span>
                    <span
                      aria-hidden
                      className="absolute inset-x-3 bottom-1 h-[3px] rounded-full transition-opacity"
                      style={{
                        background: color,
                        opacity: activeTab ? 1 : 0,
                        boxShadow: activeTab ? `0 0 10px ${glow}` : "none",
                      }}
                    />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 flex w-full gap-2">
              <button
                type="button"
                onClick={() => followMutation.mutate()}
                className={`tap-target flex-1 rounded-2xl text-sm font-semibold ${
                  data.isFollowing
                    ? "border border-border text-foreground"
                    : "ember-fill text-primary-foreground"
                }`}
              >
                {data.isFollowing ? "Following" : "Follow"}
              </button>
              <button
                type="button"
                onClick={() => setComposing((v) => !v)}
                className="tap-target flex-1 rounded-2xl border border-border text-sm font-semibold"
              >
                Message
              </button>
              <button
                type="button"
                aria-label="Report this person"
                onClick={async () => {
                  await report({
                    data: { targetType: "user", targetId: p.id, category: "harassment" },
                  });
                  toast.success("Reported to the safety team.");
                }}
                className="tap-target grid w-14 place-items-center rounded-2xl border border-border"
              >
                <ShieldAlert className="size-4" />
              </button>
            </div>
          )}
          {!data.isSelf && composing ? (
            <form
              className="mt-3 w-full rounded-2xl border border-border bg-surface p-3"
              onSubmit={async (e) => {
                e.preventDefault();
                const text = messageText.trim();
                if (!text) return;
                try {
                  const res = await startChat({ data: { toUserId: p.id, body: text } });
                  setMessageText("");
                  setComposing(false);
                  toast.success(
                    res.status === "pending"
                      ? "Message request sent. They have to accept it first."
                      : "Message sent.",
                  );
                  void navigate({
                    to: "/messages/$conversationId",
                    params: { conversationId: res.conversationId },
                  });
                } catch (err) {
                  toast.error((err as Error).message);
                }
              }}
            >
              <textarea
                value={messageText}
                rows={2}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={`Say something to @${p.username}`}
                className="w-full resize-none rounded-xl border border-border bg-surface-raised px-3 py-2 text-sm outline-none"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                If you don&apos;t follow each other, this goes as a request first.
              </p>
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="ember-fill tap-target mt-2 w-full rounded-2xl text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Send
              </button>
            </form>
          ) : null}
        </div>
      </section>

      {/* --- Moments orbit the avatar as day-by-day ribbons, never a grid --- */}
      <section className="pb-12 pt-8">
        {(() => {
          const list: MomentCard[] = data.isSelf
            ? tab === "reelz"
              ? data.moments
              : tab === "liked"
                ? likedData?.moments ?? []
                : savedData?.moments ?? []
            : data.moments;

          if (list.length === 0) {
            const copy =
              data.isSelf && tab === "liked"
                ? { title: "No liked moments yet.", line: "Moments you love will live here." }
                : data.isSelf && tab === "saved"
                  ? { title: "No saved moments yet.", line: "Moments you save will live here." }
                  : data.isSelf
                    ? { title: "Your timeline is empty.", line: "Open the camera and put something real on it." }
                    : p.isPrivate
                      ? { title: "This account is private.", line: "Check back later." }
                      : { title: "Nothing captured yet.", line: "Check back later." };
            return (
              <EmptyState
                title={copy.title}
                line={copy.line}
                action={
                  data.isSelf && tab === "reelz" ? (
                    <Link
                      to="/camera"
                      className="ember-fill tap-target inline-flex items-center rounded-full px-6 text-sm font-semibold text-primary-foreground"
                    >
                      Capture a moment
                    </Link>
                  ) : null
                }
              />
            );
          }

          const groupedTabs: Array<[string, MomentCard[]]> = [];
          for (const m of list) {
            const label = dayLabel(m.createdAt);
            const last = groupedTabs[groupedTabs.length - 1];
            if (last && last[0] === label) last[1].push(m);
            else groupedTabs.push([label, [m]]);
          }

          return (
            <div className="space-y-7">
              {groupedTabs.map(([label, items]) => (
                <div key={label}>
                  <div className="flex items-center gap-3 px-5">
                    <span className="ember-fill size-[7px] shrink-0 rounded-full" aria-hidden />
                    <p className="data-figure text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {label}
                    </p>
                    <span className="h-px flex-1 bg-border" aria-hidden />
                    <span className="data-figure text-[11px] text-muted-foreground">
                      {items.length}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5 px-5">
                    {items.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setOpen(m)}
                        className="group relative aspect-[9/16] overflow-hidden rounded-[22px] border border-border bg-surface text-left"
                      >
                        {m.posterUrl || m.mediaUrl ? (
                          <img
                            src={m.posterUrl ?? m.mediaUrl ?? ""}
                            alt={m.caption ?? "Moment"}
                            className="size-full object-cover"
                            style={filterCss(m.styleFilter) ? { filter: filterCss(m.styleFilter) } : undefined}
                            loading="lazy"
                          />
                        ) : null}
                        <span className="stage-vignette absolute inset-0" aria-hidden />
                        {m.kind !== "photo" ? (
                          <span className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-background/55 backdrop-blur">
                            <Play className="size-3 fill-current" />
                          </span>
                        ) : null}
                        <span className="absolute inset-x-0 bottom-0 p-2.5">
                          {m.caption ? (
                            <span className="line-clamp-1 block font-display text-[13px] font-semibold leading-snug tracking-tight">
                              {m.caption}
                            </span>
                          ) : null}
                          <span className="data-figure mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{formatCount(m.viewCount)} seen</span>
                            <span className="text-primary">{formatCount(m.likeCount)} felt</span>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </section>
    </AppShell>
  );
}
