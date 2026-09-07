/**
 * Reelzy camera engine.
 *
 * A small, modular controller that sits between the UI and the browser media
 * stack. It owns lens selection, framing, zoom, torch and recording so the
 * camera screen stays presentational — and so future work (AR, stabilisation,
 * smarter encoders) can slot in here without touching the interface.
 */

export type Facing = "user" | "environment";

export type ZoomRange = { min: number; max: number; step: number };

export type EngineState = {
  facing: Facing;
  zoom: number;
  zoomRange: ZoomRange | null;
  torch: boolean;
  torchAvailable: boolean;
  width: number;
  height: number;
};

export type EngineError = { title: string; body: string; kind: "denied" | "missing" | "failed" };

type TrackWithCaps = MediaStreamTrack & {
  getCapabilities?: () => Record<string, unknown>;
  getSettings: () => MediaTrackSettings & { zoom?: number };
};

const HIGH_BITRATE = 12_000_000;
const AUDIO_BITRATE = 192_000;

/** Ordered by fidelity: MP4/H.264 first (best downstream compatibility), then VP9, then anything. */
function bestMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "video/mp4;codecs=avc1.640029,mp4a.40.2",
    "video/mp4;codecs=avc1",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c));
}

/**
 * Framing rules. The old camera pinned 1080x1920, which many devices satisfy by
 * cropping the sensor — that is exactly the "too zoomed in" feeling. We ask for
 * a generous capture size, tell the browser not to crop or rescale, and let the
 * device pick its natural, widest comfortable field of view.
 */
function videoConstraints(facing: Facing): MediaTrackConstraints {
  return {
    facingMode: { ideal: facing },
    width: { ideal: 1920, max: 3840 },
    height: { ideal: 1080, max: 2160 },
    frameRate: { ideal: 30, max: 60 },
    // Keep the sensor's own framing — no browser-side crop/scale.
    resizeMode: "none",
  } as MediaTrackConstraints;
}

function audioConstraints(): MediaTrackConstraints {
  return {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
    channelCount: { ideal: 2 },
    sampleRate: { ideal: 48_000 },
  } as MediaTrackConstraints;
}

export class CameraEngine {
  private stream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private mime: string | undefined;

  state: EngineState = {
    facing: "user",
    zoom: 1,
    zoomRange: null,
    torch: false,
    torchAvailable: false,
    width: 0,
    height: 0,
  };

  get mediaStream() {
    return this.stream;
  }

  private get videoTrack(): TrackWithCaps | null {
    return (this.stream?.getVideoTracks()[0] as TrackWithCaps | undefined) ?? null;
  }

  /** Open (or re-open) the camera. Resolves with the live stream. */
  async start(facing: Facing, withAudio: boolean): Promise<MediaStream> {
    this.stop();
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw this.friendly({ name: "NotFoundError" });
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints(facing),
        audio: withAudio ? audioConstraints() : false,
      });
    } catch (err) {
      // Some devices reject the richer constraints — fall back to a plain open
      // rather than failing the whole camera.
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: withAudio,
        });
      } catch {
        throw this.friendly(err);
      }
    }
    this.stream = stream;
    this.state.facing = facing;
    this.readCapabilities();
    // Always begin at the natural, unzoomed view.
    await this.setZoom(this.state.zoomRange?.min ?? 1).catch(() => undefined);
    return stream;
  }

  private readCapabilities() {
    const track = this.videoTrack;
    if (!track) return;
    const caps = (track.getCapabilities?.() ?? {}) as { zoom?: Partial<ZoomRange>; torch?: boolean };
    const settings = track.getSettings();
    const zoom = caps.zoom && typeof caps.zoom.max === "number" && caps.zoom.max > (caps.zoom.min ?? 1)
      ? { min: caps.zoom.min ?? 1, max: caps.zoom.max, step: caps.zoom.step || 0.1 }
      : null;
    this.state.zoomRange = zoom;
    this.state.zoom = settings.zoom ?? zoom?.min ?? 1;
    this.state.torchAvailable = caps.torch === true;
    this.state.torch = false;
    this.state.width = settings.width ?? 0;
    this.state.height = settings.height ?? 0;
  }

  /** Hardware zoom when the lens supports it; the UI falls back to a capped digital zoom. */
  async setZoom(value: number): Promise<number> {
    const track = this.videoTrack;
    const range = this.state.zoomRange;
    if (!track || !range) {
      this.state.zoom = value;
      return value;
    }
    const clamped = Math.min(range.max, Math.max(range.min, value));
    try {
      await track.applyConstraints({ advanced: [{ zoom: clamped }] } as unknown as MediaTrackConstraints);
      this.state.zoom = clamped;
    } catch {
      this.state.zoom = clamped;
    }
    return clamped;
  }

  async setTorch(on: boolean): Promise<boolean> {
    const track = this.videoTrack;
    if (!track || !this.state.torchAvailable) return false;
    try {
      await track.applyConstraints({ advanced: [{ torch: on }] } as unknown as MediaTrackConstraints);
      this.state.torch = on;
      return on;
    } catch {
      return this.state.torch;
    }
  }

  /** Mute the mic briefly so interface cues never land in the recording. */
  silenceMic(ms: number) {
    const tracks = this.stream?.getAudioTracks() ?? [];
    if (!tracks.length) return;
    tracks.forEach((t) => (t.enabled = false));
    setTimeout(() => tracks.forEach((t) => (t.enabled = true)), ms);
  }

  startRecording(onStop: (blob: Blob) => void) {
    const stream = this.stream;
    if (!stream) return;
    this.mime = bestMimeType();
    const rec = new MediaRecorder(stream, {
      ...(this.mime ? { mimeType: this.mime } : {}),
      videoBitsPerSecond: HIGH_BITRATE,
      audioBitsPerSecond: AUDIO_BITRATE,
    });
    this.chunks = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(this.chunks, { type: rec.mimeType || this.mime || "video/webm" });
      this.chunks = [];
      onStop(blob);
    };
    this.recorder = rec;
    rec.start(500);
  }

  pause() {
    if (this.recorder?.state === "recording") this.recorder.pause();
  }

  resume() {
    if (this.recorder?.state === "paused") this.recorder.resume();
  }

  stopRecording() {
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    this.recorder = null;
  }

  stop() {
    this.stopRecording();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  /** Grab a still frame from a live preview element (used for posters). */
  static async grabFrame(video: HTMLVideoElement | null, mirrored = false): Promise<Blob | null> {
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    if (mirrored) {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92));
  }

  private friendly(err: unknown): EngineError {
    const name = err instanceof Error ? err.name : String(err);
    if (name === "NotAllowedError" || name === "SecurityError") {
      return {
        kind: "denied",
        title: "Camera access is off",
        body: "Reelzy needs your camera and microphone to record a moment. Turn them on in your device settings, then come back.",
      };
    }
    if (name === "NotFoundError" || name === "OverconstrainedError") {
      return {
        kind: "missing",
        title: "No camera found",
        body: "We couldn't find a camera on this device. Try another device to record your moment.",
      };
    }
    return {
      kind: "failed",
      title: "We couldn't start the camera",
      body: "Something interrupted the camera. Close any other app using it and try again.",
    };
  }
}

export function isEngineError(v: unknown): v is EngineError {
  return !!v && typeof v === "object" && "title" in v && "body" in v;
}
