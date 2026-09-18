import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import type { MomentCard } from "@/lib/reelzy.functions";
import { MomentStage } from "./moment-stage";

/**
 * Full-screen, swipe-to-navigate reel viewer.
 * Each moment fills the screen and carries its own stats, likes and comments.
 */
export function MomentReel({
  moments,
  startIndex = 0,
  onClose,
  onGone,
  title,
}: {
  moments: MomentCard[];
  startIndex?: number;
  onClose: () => void;
  onGone?: () => void;
  title?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [index, setIndex] = useState(startIndex);
  const [mediaReady, setMediaReady] = useState(false);

  // Position the tapped moment before the browser paints the full-screen viewer.
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: startIndex * el.clientHeight, behavior: "auto" });
  }, [startIndex]);

  // Lock the page behind the viewer while it's open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-black ${mediaReady ? "visible" : "invisible"}`}
      aria-hidden={!mediaReady}
    >
      <div
        ref={scrollerRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          if (!el.clientHeight) return;
          setIndex(Math.round(el.scrollTop / el.clientHeight));
        }}
        className="h-[100svh] snap-y snap-mandatory overflow-y-auto overscroll-contain"
      >
        {moments.map((m, momentIndex) => (
          <MomentStage
            key={m.id}
            moment={m}
            fullscreen
            {...(onGone ? { onGone } : {})}
            {...(momentIndex === startIndex ? { onMediaReady: () => setMediaReady(true) } : {})}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Back"
        className="absolute left-4 top-4 grid size-10 place-items-center rounded-full border border-[oklch(1_0_0/14%)] bg-background/50 backdrop-blur-md"
      >
        <ChevronLeft className="size-5" />
      </button>

      <div className="pointer-events-none absolute right-4 top-6 flex flex-col items-end gap-1">
        {title ? (
          <span className="data-figure rounded-full bg-background/45 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-md">
            {title}
          </span>
        ) : null}
        <span className="data-figure rounded-full bg-background/45 px-2.5 py-1 text-[11px] tabular-nums text-foreground backdrop-blur-md">
          {Math.min(index + 1, moments.length)} / {moments.length}
        </span>
      </div>
    </div>
  );
}
