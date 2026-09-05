import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { SwitchCamera, X, Mic, MicOff, MapPin } from "lucide-react";
import { publishMoment, startCapture } from "@/lib/reelzy.functions";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/camera")({
  component: CameraPage,
});

const MAX_MS = 30_000;

type Captured = {
  blob: Blob;
  url: string;
  kind: "video" | "photo";
  durationMs: number;
  poster: Blob | null;
};

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

  const [facing, setFacing] = useState<"user" | "environment">("environment");
  const [withAudio, setWithAudio] = useState(true);
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [session, setSession] = useState<{ sessionId: string; storagePrefix: string } | null>(null);
  const [caption, setCaption] = useState("");
  const [place, setPlace] = useState("");
  const [publishing, setPublishing] = useState(false);

  const openSession = useServerFn(startCapture);
  const publish = useServerFn(publishMoment);

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
    if (!recording) return;
    const id = setInterval(() => {
      const ms = Date.now() - startedAtRef.current;
      setElapsed(ms);
      if (ms >= MAX_MS) recorderRef.current?.stop();
    }, 100);
    return () => clearInterval(id);
  }, [recording]);

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
    if (!poster) return toast.error("Couldn't capture that frame.");
    setCaptured({
      blob: poster,
      url: URL.createObjectURL(poster),
      kind: "photo",
      durationMs: 0,
      poster: null,
    });
    stopStream();
  }

  async function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;
    const mimeType = pickMimeType();
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
    rec.onstop = async () => {
      const duration = Date.now() - startedAtRef.current;
      const poster = await grabPoster();
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" });
      setRecording(false);
      setElapsed(0);
      if (duration < 800) {
        toast.error("Hold the button to record.");
        return;
      }
      setCaptured({ blob, url: URL.createObjectURL(blob), kind: "video", durationMs: duration, poster });
      stopStream();
    };
    recorderRef.current = rec;
    startedAtRef.current = Date.now();
    rec.start(250);
    setRecording(true);
  }

  function retake() {
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
    setCaption("");
    setPlace("");
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
          thumbnailPath,
          kind: captured.kind,
          durationMs: Math.round(captured.durationMs),
          caption: caption.trim() || undefined,
          locationLabel: place.trim() || undefined,
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

          <div className="mt-3 overflow-hidden rounded-[28px] bg-surface">
            {captured.kind === "video" ? (
              <video src={captured.url} className="aspect-[9/16] w-full object-cover" controls playsInline />
            ) : (
              <img src={captured.url} alt="Your capture" className="aspect-[9/16] w-full object-cover" />
            )}
          </div>

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
      </main>
    );
  }

  return (
    <main className="relative h-svh overflow-hidden bg-black">
      <video ref={videoRef} className="size-full object-cover" playsInline muted autoPlay />

      <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-4">
        <Link
          to="/feed"
          aria-label="Close camera"
          className="tap-target grid place-items-center rounded-full bg-background/70 backdrop-blur"
        >
          <X className="size-5" />
        </Link>
        <span className="data-figure rounded-full bg-background/70 px-3 py-1.5 text-[11px] backdrop-blur">
          {recording ? `${(elapsed / 1000).toFixed(1)}s / 30s` : "Reelzy camera"}
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
        <div className="flex items-center justify-around px-8">
          <button
            type="button"
            onClick={takePhoto}
            disabled={!ready || recording}
            className="tap-target rounded-full border border-white/25 px-4 text-xs font-semibold text-white"
          >
            Still
          </button>

          <button
            type="button"
            aria-label={recording ? "Stop recording" : "Record a moment"}
            disabled={!ready}
            onClick={() => (recording ? recorderRef.current?.stop() : void startRecording())}
            className="ember-ring grid size-20 place-items-center rounded-full border-[3px] border-white/80 transition-transform active:scale-95"
          >
            <span
              className={
                recording
                  ? "size-7 rounded-md bg-[image:var(--gradient-ember)]"
                  : "ember-fill size-16 rounded-full"
              }
            />
          </button>

          <button
            type="button"
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            disabled={!ready}
            aria-label="Flip camera"
            className="tap-target grid place-items-center rounded-full border border-white/25 text-white"
          >
            <SwitchCamera className="size-5" />
          </button>
        </div>
        <p className="mt-4 text-center text-[11px] text-white/60">
          Captured live. Nothing can be uploaded from your camera roll.
        </p>
      </div>
    </main>
  );
}
