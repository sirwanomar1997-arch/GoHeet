import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Sparkles, RefreshCw, Check, SwitchCamera } from "lucide-react";
import { saveAvatar } from "@/lib/reelzy.functions";
import { streamAvatar } from "@/lib/stream-avatar";

const STYLE_BASE =
  "A single stylized 3D animated character portrait, head and shoulders, Pixar-quality soft-shaded render, " +
  "glossy skin with subtle subsurface scattering, big expressive eyes, warm friendly half-smile, " +
  "clean studio key light from the upper left, smooth warm amber-to-crimson gradient background, " +
  "no text, no watermark, no logo, centered, square composition, high detail.";

type Traits = {
  vibe: string;
  hair: string;
  skin: string;
  extra: string;
};

const VIBES = ["Warm", "Bold", "Playful", "Calm", "Sharp"];
const HAIR = ["Short dark", "Long wavy brown", "Curly black", "Blonde bob", "Buzz cut", "Bun"];
const SKIN = ["Fair", "Light olive", "Tan", "Brown", "Deep brown"];
const EXTRA = ["Glasses", "Beard", "Freckles", "Hoodie", "Earrings", "Cap"];

function buildPrompt(t: Traits) {
  const bits = [
    `${t.vibe.toLowerCase()} personality`,
    t.hair.toLowerCase() + " hair",
    t.skin.toLowerCase() + " skin tone",
    t.extra ? t.extra.toLowerCase() : "",
  ].filter(Boolean);
  return `${STYLE_BASE} The character has ${bits.join(", ")}.`;
}

const SELFIE_PROMPT =
  `${STYLE_BASE} Recreate the person in the reference photo as this stylized 3D character: ` +
  `keep their hair, skin tone, face shape, facial hair and glasses recognizable, but render them in the animated style.`;

export function AvatarStudio({
  onDone,
  onSkip,
}: {
  onDone: () => void;
  onSkip?: () => void;
}) {
  const qc = useQueryClient();
  const persist = useServerFn(saveAvatar);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<"selfie" | "build">("selfie");
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [selfie, setSelfie] = useState<string | null>(null);
  const [camError, setCamError] = useState<string | null>(null);
  const [traits, setTraits] = useState<Traits>({
    vibe: "Warm",
    hair: "Short dark",
    skin: "Tan",
    extra: "",
  });
  const [frame, setFrame] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startStream = useCallback(async () => {
    stopStream();
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = s;
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play().catch(() => undefined);
      }
      setCamError(null);
    } catch {
      setCamError("No camera access — build your avatar instead.");
    }
  }, [facing, stopStream]);

  useEffect(() => {
    if (mode !== "selfie" || selfie) {
      stopStream();
      return;
    }
    void startStream();
    return stopStream;
  }, [mode, selfie, startStream, stopStream]);

  function snap() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const size = Math.min(v.videoWidth, v.videoHeight);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, (v.videoWidth - size) / 2, (v.videoHeight - size) / 2, size, size, 0, 0, size, size);
    setSelfie(canvas.toDataURL("image/jpeg", 0.9));
    stopStream();
  }

  async function generate() {
    setBusy(true);
    setFrame(null);
    setIsFinal(false);
    try {
      const prompt = mode === "selfie" ? SELFIE_PROMPT : buildPrompt(traits);
      await streamAvatar(prompt, mode === "selfie" ? selfie : null, (url, final) => {
        setFrame(url);
        if (final) setIsFinal(true);
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't create your avatar.");
    } finally {
      setBusy(false);
    }
  }

  async function keep() {
    if (!frame) return;
    setSaving(true);
    try {
      await persist({ data: { dataUrl: frame } });
      await qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("That's you.");
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save your avatar.");
    } finally {
      setSaving(false);
    }
  }

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
      active
        ? "ember-fill text-primary-foreground"
        : "border border-border bg-surface text-muted-foreground"
    }`;

  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex gap-2">
        <button type="button" onClick={() => setMode("selfie")} className={chip(mode === "selfie")}>
          Snap a selfie
        </button>
        <button type="button" onClick={() => setMode("build")} className={chip(mode === "build")}>
          Build it instead
        </button>
      </div>

      <div className="key-glow relative mt-6 aspect-square w-full overflow-hidden rounded-[32px] border border-border bg-surface">
        {frame ? (
          <img
            src={frame}
            alt="Your avatar"
            className={`size-full object-cover transition-[filter] duration-500 ${
              isFinal ? "blur-0" : "blur-2xl"
            }`}
          />
        ) : mode === "selfie" && selfie ? (
          <img src={selfie} alt="Your selfie" className="size-full object-cover" />
        ) : mode === "selfie" ? (
          <video
            ref={videoRef}
            playsInline
            muted
            className={`size-full object-cover ${facing === "user" ? "-scale-x-100" : ""}`}
          />
        ) : (
          <div className="grid size-full place-items-center px-8 text-center">
            <p className="text-sm text-muted-foreground">
              Pick your look below, then press create — Reelzy renders a 3D you.
            </p>
          </div>
        )}

        {busy ? (
          <div className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-background/70 px-4 py-3 text-xs backdrop-blur">
            <Sparkles className="size-3.5 animate-pulse text-primary" />
            Rendering your avatar…
          </div>
        ) : null}

        {mode === "selfie" && !selfie && !frame && !camError ? (
          <button
            type="button"
            onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
            aria-label="Flip camera"
            className="absolute right-3 top-3 grid size-10 place-items-center rounded-full bg-background/60 backdrop-blur"
          >
            <SwitchCamera className="size-4" />
          </button>
        ) : null}
      </div>

      {camError && mode === "selfie" ? (
        <p className="mt-3 text-xs text-destructive">{camError}</p>
      ) : null}

      {mode === "build" ? (
        <div className="mt-5 space-y-4">
          {(
            [
              ["Vibe", VIBES, "vibe"],
              ["Hair", HAIR, "hair"],
              ["Skin", SKIN, "skin"],
            ] as const
          ).map(([label, opts, key]) => (
            <div key={key}>
              <p className="data-figure text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                {label}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {opts.map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setTraits((t) => ({ ...t, [key]: o }))}
                    className={chip(traits[key] === o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div>
            <p className="data-figure text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Detail
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {EXTRA.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setTraits((t) => ({ ...t, extra: t.extra === o ? "" : o }))}
                  className={chip(traits.extra === o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {mode === "selfie" && !selfie ? (
          <button
            type="button"
            onClick={snap}
            disabled={!!camError}
            className="ember-fill flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-primary-foreground disabled:opacity-40"
          >
            <Camera className="size-4" /> Take the shot
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void generate()}
            disabled={busy}
            className="ember-fill flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {frame ? <RefreshCw className="size-4" /> : <Sparkles className="size-4" />}
            {busy ? "Creating…" : frame ? "Try another" : "Create my avatar"}
          </button>
        )}

        {frame && isFinal ? (
          <button
            type="button"
            onClick={() => void keep()}
            disabled={saving}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold disabled:opacity-50"
          >
            <Check className="size-4" /> {saving ? "Saving…" : "This is me"}
          </button>
        ) : null}

        {mode === "selfie" && selfie && !busy ? (
          <button
            type="button"
            onClick={() => {
              setSelfie(null);
              setFrame(null);
            }}
            className="w-full text-center text-xs text-muted-foreground underline"
          >
            Retake the selfie
          </button>
        ) : null}

        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="w-full text-center text-xs text-muted-foreground underline"
          >
            Skip for now
          </button>
        ) : null}
      </div>
    </div>
  );
}
