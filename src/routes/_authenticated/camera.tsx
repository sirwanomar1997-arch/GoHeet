import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SwitchCamera, X, Mic, MicOff, MapPin, Type as TypeIcon, Music2, Check, Play, Pause, Search } from "lucide-react";
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
  filterCss,
  overlayFontClass,
  overlayPlaceClass,
  overlayStyleClass,
  type FilterId,
  type MomentOverlay,
  type OverlayPlace,
  type OverlayStyle,
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
      rec.resume();
      playPauseBlip(true);
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
    return (
      <main className="min-h-svh bg-background">
        <div className="mx-auto max-w-lg px-4 pb-10 pt-4">
          <div className="flex items-center justify-between">
            <button type="button" onClick={retake} className="tap-target text-sm underline">
              Retake
            </button>
            <p className="data-figure text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              Captured just now
            </p>
          </div>

          <div className="relative mt-3 overflow-hidden rounded-[28px] bg-surface">
            {captured.kind === "video" ? (
              <video
                src={captured.url}
                className="aspect-[9/16] w-full object-cover"
                style={filterCss(look) ? { filter: filterCss(look) } : undefined}
                controls
                playsInline
              />
            ) : (
              <img
                src={captured.url}
                alt="Your capture"
                className="aspect-[9/16] w-full object-cover"
                style={filterCss(look) ? { filter: filterCss(look) } : undefined}
              />
            )}
            {overlay?.text ? (
              <div
                className={`pointer-events-none absolute inset-0 flex justify-center px-6 text-center ${overlayPlaceClass(
                  overlay.place,
                )}`}
              >
                <p
                  className={`max-w-[85%] text-[24px] leading-tight ${overlayFontClass(
                    overlay.font,
                  )} ${overlayStyleClass(overlay.style)}`}
                >
                  {overlay.text}
                </p>
              </div>
            ) : null}
          </div>

          {/* Creative tools — a look, a line of type, a track. Nothing heavier. */}
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setTextOpen(true)}
              className="tap-target flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised text-sm font-medium"
            >
              <TypeIcon className="size-4" /> {overlay?.text ? "Edit text" : "Add text"}
            </button>
            <button
              type="button"
              onClick={() => setMusicOpen(true)}
              className="tap-target flex flex-1 items-center justify-center gap-2 rounded-2xl border border-border bg-surface-raised px-3 text-sm font-medium"
            >
              <Music2 className="size-4" />
              <span className="truncate">{track ? track.title : "Add music"}</span>
            </button>
          </div>

          <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
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
                    look === f.id ? "border-primary scale-105" : "border-border"
                  }`}
                  style={{ backgroundImage: f.swatch }}
                  aria-hidden
                />
                <span
                  className={`data-figure mt-1.5 block text-[10px] uppercase tracking-[0.12em] ${
                    look === f.id ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {f.label}
                </span>
              </button>
            ))}
          </div>

          {track ? (
            <div className="mt-4 space-y-4 rounded-2xl border border-border bg-surface-raised p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{track.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{track.artist}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => toggleTrackPreview(track)} aria-label="Preview selected track">
                  {previewingTrackId === track.id ? <Pause className="size-4" /> : <Play className="size-4" />}
                </Button>
              </div>
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

          <div className="mt-5 space-y-4">
            <Textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value.slice(0, 300))}
              placeholder="What's happening? (optional)"
              className="min-h-20 bg-surface-raised"
            />
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={place}
                onChange={(e) => setPlace(e.target.value.slice(0, 60))}
                placeholder="Add a place (optional)"
                className="h-12 bg-surface-raised pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Reelzy keeps editing light on purpose. Caption it, place it, post it.
            </p>
            <Button
              onClick={doPublish}
              disabled={publishing || !session}
              className="ember-fill h-13 h-12 w-full rounded-2xl text-base font-semibold text-primary-foreground"
            >
              {publishing ? "Publishing…" : "Publish this moment"}
            </Button>
          </div>
        </div>

        <Sheet open={textOpen} onOpenChange={setTextOpen}>
          <SheetContent side="bottom" className="rounded-t-[28px] border-border bg-surface">
            <SheetHeader className="px-0">
              <SheetTitle className="font-display">Put a line on it</SheetTitle>
              <SheetDescription>One line of type, styled to fit Reelzy.</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 pb-8">
              <Input
                value={overlay?.text ?? ""}
                autoFocus
                onChange={(e) =>
                  setOverlay({
                    text: e.target.value.slice(0, 120),
                    font: overlay?.font ?? "display",
                    style: overlay?.style ?? "plain",
                    place: overlay?.place ?? "middle",
                  })
                }
                placeholder="Say it in a few words"
                className="h-12 bg-surface-raised"
              />
              <div className="flex gap-2">
                {OVERLAY_FONTS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => overlay && setOverlay({ ...overlay, font: f.id })}
                    className={`h-11 flex-1 rounded-xl border text-sm ${f.className} ${
                      overlay?.font === f.id ? "border-primary text-primary" : "border-border"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(["plain", "ember", "block"] as OverlayStyle[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => overlay && setOverlay({ ...overlay, style: st })}
                    className={`h-11 flex-1 rounded-xl border text-xs uppercase tracking-[0.14em] ${
                      overlay?.style === st ? "border-primary text-primary" : "border-border"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                {(["top", "middle", "bottom"] as OverlayPlace[]).map((pl) => (
                  <button
                    key={pl}
                    type="button"
                    onClick={() => overlay && setOverlay({ ...overlay, place: pl })}
                    className={`h-11 flex-1 rounded-xl border text-xs uppercase tracking-[0.14em] ${
                      overlay?.place === pl ? "border-primary text-primary" : "border-border"
                    }`}
                  >
                    {pl}
                  </button>
                ))}
              </div>
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
          </SheetContent>
        </Sheet>

        <Sheet open={musicOpen} onOpenChange={setMusicOpen}>
          <SheetContent side="bottom" className="flex h-[70svh] flex-col rounded-t-[28px] border-border bg-surface">
            <SheetHeader className="px-0">
              <SheetTitle className="font-display">Add a track</SheetTitle>
              <SheetDescription>Music cleared for use inside Reelzy.</SheetDescription>
            </SheetHeader>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={musicSearch} onChange={(event) => setMusicSearch(event.target.value)} placeholder="Search tracks, artists or moods" className="h-11 bg-surface-raised pl-10" />
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pb-6">
              {musicLoading ? (
                <p className="py-10 text-center text-sm text-muted-foreground">Loading tracks…</p>
              ) : (music?.tracks.length ?? 0) === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Reelzy's licensed catalog is awaiting provider approval. Tracks will appear here
                  only after their usage rights are verified.
                </p>
              ) : (
                visibleTracks.map((t) => (
                  <div key={t.id} className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface-raised p-3">
                    <Button variant="ghost" size="icon" onClick={() => toggleTrackPreview(t)} aria-label={`Preview ${t.title}`} className="shrink-0 overflow-hidden rounded-xl">
                      {t.artworkUrl ? <img src={t.artworkUrl} alt="" className="size-full object-cover" /> : previewingTrackId === t.id ? <Pause className="size-4" /> : <Play className="size-4" />}
                    </Button>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{t.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{t.artist}</span>
                    </span>
                    <Button
                      variant={track?.id === t.id ? "default" : "outline"}
                      size="icon"
                      onClick={() => {
                        previewAudioRef.current?.pause();
                        setPreviewingTrackId(null);
                        setTrack({ id: t.id, title: t.title, artist: t.artist, url: t.url, durationMs: t.durationMs });
                        setMusicOffsetMs(0);
                        setMusicOpen(false);
                      }}
                      aria-label={`Use ${t.title}`}
                    >
                      <Check className="size-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
            {track ? (
              <Button
                variant="ghost"
                className="h-12 rounded-2xl border border-border"
                onClick={() => {
                  setTrack(null);
                  setMusicOpen(false);
                }}
              >
                Remove music
              </Button>
            ) : null}
          </SheetContent>
        </Sheet>
      </main>
    );
  }

  return (
    <main className="relative h-svh overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="size-full object-cover"
        style={filterCss(look) ? { filter: filterCss(look) } : undefined}
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

      <div className="absolute inset-x-0 bottom-0 pb-10">
        <div className="mb-5 flex gap-2.5 overflow-x-auto px-5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setLook(f.id)}
              aria-label={f.label}
              aria-pressed={look === f.id}
              className={`size-11 shrink-0 rounded-2xl border-2 transition-transform ${
                look === f.id ? "border-white scale-110" : "border-white/25"
              }`}
              style={{ backgroundImage: f.swatch }}
            />
          ))}
        </div>
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
            className={`grid size-20 place-items-center rounded-full border-[3px] border-white/80 transition-transform active:scale-95 ${
              recording && !paused ? "rec-live" : "ember-ring"
            }`}
          >
            <span
              className={
                recording
                  ? paused
                    ? "size-8 rounded-full bg-[image:var(--gradient-ember)]"
                    : "size-7 rounded-md bg-[image:var(--gradient-ember)]"
                  : "ember-fill size-16 rounded-full"
              }
            />
          </button>

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
