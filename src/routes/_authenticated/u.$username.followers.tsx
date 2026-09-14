import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, UserMinus } from "lucide-react";
import { toast } from "sonner";
import { listFollowers, removeFollower } from "@/lib/reelzy.functions";
import { useDemoMode } from "@/lib/use-demo-mode";
import { demoPeople } from "@/lib/demo-data";
import { AppShell } from "@/components/reelzy/nav";
import { BackLink } from "@/components/reelzy/back-link";
import { EmptyState, LoadingRail } from "@/components/reelzy/empty-state";
import { FollowButton } from "@/components/reelzy/follow-button";
import { formatCount } from "@/components/reelzy/format";

export const Route = createFileRoute("/_authenticated/u/$username/followers")({
  component: FollowersPage,
});

type Person = {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number;
  isFollowing: boolean;
};

/** Three-dots menu with the "Remove this follower" choice. */
function RemoveMenu({ onRemove, busy }: { onRemove: () => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative shrink-0">
      <button
        type="button"
        aria-label="More options"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="tap-target grid size-10 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
      >
        <MoreHorizontal className="size-5" />
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-[100] w-56 overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            disabled={busy}
            onClick={() => {
              setOpen(false);
              onRemove();
            }}
            className="tap-target flex w-full items-center gap-2 px-4 text-sm font-semibold text-destructive"
          >
            <UserMinus className="size-4" />
            Remove this follower
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FollowersPage() {
  const { username } = Route.useParams();
  const demo = useDemoMode();
  const fetchFollowers = useServerFn(listFollowers);
  const remove = useServerFn(removeFollower);
  const qc = useQueryClient();
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ people: Person[]; isSelf: boolean }>({
    queryKey: ["followers", username, demo],
    queryFn: () =>
      demo
        ? Promise.resolve({
            people: demoPeople.map((p) => ({
              id: p.id,
              username: p.username,
              displayName: p.displayName,
              avatarUrl: p.avatarUrl,
              followerCount: p.followerCount,
              isFollowing: false,
            })),
            isSelf: true,
          })
        : fetchFollowers({ data: { username } }),
    staleTime: 0,
    refetchOnMount: "always",
  });

  const handleRemove = async (person: Person) => {
    if (demo) {
      qc.setQueryData(["followers", username, demo], (old: { people: Person[]; isSelf: boolean } | undefined) =>
        old ? { ...old, people: old.people.filter((p) => p.id !== person.id) } : old,
      );
      toast(`Removed @${person.username} from your followers`);
      return;
    }
    setRemovingId(person.id);
    try {
      await remove({ data: { userId: person.id } });
      qc.setQueryData(["followers", username, demo], (old: { people: Person[]; isSelf: boolean } | undefined) =>
        old ? { ...old, people: old.people.filter((p) => p.id !== person.id) } : old,
      );
      void qc.invalidateQueries({ queryKey: ["profile", username] });
      toast(`Removed @${person.username} from your followers`);
    } catch {
      toast.error("Could not remove this follower. Try again.");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <AppShell>
      <header className="sticky top-0 z-30 flex items-center gap-3 bg-background/90 px-4 py-3 backdrop-blur-xl">
        <BackLink fallback={`/u/${username}`} />
        <div className="min-w-0">
          <h1 className="font-display text-xl font-extrabold tracking-[-0.04em]">Followers</h1>
          <p className="truncate text-[11px] text-muted-foreground" data-no-translate>
            @{username}
          </p>
        </div>
      </header>

      {isLoading ? (
        <LoadingRail label="Loading followers" />
      ) : (data?.people.length ?? 0) === 0 ? (
        <EmptyState title="No followers yet." line="When people follow, they appear here." />
      ) : (
        <ul className="divide-y divide-border px-4 pb-8">
          {data?.people.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3">
              <Link to="/u/$username" params={{ username: p.username }} className="shrink-0">
                <span className="grid size-11 place-items-center overflow-hidden rounded-2xl bg-surface-raised font-display text-sm font-bold uppercase">
                  {p.avatarUrl ? (
                    <img
                      src={p.avatarUrl}
                      alt=""
                      draggable={false}
                      className="untouchable-photo size-full object-cover"
                    />
                  ) : (
                    p.username.slice(0, 1)
                  )}
                </span>
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to="/u/$username"
                  params={{ username: p.username }}
                  className="block truncate font-semibold"
                  data-no-translate
                >
                  {p.displayName || p.username}
                </Link>
                <p className="data-figure truncate text-[11px] text-muted-foreground" data-no-translate>
                  @{p.username} · {formatCount(p.followerCount)} followers
                </p>
              </div>
              <FollowButton
                userId={p.id}
                isFollowing={p.isFollowing}
                demo={demo}
                className="px-4 text-xs"
                onChange={() => void qc.invalidateQueries({ queryKey: ["followers"] })}
              />
              {data?.isSelf ? (
                <RemoveMenu busy={removingId === p.id} onRemove={() => void handleRemove(p)} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
