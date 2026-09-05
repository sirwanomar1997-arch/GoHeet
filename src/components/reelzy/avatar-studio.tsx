import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Sparkles, RefreshCw, Check, SwitchCamera, Dices } from "lucide-react";
import { saveAvatar } from "@/lib/reelzy.functions";
import { streamAvatar } from "@/lib/stream-avatar";
import { OptionVisual, type IconKey } from "@/components/reelzy/avatar-icons";


const STYLE_BASE =
  "Ultra-detailed glossy 3D animated character portrait in premium Pixar/Disney feature-film style, " +
  "head and shoulders, three-quarter view, warm friendly gaze straight into camera, " +
  "slightly stylized proportions with large expressive photoreal eyes, crisp catchlights and detailed irises, " +
  "soft subsurface-scattering skin with fine pores, peach fuzz and gentle blush on the cheeks and nose, " +
  "individually rendered glossy hair strands with soft flyaways, realistic cloth weave on the clothing, " +
  "soft cinematic studio key light from the upper left with warm rim light, " +
  "smooth vertical gradient studio backdrop, shallow depth of field, octane-quality 8k render, " +
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
  fabric: string;
  headwear: string;
  eyewear: string;
  makeup: string[];
  jewelry: string[];
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
  "Crisp white shirt",
  "Oversized hoodie",
  "Denim jacket",
  "Leather biker jacket",
  "Crewneck sweater",
  "Ribbed turtleneck",
  "Tank top",
  "Tailored blazer",
  "Graphic tee",
  "Flannel shirt",
  "Varsity jacket",
  "Puffer coat",
  "Trench coat",
  "Silk slip dress",
  "Satin blouse",
  "Linen shirt, open collar",
  "Knit cardigan",
  "Track jacket",
  "Utility jumpsuit",
  "Corduroy overshirt",
  "Wool peacoat",
  "Mesh layered top",
  "Embroidered jacket",
  "Kimono robe",
  "Kaftan",
  "Sherwani collar",
  "Traditional embroidered tunic",
  "Bare shoulders, minimal",
];
const FABRIC = [
  "Matte cotton",
  "Soft knit",
  "Washed denim",
  "Glossy leather",
  "Liquid satin",
  "Crushed velvet",
  "Technical nylon",
  "Airy linen",
  "Metallic sheen",
  "Chunky wool",
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
  "Chocolate",
  "Sage",
  "Electric blue",
  "Champagne gold",
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
  "Wide-brim hat",
  "Cowboy hat",
  "Durag",
  "Turban",
  "Hair clips",
  "Silk scarf tied back",
  "Headphones around neck",
];
const EYEWEAR = [
  "None",
  "Thin metal glasses",
  "Bold square frames",
  "Round wire glasses",
  "Cat-eye frames",
  "Aviator sunglasses",
  "Retro shades",
  "Sport visor shades",
  "Clear-frame glasses",
];
const MAKEUP = [
  "Natural glow",
  "Soft matte base",
  "Winged eyeliner",
  "Smoky eyes",
  "Bold red lip",
  "Nude gloss",
  "Berry lip",
  "Warm blush",
  "Highlighted cheekbones",
  "Shimmer eyelids",
  "Graphic liner",
  "Bronzed contour",
  "Glitter accents",
];
const JEWELRY = [
  "Hoop earrings",
  "Stud earrings",
  "Ear cuff",
  "Layered necklaces",
  "Chunky chain",
  "Pendant necklace",
  "Nose ring",
  "Septum ring",
  "Choker",
  "Statement rings",
  "Pearl set",
  "Gold bangles",
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
  "Cool slate",
  "Emerald haze",
  "Violet twilight",
  "Studio charcoal",
];
const EXTRA = [
  "Freckles",
  "Dimples",
  "Beauty spot",
  "Vitiligo",
  "Face tattoo",
  "Neck tattoo",
  "Scar detail",
  "Sun-kissed cheeks",
  "Sharp jaw shadow",
  "Blushed nose",
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

const some = (arr: readonly string[], chance: number, max: number) =>
  arr.filter(() => Math.random() < chance).slice(0, max);

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
    fabric: pick(FABRIC),
    headwear: pick(HEADWEAR),
    eyewear: pick(EYEWEAR),
    makeup: some(MAKEUP, 0.15, 3),
    jewelry: some(JEWELRY, 0.15, 3),
    background: pick(BACKGROUND),
    extras: some(EXTRA, 0.15, 2),
  };
}

function buildPrompt(t: Traits, pose: string, seed: number) {
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
    `wearing a ${t.outfitColor.toLowerCase()} ${t.outfit.toLowerCase()} in ${t.fabric.toLowerCase()}`,
    t.headwear !== "None" ? `wearing a ${t.headwear.toLowerCase()}` : "",
    t.eyewear !== "None" ? `wearing ${t.eyewear.toLowerCase()}` : "",
    t.makeup.length ? `makeup: ${t.makeup.join(", ").toLowerCase()}` : "",
    t.jewelry.length ? `jewellery: ${t.jewelry.join(", ").toLowerCase()}` : "",
    ...t.extras.map((e) => e.toLowerCase()),
  ].filter(Boolean);
  // The pose + variation seed stay fixed while the user is styling, so only the
  // thing they just tapped changes. Shuffle / Try another rolls a new one.
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

type SingleKey =
  | "age"
  | "skin"
  | "face"
  | "eyeColor"
  | "eyeShape"
  | "brows"
  | "nose"
  | "lips"
  | "ears"
  | "hair"
  | "hairColor"
  | "facialHair"
  | "expression"
  | "outfit"
  | "outfitColor"
  | "fabric"
  | "headwear"
  | "eyewear"
  | "background";
type MultiKey = "makeup" | "jewelry" | "extras";

type Group =
  | { kind: "single"; label: string; key: SingleKey; opts: readonly string[] }
  | { kind: "multi"; label: string; key: MultiKey; opts: readonly string[] };

const single = (label: string, key: SingleKey, opts: readonly string[]): Group => ({
  kind: "single",
  label,
  key,
  opts,
});
const multi = (label: string, key: MultiKey, opts: readonly string[]): Group => ({
  kind: "multi",
  label,
  key,
  opts,
});

const SECTIONS: { id: string; label: string; blurb: string; groups: Group[] }[] = [
  {
    id: "face",
    label: "Face",
    blurb: "Shape the features that make you, you.",
    groups: [
      single("Age", "age", AGE),
      single("Skin tone", "skin", SKIN),
      single("Face shape", "face", FACE),
      single("Eye colour", "eyeColor", EYE_COLOR),
      single("Eye shape", "eyeShape", EYE_SHAPE),
      single("Eyebrows", "brows", BROWS),
      single("Nose", "nose", NOSE),
      single("Lips", "lips", LIPS),
      single("Ears", "ears", EARS),
      single("Expression", "expression", EXPRESSION),
      multi("Details", "extras", EXTRA),
    ],
  },
  {
    id: "hair",
    label: "Hair",
    blurb: "Cut, colour and everything on your face.",
    groups: [
      single("Hairstyle", "hair", HAIR),
      single("Hair colour", "hairColor", HAIR_COLOR),
      single("Facial hair", "facialHair", FACIAL_HAIR),
    ],
  },
  {
    id: "wardrobe",
    label: "Wardrobe",
    blurb: "Pick the fit. New drops land here.",
    groups: [
      single("Outfit", "outfit", OUTFIT),
      single("Colour", "outfitColor", OUTFIT_COLOR),
      single("Fabric", "fabric", FABRIC),
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    blurb: "Headwear, frames and hardware.",
    groups: [
      single("Headwear", "headwear", HEADWEAR),
      single("Eyewear", "eyewear", EYEWEAR),
      multi("Jewellery", "jewelry", JEWELRY),
    ],
  },
  {
    id: "makeup",
    label: "Make-up",
    blurb: "Stack as many looks as you like.",
    groups: [multi("Make-up", "makeup", MAKEUP)],
  },
  {
    id: "scene",
    label: "Scene",
    blurb: "The light you stand in.",
    groups: [single("Backdrop", "background", BACKGROUND)],
  },
];


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
    outfit: "Oversized hoodie",
    outfitColor: "Black",
    fabric: "Soft knit",
    headwear: "None",
    eyewear: "None",
    makeup: [],
    jewelry: [],
    background: "Warm orange-pink glow",
    extras: [],
  });
  const [section, setSection] = useState("face");

  const [frame, setFrame] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  // Fixed pose + seed keep the character consistent between edits.
  const [look, setLook] = useState(() => ({ pose: pick(POSES), seed: Math.floor(Math.random() * 1_000_000) }));
  const runRef = useRef(0);


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

  const generate = useCallback(
    async (l: { pose: string; seed: number }, t: Traits, useSelfie: string | null) => {
      const run = ++runRef.current;
      setBusy(true);
      setIsFinal(false);
      try {
        const prompt = useSelfie ? SELFIE_PROMPT : buildPrompt(t, l.pose, l.seed);
        await streamAvatar(prompt, useSelfie, (url, final) => {
          if (runRef.current !== run) return;
          setFrame(url);
          if (final) setIsFinal(true);
        });
      } catch (e) {
        if (runRef.current === run) {
          toast.error(e instanceof Error ? e.message : "Couldn't create your avatar.");
        }
      } finally {
        if (runRef.current === run) setBusy(false);
      }
    },
    [],
  );

  // Every tap re-renders the real 3D avatar, so the user always sees the
  // finished look — never a flat sketch. Debounced so rapid taps collapse
  // into a single render.
  useEffect(() => {
    if (mode !== "build" || !traits.gender) return;
    const id = setTimeout(() => {
      void generate(look, traits, null);
    }, 700);
    return () => clearTimeout(id);
  }, [mode, traits, look, generate]);


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

  const Tile = ({
    group,
    value,
    active,
    onClick,
  }: {
    group: IconKey;
    value: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={value}
      aria-pressed={active}
      title={value}
      className={`w-[68px] shrink-0 rounded-2xl border p-1.5 transition-all ${
        active
          ? "border-primary bg-primary/10 text-primary shadow-[0_0_0_1px_hsl(var(--primary))]"
          : "border-border bg-surface text-foreground/70"
      }`}
    >
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-background/40">
        <OptionVisual group={group} value={value} />
      </div>
      <span className="mt-1 block truncate text-center text-[9px] font-medium text-muted-foreground">
        {value}
      </span>
    </button>
  );

  const buildReady = !!traits.gender;

  const edit = (fn: (t: Traits) => Traits) => setTraits(fn);


  return (
    <div className="mx-auto w-full max-w-sm">
      <div className="flex gap-2">
        <button type="button" onClick={() => { setMode("selfie"); setFrame(null); setIsFinal(false); }} className={chip(mode === "selfie")}>
          Snap a selfie
        </button>
        <button type="button" onClick={() => { setMode("build"); setFrame(null); setIsFinal(false); }} className={chip(mode === "build")}>
          Build it instead
        </button>
      </div>

      <div className="key-glow relative mt-6 aspect-[3/4] w-full overflow-hidden rounded-[32px] border border-border bg-surface">
        {frame ? (
          <img
            src={frame}
            alt="Your avatar"
            className={`size-full object-cover transition-[filter] duration-500 ${
              isFinal && !busy ? "blur-0" : "blur-xl"
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
        ) : buildReady ? (
          <div className="grid size-full animate-pulse place-items-center bg-gradient-to-b from-primary/25 to-background">
            <Sparkles className="size-8 text-primary" />
          </div>
        ) : (
          <div className="grid size-full place-items-center px-8 text-center">
            <p className="text-sm text-muted-foreground">
              Pick who you are below — your avatar is rendered here in full 3D, and re-renders with
              every single thing you tap.
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
            <div className="flex items-center justify-between">
              <p className="data-figure text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                You are
              </p>
              <button
                type="button"
                onClick={() => edit((t) => ({ ...randomTraits(), gender: t.gender || "Male" }))}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-semibold text-muted-foreground"
              >
                <Dices className="size-3.5" /> Shuffle
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              {GENDER.map((o) => (
                <Tile
                  key={o}
                  group="gender"
                  value={o}
                  active={traits.gender === o}
                  onClick={() => edit((t) => ({ ...t, gender: o }))}
                />
              ))}
            </div>

          </div>

          {buildReady ? (
            <>
              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSection(s.id)}
                    className={`shrink-0 rounded-2xl px-4 py-2 text-xs font-semibold transition-colors ${
                      section === s.id
                        ? "ember-fill text-primary-foreground"
                        : "border border-border bg-surface text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {SECTIONS.filter((s) => s.id === section).map((s) => (
                <div key={s.id} className="space-y-4 rounded-[28px] border border-border bg-surface/60 p-4">
                  <p className="text-xs text-muted-foreground">{s.blurb}</p>
                  {s.groups.map((g) => (
                    <div key={g.key}>
                      <p className="data-figure text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                        {g.label}
                        {g.kind === "multi" ? " — pick as many as you like" : ""}
                      </p>
                      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
                        {g.opts.map((o) =>
                          g.kind === "single" ? (
                            <Tile
                              key={o}
                              group={g.key as IconKey}
                              value={o}
                              active={traits[g.key] === o}
                              onClick={() => edit((t) => ({ ...t, [g.key]: o }))}
                            />
                          ) : (
                            <Tile
                              key={o}
                              group={g.key as IconKey}
                              value={o}
                              active={traits[g.key].includes(o)}
                              onClick={() =>
                                edit((t) => {
                                  const cur = t[g.key];
                                  return {
                                    ...t,
                                    [g.key]: cur.includes(o)
                                      ? cur.filter((e) => e !== o)
                                      : [...cur, o],
                                  };
                                })
                              }
                            />
                          ),
                        )}
                      </div>

                    </div>
                  ))}
                  {s.id === "wardrobe" || s.id === "accessories" ? (
                    <p className="text-[11px] text-muted-foreground">
                      Everything here is free. Limited drops arrive later.
                    </p>
                  ) : null}
                </div>
              ))}
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
        ) : mode === "build" ? (
          <button
            type="button"
            onClick={() =>
              setLook({ pose: pick(POSES), seed: Math.floor(Math.random() * 1_000_000) })
            }
            disabled={busy || !buildReady}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw className="size-4" />
            {busy ? "Rendering…" : "Try another take"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void generate(look, traits, selfie)}
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
            className="ember-fill flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-primary-foreground disabled:opacity-50"
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
