import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Settings, Bookmark, ShieldAlert, Sparkles, Play } from "lucide-react";
import { getProfile, toggleFollow, submitReport, type MomentCard } from "@/lib/reelzy.functions";
import { AppShell } from "@/components/reelzy/nav";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { MomentStage } from "@/components/reelzy/moment-stage";
import { formatCount, dayLabel, timeAgo } from "@/components/reelzy/format";

export const Route = createFileRoute("/_authenticated/u/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const fetchProfile = useServerFn(getProfile);
  const follow = useServerFn(toggleFollow);
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
  const grouped: Array<[string, MomentCard[]]> = [];
  for (const m of data.moments) {
    const label = dayLabel(m.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last[0] === label) last[1].push(m);
    else grouped.push([label, [m]]);
  }

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
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 py-1.5 text-[11px] font-semibold text-muted-foreground"
            >
              <Sparkles className="size-3" /> {p.avatarUrl ? "Remake your avatar" : "Create your avatar"}
            </Link>
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

          {/* stats orbit the avatar as one quiet ring of numbers */}
          <div className="mt-6 flex w-full items-center justify-between rounded-full border border-border bg-surface px-5 py-3">
            {[
              ["Moments", formatCount(p.momentCount)],
              ["Followers", formatCount(p.followerCount)],
              ["Following", formatCount(p.followingCount)],
              ["Seen", formatCount(p.totalViews)],
            ].map(([k, v]) => (
              <div key={k} className="text-center">
                <p className="data-figure text-base leading-none text-foreground">{v}</p>
                <p className="data-figure mt-1 text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  {k}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex w-full gap-2">
            {data.isSelf ? (
              <>
                <Link
                  to="/camera"
                  className="ember-fill tap-target flex flex-1 items-center justify-center rounded-2xl text-sm font-semibold text-primary-foreground"
                >
                  Capture a moment
                </Link>
                <Link
                  to="/saved"
                  aria-label="Kept moments"
                  className="tap-target grid w-14 place-items-center rounded-2xl border border-border"
                >
                  <Bookmark className="size-4" />
                </Link>
                <Link
                  to="/settings"
                  aria-label="Settings"
                  className="tap-target grid w-14 place-items-center rounded-2xl border border-border"
                >
                  <Settings className="size-4" />
                </Link>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </section>

      {/* --- Moments orbit the avatar as day-by-day ribbons, never a grid --- */}
      <section className="pb-12 pt-8">
        <h2 className="data-figure px-5 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          Life so far
        </h2>

        {data.moments.length === 0 ? (
          <EmptyState
            title={data.isSelf ? "Your timeline is empty." : "Nothing captured yet."}
            line={
              data.isSelf
                ? "Open the camera and put something real on it."
                : p.isPrivate
                  ? "This account is private."
                  : "Check back later."
            }
            action={
              data.isSelf ? (
                <Link
                  to="/camera"
                  className="ember-fill tap-target inline-flex items-center rounded-full px-6 text-sm font-semibold text-primary-foreground"
                >
                  Capture a moment
                </Link>
              ) : null
            }
          />
        ) : (
          <div className="mt-4 space-y-7">
            {grouped.map(([label, items]) => (
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

                <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2">
                  {items.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setOpen(m)}
                      className="group relative aspect-[3/5] w-[58%] shrink-0 snap-start overflow-hidden rounded-[26px] border border-border bg-surface text-left"
                    >
                      {m.posterUrl || m.mediaUrl ? (
                        <img
                          src={m.posterUrl ?? m.mediaUrl ?? ""}
                          alt={m.caption ?? "Moment"}
                          className="size-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                      <span className="stage-vignette absolute inset-0" aria-hidden />
                      {m.kind !== "photo" ? (
                        <span className="absolute right-3 top-3 grid size-8 place-items-center rounded-full bg-background/55 backdrop-blur">
                          <Play className="size-3.5 fill-current" />
                        </span>
                      ) : null}
                      <span className="absolute inset-x-0 bottom-0 p-3.5">
                        <span className="line-clamp-2 block font-display text-sm font-semibold leading-snug tracking-tight">
                          {m.caption || (m.kind === "photo" ? "A still" : "A moment")}
                        </span>
                        <span className="data-figure mt-1.5 block text-[10px] text-muted-foreground">
                          {timeAgo(m.createdAt)} · {formatCount(m.viewCount)} seen ·{" "}
                          {formatCount(m.likeCount)} felt
                        </span>
                        {m.locationLabel ? (
                          <span className="data-figure mt-0.5 block text-[10px] text-primary">
                            {m.locationLabel}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
