import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SwitchCamera, X, Mic, MicOff, MapPin, Type as TypeIcon, Music2, Check, Play, Pause, Search, Trash2 } from "lucide-react";
import { publishMoment, startCapture, listMusicTracks } from "@/lib/reelzy.functions";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import {
  FILTERS,
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


export const Route = createFileRoute("/_authenticated/camera")({
  component: CameraPage,
});

const MAX_MS = 300_000; // Reelzy caps a moment at five minutes.

type Captured = {
  blob: Blob;
  url: string;
  kind: "video" | "photo";
  durationMs: number;
  poster: Blob | null;
};

function formatClock(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")} / 5:00`;
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["video/mp4;codecs=avc1", "video/webm;codecs=vp9,opus", "video/webm"];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c));
}

function CameraPage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const accumulatedRef = useRef(0);
  const elapsedRef = useRef(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [withAudio, setWithAudio] = useState(true);
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [captured, setCaptured] = useState<Captured | null>(null);

  const [session, setSession] = useState<{ sessionId: string; storagePrefix: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [place, setPlace] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [look, setLook] = useState<FilterId>("none");
  const [overlay, setOverlay] = useState<MomentOverlay | null>(null);
  const [textOpen, setTextOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragMovedRef = useRef(false);

  const [draggingText, setDraggingText] = useState(false);
  const [trashHot, setTrashHot] = useState(false);
  const trashHotRef = useRef(false);

  const startDrag = (e: React.PointerEvent<HTMLElement>) => {
    draggingRef.current = true;
    dragMovedRef.current = false;
    trashHotRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setDraggingText(true);
    setTrashHot(false);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.hypot(dx, dy) > 6) dragMovedRef.current = true;
    const box = stageRef.current?.getBoundingClientRect();
    if (!box) return;
    const x = Math.min(96, Math.max(4, ((e.clientX - box.left) / box.width) * 100));
    const y = Math.min(96, Math.max(4, ((e.clientY - box.top) / box.height) * 100));
    const overTrash = y > 84 && x > 28 && x < 72;
    if (overTrash !== trashHotRef.current) {
      trashHotRef.current = overTrash;
      setTrashHot(overTrash);
    }
    setOverlay((o) => (o ? { ...o, x, y } : o));
  };
  const endDrag = () => {
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
  const onTextTap = () => {
    // A tap without a drag opens the editor; a drag just moves the text.
    if (!dragMovedRef.current) setTextOpen(true);
  };

  const [musicOpen, setMusicOpen] = useState(false);
  const [track, setTrack] = useState<{
    id: string;
    title: string;
    artist: string;
    url: string | null;
    durationMs: number | null;
  } | null>(null);
  const [musicSearch, setMusicSearch] = useState("");
  const [musicOffsetMs, setMusicOffsetMs] = useState(0);
  const [musicVolume, setMusicVolume] = useState(0.75);
  const [originalAudioVolume, setOriginalAudioVolume] = useState(1);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const openSession = useServerFn(startCapture);
  const fetchTracks = useServerFn(listMusicTracks);
  const { data: music, isLoading: musicLoading } = useQuery({
    queryKey: ["music-library"],
    queryFn: () => fetchTracks({ data: undefined }),
    enabled: musicOpen,
  });
  const publish = useServerFn(publishMoment);
  const visibleTracks = (music?.tracks ?? []).filter((item) => {
    const query = musicSearch.trim().toLowerCase();
    return !query || `${item.title} ${item.artist} ${item.mood ?? ""} ${item.genres.join(" ")}`.toLowerCase().includes(query);
  });

  useEffect(() => () => previewAudioRef.current?.pause(), []);

  function toggleTrackPreview(item: { id: string; url: string | null }) {
    const current = previewAudioRef.current;
    if (previewingTrackId === item.id && current) {
      current.pause();
      setPreviewingTrackId(null);
      return;
    }
    current?.pause();
    if (!item.url) return;
    const audio = new Audio(item.url);
    audio.volume = 0.75;
    audio.onended = () => setPreviewingTrackId(null);
    previewAudioRef.current = audio;
    setPreviewingTrackId(item.id);
    void audio.play().catch(() => setPreviewingTrackId(null));
  }

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    setReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: withAudio,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
      setReady(true);
      setDenied(null);
    } catch (err) {
      setDenied(
        err instanceof Error && err.name === "NotAllowedError"
          ? "Reelzy needs camera access. Allow it in your browser settings and reload."
          : "No camera available on this device.",
      );
    }
  }, [facing, withAudio, stopStream]);

  useEffect(() => {
    if (captured) return;
    void startStream();
    return stopStream;
  }, [startStream, stopStream, captured]);

  // A server-issued capture session is what proves this came from the Reelzy camera.
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
      if (ms >= MAX_MS) recorderRef.current?.stop();
    }, 100);
    return () => clearInterval(id);
  }, [recording, paused]);


  function grabPoster(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const vid = videoRef.current;
      if (!vid) return resolve(null);
      const canvas = document.createElement("canvas");
      canvas.width = vid.videoWidth || 720;
      canvas.height = vid.videoHeight || 1280;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82);
    });
  }

  async function takePhoto() {
    const poster = await grabPoster();
    if (!poster) {
      toast.error("Couldn't capture that frame.");
      return;
    }
    setCaptured({
      blob: poster,
      url: URL.createObjectURL(poster),
      kind: "photo",
      durationMs: 0,
      poster: null,
    });
    stopStream();
  }

  /** Cue sounds are for the person filming — never for the clip. Mute the mic while they play. */
  function silenceMicFor(ms: number) {
    const tracks = streamRef.current?.getAudioTracks() ?? [];
    if (!tracks.length) return;
    tracks.forEach((t) => (t.enabled = false));
    window.setTimeout(() => {
      tracks.forEach((t) => (t.enabled = true));
    }, ms);
  }

  async function beginRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    accumulatedRef.current = 0;
    elapsedRef.current = 0;
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = async () => {
      playRecordStop();
      const duration = elapsedRef.current;
      const poster = await grabPoster();
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" });
      setRecording(false);
      setPaused(false);
      setElapsed(0);
      if (duration < 800) {
        toast.error("Hold a moment longer — that clip was too short.");
        return;
      }
      setCaptured({ blob, url: URL.createObjectURL(blob), kind: "video", durationMs: duration, poster });
      stopStream();
    };
    recorderRef.current = rec;
    startedAtRef.current = Date.now();
    playRecordStart();
    silenceMicFor(700);
    rec.start(250);
    setRecording(true);
  }

  /** 3 · 2 · 1 before the first frame, so you can get in place. */
  function startCountdown() {
    if (countdown !== null) return;
    primeCaptureSounds();
    setCountdown(3);
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
    const rec = recorderRef.current;
    if (!rec) return;
    if (paused) {
      startedAtRef.current = Date.now();
      playPauseBlip(true);
      silenceMicFor(500);
      rec.resume();
      setPaused(false);
    } else {
      accumulatedRef.current += Date.now() - startedAtRef.current;
      elapsedRef.current = accumulatedRef.current;
      rec.pause();
      playPauseBlip(false);
      setPaused(true);
    }
  }


  function retake() {
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    setCaption("");
    setPlace("");
    setOverlay(null);
    setTrack(null);
    setMusicOffsetMs(0);
    setMusicVolume(0.75);
    setOriginalAudioVolume(1);
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
          ...(thumbnailPath ? { thumbnailPath } : {}),
          ...(caption.trim() ? { caption: caption.trim() } : {}),
          ...(place.trim() ? { locationLabel: place.trim() } : {}),
          ...(look !== "none" ? { styleFilter: look } : {}),
          ...(overlay?.text.trim() ? { overlay } : {}),
          ...(track ? { musicTrackId: track.id } : {}),
          ...(track ? { musicOffsetMs, musicVolume } : {}),
          originalAudioVolume,
        },
      });
      toast.success("Published. That's a real one.");
      await navigate({ to: "/feed" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't publish that moment.");
    } finally {
      setPublishing(false);
    }
  }

  if (captured) {
    const media =
      captured.kind === "video" ? (
        <video
          src={captured.url}
          className="size-full object-contain"
          style={filterCss(look) ? { filter: filterCss(look) } : undefined}
          playsInline
          autoPlay
          loop
          controls={false}
        />
      ) : (
        <img
          src={captured.url}
          alt="Your capture"
          className="size-full object-contain"
          style={filterCss(look) ? { filter: filterCss(look) } : undefined}
        />
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

              <button
                type="button"
                onClick={() => setMusicOpen(true)}
                className="flex h-12 w-full items-center gap-3 rounded-2xl border border-border bg-surface-raised px-4 text-left text-sm"
              >
                <Music2 className="size-4 text-muted-foreground" />
                <span className="truncate">{track ? `${track.title} · ${track.artist}` : "Add music (optional)"}</span>
              </button>

              {track ? (
                <div className="space-y-4 rounded-2xl border border-border bg-surface-raised p-4">
                  <label className="block space-y-2 text-xs text-muted-foreground">
                    <span className="flex justify-between"><span>Start point</span><span>{Math.floor(musicOffsetMs / 1000)}s</span></span>
                    <Slider value={[musicOffsetMs]} min={0} max={Math.max(0, (track.durationMs ?? 30000) - 1000)} step={1000} onValueChange={([value]) => setMusicOffsetMs(value ?? 0)} />
                  </label>
                  <label className="block space-y-2 text-xs text-muted-foreground">
                    <span>Music volume</span>
                    <Slider value={[musicVolume]} min={0} max={1} step={0.05} onValueChange={([value]) => setMusicVolume(value ?? 0.75)} />
                  </label>
                  <label className="block space-y-2 text-xs text-muted-foreground">
                    <span>Original sound</span>
                    <Slider value={[originalAudioVolume]} min={0} max={1} step={0.05} onValueChange={([value]) => setOriginalAudioVolume(value ?? 1)} />
                  </label>
                </div>
              ) : null}

              <Button
                onClick={doPublish}
                disabled={publishing || !session}
                className="ember-fill h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
              >
                {publishing ? "Publishing…" : "Publish"}
              </Button>
            </div>
          </div>

          {musicSheet}
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
            className="absolute inset-0 touch-none"
            onPointerMove={onDragMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <p
              onPointerDown={startDrag}
              onClick={onTextTap}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") setTextOpen(true);
              }}
              aria-label="Tap to edit, drag to move your text"
              className={`absolute max-w-[80%] cursor-grab touch-none select-none whitespace-pre-wrap text-center leading-tight active:cursor-grabbing ${
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
            {draggingText ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-8">
                <div
                  className={`flex size-14 items-center justify-center rounded-full border-2 transition-all duration-150 ${
                    trashHot
                      ? "scale-125 border-red-500 bg-red-500 text-white shadow-[0_0_28px_rgba(239,68,68,0.7)]"
                      : "border-white/40 bg-black/55 text-white/90 backdrop-blur-sm"
                  }`}
                  aria-hidden
                >
                  <Trash2 className="size-6" />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {/* Top bar: leave, or move on to the details step. */}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
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
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 flex-col gap-3">
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
                  setTextOpen(true);
                },
              },
              {
                key: "music",
                icon: <Music2 className="size-5" />,
                label: track ? "Change music" : "Add music",
                active: !!track,
                onClick: () => {
                  setFilterOpen(false);
                  setMusicOpen(true);
                },
              },
            ].map((tool) => (
              <button
                key={tool.key}
                type="button"
                aria-label={tool.label}
                onClick={tool.onClick}
                className={`grid size-12 place-items-center rounded-full backdrop-blur transition-colors ${
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
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pb-8 pt-10">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {FILTERS.map((f) => (
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
          <div className="absolute inset-x-0 bottom-0 z-40 rounded-t-[28px] border border-border bg-surface p-5 shadow-[0_-18px_60px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-lg">Say it loud</p>
                <p className="text-xs text-muted-foreground">
                  Everything updates live on your video as you tap.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTextOpen(false)}
                aria-label="Close text editor"
                className="tap-target -mr-1 -mt-1 text-muted-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="max-h-[42svh] space-y-5 overflow-y-auto pb-6">
              <Input
                value={overlay?.text ?? ""}
                autoFocus
                onChange={(e) =>
                  setOverlay((o) => ({
                    ...(o ?? { ...DEFAULT_OVERLAY }),
                    text: e.target.value.slice(0, 120),
                  }))
                }
                placeholder="Say it in a few words"
                className="h-12 bg-surface-raised"
              />

              <div>
                <p className="data-figure mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Font
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {OVERLAY_FONTS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => overlay && setOverlay({ ...overlay, font: f.id })}
                      className={`h-14 shrink-0 rounded-2xl border px-4 text-lg ${
                        overlay?.font === f.id
                          ? "border-primary text-primary"
                          : "border-border text-foreground"
                      }`}
                      style={overlayFontStyle(f.id)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="data-figure mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Colour
                </p>
                <div className="flex gap-2.5 overflow-x-auto pb-1">
                  {OVERLAY_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      aria-label={c.label}
                      onClick={() => overlay && setOverlay({ ...overlay, color: c.value })}
                      className={`size-9 shrink-0 rounded-full border-2 transition-transform ${
                        overlay?.color === c.value
                          ? "border-primary scale-110"
                          : "border-border/60"
                      }`}
                      style={{ background: c.value }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="data-figure mb-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Finish
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {OVERLAY_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => overlay && setOverlay({ ...overlay, style: st.id })}
                      className={`h-11 shrink-0 rounded-xl border px-4 text-xs uppercase tracking-[0.14em] ${
                        overlay?.style === st.id
                          ? "border-primary text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block space-y-2 text-xs text-muted-foreground">
                <span>Size</span>
                <Slider
                  value={[overlay?.size ?? DEFAULT_OVERLAY.size]}
                  min={14}
                  max={64}
                  step={1}
                  onValueChange={([v]) =>
                    overlay && setOverlay({ ...overlay, size: v ?? overlay.size })
                  }
                />
              </label>

              <label className="block space-y-2 text-xs text-muted-foreground">
                <span>Tilt</span>
                <Slider
                  value={[overlay?.rotate ?? 0]}
                  min={-30}
                  max={30}
                  step={1}
                  onValueChange={([v]) =>
                    overlay && setOverlay({ ...overlay, rotate: v ?? overlay.rotate })
                  }
                />
              </label>

              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="h-12 flex-1 rounded-2xl border border-border"
                  onClick={() => {
                    setOverlay(null);
                    setTextOpen(false);
                  }}
                >
                  Remove
                </Button>
                <Button
                  className="ember-fill h-12 flex-1 rounded-2xl text-primary-foreground"
                  onClick={() => setTextOpen(false)}
                >
                  Done
                </Button>
              </div>
            </div>
          </div>
        ) : null}

        {musicSheet}
      </main>
    );
  }


  return (
    <main className="relative h-svh overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="size-full object-cover"
        playsInline
        muted
        autoPlay
      />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
        <Link
          to="/feed"
          aria-label="Close camera"
          className="tap-target grid place-items-center rounded-full bg-background/70 backdrop-blur"
        >
          <X className="size-5" />
        </Link>
        <span className="data-figure flex items-center gap-2 rounded-full bg-background/70 px-3 py-1.5 text-[11px] backdrop-blur">
          {recording ? (
            <>
              <span
                className={`size-2 rounded-full bg-[image:var(--gradient-ember)] ${paused ? "opacity-50" : "animate-ember-pulse"}`}
              />
              {paused ? "Paused" : null} {formatClock(elapsed)}
            </>
          ) : (
            "Reelzy camera"
          )}
        </span>

        <button
          type="button"
          onClick={() => setWithAudio((a) => !a)}
          aria-label={withAudio ? "Record without sound" : "Record with sound"}
          className="tap-target grid place-items-center rounded-full bg-background/70 backdrop-blur"
        >
          {withAudio ? <Mic className="size-5" /> : <MicOff className="size-5" />}
        </button>
      </div>

      {denied ? (
        <div className="absolute inset-0 grid place-items-center bg-background/95 px-8 text-center">
          <div>
            <h1 className="font-display text-xl font-semibold">Camera blocked</h1>
            <p className="mt-2 text-sm text-muted-foreground">{denied}</p>
            <p className="mt-4 text-xs text-muted-foreground">
              Reelzy has no upload option by design — capture is the only way to post.
            </p>
          </div>
        </div>
      ) : null}

      {/* No looks while filming — the frame stays true. Filters come after, before posting. */}
      <div className="absolute inset-x-0 bottom-0 pb-10">

        <div className="flex items-center justify-around px-8">
          {recording ? (
            <button
              type="button"
              onClick={togglePause}
              aria-label={paused ? "Resume recording" : "Pause recording"}
              className="tap-target grid place-items-center rounded-full border border-white/25 px-4 text-white"
            >
              {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={takePhoto}
              disabled={!ready || countdown !== null}
              className="tap-target rounded-full border border-white/25 px-4 text-xs font-semibold text-white"
            >
              Still
            </button>
          )}

          <button
            type="button"
            aria-label={
              recording ? (paused ? "Resume recording" : "Pause recording") : "Record a moment"
            }
            disabled={!ready || countdown !== null}
            onClick={() => (recording ? togglePause() : startCountdown())}
            className={`size-20 rounded-full bg-[image:var(--gradient-ember)] transition-transform active:scale-95 ${
              recording && !paused ? "rec-live" : ""
            }`}
          />

          {recording ? (
            <button
              type="button"
              onClick={() => recorderRef.current?.stop()}
              aria-label="Finish recording"
              className="tap-target grid place-items-center rounded-full border border-white/25 px-4 text-white"
            >
              <Check className="size-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
              disabled={!ready || countdown !== null}
              aria-label="Flip camera"
              className="tap-target grid place-items-center rounded-full border border-white/25 text-white"
            >
              <SwitchCamera className="size-5" />
            </button>
          )}
        </div>
        <p className="mt-4 text-center text-[11px] text-white/60">
          {recording
            ? "Pause any time, keep filming, then tap the check when you're done."
            : "Captured live, up to five minutes. Nothing can be uploaded from your camera roll."}
        </p>
      </div>

      {countdown !== null ? (
        <div className="absolute inset-0 grid place-items-center bg-black/35 backdrop-blur-[2px]">
          <span
            key={countdown}
            className="ember-text animate-shutter font-display text-[7rem] font-bold leading-none"
          >
            {countdown}
          </span>
        </div>
      ) : null}

    </main>
  );
}
