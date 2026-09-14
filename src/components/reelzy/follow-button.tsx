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
  wrapperClassName = "",
  demo = false,
  onChange,
}: {
  userId: string;
  isFollowing: boolean;
  className?: string;
  wrapperClassName?: string;
  demo?: boolean;
  onChange?: (following: boolean) => void;
}) {
  const toggle = useServerFn(toggleFollow);
  const [following, setFollowing] = useState(isFollowing);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  // Reset for every profile, even when two profiles share the same server state.
  useEffect(() => {
    setFollowing(isFollowing);
    setConfirmOpen(false);
  }, [userId, isFollowing]);

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
      const result = await toggle({ data: { userId, following: target } });
      setFollowing(result.following);
      onChange?.(result.following);
    } catch {
      setFollowing(!target); // revert on failure
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      ref={wrapRef}
      className={`relative ${wrapperClassName}`}
      data-no-translate
      translate="no"
    >
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
            : "follow-fire"
        } ${className}`}
      >
        <span key={following ? "following" : "follow"}>
          {following ? "Following" : "Follow"}
        </span>
      </button>
      {confirmOpen && following ? (
        <div
          role="menu"
          className="absolute bottom-[calc(100%+8px)] left-0 z-[100] w-full min-w-32 overflow-hidden rounded-2xl border border-border bg-surface-raised shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
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
