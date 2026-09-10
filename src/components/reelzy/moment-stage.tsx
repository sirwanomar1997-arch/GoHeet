import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Eye,
  Repeat,
  Bookmark,
  MoreHorizontal,
  Send,
  Volume2,
  VolumeX,
  Play,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addComment,
  deleteComment,
  deleteMoment,
  listComments,
  recordView,
  submitReport,
  toggleBlock,
  toggleCommentLike,
  toggleLike,
  toggleRepost,
  toggleSave,
  type MomentCard,
} from "@/lib/reelzy.functions";
import { formatCount, timeAgo } from "./format";
import { HeetFlame } from "./heet-flame";
import { ShareSheet } from "./share-sheet";
import { GradeLayers } from "./grade";

import {
  filterCss,
  overlayFontStyle,
  overlayStyleProps,
  parseOverlay,
} from "./creative";


const REPORT_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: "harassment", label: "Harassment" },
  { value: "bullying", label: "Bullying" },
  { value: "hate", label: "Hate" },
  { value: "sexual", label: "Sexual content" },
  { value: "violence", label: "Violence" },
  { value: "dangerous", label: "Dangerous behaviour" },
  { value: "spam", label: "Spam" },
  { value: "impersonation", label: "Impersonation" },
  { value: "ai_generated", label: "AI-generated / not real" },
  { value: "illegal", label: "Illegal content" },
  { value: "self_harm", label: "Self-harm" },
  { value: "other", label: "Something else" },
];

export function MomentStage({
  moment,
  onGone,
  fullscreen = false,
}: {
  moment: MomentCard;
  onGone?: () => void;
  fullscreen?: boolean;
}) {
  const qc = useQueryClient();
  const repost = useServerFn(toggleRepost);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const watchedRef = useRef(0);
  const reportedRef = useRef(false);

  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(moment.liked);
  const [likeCount, setLikeCount] = useState(moment.likeCount);
  const [saved, setSaved] = useState(moment.saved);
  const [reposted, setReposted] = useState(moment.reposted);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [bursts, setBursts] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [heetPop, setHeetPop] = useState(false);

  const look = filterCss(moment.styleFilter);
  const overlay = parseOverlay(moment.overlay);

  const togglePlayback = useCallback(() => {
    const vid = videoRef.current;
    if (!vid) return;
    if (vid.paused) {
      void vid.play().catch(() => undefined);
      setPaused(false);
    } else {
      vid.pause();
      setPaused(true);
    }
  }, []);

  /* ---------------- Pinch / wheel zoom + pan ---------------- */
  const zoomWrapRef = useRef<HTMLDivElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const zoomStateRef = useRef({ zoom: 1, offset: { x: 0, y: 0 } });
  zoomStateRef.current = { zoom, offset };
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchRef = useRef<{ dist: number; cx: number; cy: number } | null>(null);
  const lastTapRef = useRef(0);
  const movedRef = useRef(false);

  const MIN_ZOOM = 1;
  const MAX_ZOOM = 5;
  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const clampOffset = useCallback((x: number, y: number, z: number) => {
    const el = zoomWrapRef.current;
    if (!el || z <= 1) return { x: 0, y: 0 };
    const maxX = (el.clientWidth * (z - 1)) / 2;
    const maxY = (el.clientHeight * (z - 1)) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }, []);

  const zoomAt = useCallback(
    (nextZoomRaw: number, px: number, py: number) => {
      const el = zoomWrapRef.current;
      if (!el) return;
      const { zoom: z, offset: o } = zoomStateRef.current;
      const next = clampZoom(nextZoomRaw);
      if (next === z) return;
      const cx = el.clientWidth / 2;
      const cy = el.clientHeight / 2;
      const k = next / z;
      const nx = px - cx - (px - cx - o.x) * k;
      const ny = py - cy - (py - cy - o.y) * k;
      const clamped = clampOffset(nx, ny, next);
      setZoom(next);
      setOffset(next <= 1 ? { x: 0, y: 0 } : clamped);
    },
    [clampOffset],
  );

  const zoomAtRef = useRef(zoomAt);
  zoomAtRef.current = zoomAt;

  useEffect(() => {
    const el = zoomWrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
      const rect = el.getBoundingClientRect();
      zoomAtRef.current(
        zoomStateRef.current.zoom * Math.exp(-dy * 0.0018),
        e.clientX - rect.left,
        e.clientY - rect.top,
      );
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    movedRef.current = false;
    if (pointersRef.current.size === 2) {
      const [a, b] = [...pointersRef.current.values()];
      if (a && b) {
        pinchRef.current = {
          dist: Math.hypot(a.x - b.x, a.y - b.y),
          cx: (a.x + b.x) / 2,
          cy: (a.y + b.y) / 2,
        };
      }
    }
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const prev = pointersRef.current.get(e.pointerId);
    if (!prev) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const el = zoomWrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const [a, b] = [...pointersRef.current.values()];
      if (!a || !b) return;
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const ratio = dist / (pinchRef.current.dist || dist);
      pinchRef.current.dist = dist;
      movedRef.current = true;
      zoomAtRef.current(
        zoomStateRef.current.zoom * ratio,
        (a.x + b.x) / 2 - rect.left,
        (a.y + b.y) / 2 - rect.top,
      );
      return;
    }

    if (zoomStateRef.current.zoom > 1) {
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) movedRef.current = true;
      const o = zoomStateRef.current.offset;
      setOffset(clampOffset(o.x + dx, o.y + dy, zoomStateRef.current.zoom));
    }
  };

  const endPointer = (e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchRef.current = null;
  };

  const heetRef = useRef<(x: number, y: number) => void>(() => undefined);

  const onMediaTap = (e: React.PointerEvent) => {
    endPointer(e);
    if (movedRef.current) return;
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
      lastTapRef.current = 0;
      const el = zoomWrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (zoomStateRef.current.zoom > 1) {
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        return;
      }
      // Double tap anywhere on the frame = heet it, with the flame popping up.
      heetRef.current(e.clientX - rect.left, e.clientY - rect.top);
      return;
    }
    lastTapRef.current = now;
    window.setTimeout(() => {
      if (lastTapRef.current && Date.now() - lastTapRef.current >= 280) {
        lastTapRef.current = 0;
        if (moment.kind === "video") togglePlayback();
      }
    }, 300);
  };

  const resetZoom = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };


  const like = useServerFn(toggleLike);
  const save = useServerFn(toggleSave);
  const view = useServerFn(recordView);
  const report = useServerFn(submitReport);
  const block = useServerFn(toggleBlock);
  const removeMoment = useServerFn(deleteMoment);

  const flushView = useCallback(
    (completed: boolean) => {
      if (reportedRef.current || watchedRef.current < 1500) return;
      reportedRef.current = true;
      void view({ data: { momentId: moment.id, watchedMs: Math.round(watchedRef.current), completed } });
    },
    [moment.id, view],
  );

  useEffect(() => {
    const el = containerRef.current;
    const vid = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            void vid?.play().catch(() => undefined);
          } else {
            vid?.pause();
            flushView(false);
          }
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [flushView]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;
    vid.volume = moment.originalAudioVolume;
    let last = 0;
    const onTime = () => {
      const t = vid.currentTime * 1000;
      if (t > last) watchedRef.current += t - last;
      last = t;
      if (vid.duration) setProgress(Math.min(1, vid.currentTime / vid.duration));
      if (watchedRef.current >= 1500) flushView(false);
    };

    const onEnded = () => {
      reportedRef.current = false;
      watchedRef.current = Math.max(watchedRef.current, 3000);
      flushView(true);
      last = 0;
    };
    vid.addEventListener("timeupdate", onTime);
    vid.addEventListener("ended", onEnded);
    return () => {
      vid.removeEventListener("timeupdate", onTime);
      vid.removeEventListener("ended", onEnded);
    };
  }, [flushView, moment.originalAudioVolume]);

  // Photos still count as seen after a short dwell.
  useEffect(() => {
    if (moment.kind !== "photo") return;
    const timer = setTimeout(() => {
      watchedRef.current = 2000;
      flushView(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [moment.kind, flushView]);

  const likeMutation = useMutation({
    mutationFn: () => like({ data: { momentId: moment.id } }),
    onMutate: () => {
      setLiked((v) => !v);
      setLikeCount((c) => c + (liked ? -1 : 1));
    },
    onError: () => {
      setLiked(moment.liked);
      setLikeCount(moment.likeCount);
      toast.error("Couldn't register that. Try again.");
    },
  });

  heetRef.current = (x: number, y: number) => {
    const id = Date.now() + Math.random();
    setBursts((b) => [...b, { id, x, y }]);
    window.setTimeout(() => setBursts((b) => b.filter((v) => v.id !== id)), 900);
    if (!liked) likeMutation.mutate();
  };



  const saveMutation = useMutation({
    mutationFn: () => save({ data: { momentId: moment.id } }),
    onMutate: () => setSaved((v) => !v),
    onSuccess: (res) => {
      setSaved(res.saved);
      toast.success(res.saved ? "Kept." : "Removed from kept.");
      void qc.invalidateQueries({ queryKey: ["feed", "saved"] });
    },
    onError: () => {
      setSaved(moment.saved);
      toast.error("Couldn't save that moment.");
    },
  });

  const repostMutation = useMutation({
    mutationFn: () => repost({ data: { momentId: moment.id } }),
    onSuccess: (res) => {
      setReposted(res.reposted);
      toast.success(res.reposted ? "Reposted to your profile." : "Removed from your reposts.");
      void qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Couldn't update your repost."),
  });

  const reportMutation = useMutation({
    mutationFn: (category: string) =>
      report({ data: { targetType: "moment", targetId: moment.id, category } }),
    onSuccess: () => {
      setReportOpen(false);
      toast.success("Reported. Our safety team will review it.");
    },
    onError: () => toast.error("Couldn't send that report."),
  });

  const blockMutation = useMutation({
    mutationFn: () => block({ data: { userId: moment.author.id } }),
    onSuccess: () => {
      toast.success(`You blocked @${moment.author.username}.`);
      onGone?.();
      void qc.invalidateQueries();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => removeMoment({ data: { momentId: moment.id } }),
    onSuccess: () => {
      toast.success("Moment deleted.");
      onGone?.();
      void qc.invalidateQueries();
    },
  });

  return (
    <section
      ref={containerRef}
      className={
        fullscreen
          ? "relative h-[100svh] w-full shrink-0 snap-start snap-always overflow-hidden bg-black"
          : "animate-shutter relative h-[calc(100svh-6.5rem)] w-full snap-start snap-always overflow-hidden rounded-[30px] bg-surface shadow-[0_30px_60px_-30px_oklch(0_0_0/90%)] ring-1 ring-[oklch(1_0_0/6%)]"
      }
      aria-label={`Moment by ${moment.author.username}`}
    >
      <div
        ref={zoomWrapRef}
        className="absolute inset-0 touch-none overflow-hidden"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onMediaTap}
        onPointerCancel={endPointer}
        style={{
          transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
          transition: pinchRef.current ? "none" : "transform 120ms ease-out",
        }}
      >
        {moment.kind === "video" && moment.mediaUrl ? (
          <video
            ref={videoRef}
            src={moment.mediaUrl}
            poster={moment.posterUrl ?? undefined}
            className="size-full object-cover"
            style={look ? { filter: look } : undefined}
            playsInline
            loop
            muted={muted}
            preload="metadata"
          />
        ) : moment.mediaUrl ? (
          <img
            src={moment.mediaUrl}
            alt={moment.caption ?? `A moment by ${moment.author.username}`}
            className="size-full object-cover"
            style={look ? { filter: look } : undefined}
            draggable={false}
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-muted-foreground">
            This moment is unavailable.
          </div>
        )}
        <GradeLayers filterId={moment.styleFilter} />
      </div>


      {zoom > 1 ? (
        <button
          type="button"
          onClick={resetZoom}
          className="data-figure absolute bottom-[42%] left-1/2 z-10 -translate-x-1/2 rounded-full border border-[oklch(1_0_0/16%)] bg-background/60 px-3 py-1 text-[11px] backdrop-blur-md"
        >
          {zoom.toFixed(1)}× · reset
        </button>
      ) : null}


      {/* Film treatment: vignette + grain so real footage reads cinematic. */}
      {/* Flames that pop where the frame was double-tapped */}
      {bursts.map((b) => (
        <span
          key={b.id}
          aria-hidden
          className="animate-heet-burst pointer-events-none absolute z-20"
          style={{ left: b.x, top: b.y, transform: "translate(-50%, -50%)" }}
        >
          <HeetFlame className="size-28" glow />
        </span>
      ))}

      <div className="stage-vignette pointer-events-none absolute inset-0" aria-hidden />
      <div className="stage-grain pointer-events-none absolute inset-0" aria-hidden />

      {overlay ? (
        <div className="pointer-events-none absolute inset-0">
          <p
            className={`absolute max-w-[80%] whitespace-pre-wrap text-center leading-tight ${
              overlayStyleProps(overlay.style, overlay.color).className
            }`}
            style={{
              left: `${overlay.x}%`,
              top: `${overlay.y}%`,
              transform: `translate(-50%, -50%) rotate(${overlay.rotate}deg)`,
              fontSize: `${overlay.size}px`,
              ...overlayFontStyle(overlay.font),
              ...overlayStyleProps(overlay.style, overlay.color).style,
            }}
          >
            {overlay.text}
          </p>
        </div>
      ) : null}


      {moment.kind === "video" && paused ? (
        <button
          type="button"
          onClick={togglePlayback}
          aria-label="Play"
          className="absolute inset-0 grid place-items-center"
        >
          <span className="grid size-16 place-items-center rounded-full border border-[oklch(1_0_0/25%)] bg-background/45 backdrop-blur-md">
            <Play className="ml-0.5 size-6" strokeWidth={1.8} />
          </span>
        </button>
      ) : null}

      {/* Top rail: honest seen ticker on the left, sound on the right */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-background/75 to-transparent" aria-hidden />



      {moment.kind === "video" ? (
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? "Turn sound on" : "Turn sound off"}
          className="tap-target absolute right-4 top-4 grid place-items-center rounded-full border border-[oklch(1_0_0/12%)] bg-background/45 backdrop-blur-md"
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </button>
      ) : null}

      {/* Hairline scrub line — progress, never a control bar */}
      {moment.kind === "video" ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-[oklch(1_0_0/8%)]" aria-hidden>
          <div
            className="ember-fill h-full origin-left transition-[width] duration-150 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      ) : null}


      {/* Bottom information band + reaction rail */}
      <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,oklch(0.145_0.006_60/97%)_0%,oklch(0.145_0.006_60/78%)_45%,transparent_100%)] px-4 pb-5 pt-24">
        <div className="flex items-center gap-3">
          <Link to="/u/$username" params={{ username: moment.author.username }} replace className="shrink-0">
            <span className="ember-fill flex size-10 items-center justify-center rounded-2xl p-[2px]">
              <span className="grid size-full place-items-center overflow-hidden rounded-[14px] bg-surface">
                {moment.author.avatarUrl ? (
                  <img src={moment.author.avatarUrl} alt="" className="size-full object-cover" />
                ) : (
                  <span className="font-display text-sm font-bold uppercase">
                    {moment.author.username.slice(0, 1)}
                  </span>
                )}
              </span>
            </span>
          </Link>
          <div className="min-w-0 flex-1">
            <Link
              to="/u/$username"
              params={{ username: moment.author.username }}
              replace
              className="block truncate font-display text-base font-semibold"
              data-no-translate
            >
              @{moment.author.username}
            </Link>
            <p className="data-figure truncate text-[11px] text-muted-foreground">
              {moment.locationLabel ? `${moment.locationLabel} · ` : ""}
              {timeAgo(moment.createdAt)}
            </p>
          </div>
        </div>


        {moment.caption ? (
          <p className="mt-2.5 max-w-[82%] text-sm font-normal leading-relaxed text-foreground/90" data-no-translate>
            {moment.caption}
          </p>

        ) : null}

      </div>

      {/* Heet flame — separated above the lower rail, bigger symbol + count */}
      <div className="absolute bottom-[300px] right-1 z-20 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            const host = containerRef.current?.getBoundingClientRect();
            const r = e.currentTarget.getBoundingClientRect();
            setHeetPop(true);
            window.setTimeout(() => setHeetPop(false), 560);
            if (!liked && host) {
              heetRef.current(r.left - host.left + r.width / 2, r.top - host.top + r.height / 2);
            } else {
              likeMutation.mutate();
            }
            e.currentTarget.blur();
          }}
          aria-pressed={liked}
          aria-label={liked ? "Remove your heet" : "Heet this moment"}
          className="grid size-20 place-items-center rounded-full transition-transform active:scale-90"
        >
          <HeetFlame
            className={`size-20 transition-transform ${heetPop ? "animate-heet-pop" : ""} ${
              liked && !heetPop ? "animate-heet-flicker" : ""
            }`}
            filled
            glow={liked || heetPop}
          />
        </button>
        <span
          className="data-figure text-[16px] font-bold leading-none text-white"
          style={{ filter: "drop-shadow(0 1px 2px oklch(0 0 0 / 85%))" }}
        >
          {formatCount(moment.likeCount)}
        </span>
      </div>

      {/* Right reaction rail — lower actions sit low, just above the bottom bar */}
      <div className="absolute bottom-[26px] right-0.5 z-20 flex w-10 flex-col items-center gap-2">

        <RailAction
          label="Views"
          count={formatCount(moment.viewCount)}
          color={NEON_AMBER}
          onClick={() => undefined}
        >
          <Eye className="size-5" strokeWidth={2.2} />
        </RailAction>

        <RailAction
          label="Comments"
          count={formatCount(moment.commentCount)}
          color={NEON_BLUE}
          onClick={() => setCommentsOpen(true)}
        >
          <NeonComment />
        </RailAction>

        <RailAction
          label="Keep this moment"
          active={saved}
          color={NEON_GREEN}
          onClick={() => saveMutation.mutate()}
        >
          <Bookmark className="size-5" strokeWidth={1.8} fill={saved ? "currentColor" : "none"} />
        </RailAction>

        <RailAction
          label={reposted ? "Remove repost" : "Repost to your profile"}
          active={reposted}
          color={NEON_VIOLET}
          onClick={() => repostMutation.mutate()}
        >
          <Repeat className="size-5" strokeWidth={1.9} />
        </RailAction>

        <RailAction
          label="Send this moment"
          color={NEON_CYAN}
          onClick={() => setShareOpen(true)}
        >
          <Send className="size-5 -rotate-12" strokeWidth={1.8} />
        </RailAction>

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="More options"
            className="grid size-8 place-items-center rounded-full"
            style={{
              color: NEON_RED,
              filter: softNeonFilter(NEON_RED),
            }}
          >
            <MoreHorizontal className="size-5" strokeWidth={2.1} />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" side="top">
            {moment.isOwn ? (
              <DropdownMenuItem onClick={() => deleteMutation.mutate()}>
                Delete moment
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={() => setReportOpen(true)}>Report</DropdownMenuItem>
                <DropdownMenuItem onClick={() => blockMutation.mutate()}>
                  Not interested — show less from @{moment.author.username}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

      </div>

      <CommentSheet
        momentId={moment.id}
        open={commentsOpen}
        onOpenChange={setCommentsOpen}
        author={moment.author.username}
      />

      <ShareSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        url={
          typeof window === "undefined"
            ? ""
            : `${window.location.origin}/u/${moment.author.username}?r=${moment.id}`
        }
        text={`@${moment.author.username} on GoHeet`}
      />



      <Sheet open={reportOpen} onOpenChange={setReportOpen}>
        <SheetContent side="bottom" className="rounded-t-[28px] border-border bg-surface">
          <SheetHeader className="px-0">
            <SheetTitle className="font-display">Report this moment</SheetTitle>
            <SheetDescription>
              Tell us what&apos;s wrong. Reports are reviewed by the GoHeet safety team.
            </SheetDescription>
          </SheetHeader>
          <div className="grid max-h-[50vh] grid-cols-2 gap-2 overflow-y-auto pb-6">
            {REPORT_CATEGORIES.map((c) => (
              <button
                key={c.value}
                type="button"
                disabled={reportMutation.isPending}
                onClick={() => reportMutation.mutate(c.value)}
                className="tap-target rounded-xl border border-border bg-surface-raised px-3 text-sm"
              >
                {c.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
}

type CommentRow = {
  id: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  likeCount: number;
  liked: boolean;
  isOwn: boolean;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};

function CommentSheet({
  momentId,
  open,
  onOpenChange,
  author,
}: {
  momentId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  author: string;
}) {
  const fetchComments = useServerFn(listComments);
  const create = useServerFn(addComment);
  const remove = useServerFn(deleteComment);
  const likeComment = useServerFn(toggleCommentLike);
  const removeReport = useServerFn(submitReport);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; username: string } | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["comments", momentId],
    queryFn: () => fetchComments({ data: { momentId } }),
    enabled: open,
  });

  const post = useMutation({
    mutationFn: () => create({ data: { momentId, body, parentId: replyTo?.id ?? null } }),
    onSuccess: () => {
      setBody("");
      setReplyTo(null);
      void qc.invalidateQueries({ queryKey: ["comments", momentId] });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't post that comment."),
  });

  const like = useMutation({
    mutationFn: (commentId: string) => likeComment({ data: { commentId } }),
    onMutate: (commentId: string) => {
      qc.setQueryData(
        ["comments", momentId],
        (old: { comments: CommentRow[] } | undefined) =>
          old
            ? {
                comments: old.comments.map((c) =>
                  c.id === commentId
                    ? { ...c, liked: !c.liked, likeCount: c.likeCount + (c.liked ? -1 : 1) }
                    : c,
                ),
              }
            : old,
      );
    },
    onError: () => {
      toast.error("Couldn't register that.");
      void qc.invalidateQueries({ queryKey: ["comments", momentId] });
    },
  });

  const all = (data?.comments ?? []) as CommentRow[];
  const roots = all
    .filter((c) => !c.parentId)
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const repliesOf = (id: string) =>
    all
      .filter((c) => c.parentId === id)
      .slice()
      .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

  const renderComment = (c: CommentRow, isReply: boolean) => (
    <div key={c.id} className={`flex gap-3 ${isReply ? "ml-11" : ""}`}>
      <span
        className={`grid ${isReply ? "size-7" : "size-8"} shrink-0 place-items-center overflow-hidden rounded-xl bg-surface-raised text-xs font-semibold uppercase`}
      >
        {c.avatarUrl ? (
          <img src={c.avatarUrl} alt="" className="size-full object-cover" />
        ) : (
          c.username.slice(0, 1)
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">
          @{c.username} · {timeAgo(c.createdAt)}
        </p>
        <p className="text-sm text-foreground">{c.body}</p>
        <div className="mt-1 flex items-center gap-3">
          <button
            type="button"
            aria-pressed={c.liked}
            aria-label={c.liked ? "Unlike comment" : "Like comment"}
            onClick={() => like.mutate(c.id)}
            className={`flex items-center gap-1 text-[11px] ${
              c.liked ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <HeetFlame className="size-3.5" filled={c.liked} />
            {c.likeCount > 0 ? <span className="data-figure">{formatCount(c.likeCount)}</span> : null}
          </button>
          <button
            type="button"
            className="text-[11px] text-muted-foreground underline"
            onClick={() => setReplyTo({ id: c.parentId ?? c.id, username: c.username })}
          >
            Reply
          </button>
          {c.isOwn ? (
            <button
              type="button"
              className="text-[11px] text-muted-foreground underline"
              onClick={async () => {
                await remove({ data: { commentId: c.id } });
                void qc.invalidateQueries({ queryKey: ["comments", momentId] });
              }}
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              className="text-[11px] text-muted-foreground underline"
              onClick={async () => {
                await removeReport({
                  data: { targetType: "comment", targetId: c.id, category: "harassment" },
                });
                toast.success("Reported.");
              }}
            >
              Report
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex h-[80svh] flex-col rounded-t-[28px] border-border bg-surface">
        <SheetHeader className="px-0">
          <SheetTitle className="font-display">Said about this moment</SheetTitle>
          <SheetDescription>Talking with @{author} and everyone else here.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto pb-4">
          {isLoading ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : roots.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nobody has said anything yet. Be first.
            </p>
          ) : (
            roots.map((c) => (
              <div key={c.id} className="space-y-3">
                {renderComment(c, false)}
                {repliesOf(c.id).map((r) => renderComment(r, true))}
              </div>
            ))
          )}
        </div>

        {replyTo ? (
          <div className="flex items-center justify-between rounded-xl bg-surface-raised px-3 py-2 text-[12px] text-muted-foreground">
            <span>Replying to @{replyTo.username}</span>
            <button type="button" className="underline" onClick={() => setReplyTo(null)}>
              Cancel
            </button>
          </div>
        ) : null}

        <div className="flex items-end gap-2 border-t border-border pt-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 500))}
            placeholder={replyTo ? `Reply to @${replyTo.username}…` : "Say something real…"}
            rows={1}
            className="min-h-11 resize-none bg-surface-raised"
          />
          <Button
            size="icon"
            className="ember-fill size-11 shrink-0 rounded-2xl text-primary-foreground"
            disabled={!body.trim() || post.isPending}
            onClick={() => post.mutate()}
            aria-label="Post comment"
          >
            <Send className="size-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}


/* Neon palette — outlined symbols, each its own colour, dark edge for
   visibility on bright videos. Counts stay plain white. */
const NEON_BLUE = "oklch(0.78 0.16 235)";
const NEON_GREEN = "oklch(0.82 0.19 150)";
const NEON_VIOLET = "oklch(0.75 0.19 300)";
const NEON_CYAN = "oklch(0.83 0.14 200)";
const NEON_RED = "oklch(0.68 0.22 22)";
const NEON_AMBER = "oklch(0.82 0.17 75)";
const NEON_CORE = NEON_BLUE;
const NEON_GLOW = NEON_BLUE;

const neonFilter = (glow: string) =>
  `drop-shadow(0 0 6px ${glow.replace(")", " / 85%)")}) drop-shadow(0 0 2px ${glow.replace(")", " / 65%)")}) drop-shadow(0 1px 1.5px oklch(0 0 0 / 80%))`;

const softNeonFilter = (glow: string) =>
  `drop-shadow(0 0 3px ${glow.replace(")", " / 55%)")}) drop-shadow(0 1px 1.5px oklch(0 0 0 / 80%))`;

/* Comment: familiar speech bubble silhouette with restrained neon and white dots. */
function NeonComment() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="none"
      stroke={NEON_BLUE}
      style={{ color: NEON_BLUE, filter: softNeonFilter(NEON_BLUE) }}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.5 11.3c0 4.1-3.7 7.3-8.4 7.3-1.1 0-2.2-.2-3.2-.5L4.2 20l1.5-4a6.7 6.7 0 0 1-2-4.7C3.7 7.2 7.4 4 12.1 4s8.4 3.2 8.4 7.3Z" />
      <g fill="var(--foreground)" stroke="var(--foreground)" strokeWidth="0.4">
        <circle cx="8.6" cy="11.4" r="0.85" />
        <circle cx="12.1" cy="11.4" r="0.85" />
        <circle cx="15.6" cy="11.4" r="0.85" />
      </g>
    </svg>
  );
}

function RailAction({
  label,
  count,
  active,
  color,
  activeColor,
  onClick,
  children,
}: {
  label: string;
  count?: string;
  active?: boolean;
  color: string;
  activeColor?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  const core = active ? (activeColor ?? color) : color;
  return (
    <div className="flex w-10 flex-col items-center gap-1">
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        onClick={onClick}
        className="grid size-7 place-items-center rounded-full transition-transform active:scale-90"
        style={{ color: core, filter: softNeonFilter(core) }}
      >
        {children}
      </button>
      {count ? (
        <span
          className="data-figure whitespace-nowrap text-center text-[11px] font-bold leading-none text-foreground"
        >
          {count}
        </span>
      ) : null}
    </div>
  );
}

