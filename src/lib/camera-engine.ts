/**
 * GoHeet camera engine.
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

// Conservative mobile settings prevent memory pressure and encoder crashes on
// entry-level Android tablets while retaining clear short-form video.
const VIDEO_BITRATE = 4_000_000;
const AUDIO_BITRATE = 128_000;

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
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 30 },
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
  private audioStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: BlobPart[] = [];
  private mime: string | undefined;
  /** Recording pipeline: we always record a canvas so the lens can change mid-take. */
  private canvas: HTMLCanvasElement | null = null;
  private mixVideo: HTMLVideoElement | null = null;
  private raf = 0;
  /** Last good frame, held on screen while the other lens wakes up. */
  private freeze: HTMLCanvasElement | null = null;
  /** Timestamp the crossfade from the frozen frame to the new lens began. */
  private fadeFrom = 0;
  private swapping = false;

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

  /** Hardware name of the lens in use — part of the proof a clip was filmed live. */
  get cameraLabel(): string | null {
    return this.videoTrack?.label ?? null;
  }


  private get videoTrack(): TrackWithCaps | null {
    return (this.stream?.getVideoTracks()[0] as TrackWithCaps | undefined) ?? null;
  }

  private async openVideo(facing: Facing): Promise<MediaStream> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      throw this.friendly({ name: "NotFoundError" });
    }
    try {
      return await navigator.mediaDevices.getUserMedia({ video: videoConstraints(facing), audio: false });
    } catch (err) {
      try {
        return await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing }, audio: false });
      } catch {
        throw this.friendly(err);
      }
    }
  }

  /** Open (or re-open) the camera. Resolves with the live stream. */
  async start(facing: Facing, withAudio: boolean): Promise<MediaStream> {
    this.stop();
    const video = await this.openVideo(facing);
    if (withAudio) {
      try {
        this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints() });
      } catch {
        this.audioStream = null;
      }
    }
    const stream = new MediaStream([
      ...video.getVideoTracks(),
      ...(this.audioStream?.getAudioTracks() ?? []),
    ]);
    this.stream = stream;
    this.state.facing = facing;
    this.readCapabilities();
    // Always begin at the natural, unzoomed view.
    await this.setZoom(this.state.zoomRange?.min ?? 1).catch(() => undefined);
    return stream;
  }

  /**
   * Swap lenses without interrupting anything. While recording, the canvas
   * pipeline simply starts drawing the new lens — the take keeps running.
   */
  async switchFacing(facing: Facing): Promise<MediaStream> {
    if (this.swapping) return this.stream ?? new MediaStream();
    this.swapping = true;
    // iOS only allows one active capture at a time, so release the current lens
    // first. The recorder keeps running because it records the canvas: we hold
    // the last good frame on it, then crossfade into the new lens.
    this.captureFreeze();
    const previous = this.stream?.getVideoTracks() ?? [];
    previous.forEach((t) => {
      t.stop();
      this.stream?.removeTrack(t);
    });

    let next: MediaStream;
    try {
      next = await this.openVideo(facing);
    } catch (err) {
      // Couldn't open the other lens — put the original one back.
      try {
        const back = await this.openVideo(this.state.facing);
        back.getVideoTracks().forEach((t) => this.stream?.addTrack(t));
        await this.attachMixSource();
      } catch {
        /* nothing more we can do */
      }
      this.swapping = false;
      throw err;
    }

    next.getVideoTracks().forEach((t) => this.stream?.addTrack(t));
    if (!this.stream) this.stream = next;
    this.state.facing = facing;
    this.readCapabilities();
    await this.setZoom(this.state.zoomRange?.min ?? 1).catch(() => undefined);
    await this.attachMixSource();
    this.swapping = false;
    return this.stream;
  }

  /** Point the recording mixer at the current lens and wait for a real frame. */
  private async attachMixSource() {
    const mix = this.mixVideo;
    if (!mix || !this.stream) return;
    mix.srcObject = new MediaStream(this.stream.getVideoTracks());
    await mix.play().catch(() => undefined);
    await this.firstFrame(mix);
    // Only now let the canvas leave the frozen frame — no black flash, ever.
    this.fadeFrom = performance.now();
  }

  /** Resolve once the element is actually painting pixels (or after a safety timeout). */
  private firstFrame(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
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
      if (typeof el.requestVideoFrameCallback === "function") {
        el.requestVideoFrameCallback(() => settle());
      } else {
        const poll = () => {
          if (done) return;
          if (video.videoWidth > 0 && video.readyState >= 2) settle();
          else requestAnimationFrame(poll);
        };
        poll();
      }
    });
  }

  /** Snapshot the canvas so the take can hold this frame while lenses change. */
  private captureFreeze() {
    const canvas = this.canvas;
    if (!canvas) return;
    const hold = this.freeze ?? document.createElement("canvas");
    hold.width = canvas.width;
    hold.height = canvas.height;
    hold.getContext("2d")?.drawImage(canvas, 0, 0);
    this.freeze = hold;
    this.fadeFrom = 0;
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

  /**
   * Keep the lens hunting-free: continuous autofocus, exposure and white
   * balance. Without this many phones re-focus from scratch every time the
   * subject gets close, which reads as stutter and breathing in the take.
   * Every field is best-effort — unsupported ones are simply skipped.
   */
  private async tuneLens() {
    const track = this.videoTrack;
    if (!track) return;
    const caps = (track.getCapabilities?.() ?? {}) as Record<string, unknown>;
    const has = (key: string, mode: string) => {
      const v = caps[key];
      return Array.isArray(v) && (v as string[]).includes(mode);
    };
    const advanced: Record<string, unknown>[] = [];
    if (has("focusMode", "continuous")) advanced.push({ focusMode: "continuous" });
    if (has("exposureMode", "continuous")) advanced.push({ exposureMode: "continuous" });
    if (has("whiteBalanceMode", "continuous")) advanced.push({ whiteBalanceMode: "continuous" });
    if (!advanced.length) return;
    try {
      await track.applyConstraints({ advanced } as unknown as MediaTrackConstraints);
    } catch {
      /* lens does not accept these — the default behaviour still works */
    }
  }

  /**
   * Hardware zoom when the lens supports it; the UI falls back to a capped
   * digital zoom.
   *
   * A pinch fires dozens of times a second. Sending every one of those to the
   * driver queues constraint changes faster than the lens can settle, and the
   * preview stalls and jumps. So we only ever have one change in flight: newer
   * values overwrite the pending one and the lens always lands on the finger's
   * latest position.
   */
  async setZoom(value: number): Promise<number> {
    const track = this.videoTrack;
    const range = this.state.zoomRange;
    if (!track || !range) {
      this.state.zoom = value;
      return value;
    }
    const clamped = Math.min(range.max, Math.max(range.min, value));
    this.state.zoom = clamped;
    this.zoomWanted = clamped;
    if (this.zoomBusy) return clamped;

    this.zoomBusy = true;
    try {
      while (this.zoomWanted !== null) {
        const target = this.zoomWanted;
        this.zoomWanted = null;
        // Snap to the lens's own step so tiny sub-step deltas never thrash it.
        const step = range.step || 0.1;
        const snapped = Math.round(target / step) * step;
        if (Math.abs(snapped - this.zoomApplied) < step / 2) continue;
        try {
          await track.applyConstraints({ advanced: [{ zoom: snapped }] } as unknown as MediaTrackConstraints);
          this.zoomApplied = snapped;
        } catch {
          break;
        }
      }
    } finally {
      this.zoomBusy = false;
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

  startRecording(onStop: (blob: Blob) => void): boolean {
    const stream = this.stream;
    if (!stream || this.recorder?.state === "recording" || typeof MediaRecorder === "undefined") return false;
    this.mime = bestMimeType();

    // Record a canvas rather than the raw camera track: the lens can then be
    // swapped mid-take without the recorder ever seeing an interruption.
    const track = this.videoTrack;
    const settings = track?.getSettings();
    const canvas = document.createElement("canvas");
    const sourceWidth = settings?.width || 1280;
    const sourceHeight = settings?.height || 720;
    const scale = Math.min(1, 1280 / Math.max(sourceWidth, sourceHeight));
    canvas.width = Math.max(2, Math.round(sourceWidth * scale));
    canvas.height = Math.max(2, Math.round(sourceHeight * scale));
    const ctx = canvas.getContext("2d");
    const captureStream = canvas.captureStream?.bind(canvas);
    if (!ctx || !captureStream) return false;

    const mix = document.createElement("video");
    mix.muted = true;
    mix.playsInline = true;
    mix.srcObject = new MediaStream(stream.getVideoTracks());
    void mix.play().catch(() => undefined);

    this.canvas = canvas;
    this.mixVideo = mix;

    const FADE_MS = 260;
    const drawCover = (source: CanvasImageSource, sw: number, sh: number) => {
      // Cover-fit so a lens with a different aspect never letterboxes the take.
      const scale = Math.max(canvas.width / sw, canvas.height / sh);
      const w = sw * scale;
      const h = sh * scale;
      ctx?.drawImage(source, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };

    const draw = () => {
      this.raf = requestAnimationFrame(draw);
      if (!ctx) return;
      const live = mix.videoWidth > 0 && mix.readyState >= 2 && !this.swapping;
      const held = this.freeze;

      // Lens is waking up: keep the last good frame on screen instead of black.
      if (!live) {
        if (held) drawCover(held, held.width, held.height);
        return;
      }

      // New lens is live: dissolve out of the held frame so the cut feels soft.
      const t = held && this.fadeFrom ? Math.min(1, (performance.now() - this.fadeFrom) / FADE_MS) : 1;
      if (held && t < 1) {
        drawCover(held, held.width, held.height);
        ctx.save();
        ctx.globalAlpha = t;
        drawCover(mix, mix.videoWidth, mix.videoHeight);
        ctx.restore();
        return;
      }
      if (held && t >= 1) {
        this.freeze = null;
        this.fadeFrom = 0;
      }
      drawCover(mix, mix.videoWidth, mix.videoHeight);
    };
    this.raf = requestAnimationFrame(draw);

    const composed = new MediaStream([
      ...captureStream(30).getVideoTracks(),
      ...stream.getAudioTracks(),
    ]);

    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(composed, {
        ...(this.mime ? { mimeType: this.mime } : {}),
        videoBitsPerSecond: VIDEO_BITRATE,
        audioBitsPerSecond: AUDIO_BITRATE,
      });
    } catch {
      try {
        rec = new MediaRecorder(composed);
      } catch {
        composed.getVideoTracks().forEach((track) => track.stop());
        this.teardownMixer();
        return false;
      }
    }
    this.chunks = [];
    rec.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    rec.onstop = () => {
      const blob = new Blob(this.chunks, { type: rec.mimeType || this.mime || "video/webm" });
      this.chunks = [];
      composed.getVideoTracks().forEach((track) => track.stop());
      onStop(blob);
    };
    this.recorder = rec;
    rec.start(500);
    return true;
  }

  pause() {
    if (this.recorder?.state === "recording") this.recorder.pause();
  }

  resume() {
    if (this.recorder?.state === "paused") this.recorder.resume();
  }

  private teardownMixer() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.mixVideo) {
      this.mixVideo.srcObject = null;
      this.mixVideo = null;
    }
    this.canvas = null;
    this.freeze = null;
    this.fadeFrom = 0;
    this.swapping = false;
  }

  stopRecording() {
    if (this.recorder && this.recorder.state !== "inactive") this.recorder.stop();
    this.recorder = null;
    this.teardownMixer();
  }

  stop() {
    this.stopRecording();
    this.stream?.getTracks().forEach((t) => t.stop());
    this.audioStream?.getTracks().forEach((t) => t.stop());
    this.audioStream = null;
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
        body: "GoHeet needs your camera and microphone to record a moment. Turn them on in your device settings, then come back.",
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
