import { useNavigate } from "@tanstack/react-router";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bookmark, Ban, Sparkles, Play, LayoutGrid, Settings, Pencil, Instagram, Youtube, Twitter, Facebook, Ghost, MessageCircle, Music2, ChevronDown, ShieldAlert, Repeat2, type LucideIcon } from "lucide-react";
import { getProfile, getFeed, toggleFollow, toggleBlock, submitReport, sendMessage, type MomentCard } from "@/lib/reelzy.functions";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { MomentReel } from "@/components/reelzy/moment-reel";
import { formatCount, dayLabel } from "@/components/reelzy/format";
import { filterCss } from "@/components/reelzy/creative";
import { HeetFlame } from "@/components/reelzy/heet-flame";

export const Route = createFileRoute("/_authenticated/u/$username")({
  component: ProfilePage,
});

const SORT_OPTIONS = [
  { key: "new", label: "Newest" },
  { key: "views", label: "Most viewed" },
  { key: "old", label: "Oldest" },
] as const;

function ProfileSort({
  sort,
  onChange,
}: {
  sort: "new" | "views" | "old";
  onChange: (s: "new" | "views" | "old") => void;
}) {
  const [open, setOpen] = useState(false);
  const current = SORT_OPTIONS.find((o) => o.key === sort);
  return (
    <div className="mb-4 px-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="data-figure inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <span className="uppercase tracking-[0.12em]">Sort by:</span>
        <span className="font-semibold text-foreground">{current?.label}</span>
        <ChevronDown className={`size-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => {
                onChange(o.key);
                setOpen(false);
              }}
              aria-pressed={sort === o.key}
              className={`data-figure rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.12em] transition-colors ${
                sort === o.key
                  ? "border-transparent bg-[image:var(--gradient-ember)] text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProfilePage() {
  const { username } = Route.useParams();
  const fetchProfile = useServerFn(getProfile);
  const follow = useServerFn(toggleFollow);
  const navigate = useNavigate();
  const startChat = useServerFn(sendMessage);
  const [messageText, setMessageText] = useState("");
  const [composing, setComposing] = useState(false);
  const report = useServerFn(submitReport);
  const blockUser = useServerFn(toggleBlock);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const qc = useQueryClient();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [sort, setSort] = useState<"new" | "views" | "old">("new");

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["profile", username, sort],
    queryFn: () => fetchProfile({ data: { username, sort } }),
  });

  // Opening a shared reel link (?r=<id>) lands straight on that reel.
  useEffect(() => {
    if (!data?.moments?.length) return;
    const id = new URLSearchParams(window.location.search).get("r");
    if (!id) return;
    const i = data.moments.findIndex((m) => m.id === id);
    if (i >= 0) setOpenIndex(i);
  }, [data]);

  const followMutation = useMutation({
    mutationFn: () => follow({ data: { userId: data!.profile!.id } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["profile", username] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const [tab, setTab] = useState<"reelz" | "liked" | "saved" | "reposted">("reelz");
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
      <AppShell hideNav>
        <LoadingRail label="Opening timeline" />
      </AppShell>
    );
  }

  if (!data?.profile) {
    return (
      <AppShell hideNav>
        <EmptyState title="No one by that name." line={`@${username} doesn't exist on Reelzy.`} />
      </AppShell>
    );
  }

  const p = data.profile;




  return (
    <AppShell hideNav>
      {/* --- Avatar stage: the character is the page, not a tiny circle --- */}
      <section className="relative overflow-hidden px-5 pb-2 pt-8">
        <div
          aria-hidden
          className="ember-fill absolute left-1/2 top-4 size-72 -translate-x-1/2 rounded-full opacity-25 blur-[90px]"
        />
        {data.isSelf ? (
          <>
            <Link
              to="/edit-profile"
              aria-label="Edit profile"
              className="absolute left-5 top-5 grid size-10 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pencil className="size-4" />
            </Link>
            <div className="absolute right-5 top-5 flex gap-2">
              <Link
                to="/messages"
                aria-label="Messages"
                className="grid size-10 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
              >
                <MessageCircle className="size-4" />
              </Link>
              <Link
                to="/settings"
                aria-label="Settings"
                className="grid size-10 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
              >
                <Settings className="size-4" />
              </Link>
            </div>
          </>
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
            <Link
              to="/avatar"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Sparkles className="size-3" /> {p.avatarUrl ? "Change your avatar" : "Create your avatar"}
            </Link>
          ) : null}

          {/* nickname + username — compact, tight under the avatar button */}
          <h2 className="mt-2 text-center font-display text-[13px] font-semibold tracking-tight text-foreground">
            {p.displayName || p.username}
          </h2>

          <p className="data-figure mt-0.5 text-center text-[11px] font-normal tracking-normal text-muted-foreground">
            @{p.username}
          </p>

          {/* bio lives under the username, only when the user adds one */}
          {p.bio ? (
            <p className="mt-5 max-w-[19rem] text-center text-sm leading-relaxed text-foreground/85">
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

          {/* the heet total — one big flame, one big number */}
          <div className="mt-5 flex items-center justify-center gap-4">
            <HeetFlame className="size-16" glow />
            <span className="font-display text-[46px] font-extrabold leading-none tracking-[-0.04em] text-foreground">
              {formatCount(p.totalLikes)}
            </span>
          </div>

          {/* stat band — a premium segmented strip */}
          <div className="mt-5 grid w-full grid-cols-4 overflow-hidden rounded-2xl border border-border bg-surface">
            {[
              ["Reelz", formatCount(p.momentCount)],
              ["Followers", formatCount(p.followerCount)],
              ["Following", formatCount(p.followingCount)],
              ["Views", formatCount(p.totalViews)],
            ].map(([k, v]) => (
              <div
                key={k as string}
                className="relative flex flex-col items-center gap-1 px-1 py-3.5 [&:not(:last-child)]:border-r [&:not(:last-child)]:border-border"
              >
                <p className="data-figure text-lg leading-none tabular-nums text-foreground">
                  {v}
                </p>
                <p className="data-figure text-[8.5px] uppercase tracking-[0.16em] text-muted-foreground">
                  {k}
                </p>
              </div>
            ))}
          </div>

          {data.isSelf ? (
            <div className="mt-5 grid w-full grid-cols-4 gap-2">
              {([
                { id: "reelz", label: "Your Reelz", Icon: LayoutGrid, color: "oklch(0.82 0.16 75)", glow: "oklch(0.82 0.16 75 / 60%)" },
                { id: "liked", label: "Heeted", Icon: null, color: "oklch(0.64 0.22 18)", glow: "oklch(0.64 0.22 18 / 60%)" },
                { id: "saved", label: "Saved", Icon: Bookmark, color: "oklch(0.74 0.15 150)", glow: "oklch(0.74 0.15 150 / 60%)" },
                { id: "reposted", label: "Reposts", Icon: Repeat2, color: "oklch(0.72 0.17 150)", glow: "oklch(0.72 0.17 150 / 60%)" },
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
                    {Icon ? (
                      <Icon
                        className="size-5"
                        strokeWidth={activeTab ? 2.4 : 1.7}
                        style={{
                          color,
                          opacity: activeTab ? 1 : 0.45,
                          filter: activeTab ? `drop-shadow(0 0 7px ${glow})` : "none",
                        }}
                      />
                    ) : (
                      <HeetFlame
                        className="size-5"
                        glow={activeTab}
                      />
                    )}
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
                aria-label={`View @${p.username}'s reposts`}
                aria-pressed={tab === "reposted"}
                onClick={() => setTab((current) => (current === "reposted" ? "reelz" : "reposted"))}
                className={`tap-target grid w-14 place-items-center rounded-2xl border transition-colors ${
                  tab === "reposted" ? "border-primary bg-primary/10 text-primary" : "border-border"
                }`}
              >
                <Repeat2 className="size-5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  aria-label="Report or block this person"
                  aria-expanded={safetyOpen}
                  onClick={() => setSafetyOpen((v) => !v)}
                  className="tap-target grid w-14 place-items-center rounded-2xl border border-border"
                >
                  <Ban className="size-4 text-destructive" />
                </button>
                {safetyOpen ? (
                  <>
                    <button
                      type="button"
                      aria-label="Close"
                      className="fixed inset-0 z-40 cursor-default"
                      onClick={() => setSafetyOpen(false)}
                    />
                    <div className="absolute bottom-full right-0 z-50 mb-2 w-44 overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-xl">
                      <button
                        type="button"
                        onClick={async () => {
                          setSafetyOpen(false);
                          await report({
                            data: { targetType: "user", targetId: p.id, category: "harassment" },
                          });
                          toast.success("Reported to the safety team.");
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-sm transition-colors hover:bg-surface"
                      >
                        <ShieldAlert className="size-4 text-amber-400" />
                        Report @{p.username}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setSafetyOpen(false);
                          try {
                            const res = await blockUser({ data: { userId: p.id } });
                            toast.success(
                              res.blocked
                                ? `@${p.username} is blocked. They can't see or contact you.`
                                : `@${p.username} is unblocked.`,
                            );
                            void refetch();
                          } catch (err) {
                            toast.error((err as Error).message);
                          }
                        }}
                        className="flex w-full items-center gap-2.5 border-t border-border px-4 py-3 text-left text-sm text-destructive transition-colors hover:bg-surface"
                      >
                        <Ban className="size-4" />
                        Block @{p.username}
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
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
        <ProfileSort sort={sort} onChange={setSort} />
        {(() => {
          const list: MomentCard[] = tab === "reposted"
            ? data.reposts
            : data.isSelf
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
                  : tab === "reposted"
                    ? !data.isSelf && !p.showReposts
                      ? { title: "Reposts are private.", line: `@${p.username} keeps this section private.` }
                      : { title: "No reposts yet.", line: data.isSelf ? "Videos you repost will live here." : "Check back later." }
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
                        onClick={() => setOpenIndex(list.indexOf(m))}
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

              {openIndex !== null ? (
                <MomentReel
                  moments={list}
                  startIndex={openIndex}
                  title={tab === "liked" ? "Liked" : tab === "saved" ? "Saved" : tab === "reposted" ? "Reposts" : `@${p.username}`}
                  onClose={() => setOpenIndex(null)}
                  onGone={() => {
                    setOpenIndex(null);
                    void refetch();
                  }}
                />
              ) : null}
            </div>
          );
        })()}
      </section>
    </AppShell>
  );
}
