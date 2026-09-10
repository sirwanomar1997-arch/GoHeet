import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bookmark, Ban, Sparkles, Play, LayoutGrid, Settings, Pencil, Instagram, Youtube, Twitter, Facebook, Ghost, Globe, Eye, MessageCircle, Music2, ChevronDown, ShieldAlert, Repeat2, MoreHorizontal, Share2, type LucideIcon } from "lucide-react";
import { ShareSheet } from "@/components/reelzy/share-sheet";
import { getProfile, getFeed, toggleFollow, toggleBlock, submitReport, sendMessage, type MomentCard } from "@/lib/reelzy.functions";
import { useDemoMode } from "@/lib/use-demo-mode";
import { getDemoProfile } from "@/lib/demo-data";
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
  const demo = useDemoMode();
  const fetchProfile = useServerFn(getProfile);
  const follow = useServerFn(toggleFollow);
  const report = useServerFn(submitReport);
  const blockUser = useServerFn(toggleBlock);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageBody, setMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const postMessage = useServerFn(sendMessage);
  const navigate = useNavigate();
  const router = useRouter();
  const qc = useQueryClient();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [adultLink, setAdultLink] = useState<string | null>(null);
  const [sort, setSort] = useState<"new" | "views" | "old">("new");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, isLoading, refetch } = useQuery<any>({
    queryKey: ["profile", username, sort, demo],
    queryFn: () =>
      demo
        ? getDemoProfile(username, sort)
        : fetchProfile({ data: { username, sort } }),
    // Profile pictures must reflect the very latest choice (avatar ↔ photo),
    // so this always revalidates on mount and on focus.
    staleTime: 0,
    gcTime: 10 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!data?.isSelf) return;
    void Promise.all([
      router.preloadRoute({ to: "/edit-profile" }),
      router.preloadRoute({ to: "/settings" }),
    ]);
  }, [data?.isSelf, router]);

  // Opening a shared reel link (?r=<id>) lands straight on that reel.
  useEffect(() => {
    if (!data?.moments?.length) return;
    const id = new URLSearchParams(window.location.search).get("r");
    if (!id) return;
    const i = data.moments.findIndex((m: { id: string }) => m.id === id);
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
        <EmptyState title="No one by that name." line={`@${username} doesn't exist on GoHeet.`} />
      </AppShell>
    );
  }

  const p = data.profile;




  return (
    <AppShell hideNav>
      {/* --- Profile image stage --- */}
      <section className="relative overflow-hidden px-5 pb-2 pt-8">
        {/* Share profile — top-left */}
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          aria-label={data.isSelf ? "Share your profile" : "Share this profile"}
          className="tap-target absolute left-4 top-4 z-20 grid size-12 touch-manipulation select-none place-items-center rounded-full border border-border bg-surface-raised text-foreground shadow-lg transition-transform active:scale-90"
        >
          <Share2 className="pointer-events-none size-5" />
        </button>
        <div
          aria-hidden
          className="ember-fill pointer-events-none absolute left-1/2 top-4 size-72 -translate-x-1/2 rounded-full opacity-25 blur-[90px]"
        />
        {data.isSelf ? (
          <div className="absolute right-4 top-4 z-20 flex gap-2">
            <Link
              to="/edit-profile"
              preload="intent"
              replace
              aria-label="Edit profile"
              className="tap-target grid size-12 touch-manipulation select-none place-items-center rounded-full border border-border bg-surface-raised text-foreground shadow-lg transition-transform active:scale-90"
            >
              <Pencil className="pointer-events-none size-5" />
            </Link>
            <Link
              to="/settings"
              preload="intent"
              replace
              aria-label="Settings"
              className="tap-target grid size-12 touch-manipulation select-none place-items-center rounded-full border border-border bg-surface-raised text-foreground shadow-lg transition-transform active:scale-90"
            >
              <Settings className="pointer-events-none size-5" />
            </Link>
          </div>
        ) : (
          <div className="absolute right-5 top-5 z-50">
            <button
              type="button"
              aria-label="More options"
              aria-expanded={safetyOpen}
              onClick={() => setSafetyOpen((v) => !v)}
              className="grid size-10 place-items-center rounded-full border border-border bg-surface text-muted-foreground transition-colors hover:text-foreground"
            >
              <MoreHorizontal className="size-5" />
            </button>
            {safetyOpen ? (
              <>
                <button
                  type="button"
                  aria-label="Close"
                  className="fixed inset-0 z-40 cursor-default"
                  onClick={() => setSafetyOpen(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-xl">
                  <button
                    type="button"
                    onClick={async () => {
                      setSafetyOpen(false);
                      await report({ data: { targetType: "user", targetId: p.id, category: "harassment" } });
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
        )}

        <div className="relative flex flex-col items-center">
          <div
            className="key-glow untouchable-photo relative size-44 overflow-hidden rounded-[44px] border border-border bg-surface"
            onContextMenu={(e) => e.preventDefault()}
          >
            {p.avatarUrl ? (
              <img
                src={p.avatarUrl}
                alt={`${p.username}'s profile`}
                draggable={false}
                className="untouchable-photo size-full object-cover"
              />
            ) : (
              <span className="grid size-full place-items-center font-display text-6xl font-extrabold uppercase text-muted-foreground">
                {p.username.slice(0, 1)}
              </span>
            )}
          </div>

          {data.isSelf ? (
            <Link
              to="/edit-profile"
              replace
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <Sparkles className="size-3" /> Manage profile picture
            </Link>
          ) : null}

          {/* nickname + username — compact, tight under the avatar button */}
          <h2 className="mt-2 text-center font-display text-[13px] font-semibold tracking-tight text-foreground" data-no-translate>
            {p.displayName || p.username}
          </h2>

          <p className="data-figure mt-0.5 text-center text-[11px] font-normal tracking-normal text-muted-foreground" data-no-translate>
            @{p.username}
          </p>

          {/* bio lives under the username, only when the user adds one */}
          {p.bio ? (
            <p className="mt-5 max-w-[19rem] text-center text-sm leading-relaxed text-foreground/85" data-no-translate>
              {p.bio}
            </p>
          ) : null}

          {Object.keys(p.socialLinks ?? {}).length > 0 ? (
            <div className="mt-4 flex flex-wrap justify-center gap-2.5">
              {Object.entries((p.socialLinks ?? {}) as Record<string, string>).map(([key, url]) => {
                const icons: Record<string, { Icon: LucideIcon; label: string; color: string }> = {
                  instagram: { Icon: Instagram, label: "Instagram", color: "oklch(0.65 0.24 350)" },
                  tiktok: { Icon: Music2, label: "TikTok", color: "oklch(0.72 0.15 195)" },
                  youtube: { Icon: Youtube, label: "YouTube", color: "oklch(0.6 0.22 25)" },
                  twitter: { Icon: Twitter, label: "X (Twitter)", color: "oklch(0.75 0.02 250)" },
                  facebook: { Icon: Facebook, label: "Facebook", color: "oklch(0.6 0.18 255)" },
                  snapchat: { Icon: Ghost, label: "Snapchat", color: "oklch(0.88 0.16 100)" },
                  whatsapp: { Icon: MessageCircle, label: "WhatsApp", color: "oklch(0.72 0.17 150)" },
                  website: { Icon: Globe, label: "Website", color: "oklch(0.68 0.18 250)" },
                };
                const meta = icons[key];
                if (!meta) return null;
                if (key === "website" && (p.socialLinks ?? {})["website_adult"] === "1") {
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAdultLink(url)}
                      aria-label="Website (18+)"
                      title="Website (18+)"
                      className="relative grid size-11 place-items-center rounded-2xl border border-border bg-surface transition-transform hover:scale-105 active:scale-95"
                      style={{ color: meta.color }}
                    >
                      <Globe className="size-5" />
                      <span className="absolute -right-1 -top-1 rounded-full bg-[oklch(0.6_0.22_25)] px-1.5 py-px text-[9px] font-bold text-white">
                        18+
                      </span>
                    </button>
                  );
                }
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

          {/* Heet total — exact reference treatment: flame and bold total on one baseline. */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <HeetFlame className="size-16 shrink-0" glow />
            <span
              className="font-display text-[40px] font-extrabold leading-none tracking-normal text-foreground"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatCount(p.totalLikes)}
            </span>
          </div>





          {/* follower band — original rounded frame with the refined type */}
          <div className="mt-5 grid w-full max-w-sm grid-cols-2 overflow-hidden rounded-[2rem] border border-border bg-surface/35">
            {[
              ["Followers", formatCount(p.followerCount)],
              ["Following", formatCount(p.followingCount)],
            ].map(([k, v]) => (
              <div
                key={k as string}
                className="relative flex min-w-0 flex-col items-center gap-1.5 px-3 py-4 [&:not(:last-child)]:after:absolute [&:not(:last-child)]:after:bottom-0 [&:not(:last-child)]:after:right-0 [&:not(:last-child)]:after:top-0 [&:not(:last-child)]:after:w-px [&:not(:last-child)]:after:bg-border"
              >
                <p className="font-display text-[22px] font-bold leading-none tabular-nums text-foreground">
                  {v}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground">
                  {k}
                </p>
              </div>
            ))}
          </div>

          {data.isSelf ? (
            <div className="mt-5 grid w-full grid-cols-4 gap-2">
              {([
                { id: "reelz", label: "Posts", Icon: LayoutGrid, color: "oklch(0.82 0.16 75)", glow: "oklch(0.82 0.16 75 / 60%)" },
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
            <div className="mt-4 flex w-full items-center gap-2">
              <button
                type="button"
                onClick={() => followMutation.mutate()}
                className={`tap-target flex-1 rounded-full text-sm font-semibold ${
                  data.isFollowing
                    ? "border border-border text-foreground"
                    : "ember-fill text-primary-foreground"
                }`}
              >
                {data.isFollowing ? "Following" : "Follow"}
              </button>
              <button
                type="button"
                onClick={() => setMessageOpen(true)}
                className="tap-target flex-1 rounded-full border border-border text-sm font-semibold text-foreground"
              >
                Message
              </button>
              <button
                type="button"
                aria-label={`View @${p.username}'s reposts`}
                aria-pressed={tab === "reposted"}
                onClick={() => setTab((current) => (current === "reposted" ? "reelz" : "reposted"))}
                className={`tap-target grid w-14 place-items-center rounded-full border transition-colors ${
                  tab === "reposted" ? "border-primary bg-primary/10 text-primary" : "border-border"
                }`}
              >
                <Repeat2 className="size-5" />
              </button>
            </div>
          )}

        </div>
      </section>

      {messageOpen ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-background/70 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 cursor-default"
            onClick={() => setMessageOpen(false)}
          />
          <div className="relative w-full rounded-t-3xl border-t border-border bg-surface-raised p-5">
            <p className="font-display text-sm font-semibold">Message @{p.username}</p>
            <textarea
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              rows={3}
              placeholder="Say something…"
              className="mt-3 w-full resize-none rounded-2xl border border-border bg-surface p-3 text-sm outline-none"
            />
            <button
              type="button"
              disabled={sending || !messageBody.trim()}
              onClick={async () => {
                setSending(true);
                try {
                  const res = await postMessage({ data: { toUserId: p.id, body: messageBody.trim() } });
                  setMessageOpen(false);
                  setMessageBody("");
                  void navigate({
                    to: "/messages/$conversationId",
                    params: { conversationId: res.conversationId },
                  });
                } catch (err) {
                  toast.error((err as Error).message);
                } finally {
                  setSending(false);
                }
              }}
              className="ember-fill tap-target mt-3 w-full rounded-full text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      ) : null}


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
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/55 px-2 py-1 backdrop-blur">
                          <Eye
                            className="size-3.5"
                            style={{
                              color: "oklch(0.78 0.16 235)",
                              filter: "drop-shadow(0 0 5px oklch(0.7 0.2 235 / 75%))",
                            }}
                          />
                          <span className="data-figure text-[10px] font-semibold tabular-nums text-white">
                            {formatCount(m.viewCount)}
                          </span>
                        </span>
                        {m.kind !== "photo" ? (
                          <span className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-background/55 backdrop-blur">
                            <Play className="size-3 fill-current" />
                          </span>
                        ) : null}
                        <span className="absolute inset-x-0 bottom-0 p-2.5">
                          {m.caption ? (
                            <span className="line-clamp-1 block font-display text-[13px] font-semibold leading-snug tracking-tight" data-no-translate>
                              {m.caption}
                            </span>
                          ) : null}
                          <span className="data-figure mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span className="text-primary">{formatCount(m.likeCount)} heets</span>
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

      {adultLink ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border border-border bg-surface p-5 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-[oklch(0.6_0.22_25/15%)] text-[oklch(0.7_0.2_25)]">
              <ShieldAlert className="size-6" />
            </span>
            <h3 className="mt-3 font-display text-lg font-bold">Adult content ahead</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              This link leaves GoHeet and may contain content for adults only. Continue only if you
              are 18 or older.
            </p>
            <p className="mt-2 break-all text-[11px] text-muted-foreground/80">{adultLink}</p>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setAdultLink(null)}
                className="h-11 flex-1 rounded-2xl border border-border text-sm font-semibold"
              >
                Go back
              </button>
              <a
                href={adultLink}
                target="_blank"
                rel="noreferrer noopener"
                onClick={() => setAdultLink(null)}
                className="ember-fill grid h-11 flex-1 place-items-center rounded-2xl text-sm font-semibold text-primary-foreground"
              >
                I'm 18+, continue
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <ShareSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={`https://goheet.lovable.app/u/${p.username}`}
        text={`${p.displayName || p.username} on GoHeet`}
        title={data.isSelf ? "Share your profile" : "Share this profile"}
        qr
      />
    </AppShell>
  );
}
