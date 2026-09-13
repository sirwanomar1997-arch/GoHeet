import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toggleFollow } from "@/lib/reelzy.functions";

/**
 * Follow / Following button.
 * - Tapping "Follow" switches to "Following" instantly (optimistic).
 * - Tapping "Following" opens a small "Unfollow" choice instead of
 *   unfollowing immediately.
 */
export function FollowButton({
  userId,
  isFollowing,
  className = "",
  demo = false,
  onChange,
}: {
  userId: string;
  isFollowing: boolean;
  className?: string;
  demo?: boolean;
  onChange?: (following: boolean) => void;
}) {
  const toggle = useServerFn(toggleFollow);
  const [following, setFollowing] = useState(isFollowing);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Keep in sync when the server data refreshes.
  useEffect(() => setFollowing(isFollowing), [isFollowing]);

  // Close the unfollow choice when tapping anywhere else.
  useEffect(() => {
    if (!confirmOpen) return;
    const close = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setConfirmOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [confirmOpen]);

  const run = async (target: boolean) => {
    setConfirmOpen(false);
    setFollowing(target); // instant feedback
    if (demo) return; // preview mode: local only
    setBusy(true);
    try {
      await toggle({ data: { userId } });
      onChange?.(target);
    } catch {
      setFollowing(!target); // revert on failure
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={busy}
        aria-pressed={following}
        onClick={() => {
          if (busy) return;
          if (following) {
            setConfirmOpen((o) => !o); // second step: choose Unfollow
          } else {
            void run(true);
          }
        }}
        className={`tap-target rounded-full text-sm font-semibold transition-colors ${
          following
            ? "border border-border text-foreground"
            : "ember-fill text-primary-foreground"
        } ${className}`}
      >
        {following ? "Following" : "Follow"}
      </button>
      {confirmOpen ? (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[80] min-w-32 overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-lg">
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(false)}
            className="tap-target flex w-full items-center justify-center px-4 text-sm font-semibold text-destructive"
          >
            Unfollow
          </button>
        </div>
      ) : null}
    </div>
  );
}
