import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Camera, Check, Dices, RefreshCw, Sparkles, SwitchCamera, X } from "lucide-react";
import { saveAvatar } from "@/lib/reelzy.functions";
import { streamAvatar } from "@/lib/stream-avatar";
import {
  AvatarArt,
  BACKDROPS,
  BROWS,
  EARS,
  EXPRESSIONS,
  EYE_COLORS,
  EYE_SHAPES,
  EYEWEAR,
  FACE_SHAPES,
  FACIAL_HAIR,
  HAIR_COLORS,
  HAIR_FEMALE,
  HAIR_MALE,
  HEADWEAR_FEMALE,
  HEADWEAR_MALE,
  LIPS,
  NOSES,
  OUTFIT_COLORS,
  OUTFITS_FEMALE,
  OUTFITS_MALE,
  SKINS,
  type Traits,
} from "@/components/reelzy/avatar-art";

/* ------------------------------------------------------------------ */
/* Prompt                                                              */
/* ------------------------------------------------------------------ */

const STYLE_BASE =
  "Ultra-detailed glossy 3D animated character portrait in premium Pixar/Disney feature-film style: " +
  "head-and-shoulders close-up, slight three-quarter turn, warm friendly gaze into camera, " +
  "big glossy photoreal eyes with crisp catchlights and detailed irises, " +
  "soft subsurface-scattering skin with fine pores, peach fuzz and gentle blush on cheeks and nose, " +
  "individually rendered glossy hair strands with soft flyaways, realistic cloth weave, " +
  "soft cinematic studio key light from the upper left with a warm rim light, shallow depth of field, " +
  "octane-quality 8k render, vertical portrait with the WHOLE head, complete hairstyle and any headwear " +
  "fully inside the frame with generous margin above the hair, shoulders visible, nothing cropped, " +
  "no text, no watermark, no logo.";

const AGES = ["Teen", "20s", "30s", "40s", "50s", "60+"] as const;

const AGE_LOOK: Record<string, string> = {
  Teen: "16 to 18 years old, fresh youthful face, completely smooth skin, no wrinkles, no grey hair",
  "20s": "about 25 years old, smooth taut skin, no wrinkles, no grey hair",
  "30s": "about 32 years old, youthful adult, smooth firm skin, no wrinkles, no grey hair",
  "40s": "about 44 years old, only very faint smile lines, barely any grey",
  "50s": "about 55 years old, light natural wrinkles, a little grey at the temples",
  "60+": "about 66 years old, silver hair and gentle natural wrinkles",
};

function buildPrompt(t: Traits, seed: number) {
  const female = t.gender === "Female";
  const bits = [
    female
      ? `beautiful feminine woman character with soft delicate features, ${AGE_LOOK[t.age] ?? ""}`
      : `masculine man character, ${AGE_LOOK[t.age] ?? ""}`,
    `${t.skin.toLowerCase()} skin tone`,
    `${t.face.toLowerCase()} face shape`,
    `${t.eyeShape.toLowerCase()} ${t.eyeColor.toLowerCase()} eyes`,
    `${t.brows.toLowerCase()} eyebrows`,
    `${t.nose.toLowerCase()} nose`,
    `${t.lips.toLowerCase()} lips`,
    `${t.ears.toLowerCase()} ears`,
    t.hair === "Bald" ? "bald head" : `${t.hair.toLowerCase()} ${t.hairColor.toLowerCase()} hair`,
    female ? "" : t.facialHair === "Clean shaven" ? "clean shaven" : t.facialHair.toLowerCase(),
    `${t.expression.toLowerCase()} expression`,
    `wearing a ${t.outfitColor.toLowerCase()} ${t.outfit.toLowerCase()}`,
    t.headwear !== "None" ? `wearing a ${t.headwear.toLowerCase()}` : "",
    t.eyewear !== "None" ? `wearing ${t.eyewear.toLowerCase()}` : "",
  ].filter(Boolean);
  return (
    `${STYLE_BASE} Smooth ${t.backdrop.toLowerCase()} gradient studio backdrop. ` +
    `The character is a ${bits.join(", ")}. Variation #${seed}.`
  );
}

const SELFIE_PROMPT =
  `${STYLE_BASE} Recreate the exact person in the reference photo as this stylized 3D character: ` +
  "keep their face shape, skin tone, eye colour and shape, nose, lips, hairstyle, hair colour, " +
  "facial hair and glasses clearly recognisable — unmistakably the same person, only rendered in the animated film style. " +
  "Smooth warm orange-to-pink gradient studio backdrop.";

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

type Key = keyof Traits;

type Row = { label: string; key: Key; opts: readonly string[]; zoom: "head" | "face" | "bust" };

const row = (label: string, key: Key, opts: readonly string[], zoom: Row["zoom"] = "head"): Row => ({
  label,
  key,
  opts,
  zoom,
});

function stepsFor(gender: string) {
  const female = gender === "Female";
  return [
    {
      id: "you",
      title: "The basics",
      blurb: "Skin and age set the whole tone.",
      rows: [
        row("Skin tone", "skin", SKINS.map((s) => s.name)),
        row("Age", "age", AGES),
      ],
    },
    {
      id: "face",
      title: "Your face",
      blurb: "Every tile is your avatar with that one feature changed.",
      rows: [
        row("Face shape", "face", FACE_SHAPES),
        row("Eye shape", "eyeShape", EYE_SHAPES, "face"),
        row("Eye colour", "eyeColor", EYE_COLORS.map((c) => c.name), "face"),
        row("Eyebrows", "brows", BROWS, "face"),
        row("Nose", "nose", NOSES, "face"),
        row("Lips", "lips", LIPS, "face"),
        row("Ears", "ears", EARS),
      ],
    },
    {
      id: "hair",
      title: "Hair",
      blurb: female ? "Cut and colour." : "Cut, colour and beard.",
      rows: [
        row("Hairstyle", "hair", female ? HAIR_FEMALE : HAIR_MALE),
        row("Hair colour", "hairColor", HAIR_COLORS.map((c) => c.name)),
        ...(female ? [] : [row("Facial hair", "facialHair", FACIAL_HAIR)]),
      ],
    },
    {
      id: "wear",
      title: "What you wear",
      blurb: "Your everyday fit.",
      rows: [
        row("Outfit", "outfit", female ? OUTFITS_FEMALE : OUTFITS_MALE, "bust"),
        row("Colour", "outfitColor", OUTFIT_COLORS.map((c) => c.name), "bust"),
      ],
    },
    {
      id: "extras",
      title: "Finishing touches",
      blurb: "Accessories, mood and the light you stand in.",
      rows: [
        row("Eyewear", "eyewear", EYEWEAR, "face"),
        row("Headwear", "headwear", female ? HEADWEAR_FEMALE : HEADWEAR_MALE),
        row("Expression", "expression", EXPRESSIONS, "face"),
        row("Backdrop", "backdrop", BACKDROPS.map((b) => b.name)),
      ],
    },
  ];
}

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]!;

function defaults(gender: "Male" | "Female"): Traits {
  const female = gender === "Female";
  return {
    gender,
    age: "20s",
    skin: "Light olive",
    face: "Oval",
    eyeColor: "Dark brown",
    eyeShape: "Almond",
    brows: "Soft arched",
    nose: "Straight",
    lips: female ? "Full" : "Medium",
    ears: "Medium",
    hair: female ? "Long waves" : "Short crop",
    hairColor: "Dark brown",
    facialHair: female ? "Clean shaven" : "Light stubble",
    expression: "Warm half-smile",
    outfit: female ? "Knit sweater" : "Hoodie",
    outfitColor: female ? "Dusty pink" : "Black",
    eyewear: "None",
    headwear: "None",
    backdrop: "Warm orange-pink glow",
  };
}

function randomTraits(gender: "Male" | "Female"): Traits {
  const female = gender === "Female";
  return {
    ...defaults(gender),
    age: pick(AGES),
    skin: pick(SKINS).name,
    face: pick(FACE_SHAPES),
    eyeColor: pick(EYE_COLORS).name,
    eyeShape: pick(EYE_SHAPES),
    brows: pick(BROWS),
    nose: pick(NOSES),
    lips: pick(LIPS),
    ears: pick(EARS),
    hair: pick(female ? HAIR_FEMALE : HAIR_MALE),
    hairColor: pick(HAIR_COLORS).name,
    facialHair: female ? "Clean shaven" : pick(FACIAL_HAIR),
    expression: pick(EXPRESSIONS),
    outfit: pick(female ? OUTFITS_FEMALE : OUTFITS_MALE),
    outfitColor: pick(OUTFIT_COLORS).name,
    backdrop: pick(BACKDROPS).name,
  };
}

/* ------------------------------------------------------------------ */
/* Studio                                                              */
/* ------------------------------------------------------------------ */

export function AvatarStudio({ onDone, onSkip }: { onDone: () => void; onSkip?: () => void }) {
  const qc = useQueryClient();
  const persist = useServerFn(saveAvatar);

  const [traits, setTraits] = useState<Traits>({ ...defaults("Male"), gender: "" });
  const [stage, setStage] = useState<"gender" | "build" | "render">("gender");
  const [stepIndex, setStepIndex] = useState(0);

  const [selfie, setSelfie] = useState<string | null>(null);
  const [selfieOpen, setSelfieOpen] = useState(false);

  const [frame, setFrame] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const runRef = useRef(0);

  const steps = useMemo(() => stepsFor(traits.gender), [traits.gender]);
  const step = steps[Math.min(stepIndex, steps.length - 1)]!;

  const set = (key: Key, value: string) => setTraits((t) => ({ ...t, [key]: value }));

  const generate = useCallback(async (prompt: string, reference: string | null) => {
    const run = ++runRef.current;
    setBusy(true);
    setIsFinal(false);
    setFrame(null);
    try {
      await streamAvatar(prompt, reference, (url, final) => {
        if (runRef.current !== run) return;
        setFrame(url);
        if (final) setIsFinal(true);
      });
    } catch (e) {
      if (runRef.current === run) toast.error(e instanceof Error ? e.message : "Couldn't create your avatar.");
    } finally {
      if (runRef.current === run) setBusy(false);
    }
  }, []);

  function renderIt(fromSelfie: string | null) {
    setStage("render");
    void generate(
      fromSelfie ? SELFIE_PROMPT : buildPrompt(traits, Math.floor(Math.random() * 1_000_000)),
      fromSelfie,
    );
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

  /* ---------------- gender ---------------- */

  if (stage === "gender") {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {(["Male", "Female"] as const).map((g) => {
            const preview = defaults(g);
            return (
              <button
                key={g}
                type="button"
                onClick={() => {
                  setTraits(defaults(g));
                  setStepIndex(0);
                  setStage("build");
                }}
                className="overflow-hidden rounded-3xl border border-border bg-surface text-left transition-transform active:scale-[0.98]"
              >
                <AvatarArt traits={preview} className="aspect-[3/4] w-full" />
                <span className="block px-4 py-3 font-display text-sm font-bold">{g}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => setSelfieOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface py-3 text-sm font-semibold"
        >
          <Camera className="size-4" /> Start from a selfie instead
        </button>
        {onSkip ? (
          <button type="button" onClick={onSkip} className="w-full text-xs text-muted-foreground underline">
            Skip for now
          </button>
        ) : null}
        {selfieOpen ? (
          <SelfieSheet
            onClose={() => setSelfieOpen(false)}
            onShot={(url) => {
              setSelfie(url);
              setSelfieOpen(false);
              renderIt(url);
            }}
          />
        ) : null}
      </div>
    );
  }

  /* ---------------- render ---------------- */

  if (stage === "render") {
    return (
      <div className="space-y-5">
        <div className="relative overflow-hidden rounded-[2rem] border border-border bg-surface">
          {frame ? (
            <img
              src={frame}
              alt="Your Reelzy avatar"
              className={`aspect-[3/4] w-full object-cover transition-[filter] duration-500 ${
                isFinal ? "blur-0" : "blur-xl"
              }`}
            />
          ) : (
            <div className="grid aspect-[3/4] w-full place-items-center">
              <AvatarArt traits={traits} className="h-full w-full opacity-40" />
            </div>
          )}
          {busy ? (
            <span className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-xs font-semibold backdrop-blur">
              <Sparkles className="size-3.5 animate-pulse text-primary" /> Rendering the 3D you…
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => renderIt(selfie)}
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-surface py-3 text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw className="size-4" /> Try another
          </button>
          <button
            type="button"
            disabled={!isFinal || saving}
            onClick={() => void keep()}
            className="ember-fill flex items-center justify-center gap-2 rounded-full py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Check className="size-4" /> This is me
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelfie(null);
            setStage(traits.gender ? "build" : "gender");
          }}
          className="w-full text-xs text-muted-foreground underline"
        >
          Back to styling
        </button>
      </div>
    );
  }

  /* ---------------- build ---------------- */

  const last = stepIndex === steps.length - 1;

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mx-1 rounded-[2rem] bg-background/85 px-1 pb-3 pt-1 backdrop-blur">
        <div className="overflow-hidden rounded-[1.75rem] border border-border">
          <AvatarArt traits={traits} className="aspect-[4/3] w-full" />
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {steps.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStepIndex(i)}
              aria-label={s.title}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= stepIndex ? "ember-fill" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-xl font-extrabold tracking-[-0.03em]">{step.title}</h2>
        <p className="text-sm text-muted-foreground">{step.blurb}</p>
      </div>

      <div className="space-y-5">
        {step.rows.map((r) => (
          <div key={r.key}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                {r.label}
              </h3>
              <span className="text-[11px] text-muted-foreground">{String(traits[r.key])}</span>
            </div>
            <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
              {r.opts.map((opt) => {
                const active = traits[r.key] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    title={opt}
                    aria-label={opt}
                    aria-pressed={active}
                    onClick={() => set(r.key, opt)}
                    className={`w-[78px] shrink-0 overflow-hidden rounded-2xl border-2 transition-transform active:scale-95 ${
                      active ? "border-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_25%,transparent)]" : "border-border"
                    }`}
                  >
                    <AvatarArt
                      traits={{ ...traits, [r.key]: opt } as Traits}
                      zoom={r.zoom}
                      className="aspect-square w-full"
                    />
                    <span className="block truncate bg-surface px-1.5 py-1 text-[10px] font-semibold">
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() =>
            stepIndex === 0 ? setStage("gender") : setStepIndex((i) => Math.max(0, i - 1))
          }
          className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-surface"
          aria-label="Back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <button
          type="button"
          onClick={() => setTraits(randomTraits(traits.gender === "Female" ? "Female" : "Male"))}
          className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-surface"
          aria-label="Surprise me"
        >
          <Dices className="size-5" />
        </button>
        {last ? (
          <button
            type="button"
            onClick={() => renderIt(null)}
            className="ember-fill flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-primary-foreground"
          >
            <Sparkles className="size-4" /> Create my avatar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStepIndex((i) => i + 1)}
            className="ember-fill flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-primary-foreground"
          >
            Next <ArrowRight className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Selfie                                                              */
/* ------------------------------------------------------------------ */

function SelfieSheet({ onClose, onShot }: { onClose: () => void; onShot: (dataUrl: string) => void }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const start = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1080 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play().catch(() => undefined);
        }
        setError(null);
      } catch {
        setError("No camera access — build your avatar instead.");
      }
    };
    void start();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facing]);

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
    streamRef.current?.getTracks().forEach((t) => t.stop());
    onShot(canvas.toDataURL("image/jpeg", 0.9));
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background/95 p-5 backdrop-blur">
      <button type="button" onClick={onClose} className="self-end rounded-full border border-border p-2" aria-label="Close">
        <X className="size-5" />
      </button>
      <div className="mt-4 flex-1 overflow-hidden rounded-[2rem] border border-border bg-black">
        <video ref={videoRef} playsInline muted className="size-full object-cover" />
      </div>
      {error ? <p className="mt-3 text-center text-sm text-muted-foreground">{error}</p> : null}
      <div className="mt-5 flex items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          className="grid size-12 place-items-center rounded-full border border-border bg-surface"
          aria-label="Flip camera"
        >
          <SwitchCamera className="size-5" />
        </button>
        <button
          type="button"
          onClick={snap}
          className="ember-fill size-20 rounded-full shadow-[0_10px_30px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
          aria-label="Take selfie"
        />
      </div>
    </div>
  );
}
