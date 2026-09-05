import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Sparkles, RefreshCw, Check, SwitchCamera } from "lucide-react";
import { saveAvatar } from "@/lib/reelzy.functions";
import { streamAvatar } from "@/lib/stream-avatar";

const STYLE_BASE =
  "Ultra-detailed glossy 3D animated character portrait in premium Pixar/Disney feature-film style, " +
  "head and shoulders, three-quarter view, looking at camera, warm friendly closed-mouth half-smile, " +
  "large expressive photoreal eyes with crisp catchlights, soft subsurface-scattering skin with fine pores and peach fuzz, " +
  "individually rendered hair strands, soft cinematic studio key light from the upper left with gentle rim light, " +
  "smooth warm orange-to-pink gradient studio background, shallow depth of field, octane-quality render, " +
  "vertical portrait composition, no text, no watermark, no logo.";

type Traits = {
  gender: string;
  age: string;
  skin: string;
  face: string;
  eyeColor: string;
  eyeShape: string;
  brows: string;
  nose: string;
  lips: string;
  ears: string;
  hair: string;
  hairColor: string;
  facialHair: string;
  expression: string;
  outfit: string;
  outfitColor: string;
  headwear: string;
  background: string;
  extras: string[];
};

const GENDER = ["Male", "Female", "Non-binary"];
const AGE = ["Teen", "20s", "30s", "40s", "50s", "60+"];
const SKIN = ["Porcelain", "Fair", "Light olive", "Golden tan", "Warm brown", "Deep brown", "Ebony"];
const FACE = ["Oval", "Round", "Square jaw", "Heart", "Long", "Sharp cheekbones"];
const EYE_COLOR = ["Dark brown", "Hazel", "Amber", "Green", "Blue", "Grey"];
const EYE_SHAPE = ["Almond", "Round", "Wide-set", "Hooded", "Monolid", "Upturned"];
const BROWS = ["Soft arched", "Straight", "Thick bold", "Thin", "Bushy"];
const NOSE = ["Small button", "Straight", "Narrow", "Wide", "Roman bridge", "Upturned"];
const LIPS = ["Thin", "Medium", "Full", "Wide smile"];
const EARS = ["Small", "Medium", "Large", "Slightly protruding", "Pointed lobes"];
const HAIR = [
  "Short swept-back",
  "Buzz cut",
  "Crew cut",
  "Messy short",
  "Curly afro",
  "Coily",
  "Shoulder-length wavy",
  "Long straight",
  "Long wavy",
  "Braids",
  "Cornrows",
  "Locs",
  "Top knot",
  "Bob",
  "Pixie cut",
  "Ponytail",
  "Side part",
  "Shaved sides",
  "Bald",
  "Hijab",
];
const HAIR_COLOR = [
  "Jet black",
  "Dark brown",
  "Chestnut",
  "Auburn",
  "Blonde",
  "Platinum",
  "Salt & pepper",
  "Ginger",
  "Pastel pink",
  "Teal",
];
const FACIAL_HAIR = ["Clean shaven", "Stubble", "Short beard", "Full beard", "Moustache", "Goatee"];
const EXPRESSION = [
  "Warm half-smile",
  "Big joyful grin",
  "Calm and confident",
  "Playful smirk",
  "Thoughtful",
  "Surprised delight",
];
const OUTFIT = [
  "White shirt",
  "Hoodie",
  "Denim jacket",
  "Leather jacket",
  "Crewneck sweater",
  "Turtleneck",
  "Tank top",
  "Blazer",
  "Graphic tee",
  "Flannel shirt",
];
const OUTFIT_COLOR = [
  "Black",
  "White",
  "Cream",
  "Charcoal",
  "Burnt orange",
  "Crimson",
  "Mustard",
  "Forest green",
  "Navy",
  "Dusty pink",
  "Lavender",
  "Teal",
];
const HEADWEAR = [
  "None",
  "Cap",
  "Beanie",
  "Bucket hat",
  "Headband",
  "Bandana",
  "Beret",
  "Headscarf",
];
const BACKGROUND = [
  "Warm orange-pink glow",
  "Deep amber",
  "Crimson dusk",
  "Peach sunrise",
  "Soft sand",
  "Midnight ember",
  "Rose gold",
  "Golden hour",
];
const EXTRA = [
  "Glasses",
  "Sunglasses",
  "Freckles",
  "Dimples",
  "Hoop earrings",
  "Stud earrings",
  "Nose ring",
  "Necklace",
  "Beauty spot",
  "Vitiligo",
];

const POSES = [
  "chin tilted slightly up",
  "head turned a touch to the left",
  "head turned a touch to the right",
  "relaxed straight-on pose",
  "slight lean toward camera",
  "shoulders angled softly",
];

const pick = <T,>(arr: readonly T[]) => arr[Math.floor(Math.random() * arr.length)]!;

function randomTraits(): Traits {
  return {
    gender: pick(["Male", "Female", "Non-binary"]),
    age: pick(AGE),
    skin: pick(SKIN),
    face: pick(FACE),
    eyeColor: pick(EYE_COLOR),
    eyeShape: pick(EYE_SHAPE),
    brows: pick(BROWS),
    nose: pick(NOSE),
    lips: pick(LIPS),
    ears: pick(EARS),
    hair: pick(HAIR),
    hairColor: pick(HAIR_COLOR),
    facialHair: pick(FACIAL_HAIR),
    expression: pick(EXPRESSION),
    outfit: pick(OUTFIT),
    outfitColor: pick(OUTFIT_COLOR),
    headwear: pick(HEADWEAR),
    background: pick(BACKGROUND),
    extras: EXTRA.filter(() => Math.random() < 0.18).slice(0, 2),
  };
}

function buildPrompt(t: Traits) {
  const bits = [
    `${t.age.toLowerCase()} ${t.gender.toLowerCase()} character`,
    `${t.skin.toLowerCase()} skin tone`,
    `${t.face.toLowerCase()} face shape`,
    `${t.eyeShape.toLowerCase()} ${t.eyeColor.toLowerCase()} eyes`,
    `${t.brows.toLowerCase()} eyebrows`,
    `${t.nose.toLowerCase()} nose`,
    `${t.lips.toLowerCase()} lips`,
    `${t.ears.toLowerCase()} ears`,
    `${t.hair.toLowerCase()} ${t.hairColor.toLowerCase()} hair`,
    t.facialHair === "Clean shaven" ? "clean shaven" : t.facialHair.toLowerCase(),
    `${t.expression.toLowerCase()} expression`,
    `wearing a ${t.outfitColor.toLowerCase()} ${t.outfit.toLowerCase()}`,
    t.headwear !== "None" ? `wearing a ${t.headwear.toLowerCase()}` : "",
    ...t.extras.map((e) => e.toLowerCase()),
  ].filter(Boolean);
  // A unique pose + variation seed keeps every single render one of a kind,
  // even when two people pick identical options.
  const pose = pick(POSES);
  const seed = Math.floor(Math.random() * 1_000_000);
  return (
    `${STYLE_BASE} Studio background: ${t.background.toLowerCase()}. ` +
    `The character is a ${bits.join(", ")}, ${pose}. Unique variation #${seed}.`
  );
}

const SELFIE_PROMPT =
  `${STYLE_BASE} Recreate the exact person in the reference photo as this stylized 3D character: ` +
  `keep their face shape, skin tone, eye colour and shape, nose, lips, ears, hairstyle, hair colour, ` +
  `facial hair and glasses clearly recognizable — it must look unmistakably like the same person, ` +
  `only rendered in the animated film style.`;

const GROUPS = [
  ["Skin tone", SKIN, "skin"],
  ["Face shape", FACE, "face"],
  ["Eye colour", EYE_COLOR, "eyeColor"],
  ["Eye shape", EYE_SHAPE, "eyeShape"],
  ["Eyebrows", BROWS, "brows"],
  ["Nose", NOSE, "nose"],
  ["Lips", LIPS, "lips"],
  ["Ears", EARS, "ears"],
  ["Hair", HAIR, "hair"],
  ["Hair colour", HAIR_COLOR, "hairColor"],
  ["Facial hair", FACIAL_HAIR, "facialHair"],
  ["Expression", EXPRESSION, "expression"],
  ["Outfit", OUTFIT, "outfit"],
  ["Outfit colour", OUTFIT_COLOR, "outfitColor"],
  ["Headwear", HEADWEAR, "headwear"],
  ["Background", BACKGROUND, "background"],
] as const;

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
    gender: "",
    age: "20s",
    skin: "Light olive",
    face: "Oval",
    eyeColor: "Dark brown",
    eyeShape: "Almond",
    brows: "Soft arched",
    nose: "Straight",
    lips: "Medium",
    ears: "Medium",
    hair: "Short swept-back",
    hairColor: "Dark brown",
    facialHair: "Clean shaven",
    expression: "Warm half-smile",
    outfit: "Hoodie",
    outfitColor: "Black",
    headwear: "None",
    background: "Warm orange-pink glow",
    extras: [],
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

  const buildReady = !!traits.gender;

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

      <div className="key-glow relative mt-6 aspect-[3/4] w-full overflow-hidden rounded-[32px] border border-border bg-surface">
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
              {buildReady
                ? "Fine-tune every feature below, then press create — Reelzy renders the 3D you."
                : "Start by choosing who you are, then shape every feature."}
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
          <div>
            <p className="data-figure text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              You are
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {GENDER.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setTraits((t) => ({ ...t, gender: o }))}
                  className={chip(traits.gender === o)}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>

          {buildReady ? (
            <>
              <div>
                <p className="data-figure text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  Age
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {AGE.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => setTraits((t) => ({ ...t, age: o }))}
                      className={chip(traits.age === o)}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>

              {GROUPS.map(([label, opts, key]) => (
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
            </>
          ) : null}
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
            disabled={busy || (mode === "build" && !buildReady)}
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
