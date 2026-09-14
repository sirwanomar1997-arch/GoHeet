import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SwitchCamera, X, MapPin, Type as TypeIcon, Check, Play, Trash2, Sparkles, Zap, ZapOff, Bookmark, Camera as CameraIcon, Sun, Timer } from "lucide-react";
import { CameraEngine, isEngineError, type EngineError, type ZoomRange } from "@/lib/camera-engine";
import { saveClip, listSavedClips, getClip, updateClip, deleteClip, SHARE_LATER_LIMIT } from "@/lib/share-later";
import { publishMoment, startCapture } from "@/lib/reelzy.functions";

import { supabase } from "@/integrations/supabase/client";
import {
  primeCaptureSounds,
  playCountdownTick,
  playRecordStart,
  playRecordStop,
  playPauseBlip,
} from "@/lib/capture-sounds";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  FILTERS,
  FILTER_CATEGORIES,
  OVERLAY_FONTS,
  OVERLAY_COLORS,
  OVERLAY_STYLES,
  DEFAULT_OVERLAY,
  filterCss,
  overlayFontStyle,
  overlayStyleProps,
  type FilterId,
  type MomentOverlay,
} from "@/components/reelzy/creative";
import { GradeLayers } from "@/components/reelzy/grade";



export const Route = createFileRoute("/_authenticated/camera")({
  component: CameraPage,
  validateSearch: (search: Record<string, unknown>): { edit?: string } =>
    typeof search["edit"] === "string" ? { edit: search["edit"] as string } : {},

});

const MAX_MS = 300_000; // GoHeet caps a moment at five minutes.

type Captured = {
  blob: Blob;
  url: string;
  kind: "video" | "photo";
  durationMs: number;
  poster: Blob | null;
};

/** 00:04 — quiet, tabular, cinematic. No camcorder energy. */
function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/**
 * Playback of what you just filmed.
 *
 * A freshly recorded blob often paints black until the browser is nudged: it
 * has no duration yet and autoplay with sound is blocked on phones. So we mute
 * for the first play, nudge the first frame into view, and offer a tap to play
 * if the browser still refuses.
 */
function ReviewVideo({ src, filter, posterUrl }: { src: string; filter: string | undefined; posterUrl?: string | undefined }) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [needsTap, setNeedsTap] = useState(false);

  const kick = useCallback(async () => {
    const el = ref.current;
    if (!el) return;
    try {
      // Force the decoder to paint a frame instead of a black canvas.
      if (el.currentTime < 0.05) el.currentTime = 0.05;
      await el.play();
      setNeedsTap(false);
    } catch {
      setNeedsTap(true);
    }
  }, []);

  useEffect(() => {
    setNeedsTap(false);
    const id = window.setTimeout(() => void kick(), 60);
    return () => window.clearTimeout(id);
  }, [src, kick]);

  return (
    <>
      <video
        ref={ref}
        src={src}
        poster={posterUrl}
        className="size-full object-cover"
        style={filter ? { filter } : undefined}
        playsInline
        autoPlay
        muted
        loop
        controls={false}
        onLoadedData={() => void kick()}
        onCanPlay={() => void kick()}
      />
      {needsTap ? (
        <button
          type="button"
          onClick={() => void kick()}
          aria-label="Play your recording"
          className="absolute inset-0 z-10 grid place-items-center bg-black/25"
        >
          <span className="grid size-16 place-items-center rounded-full bg-black/55 text-white backdrop-blur">
            <Play className="size-7" />
          </span>
        </button>
      ) : null}
    </>
  );
}


function CameraPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const engineRef = useRef<CameraEngine | null>(null);
  if (engineRef.current === null && typeof window !== "undefined") engineRef.current = new CameraEngine();
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);
  const elapsedRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingRef = useRef(false);


  const [facing, setFacing] = useState<"user" | "environment">("environment");
  // The flip owns lens changes, so the boot effect reads facing from here.
  const facingRef = useRef<"user" | "environment">("environment");
  const withAudio = true;
  const [ready, setReady] = useState(false);
  const [booting, setBooting] = useState(true);
  const [error, setError] = useState<EngineError | null>(null);
  const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);
  const [zoom, setZoom] = useState(1);
  const [digital, setDigital] = useState(1);
  const [torch, setTorch] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [flipping, setFlipping] = useState(false);
  // The last frame of the outgoing lens, held on screen so a flip never flashes black.
  const [flipHold, setFlipHold] = useState<string | null>(null);
  // Front-camera glow: the screen itself becomes a soft ring light.
  const [glow, setGlow] = useState(0);
  const [textTab, setTextTab] = useState<"font" | "colour" | "finish" | "size">("font");
  const { edit: editId } = Route.useSearch();
  const editingId = editId;

  const [filterCat, setFilterCat] = useState<string>("Signature");
  const [savedCount, setSavedCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  /** Optional self-timer: off by default so the record button films right away. */
  const [timerSec, setTimerSec] = useState<0 | 3 | 5 | 10>(0);
  const [elapsed, setElapsed] = useState(0);
  const [captured, setCaptured] = useState<Captured | null>(null);
  /** Proof that what is about to be published was filmed live in this app. */
  const liveCaptureRef = useRef<{ live: boolean; sameSession: boolean; label: string | null }>({
    live: false,
    sameSession: true,
    label: null,
  });

  const [session, setSession] = useState<{ sessionId: string; storagePrefix: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [place, setPlace] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [look, setLook] = useState<FilterId>("none");
  const [overlay, setOverlay] = useState<MomentOverlay | null>(null);
  const [textOpen, setTextOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [stage, setStage] = useState<"edit" | "details">("edit");
  const stageRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragMovedRef = useRef(false);

  const [draggingText, setDraggingText] = useState(false);
  const [pinchingText, setPinchingText] = useState(false);
  const [trashHot, setTrashHot] = useState(false);
  const trashHotRef = useRef(false);
  const overlayRef = useRef<MomentOverlay | null>(null);
  overlayRef.current = overlay;

  // Pointer input is kept for mouse/pen. iPhone text gestures use native touch
  // events below so Safari cannot turn a two-finger pinch into page zoom.
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const textPinchRef = useRef<{ dist: number; angle: number; size: number; rotate: number } | null>(null);
  const touchDragRef = useRef<{ x: number; y: number } | null>(null);
  const toolTouchAtRef = useRef(0);

  const twoFingerGeometry = () => {
    const pts = [...pointersRef.current.values()];
    if (pts.length < 2) return null;
    const a = pts[0]!;
    const b = pts[1]!;
    return {
      dist: Math.hypot(b.x - a.x, b.y - a.y),
      angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    };
  };

  const startDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture?.(e.pointerId);

    if (pointersRef.current.size >= 2) {
      // Second finger down: stop moving, start pinching.
      const geo = twoFingerGeometry();
      draggingRef.current = false;
      dragMovedRef.current = true;
      trashHotRef.current = false;
      setDraggingText(false);
      setTrashHot(false);
      if (geo) {
        textPinchRef.current = {
          dist: geo.dist,
          angle: geo.angle,
          size: overlay?.size ?? DEFAULT_OVERLAY.size,
          rotate: overlay?.rotate ?? 0,
        };
        setPinchingText(true);
        setTextOpen(false);
      }
      return;
    }

    draggingRef.current = true;
    dragMovedRef.current = false;
    trashHotRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDraggingText(true);
    setTrashHot(false);
    // The editing tray would sit over the bin, so step out of it while dragging.
    setTextOpen(false);
  };
  const onDragMove = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType === "touch") return;
    if (pointersRef.current.has(e.pointerId)) {
      pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    const pinch = textPinchRef.current;
    if (pinch && pointersRef.current.size >= 2) {
      const geo = twoFingerGeometry();
      if (!geo || pinch.dist <= 0) return;
      const scale = geo.dist / pinch.dist;
      const size = Math.min(140, Math.max(14, Math.round(pinch.size * scale)));
      let turn = geo.angle - pinch.angle;
      while (turn > 180) turn -= 360;
      while (turn < -180) turn += 360;
      const rotate = Math.max(-180, Math.min(180, Math.round(pinch.rotate + turn)));
      setOverlay((o) => (o ? { ...o, size, rotate } : o));
      return;
    }

    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 6) dragMovedRef.current = true;
    const box = stageRef.current?.getBoundingClientRect();
    if (!box) return;
    const x = Math.min(96, Math.max(4, ((e.clientX - box.left) / box.width) * 100));
    const y = Math.min(96, Math.max(4, ((e.clientY - box.top) / box.height) * 100));
    const overTrash = y > 80 && x > 22 && x < 78;
    if (overTrash !== trashHotRef.current) {
      trashHotRef.current = overTrash;
      setTrashHot(overTrash);
    }
    setOverlay((o) => (o ? { ...o, x, y } : o));
  };


  const endDrag = (e?: React.PointerEvent<HTMLElement>) => {
    if (e?.pointerType === "touch") return;
    if (e) pointersRef.current.delete(e.pointerId);
    else pointersRef.current.clear();

    if (pointersRef.current.size < 2) {
      textPinchRef.current = null;
      setPinchingText(false);
    }
    if (pointersRef.current.size > 0) return;

    if (draggingRef.current && trashHotRef.current) {
      setOverlay(null);
      setTextOpen(false);
      toast("Text binned.", { duration: 1500 });
    }
    draggingRef.current = false;
    trashHotRef.current = false;
    setDraggingText(false);
    setTrashHot(false);
  };

  const openTextEditor = () => {
    setTextOpen(true);
  };
  const setOverlayText = (value: string) => {
    const text = value.slice(0, 200);
    setOverlay((o) => (o && o.text === text ? o : { ...(o ?? { ...DEFAULT_OVERLAY }), text }));
  };
  const onTextTap = () => {
    // A tap without a drag opens the editor; a drag just moves the text.
    if (!dragMovedRef.current) openTextEditor();
  };

  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl || !overlay?.text) return;

    const point = (touch: Touch) => ({ x: touch.clientX, y: touch.clientY });
    const geometry = (touches: TouchList) => {
      if (touches.length < 2) return null;
      const a = touches.item(0);
      const b = touches.item(1);
      if (!a || !b) return null;
      return {
        dist: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
        angle: (Math.atan2(b.clientY - a.clientY, b.clientX - a.clientX) * 180) / Math.PI,
      };
    };

    const start = (event: TouchEvent) => {
      event.preventDefault();
      dragMovedRef.current = false;
      trashHotRef.current = false;
      setTrashHot(false);
      setTextOpen(false);

      if (event.touches.length >= 2) {
        const geo = geometry(event.touches);
        const current = overlayRef.current;
        if (!geo || !current) return;
        textPinchRef.current = {
          dist: Math.max(1, geo.dist),
          angle: geo.angle,
          size: current.size,
          rotate: current.rotate,
        };
        touchDragRef.current = null;
        dragMovedRef.current = true;
        setDraggingText(false);
        setPinchingText(true);
        return;
      }

      const touch = event.touches.item(0);
      if (!touch) return;
      touchDragRef.current = point(touch);
      setDraggingText(true);
    };

    const move = (event: TouchEvent) => {
      event.preventDefault();
      const current = overlayRef.current;
      if (!current) return;

      if (event.touches.length >= 2) {
        const geo = geometry(event.touches);
        if (!geo) return;
        if (!textPinchRef.current) {
          textPinchRef.current = {
            dist: Math.max(1, geo.dist),
            angle: geo.angle,
            size: current.size,
            rotate: current.rotate,
          };
          touchDragRef.current = null;
          setDraggingText(false);
          setPinchingText(true);
          return;
        }
        const pinch = textPinchRef.current;
        const scale = geo.dist / pinch.dist;
        let turn = geo.angle - pinch.angle;
        while (turn > 180) turn -= 360;
        while (turn < -180) turn += 360;
        dragMovedRef.current = true;
        setOverlay((value) =>
          value
            ? {
                ...value,
                size: Math.min(140, Math.max(14, Math.round(pinch.size * scale))),
                rotate: Math.max(-180, Math.min(180, Math.round(pinch.rotate + turn))),
              }
            : value,
        );
        return;
      }

      const touch = event.touches.item(0);
      const startPoint = touchDragRef.current;
      const box = stageEl.getBoundingClientRect();
      if (!touch || !startPoint || box.width <= 0 || box.height <= 0) return;
      if (Math.hypot(touch.clientX - startPoint.x, touch.clientY - startPoint.y) > 5) {
        dragMovedRef.current = true;
      }
      const x = Math.min(96, Math.max(4, ((touch.clientX - box.left) / box.width) * 100));
      const y = Math.min(96, Math.max(4, ((touch.clientY - box.top) / box.height) * 100));
      const overTrash = y > 80 && x > 22 && x < 78;
      trashHotRef.current = overTrash;
      setTrashHot(overTrash);
      setOverlay((value) => (value ? { ...value, x, y } : value));
    };

    const end = (event: TouchEvent) => {
      event.preventDefault();
      if (event.touches.length >= 2) return;
      if (event.touches.length === 1 && textPinchRef.current) {
        const touch = event.touches.item(0);
        textPinchRef.current = null;
        setPinchingText(false);
        touchDragRef.current = touch ? point(touch) : null;
        setDraggingText(Boolean(touch));
        return;
      }
      if (event.touches.length > 0) return;

      if (trashHotRef.current) {
        setOverlay(null);
        setTextOpen(false);
        toast("Text binned.", { duration: 1500 });
      } else if (!dragMovedRef.current) {
        openTextEditor();
      }
      touchDragRef.current = null;
      textPinchRef.current = null;
      trashHotRef.current = false;
      setDraggingText(false);
      setPinchingText(false);
      setTrashHot(false);
    };

    stageEl.addEventListener("touchstart", start, { passive: false });
    stageEl.addEventListener("touchmove", move, { passive: false });
    stageEl.addEventListener("touchend", end, { passive: false });
    stageEl.addEventListener("touchcancel", end, { passive: false });
    return () => {
      stageEl.removeEventListener("touchstart", start);
      stageEl.removeEventListener("touchmove", move);
      stageEl.removeEventListener("touchend", end);
      stageEl.removeEventListener("touchcancel", end);
    };
  }, [overlay?.text]);




  const openSession = useServerFn(startCapture);
  const publish = useServerFn(publishMoment);
  const stopStream = useCallback(() => {
    engineRef.current?.stop();
  }, []);

  const startStream = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    // Never re-open the camera mid-take (a lens flip handles that itself).
    if (recordingRef.current) return;
    setReady(false);
    setBooting(true);

    try {
      const stream = await engine.start(facingRef.current, withAudio);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setZoomRange(engine.state.zoomRange);
      // Every take opens at the natural 1× view, never at the widest lens.
      setZoom(await engine.setZoom(1).catch(() => 1));
      setDigital(1);
      setTorchAvailable(engine.state.torchAvailable);
      setTorch(false);
      setError(null);
      setReady(true);
    } catch (err) {
      setError(
        isEngineError(err)
          ? err
          : {
              kind: "failed",
              title: "We couldn't start the camera",
              body: "Something interrupted the camera. Close any other app using it and try again.",
            },
      );
    } finally {
      setBooting(false);
    }
  }, []);

  useEffect(() => {
    if (captured) return;
    void startStream();
    return () => {
      // Never tear the camera down while a take is running — flipping the lens
      // changes this effect's inputs, and stopping here would end the recording.
      if (recordingRef.current) return;
      stopStream();
    };
  }, [startStream, stopStream, captured]);

  useEffect(() => {
    void listSavedClips().then((clips) => setSavedCount(clips.length));
  }, []);

  // Opened from "Share later" to keep working on a held moment.
  useEffect(() => {
    if (!editId) return;
    let url: string | null = null;
    void getClip(editId).then((clip) => {
      if (!clip) return;
      url = URL.createObjectURL(clip.blob);
      setCaptured({
        blob: clip.blob,
        url,
        kind: clip.kind,
        durationMs: clip.durationMs,
        poster: clip.poster,
      });
      liveCaptureRef.current = { live: true, sameSession: false, label: null };
      setCaption(clip.caption ?? "");
      setPlace(clip.place ?? "");
      setLook((clip.styleFilter as FilterId | null) ?? "none");
      setStage("edit");
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [editId]);


  // A server-issued capture session is what proves this came from the GoHeet camera.
  useEffect(() => {
    let cancelled = false;
    void openSession({ data: { deviceKind: "web" } })
      .then((s) => {
        if (!cancelled) setSession(s);
      })
      .catch(() => toast.error("Couldn't open a capture session."));
    return () => {
      cancelled = true;
    };
  }, [openSession]);

  useEffect(() => {
    if (!recording || paused) return;
    const id = setInterval(() => {
      const ms = accumulatedRef.current + (Date.now() - startedAtRef.current);
      elapsedRef.current = ms;
      setElapsed(ms);
      if (ms >= MAX_MS) finishRecording();
    }, 100);
    return () => clearInterval(id);
  }, [recording, paused]);


  function grabPoster(): Promise<Blob | null> {
    return CameraEngine.grabFrame(videoRef.current, facing === "user");
  }

  async function takePhoto() {
    const poster = await grabPoster();
    if (!poster) {
      toast.error("Couldn't capture that frame.");
      return;
    }
    liveCaptureRef.current = {
      live: true,
      sameSession: true,
      label: engineRef.current?.cameraLabel ?? null,
    };
    setCaptured({
      blob: poster,
      url: URL.createObjectURL(poster),
      kind: "photo",
      durationMs: 0,
      poster: null,
    });
    stopStream();
  }

  async function beginRecording() {
    const engine = engineRef.current;
    if (!engine) return;
    accumulatedRef.current = 0;
    elapsedRef.current = 0;
    recordingRef.current = true;
    startedAtRef.current = Date.now();

    playRecordStart();
    // Interface cues belong to the person filming, never to the clip.
    engine.silenceMic(700);
    engine.startRecording(async (blob) => {
      playRecordStop();
      recordingRef.current = false;
      const duration = elapsedRef.current;
      const poster = await grabPoster();
      setRecording(false);
      setPaused(false);
      setElapsed(0);

      if (duration < 800) {
        toast("Hold a moment longer — that take was too short.");
        return;
      }
      liveCaptureRef.current = { live: true, sameSession: true, label: engine.cameraLabel };
      setCaptured({ blob, url: URL.createObjectURL(blob), kind: "video", durationMs: duration, poster });
      stopStream();
    });
    setRecording(true);
  }

  function finishRecording() {
    engineRef.current?.stopRecording();
  }

  /** Optional 3 / 5 / 10 second lead-in before the first frame. */
  function startCountdown(seconds: number) {
    if (countdown !== null) return;
    primeCaptureSounds();
    setCountdown(seconds);
    playCountdownTick(3);
    countdownRef.current = setInterval(() => {
      setCountdown((n) => {
        if (n === null) return null;
        if (n <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);
          countdownRef.current = null;
          void beginRecording();
          return null;
        }
        playCountdownTick(n - 1);
        return n - 1;
      });
    }, 1000);
  }

  useEffect(
    () => () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    },
    [],
  );

  /** Pause banks the elapsed time; resume keeps adding to the same take. */
  function togglePause() {
    const engine = engineRef.current;
    if (!engine) return;
    if (paused) {
      startedAtRef.current = Date.now();
      playPauseBlip(true);
      engine.silenceMic(500);
      engine.resume();
      setPaused(false);
    } else {
      accumulatedRef.current += Date.now() - startedAtRef.current;
      elapsedRef.current = accumulatedRef.current;
      engine.pause();
      playPauseBlip(false);
      setPaused(true);
    }
  }

  /** Zoom: real lens zoom where the device offers it, gentle digital zoom otherwise. */
  const maxDigital = 4;
  /** Current view in the familiar phone-camera numbers (.5× / 1× / 2× / 3×). */
  const zoomFactor = zoomRange ? zoom : digital;
  const zoomLabel = `${zoomFactor < 1 ? zoomFactor.toFixed(1).replace(/^0/, "") : zoomFactor.toFixed(1)}×`;

  /** The steps offered on screen, trimmed to what this lens can actually do. */
  const zoomSteps = (() => {
    const min = zoomRange?.min ?? 1;
    const max = zoomRange?.max ?? maxDigital;
    return [0.5, 1, 2, 3].filter((step) => step >= min - 0.001 && step <= max + 0.001);
  })();

  const applyZoom = useCallback(
    (next: number) => {
      const engine = engineRef.current;
      if (zoomRange && engine) {
        const clamped = Math.min(zoomRange.max, Math.max(zoomRange.min, next));
        setZoom(clamped);
        void engine.setZoom(clamped);
      } else {
        setDigital(Math.min(maxDigital, Math.max(1, next)));
      }
    },
    [zoomRange],
  );

  const pinchRef = useRef<{ distance: number; base: number } | null>(null);
  const camStageRef = useRef<HTMLDivElement | null>(null);

  const onPreviewTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return;
    const [a, b] = [e.touches[0]!, e.touches[1]!];
    pinchRef.current = {
      distance: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY),
      base: zoomRange ? zoom : digital,
    };
  };

  const pinchMoveRef = useRef<(e: TouchEvent) => void>(() => undefined);
  pinchMoveRef.current = (e: TouchEvent) => {
    const pinch = pinchRef.current;
    if (!pinch || e.touches.length !== 2) return;
    const [a, b] = [e.touches[0]!, e.touches[1]!];
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    applyZoom(pinch.base * (distance / pinch.distance));
  };

  // Pinch must zoom the picture only — never the page. React's onTouchMove is
  // passive, so the listener is attached natively and cancels the browser's
  // own page-zoom gesture (including Safari's gesture events).
  useEffect(() => {
    const el = camStageRef.current;
    if (!el) return;
    const onMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) e.preventDefault();
      pinchMoveRef.current(e);
    };
    const block = (e: Event) => e.preventDefault();
    el.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("gesturestart", block as EventListener);
    document.addEventListener("gesturechange", block as EventListener);
    document.addEventListener("gestureend", block as EventListener);
    return () => {
      el.removeEventListener("touchmove", onMove);
      document.removeEventListener("gesturestart", block as EventListener);
      document.removeEventListener("gesturechange", block as EventListener);
      document.removeEventListener("gestureend", block as EventListener);
    };
  }, []);

  const onPreviewTouchEnd = () => {
    pinchRef.current = null;
  };


  /** Resolve once the preview element is actually painting pixels again. */
  function waitForPaint(video: HTMLVideoElement | null): Promise<void> {
    return new Promise((resolve) => {
      if (!video) return resolve();
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };
      const timer = window.setTimeout(finish, 1200);
      const settle = () => {
        window.clearTimeout(timer);
        finish();
      };
      type WithRVFC = HTMLVideoElement & { requestVideoFrameCallback?: (cb: () => void) => number };
      const el = video as WithRVFC;
      if (typeof el.requestVideoFrameCallback === "function") el.requestVideoFrameCallback(() => settle());
      else {
        const poll = () => {
          if (done) return;
          if (video.videoWidth > 0 && video.readyState >= 2) settle();
          else requestAnimationFrame(poll);
        };
        poll();
      }
    });
  }

  async function flipCamera() {
    const engine = engineRef.current;
    if (!engine || flipping) return;
    const from = facingRef.current;
    const next = from === "user" ? "environment" : "user";

    // Freeze the current view first: the screen holds this still while the other
    // lens wakes up, so the flip reads as a soft dissolve instead of a blackout.
    let holdUrl: string | null = null;
    try {
      const still = await CameraEngine.grabFrame(videoRef.current, from === "user");
      if (still) {
        holdUrl = URL.createObjectURL(still);
        setFlipHold(holdUrl);
      }
    } catch {
      /* a held frame is a nicety, never a requirement */
    }
    setFlipping(true);
    // Let the held frame paint before the lens goes away.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    try {
      // One path for both idle and recording: the engine keeps the take alive.
      const stream = await engine.switchFacing(next);
      facingRef.current = next;
      setFacing(next);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
        await waitForPaint(videoRef.current);
      }
      setZoomRange(engine.state.zoomRange);
      setZoom(await engine.setZoom(1).catch(() => 1));
      setDigital(1);
      setTorchAvailable(engine.state.torchAvailable);
      setTorch(false);
    } catch {
      toast("We couldn't switch the camera just now.");
    }

    // New lens is genuinely live: release the held frame into a soft dissolve.
    setFlipping(false);
    window.setTimeout(() => {
      setFlipHold(null);
      if (holdUrl) URL.revokeObjectURL(holdUrl);
    }, 320);
  }


  async function toggleTorch() {
    const engine = engineRef.current;
    if (!engine) return;
    const next = await engine.setTorch(!torch);
    setTorch(next);
  }

  /** Hold a moment on the device — three slots, then you have to share or clear one. */
  async function saveForLater() {
    if (!captured) return;
    setSaving(true);
    try {
      if (editingId) {
        await updateClip(editingId, {
          caption: caption.trim(),
          place: place.trim(),
          styleFilter: look !== "none" ? look : null,
        });
        toast.success("Changes saved.");
      } else {
        await saveClip({
          blob: captured.blob,
          poster: captured.poster,
          kind: captured.kind,
          durationMs: Math.round(captured.durationMs),
          caption: caption.trim(),
          place: place.trim(),
          styleFilter: look !== "none" ? look : null,
        });
        toast.success("Held for later. Share it when you're ready.");
      }
      await navigate({ to: "/share-later" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't hold that one.");
    } finally {
      setSaving(false);
    }
  }

  function retake() {
    if (captured) URL.revokeObjectURL(captured.url);
    if (editingId) {
      void navigate({ to: "/share-later" });
      return;
    }
    setCaptured(null);
    setStage("edit");
    setFilterOpen(false);
    setCaption("");
    setPlace("");
    setOverlay(null);
    setLook("none");
  }


  async function doPublish() {
    if (!captured || !session) return;
    setPublishing(true);
    try {
      const ext =
        captured.kind === "photo" ? "jpg" : captured.blob.type.includes("mp4") ? "mp4" : "webm";
      const mediaPath = `${session.storagePrefix}/moment.${ext}`;
      const up = await supabase.storage
        .from("moments")
        .upload(mediaPath, captured.blob, { contentType: captured.blob.type, upsert: true });
      if (up.error) throw new Error(up.error.message);

      let thumbnailPath: string | undefined;
      if (captured.poster) {
        const tp = `${session.storagePrefix}/poster.jpg`;
        const t = await supabase.storage
          .from("moments")
          .upload(tp, captured.poster, { contentType: "image/jpeg", upsert: true });
        if (!t.error) thumbnailPath = tp;
      }

      await publish({
        data: {
          sessionId: session.sessionId,
          mediaPath,
          kind: captured.kind,
          durationMs: Math.round(captured.durationMs),
          liveCapture: liveCaptureRef.current.live,
          sameSession: liveCaptureRef.current.sameSession,
          ...(liveCaptureRef.current.label ? { cameraLabel: liveCaptureRef.current.label.slice(0, 120) } : {}),
          ...(thumbnailPath ? { thumbnailPath } : {}),
          ...(caption.trim() ? { caption: caption.trim() } : {}),
          ...(place.trim() ? { locationLabel: place.trim() } : {}),
          ...(look !== "none" ? { styleFilter: look } : {}),
          ...(overlay?.text.trim() ? { overlay } : {}),
        },
      });
      // Publishing a held moment empties its slot.
      if (editingId) await deleteClip(editingId);
      toast.success("Published. That's a real one.");

      await navigate({ to: "/feed" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't publish that moment.");
    } finally {
      setPublishing(false);
    }
  }

  if (captured) {
    const media = (
      <>
        {captured.kind === "video" ? (
          <ReviewVideo src={captured.url} filter={filterCss(look) || undefined} />
        ) : (
          <img
            src={captured.url}
            alt="Your capture"
            className="size-full object-cover"
            style={filterCss(look) ? { filter: filterCss(look) } : undefined}
          />
        )}
        <GradeLayers filterId={look} />
      </>
    );



    if (stage === "details") {
      return (
        <main className="min-h-svh bg-background">
          <div className="mx-auto max-w-lg px-4 pb-12 pt-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStage("edit")}
                className="tap-target text-sm underline"
              >
                Back to editing
              </button>
              <p className="data-figure text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
                Almost live
              </p>
            </div>

            <div className="mt-4 flex gap-4">
              <div className="relative aspect-[9/16] w-28 shrink-0 overflow-hidden rounded-2xl bg-black">
                {media}
              </div>
              <div className="flex-1 space-y-3">
                <Textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value.slice(0, 300))}
                  placeholder="Title or description…"
                  className="min-h-28 bg-surface-raised"
                />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={place}
                  onChange={(e) => setPlace(e.target.value.slice(0, 60))}
                  placeholder="Add a place (optional)"
                  className="h-12 bg-surface-raised pl-10"
                />
              </div>

              <Button
                onClick={doPublish}
                disabled={publishing || !session}
                className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
              >
                {publishing ? "Publishing…" : "Publish"}
              </Button>

              <Button
                variant="ghost"
                onClick={() => void saveForLater()}
                disabled={saving || savedCount >= SHARE_LATER_LIMIT}
                className="h-12 w-full rounded-2xl border border-border text-sm"
              >
                <Bookmark className="mr-2 size-4" />
                {savedCount >= SHARE_LATER_LIMIT
                  ? `Share later is full (${SHARE_LATER_LIMIT}/${SHARE_LATER_LIMIT})`
                  : `Save to share later · ${savedCount}/${SHARE_LATER_LIMIT}`}
              </Button>
              <p className="pb-2 text-center text-xs text-muted-foreground">
                Holding a moment keeps it on this device only, for sharing soon — not as an album.
              </p>
            </div>
          </div>

        </main>
      );
    }

    // Full-screen editor: the frame owns the screen, tools sit on top of it.
    return (
      <main className="fixed inset-0 z-30 bg-black">
        <div className="absolute inset-0">{media}</div>

        {overlay?.text ? (
          <div
            ref={stageRef}
            className="absolute inset-0 z-30 touch-none overscroll-none"
            style={{ pointerEvents: "auto" }}
            onPointerDown={startDrag}
            onPointerMove={onDragMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <div
              className="absolute flex justify-center"
              style={{
                left: `${overlay.x}%`,
                top: `${overlay.y}%`,
                width: "88%",
                transform: `translate(-50%, -50%) rotate(${overlay.rotate}deg)`,
                pointerEvents: "auto",
              }}
            >
              <p
                data-no-translate
                translate="no"
                onClick={onTextTap}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") openTextEditor();
                }}

                aria-label="Tap to edit, hold and drag to move or bin your text"
                className={`max-w-full cursor-grab touch-none select-none whitespace-pre-wrap break-words text-center leading-tight active:cursor-grabbing ${
                  overlayStyleProps(overlay.style, overlay.color).className
                }`}
                style={{
                  fontSize: `${overlay.size}px`,
                  ...overlayFontStyle(overlay.font),
                  ...overlayStyleProps(overlay.style, overlay.color).style,
                }}
              >
                {overlay.text}
              </p>
            </div>
            {draggingText ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-8">
                <div
                  className={`flex size-16 items-center justify-center rounded-full border-2 transition-all duration-150 ${
                    trashHot
                      ? "scale-125 border-red-500 bg-red-500 text-white shadow-[0_0_28px_rgba(239,68,68,0.7)]"
                      : "border-white/40 bg-black/55 text-white/90 backdrop-blur-sm"
                  }`}
                  aria-hidden
                >
                  <Trash2 className="size-7" />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}


        {/* Top bar: leave, or move on to the details step. */}
        <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-between px-4 pt-4">
          <button
            type="button"
            onClick={retake}
            aria-label="Retake"
            className="tap-target grid place-items-center rounded-full bg-black/55 text-white backdrop-blur"
          >
            <X className="size-5" />
          </button>
          <Button
            onClick={() => {
              setTextOpen(false);
              setFilterOpen(false);
              setStage("details");
            }}
            className="ember-fill h-10 rounded-full px-6 text-sm font-semibold text-primary-foreground"
          >
            Done
          </Button>
        </div>

        {/* Side rail of tools, so nothing covers the frame. */}
        {!textOpen ? (
          <div className="pointer-events-auto absolute right-3 top-1/2 z-[70] flex -translate-y-1/2 flex-col gap-3">
            {[
              {
                key: "filter",
                icon: <Sparkles className="size-5" />,
                label: "Filters",
                active: filterOpen || look !== "none",
                onClick: () => setFilterOpen((v) => !v),
              },
              {
                key: "text",
                icon: <TypeIcon className="size-5" />,
                label: overlay?.text ? "Edit text" : "Add text",
                active: !!overlay?.text,
                onClick: () => {
                  setFilterOpen(false);
                  if (!overlay) setOverlay({ ...DEFAULT_OVERLAY, text: "" });
                  openTextEditor();
                },

              },
            ].map((tool) => (
              <button
                key={tool.key}
                type="button"
                aria-label={tool.label}
                onTouchStart={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toolTouchAtRef.current = Date.now();
                  tool.onClick();
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  if (Date.now() - toolTouchAtRef.current < 700) return;
                  tool.onClick();
                }}
                className={`grid size-12 touch-manipulation place-items-center rounded-full backdrop-blur transition-colors active:scale-90 ${
                  tool.active
                    ? "bg-[image:var(--gradient-ember)] text-primary-foreground"
                    : "bg-black/55 text-white"
                }`}
              >
                {tool.icon}
              </button>
            ))}
          </div>
        ) : null}

        {/* Filter tray, right on the frame. */}
        {filterOpen && !textOpen ? (
          <div className="absolute inset-x-0 bottom-0 z-50 bg-gradient-to-t from-black/85 to-transparent px-4 pb-8 pt-10">
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
              {FILTER_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.08em] transition-colors ${
                    filterCat === cat ? "bg-white text-black" : "bg-white/12 text-white/75"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {FILTERS.filter((f) => f.category === filterCat || f.id === "none").map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setLook(f.id)}
                  aria-pressed={look === f.id}
                  className="shrink-0 text-center"
                >
                  <span
                    className={`block size-14 rounded-2xl border-2 transition-all ${
                      look === f.id ? "border-primary scale-105" : "border-white/30"
                    }`}
                    style={{ backgroundImage: f.swatch }}
                    aria-hidden
                  />
                  <span
                    className={`data-figure mt-1.5 block text-[10px] uppercase tracking-[0.12em] ${
                      look === f.id ? "text-primary" : "text-white/70"
                    }`}
                  >
                    {f.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {!filterOpen && !textOpen && !overlay?.text ? (
          <p className="absolute inset-x-0 bottom-8 text-center text-[11px] text-white/60">
            Style it here, then tap Done to caption and publish.
          </p>
        ) : null}

        {textOpen ? (
          <div
            data-no-translate
            translate="no"
            className="absolute inset-x-0 bottom-0 z-50 bg-gradient-to-t from-black/90 via-black/70 to-transparent px-3 pb-4 pt-6 [&_button]:touch-manipulation"
          >
            <div className="flex items-center gap-2">
              <Textarea
                value={overlay?.text ?? ""}
                autoFocus
                rows={2}
                maxLength={200}
                onChange={(e) => setOverlayText(e.target.value)}
                onCompositionEnd={(e) => setOverlayText(e.currentTarget.value)}
                placeholder="Say it in a few words"
                className="max-h-28 min-h-11 flex-1 resize-none rounded-2xl border-white/20 bg-white/10 py-2.5 text-white placeholder:text-white/50"
              />


              <button
                type="button"
                onClick={() => {
                  setOverlay(null);
                  setTextOpen(false);
                }}
                aria-label="Remove text"
                className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 text-white"
              >
                <Trash2 className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setTextOpen(false)}
                aria-label="Done with text"
                className="ember-fill grid size-11 shrink-0 place-items-center rounded-full text-primary-foreground"
              >
                <Check className="size-5" />
              </button>
            </div>

            <div className="mt-2.5 flex gap-2">
              {(["font", "colour", "finish", "size"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setTextTab(tab)}
                  className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                    textTab === tab ? "bg-white text-black" : "bg-white/12 text-white/75"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="mt-2.5 min-h-[52px]">
              {textTab === "font" ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {OVERLAY_FONTS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setOverlay((current) => (current ? { ...current, font: f.id } : current))}
                      className={`h-11 shrink-0 rounded-xl border px-3.5 text-base text-white ${
                        overlay?.font === f.id ? "border-primary" : "border-white/25"
                      }`}
                      style={overlayFontStyle(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {textTab === "colour" ? (
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {OVERLAY_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-label={c.label}
                      onClick={() => setOverlay((current) => (current ? { ...current, color: c.value } : current))}
                      className={`size-9 shrink-0 rounded-full border-2 transition-transform ${
                        overlay?.color === c.value ? "border-primary scale-110" : "border-white/40"
                      }`}
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
              ) : null}

              {textTab === "finish" ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {OVERLAY_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setOverlay((current) => (current ? { ...current, style: st.id } : current))}
                      className={`h-10 shrink-0 rounded-xl border px-3.5 text-[11px] uppercase tracking-[0.14em] ${
                        overlay?.style === st.id ? "border-primary text-primary" : "border-white/25 text-white/80"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              ) : null}

              {textTab === "size" ? (
                <div className="flex items-center gap-4 px-1">
                  <span className="w-10 text-[10px] uppercase tracking-[0.14em] text-white/60">Size</span>
                  <Slider
                    className="flex-1"
                    value={[overlay?.size ?? DEFAULT_OVERLAY.size]}
                    min={14}
                    max={64}
                    step={1}
                    onValueChange={([v]) =>
                      setOverlay((current) => (current ? { ...current, size: v ?? current.size } : current))
                    }
                  />
                  <span className="w-10 text-[10px] uppercase tracking-[0.14em] text-white/60">Tilt</span>
                  <Slider
                    className="flex-1"
                    value={[overlay?.rotate ?? 0]}
                    min={-30}
                    max={30}
                    step={1}
                    onValueChange={([v]) =>
                      setOverlay((current) => (current ? { ...current, rotate: v ?? current.rotate } : current))
                    }
                  />
                </div>
              ) : null}
            </div>
          </div>
        ) : null}


      </main>
    );
  }


  const mirrored = facing === "user";
  const previewTransform = `${mirrored ? "scaleX(-1) " : ""}scale(${(zoomRange ? 1 : digital) * (flipping ? 1.04 : 1)})`;

  return (
    <main className="relative h-svh overflow-hidden bg-black">
      <div
        ref={camStageRef}
        className="absolute inset-0 touch-none"
        onTouchStart={onPreviewTouchStart}
        onTouchEnd={onPreviewTouchEnd}
      >
        <video
          ref={videoRef}
          className="size-full object-cover transition-[opacity,transform] duration-300 ease-out"
          style={{
            transform: previewTransform,
            opacity: booting ? 0 : 1,
            ...(filterCss(look) ? { filter: filterCss(look) } : {}),
          }}
          playsInline
          muted
          autoPlay
        />
        {/* Held still from the outgoing lens — blurs, then dissolves once the new one is live. */}
        {flipHold ? (
          <img
            src={flipHold}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 size-full object-cover"
            style={{
              opacity: flipping ? 1 : 0,
              transform: flipping ? "scale(1.08)" : "scale(1.14)",
              filter: `${filterCss(look) ? `${filterCss(look)} ` : ""}blur(${flipping ? 14 : 22}px) saturate(1.05)`,
              transition:
                "opacity 240ms cubic-bezier(0.22,1,0.36,1), transform 420ms cubic-bezier(0.22,1,0.36,1), filter 420ms cubic-bezier(0.22,1,0.36,1)",
              willChange: "opacity, transform, filter",
            }}
          />
        ) : null}
        <GradeLayers filterId={look} />

        {/* A whisper of vignette so controls read cleanly over any scene. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_50%,transparent_55%,rgba(0,0,0,0.45)_100%)]" />
        {/* Selfie glow: the screen edges become a soft ring light on your face. */}
        {mirrored && glow > 0 ? (
          <div
            className="pointer-events-none absolute inset-0 transition-opacity duration-300"
            style={{
              boxShadow: "inset 0 0 90px 40px rgba(255,244,230,0.9)",
              borderWidth: `${[0, 26, 42, 64][glow]}px`,
              borderStyle: "solid",
              borderColor: "rgba(255,246,235,0.96)",
              opacity: [0, 0.55, 0.8, 1][glow],
            }}
            aria-hidden
          />
        ) : null}
      </div>


      {/* Top row: leave, timer, sound. */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between px-4 pt-4">
        <Link
          to="/feed"
          aria-label="Close camera"
          className="grid size-10 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition-transform active:scale-90"
        >
          <X className="size-5" strokeWidth={2} />
        </Link>

        <div
          className={`flex items-center gap-2 rounded-full px-3.5 py-2 backdrop-blur-md transition-all duration-300 ${
            recording ? "bg-black/45 opacity-100" : "bg-black/25 opacity-70"
          }`}
        >
          {recording ? (
            <span
              className={`size-[7px] rounded-full bg-[image:var(--gradient-ember)] ${
                paused ? "opacity-40" : "animate-ember-pulse"
              }`}
              aria-hidden
            />
          ) : null}
          <span className="data-figure text-[13px] font-medium tabular-nums tracking-[0.16em] text-white">
            {recording ? formatClock(elapsed) : "00:00"}
            <span className="text-white/45"> | {formatClock(MAX_MS)}</span>
          </span>

          {paused ? (
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/60">On hold</span>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-2">
          {!recording && countdown === null ? (
            <button
              type="button"
              onClick={() => setTimerSec((t) => (t === 0 ? 3 : t === 3 ? 5 : t === 5 ? 10 : 0))}
              aria-label={timerSec === 0 ? "Self-timer off" : `Self-timer ${timerSec} seconds`}
              className={`relative grid size-10 place-items-center rounded-full backdrop-blur-md transition-transform active:scale-90 ${
                timerSec > 0 ? "bg-white text-black" : "bg-black/35 text-white"
              }`}
            >
              <Timer className="size-5" />
              {timerSec > 0 ? (
                <span className="data-figure absolute -bottom-1 rounded-full bg-black/80 px-1.5 text-[10px] font-semibold text-white">
                  {timerSec}s
                </span>
              ) : null}
            </button>
          ) : null}
          {torchAvailable && !mirrored ? (
            <button
              type="button"
              onClick={() => void toggleTorch()}
              aria-label={torch ? "Turn the light off" : "Turn the light on"}
              className={`grid size-10 place-items-center rounded-full backdrop-blur-md transition-transform active:scale-90 ${
                torch ? "bg-white text-black" : "bg-black/35 text-white"
              }`}
            >
              {torch ? <Zap className="size-5" /> : <ZapOff className="size-5" />}
            </button>
          ) : null}
          {mirrored ? (
            <button
              type="button"
              onClick={() => setGlow((g) => (g + 1) % 4)}
              aria-label={`Selfie light: ${["off", "soft", "bright", "max"][glow]}`}
              className={`grid size-10 place-items-center rounded-full backdrop-blur-md transition-transform active:scale-90 ${
                glow > 0 ? "bg-white text-black shadow-[0_0_22px_rgba(255,246,235,0.65)]" : "bg-black/35 text-white"
              }`}
            >
              <Sun className="size-5" />
            </button>
          ) : null}

        </div>
      </div>

      {/* Familiar phone-camera steps — tap one, or pinch for anything between. */}
      {ready && !error ? (
        <div className="absolute inset-x-0 bottom-44 flex justify-center">
          <div className="flex items-center gap-1 rounded-full bg-black/35 p-1 backdrop-blur-md">
            {zoomSteps.map((step) => {
              const active = Math.abs(zoomFactor - step) < 0.12;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => applyZoom(step)}
                  aria-label={`Zoom ${step}×`}
                  className={`data-figure grid h-9 min-w-9 touch-manipulation place-items-center rounded-full px-2.5 text-[12px] font-semibold transition-transform active:scale-90 ${
                    active ? "bg-white text-black" : "text-white/85"
                  }`}
                >
                  {active
                    ? zoomLabel
                    : `${step < 1 ? String(step).replace(/^0/, "") : step}×`}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}


      {error ? (
        <div className="absolute inset-0 grid place-items-center bg-black/85 px-8 text-center backdrop-blur-md">
          <div className="max-w-sm">
            <CameraIcon className="mx-auto size-8 text-white/70" />
            <h1 className="mt-4 font-display text-xl font-semibold text-white">{error.title}</h1>
            <p className="mt-2 text-sm text-white/70">{error.body}</p>
            <Button
              onClick={() => void startStream()}
              className="ember-fill mt-6 h-11 rounded-full px-8 text-sm font-semibold text-primary-foreground"
            >
              Try again
            </Button>
            <p className="mt-4 text-xs text-white/45">
              GoHeet has no upload option by design — capture is the only way to post.
            </p>
          </div>
        </div>
      ) : null}

      {/* Bottom controls. */}
      <div className="absolute inset-x-0 bottom-0 pb-9">
        <div className="grid grid-cols-3 items-center px-9">
          <div className="flex justify-start">
            {recording ? (
              <button
                type="button"
                onClick={finishRecording}
                aria-label="Done recording"
                className="grid size-12 place-items-center rounded-full bg-white text-black backdrop-blur-md transition-transform active:scale-90"
              >
                <Check className="size-6" strokeWidth={2.5} />
              </button>
            ) : (
              <button
                type="button"
                onClick={takePhoto}
                disabled={!ready || countdown !== null}
                aria-label="Take a still"
                className="grid size-12 place-items-center rounded-full bg-black/35 text-[11px] font-medium tracking-[0.08em] text-white backdrop-blur-md transition-transform active:scale-90 disabled:opacity-40"
              >
                Still
              </button>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              aria-label={
                !recording ? "Record a moment" : paused ? "Record another clip" : "Stop this clip"
              }
              disabled={!ready || countdown !== null}
              onClick={() =>
                recording
                  ? togglePause()
                  : timerSec > 0
                    ? startCountdown(timerSec)
                    : void beginRecording()
              }
              className={`capture-orbit relative grid size-[82px] place-items-center rounded-full transition-transform duration-200 active:scale-95 disabled:opacity-40 ${
                recording && !paused ? "rec-live" : ""
              }`}
            >
              <span
                className={`capture-face relative overflow-hidden transition-all duration-300 ease-out ${
                  recording && !paused ? "size-8 rounded-[10px]" : "size-[64px] rounded-full"
                }`}
              >
                {!recording || paused ? (
                  <span className="capture-shine pointer-events-none absolute inset-x-2.5 top-1.5 h-6 rounded-full" />
                ) : null}
              </span>
              {recording && !paused ? (
                <span className="pointer-events-none absolute inset-0 animate-ember-pulse rounded-full border-[3px] border-primary/60" />
              ) : null}
            </button>
          </div>


          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => void flipCamera()}
              disabled={!ready || countdown !== null}
              aria-label="Switch camera"
              className={`grid size-12 place-items-center rounded-full bg-black/35 text-white backdrop-blur-md transition-transform duration-300 active:scale-90 disabled:opacity-40 ${
                flipping ? "rotate-180" : ""
              }`}
            >
              <SwitchCamera className="size-5" />
            </button>
          </div>
        </div>

        {!recording ? (
          <div className="mt-5 flex justify-center">
            <Link
              to="/share-later"
              className="flex items-center gap-2 rounded-full bg-black/30 px-3.5 py-1.5 text-[11px] text-white/75 backdrop-blur-md"
            >
              <Bookmark className="size-3.5" />
              Share later {savedCount}/{SHARE_LATER_LIMIT}
            </Link>
          </div>
        ) : null}
      </div>

      {countdown !== null ? (
        <div className="absolute inset-0 grid place-items-center bg-black/25 backdrop-blur-[2px]">
          <span
            key={countdown}
            className="animate-shutter font-display text-[6rem] font-semibold leading-none text-white/90"
          >
            {countdown}
          </span>
        </div>
      ) : null}
    </main>
  );
}
