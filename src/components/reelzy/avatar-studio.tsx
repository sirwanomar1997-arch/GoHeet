import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Camera, RefreshCw, Sparkles, SwitchCamera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveAvatar } from "@/lib/reelzy.functions";
import { useMe } from "@/lib/use-me";
import { streamAvatar } from "@/lib/stream-avatar";
import {
  accessoriesFor,
  BASE_AVATARS,
  BEARDS,
  EYE_COLORS,
  HAIR_COLORS,
  OUTFIT_COLORS,
  WRINKLES,
  SKINS,
  STYLE_REFERENCE,
  defaultTraits,
  hairFor,
  outfitsFor,
  piercingsFor,
  type Pic,
  type Sheet,
  type Swatch,
  type Traits,
} from "@/components/reelzy/avatar-catalog";


/* ------------------------------------------------------------------ */
/* Prompt                                                              */
/* ------------------------------------------------------------------ */

const STYLE_BASE =
  "Glossy semi-realistic 3D cartoon avatar portrait, exactly the art style of the style reference sheet: " +
  "friendly head-and-shoulders bust facing the camera with a warm natural smile, smooth soft-shaded skin, " +
  "large expressive eyes with crisp catchlights, sculpted hair with clear strand texture, " +
  "believable everyday clothing with visible fabric detail, soft even studio lighting, " +
  "clean pure white background, the whole head, hairstyle and any headwear fully inside the frame " +
  "with margin above the hair, shoulders and upper chest visible, nothing cropped, " +
  "no text, no watermark, no logo.";

function describe(t: Traits) {
  const bits = [
    t.gender === "Female" ? "female character" : "male character",
    `${t.skin.toLowerCase()} skin tone`,
    `${t.eyeColor.toLowerCase()} eyes`,
    t.hair.includes("bald") ? "bald head" : `${t.hair} hairstyle in ${t.hairColor.toLowerCase()}`,
    t.wrinkles.startsWith("smooth skin")
      ? "smooth youthful skin with no wrinkles"
      : `visibly aged skin with ${t.wrinkles}`,
    t.gender === "Female" || t.beard === "clean shaven" ? "clean shaven face" : `${t.beard} facial hair`,
    t.piercing === "no piercings" ? "no piercings at all" : `wearing a ${t.piercing}`,

    t.outfitColor && t.outfitColor !== "As shown"
      ? `wearing a ${t.outfit} recoloured entirely in ${t.outfitColor.toLowerCase()}`
      : `wearing a ${t.outfit}`,
    t.accessories.length ? `wearing ${t.accessories.join(" and ")}` : "no accessories at all",
  ];
  return bits.join(", ");
}

const buildPrompt = (t: Traits, seed: number) =>
  `${STYLE_BASE} Copy the art style of the reference image exactly; do not copy any face from it. ` +
  `The character is a ${describe(t)}. Character seed #${seed}.`;

function changeLabels(prev: Traits, next: Traits): string[] {
  const out: string[] = [];
  if (prev.skin !== next.skin) out.push(`skin tone is now ${next.skin.toLowerCase()}`);
  if (prev.eyeColor !== next.eyeColor) out.push(`eye colour is now ${next.eyeColor.toLowerCase()}`);
  if (prev.hair !== next.hair)
    out.push(next.hair.includes("bald") ? "completely bald, no hair at all" : `hairstyle is now ${next.hair}`);
  if (prev.hairColor !== next.hairColor) out.push(`hair colour is now ${next.hairColor.toLowerCase()}`);
  if (prev.wrinkles !== next.wrinkles)
    out.push(
      next.wrinkles.startsWith("smooth skin")
        ? "skin is now smooth and youthful, all wrinkles removed"
        : `skin is now visibly aged with ${next.wrinkles}, clearly visible`,
    );
  if (prev.beard !== next.beard)
    out.push(
      next.beard === "clean shaven"
        ? "face is now clean shaven, all facial hair removed"
        : `facial hair is now a ${next.beard}, clearly visible`,
    );
  if (prev.piercing !== next.piercing)
    out.push(
      next.piercing === "no piercings"
        ? "all piercings removed from the face and ears"
        : `now wearing a ${next.piercing}, clearly visible`,

    );
  if (prev.outfit !== next.outfit) out.push(`clothing is now a ${next.outfit}`);
  if (prev.outfitColor !== next.outfitColor)
    out.push(
      next.outfitColor === "As shown"
        ? "the clothing keeps its own original colours"
        : `the entire outfit is now ${next.outfitColor.toLowerCase()} in colour, recolour every part of the clothing`,
    );
  if (prev.accessories.join("|") !== next.accessories.join("|")) {
    out.push(
      next.accessories.length
        ? `wearing exactly these accessories and no others: ${next.accessories.join(", ")}`
        : "no accessories at all, remove every hat, scarf, glasses and jewellery",
    );
  }
  return out;
}

const buildEditPrompt = (t: Traits, changes: string[]) =>
  `${STYLE_BASE} Keep the exact same character identity from the reference image. ` +
  (changes.length
    ? `APPLY THESE CHANGES AND MAKE THEM CLEARLY VISIBLE: ${changes.join("; ")}. ` +
      "These changes are mandatory and must be obvious in the result. "
    : "") +
  `The finished character is a ${describe(t)}. ` +
  "Everything not listed above stays identical to the reference.";

const FOCUS_RULES: Record<string, string> = {
  hair:
    "The second reference image is the exact hairstyle the user picked. Reproduce that hairstyle one-to-one: " +
    "the same silhouette and outline, the same length (do not shorten or lengthen it), the same parting and fringe, " +
    "the same volume, the same curl or wave pattern, the same layering, the same way it falls around the face, " +
    "ears, neck and shoulders, and the same back length. The pictured hairstyle overrides any wording; " +
    "if the result differs from the picture in any way it is wrong. Keep only the character's own hair colour. " +
    "Do not copy the second reference model's face, head shape, skin tone, clothing or background.",
  outfit:
    "The second reference image is the exact garment the user picked. Reproduce its cut, neckline, sleeves, " +
    "length, texture and details one-to-one. Do not copy the second model's face, head, skin tone or background.",
};

const buildPictureEditPrompt = (t: Traits, changes: string[], focus?: string) =>
  `${buildEditPrompt(t, changes)} ` +
  (focus && FOCUS_RULES[focus]
    ? FOCUS_RULES[focus]
    : "The second reference image is the exact item the user tapped. " +
      "Copy that pictured item exactly — its shape, cut, texture and styling override any wording. " +
      "Do not copy the second reference model's face, head, skin tone or anything else.");


const SELFIE_PROMPT =
  `${STYLE_BASE} Recreate the exact person in the reference photo as this stylized 3D character: ` +
  "keep their face shape, skin tone, eye colour, nose, lips, hairstyle, hair colour, " +
  "facial hair and glasses clearly recognisable — unmistakably the same person, only in the animated style.";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

let styleRefCache: string | null = null;
async function styleReferenceDataUrl(): Promise<string | null> {
  if (styleRefCache) return styleRefCache;
  try {
    const blob = await (await fetch(STYLE_REFERENCE)).blob();
    styleRefCache = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("style"));
      reader.readAsDataURL(blob);
    });
    return styleRefCache;
  } catch {
    return null;
  }
}

function cellDataUrl(sheet: Sheet, index: number): Promise<string | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      const sw = image.naturalWidth / sheet.cols;
      const sh = image.naturalHeight / sheet.rows;
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(null);
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image,
        (index % sheet.cols) * sw,
        Math.floor(index / sheet.cols) * sh,
        sw,
        sh,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      resolve(canvas.toDataURL("image/jpeg", 0.92));
    };
    image.onerror = () => resolve(null);
    image.src = sheet.src;
  });
}

/* ------------------------------------------------------------------ */
/* Tiles                                                               */
/* ------------------------------------------------------------------ */

function SpriteTile({ sheet, index }: { sheet: Sheet; index: number }) {
  const col = index % sheet.cols;
  const rowIdx = Math.floor(index / sheet.cols);
  return (
    <span
      aria-hidden
      className="block aspect-square w-full bg-muted"
      style={{
        backgroundImage: `url(${sheet.src})`,
        backgroundSize: `${sheet.cols * 100}% ${sheet.rows * 100}%`,
        backgroundPosition: `${(col / Math.max(1, sheet.cols - 1)) * 100}% ${
          (rowIdx / Math.max(1, sheet.rows - 1)) * 100
        }%`,
      }}
    />
  );
}

function PictureGrid({
  opts,
  value,
  onPick,
}: {
  opts: Pic[];
  value: string | string[];
  onPick: (opt: Pic) => void;
}) {
  const isOn = (n: string) => (Array.isArray(value) ? value.includes(n) : value === n);
  return (
    <div className="grid grid-cols-4 gap-2.5 pb-6">
      {opts.map((o) => (
        <Button
          key={o.name}
          type="button"
          variant="ghost"
          title={o.name}
          aria-label={o.name}
          aria-pressed={isOn(o.name)}
          onClick={() => onPick(o)}
          className={`h-auto min-w-0 overflow-hidden rounded-2xl border-2 bg-surface p-0 transition-transform active:scale-95 ${
            isOn(o.name)
              ? "border-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_28%,transparent)]"
              : "border-border"
          }`}
        >
          <SpriteTile sheet={o.sheet} index={o.index} />
        </Button>
      ))}
    </div>
  );
}


function SwatchGrid({
  opts,
  value,
  onPick,
}: {
  opts: Swatch[];
  value: string;
  onPick: (name: string) => void;
}) {
  return (
    <div className="grid grid-cols-6 gap-3 pb-2">
      {opts.map((s) => (
        <Button
          key={s.name}
          type="button"
          variant="ghost"
          title={s.name}
          aria-label={s.name}
          aria-pressed={value === s.name}
          onClick={() => onPick(s.name)}
          className={`size-12 shrink-0 rounded-full border-2 p-0 transition-transform active:scale-95 ${
            value === s.name
              ? "border-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_28%,transparent)]"
              : "border-border"
          }`}
          style={{ background: s.hex }}
        />
      ))}
    </div>
  );
}

type StudioCategory =
  | "Skin"
  | "Eyes"
  | "Hair"
  | "Wrinkles"
  | "Beard"
  | "Piercings"
  | "Outfits"
  | "Extras";
const CATEGORIES: StudioCategory[] = [
  "Skin",
  "Eyes",
  "Hair",
  "Wrinkles",
  "Beard",
  "Piercings",
  "Outfits",
  "Extras",
];


/* ------------------------------------------------------------------ */
/* Studio                                                              */
/* ------------------------------------------------------------------ */

export function AvatarStudio({ onDone, onSkip }: { onDone: () => void; onSkip?: () => void }) {
  const qc = useQueryClient();
  const persist = useServerFn(saveAvatar);

  const [gender, setGender] = useState<"Male" | "Female" | null>(null);
  const [traits, setTraits] = useState<Traits>(defaultTraits("Male"));
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000));

  const [selfieOpen, setSelfieOpen] = useState(false);
  const [frame, setFrame] = useState<string | null>(null);
  const [isFinal, setIsFinal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<StudioCategory>("Hair");

  const me = useMe();
  const resumedRef = useRef(false);
  const runRef = useRef(0);
  const baseRef = useRef<string | null>(null);
  const finalFrameRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const renderedRef = useRef<Traits | null>(null);

  const hair = useMemo(() => hairFor(traits.gender), [traits.gender]);
  const outfits = useMemo(() => outfitsFor(traits.gender), [traits.gender]);
  const accessories = useMemo(() => accessoriesFor(traits.gender), [traits.gender]);
  const piercings = useMemo(() => piercingsFor(traits.gender), [traits.gender]);


  const generate = useCallback(
    async (prompt: string, reference: string | null, visualReference: string | null = null) => {
      const run = ++runRef.current;
      setBusy(true);
      setIsFinal(false);
      try {
        await streamAvatar(
          prompt,
          reference,
          (url, final) => {
            if (runRef.current !== run) return;
            setFrame(url);
            if (final) {
              setIsFinal(true);
              baseRef.current = url;
              finalFrameRef.current = url;
            }
          },
          visualReference,
        );
      } catch (e) {
        if (runRef.current === run) {
          if (finalFrameRef.current) setFrame(finalFrameRef.current);
          setIsFinal(true);
          toast.error(e instanceof Error ? e.message : "Couldn't render your avatar.");
        }
      } finally {
        if (runRef.current === run) setBusy(false);
      }
    },
    [],
  );

  const queueRender = useCallback(
    (next: Traits, fresh = false, picture: string | null = null, focus?: string) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void (async () => {
          const base = fresh ? null : baseRef.current;
          const changes = renderedRef.current ? changeLabels(renderedRef.current, next) : [];
          renderedRef.current = next;
          if (!base) {
            const style = await styleReferenceDataUrl();
            void generate(buildPrompt(next, seed), null, style);
            return;
          }
          const prompt = picture ? buildPictureEditPrompt(next, changes, focus) : buildEditPrompt(next, changes);
          void generate(prompt, base, picture);
        })();
      }, fresh ? 0 : 700);
    },
    [generate, seed],
  );

  useEffect(() => () => void (timerRef.current && clearTimeout(timerRef.current)), []);

  // Returning users keep the avatar they already have and just tweak it.
  useEffect(() => {
    const url = me.data?.profile?.avatar_url;
    if (!url || resumedRef.current) return;
    resumedRef.current = true;
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("reelzy:avatar-gender") : null;
    const g: "Male" | "Female" = saved === "Female" ? "Female" : "Male";
    setGender(g);
    setTraits(defaultTraits(g));
    setFrame(url);
    setIsFinal(true);
    setCategory("Hair");
    void (async () => {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        const dataUrl: string = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error("read failed"));
          reader.readAsDataURL(blob);
        });
        baseRef.current = dataUrl;
        finalFrameRef.current = dataUrl;
      } catch {
        /* fall back to a fresh render on the first change */
      }
    })();
  }, [me.data?.profile?.avatar_url]);

  function update(patch: Partial<Traits>) {
    setTraits((t) => {
      const next = { ...t, ...patch };
      const unchanged = (Object.keys(patch) as (keyof Traits)[]).every((k) => t[k] === next[k]);
      if (unchanged) return t;
      queueRender(next);
      return next;
    });
  }

  function updateFromPicture(patch: Partial<Traits>, sheet: Sheet, index: number) {
    setTraits((current) => {
      const next = { ...current, ...patch };
      const unchanged = (Object.keys(patch) as (keyof Traits)[]).every((key) => current[key] === next[key]);
      if (unchanged) return current;
      void cellDataUrl(sheet, index).then((picture) => queueRender(next, false, picture));
      return next;
    });
  }

  function toggleAccessory(opt: Pic) {
    const name = opt.name;
    setTraits((t) => {
      if (name === "no accessories") {
        if (!t.accessories.length) return t;
        const next = { ...t, accessories: [] };
        queueRender(next);
        return next;
      }
      const on = t.accessories.includes(name);
      const list = on ? t.accessories.filter((a) => a !== name) : [...t.accessories, name].slice(-3);
      const next = { ...t, accessories: list };
      if (on) queueRender(next);
      else void cellDataUrl(opt.sheet, opt.index).then((picture) => queueRender(next, false, picture));
      return next;
    });
  }


  function chooseGender(g: "Male" | "Female") {
    const next = defaultTraits(g);
    if (typeof window !== "undefined") window.localStorage.setItem("reelzy:avatar-gender", g);
    baseRef.current = null;
    renderedRef.current = null;
    runRef.current++;
    setGender(g);
    setTraits(next);
    setFrame(BASE_AVATARS[g]);
    finalFrameRef.current = BASE_AVATARS[g];
    setIsFinal(true);
    setBusy(false);
    setCategory("Hair");
  }

  async function keep() {
    if (!frame || !isFinal) return;
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

  /* ---------------- gender gate ---------------- */

  if (!gender) {
    return (
      <div className="min-h-svh bg-background px-5 pb-10 pt-8">
        <div className="mx-auto max-w-md">
          <p className="text-xs font-bold uppercase text-primary">Your GoHeet identity</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">Create your avatar</h2>
          <p className="mt-2 text-sm text-muted-foreground">Choose where to start. Everything after this is pictures.</p>
          <div className="grid grid-cols-2 gap-4">
            {(["Male", "Female"] as const).map((g) => (
              <Button
                key={g}
                type="button"
                variant="ghost"
                aria-label={g}
                onClick={() => chooseGender(g)}
                className="mt-6 h-auto overflow-hidden rounded-2xl border border-border bg-surface p-0 active:scale-[0.98]"
              >
                <img
                  src={BASE_AVATARS[g]}
                  alt={`${g} avatar`}
                  width={1024}
                  height={1280}
                  className="aspect-[4/5] w-full object-cover"
                />
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setSelfieOpen(true)}
            className="mt-5 h-12 w-full rounded-full"
          >
            <Camera className="size-4" /> Start from a selfie instead
          </Button>
          {onSkip ? (
            <Button type="button" variant="link" onClick={onSkip} className="mt-2 w-full text-xs text-muted-foreground">
              Skip for now
            </Button>
          ) : null}
          {selfieOpen ? (
            <SelfieSheet
              onClose={() => setSelfieOpen(false)}
              onShot={(url) => {
                setSelfieOpen(false);
                setGender("Male");
                baseRef.current = null;
                renderedRef.current = null;
                setFrame(null);
                void generate(SELFIE_PROMPT, url);
              }}
            />
          ) : null}
        </div>
      </div>
    );
  }

  /* ---------------- builder ---------------- */

  return (
    <div className="mx-auto min-h-svh max-w-md overflow-hidden bg-background">
      <div className="sticky top-0 z-20 bg-background">
        <div className="relative h-[46svh] min-h-[320px] max-h-[500px] overflow-hidden bg-muted">
          {frame ? (
            <img
              src={frame}
              alt="Your GoHeet avatar"
              width={1024}
              height={1280}
              className={`size-full object-cover transition-[filter] duration-500 ${isFinal ? "blur-0" : "blur-lg"}`}
            />
          ) : (
            <div className="grid size-full place-items-center text-xs text-muted-foreground">Rendering the 3D you…</div>
          )}
          {busy ? (
            <span className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-xs font-semibold backdrop-blur">
              <Sparkles className="size-3.5 animate-pulse text-primary" /> Updating…
            </span>
          ) : null}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-background/70 to-transparent px-4 pb-10 pt-5">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => {
                runRef.current++;
                setGender(null);
                setFrame(null);
                finalFrameRef.current = null;
                setBusy(false);
              }}
              className="rounded-full bg-background/30 text-foreground backdrop-blur"
              aria-label="Back"
            >
              <ArrowLeft />
            </Button>
            <span className="font-display text-lg font-extrabold text-foreground">GOHEET</span>
            <Button
              type="button"
              disabled={!isFinal || saving}
              onClick={() => void keep()}
              className="rounded-full bg-foreground text-background"
            >
              Done
            </Button>
          </div>
          <Button
            type="button"
            disabled={busy}
            onClick={() => queueRender(traits, true)}
            size="icon"
            variant="ghost"
            className="absolute bottom-5 right-4 rounded-full bg-background/50 backdrop-blur"
            aria-label="Regenerate avatar"
          >
            <RefreshCw />
          </Button>
          <Button
            type="button"
            onClick={() => setSelfieOpen(true)}
            size="icon"
            variant="ghost"
            className="absolute bottom-5 left-4 rounded-full bg-background/50 backdrop-blur"
            aria-label="Use a selfie"
          >
            <Camera />
          </Button>
        </div>
      </div>

      <div className="relative z-30 -mt-5 min-h-[54svh] rounded-t-[1.75rem] bg-background px-5 pb-10 pt-4 shadow-2xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/30" />
        <div className="mb-4 grid grid-cols-2 gap-2">
          {(["Male", "Female"] as const).map((option) => (
            <Button
              key={option}
              type="button"
              variant="ghost"
              aria-label={option}
              aria-pressed={gender === option}
              onClick={() => chooseGender(option)}
              className={`h-auto overflow-hidden rounded-2xl border-2 p-0 ${
                gender === option ? "border-primary" : "border-border"
              }`}
            >
              <img
                src={BASE_AVATARS[option]}
                alt={option}
                width={1024}
                height={1280}
                loading="lazy"
                className="h-16 w-full object-cover object-top"
              />
            </Button>
          ))}
        </div>
        <nav className="-mx-5 mb-5 flex gap-6 overflow-x-auto border-b border-border px-5" aria-label="Avatar features">
          {CATEGORIES.filter((item) => item !== "Beard" || gender === "Male").map((item) => (
            <Button
              key={item}
              type="button"
              variant="ghost"
              onClick={() => setCategory(item)}
              className={`h-10 shrink-0 rounded-none border-b-2 px-0 ${
                category === item ? "border-primary text-foreground" : "border-transparent text-muted-foreground"
              }`}
            >
              {item}
            </Button>
          ))}
        </nav>

        {category === "Skin" ? (
          <SwatchGrid opts={SKINS} value={traits.skin} onPick={(v) => update({ skin: v })} />
        ) : null}

        {category === "Eyes" ? (
          <SwatchGrid opts={EYE_COLORS} value={traits.eyeColor} onPick={(v) => update({ eyeColor: v })} />
        ) : null}

        {category === "Hair" ? (
          <div className="space-y-5">
            <SwatchGrid opts={HAIR_COLORS} value={traits.hairColor} onPick={(v) => update({ hairColor: v })} />
            <PictureGrid
              opts={hair}
              value={traits.hair}
              onPick={(o) => updateFromPicture({ hair: o.name }, o.sheet, o.index)}
            />
          </div>
        ) : null}

        {category === "Wrinkles" ? (
          <PictureGrid
            opts={WRINKLES}
            value={traits.wrinkles}
            onPick={(o) => updateFromPicture({ wrinkles: o.name }, o.sheet, o.index)}
          />
        ) : null}

        {category === "Beard" && gender === "Male" ? (
          <PictureGrid
            opts={BEARDS}
            value={traits.beard}
            onPick={(o) => updateFromPicture({ beard: o.name }, o.sheet, o.index)}
          />
        ) : null}

        {category === "Piercings" ? (
          <PictureGrid
            opts={piercings}
            value={traits.piercing}
            onPick={(o) => updateFromPicture({ piercing: o.name }, o.sheet, o.index)}
          />
        ) : null}

        {category === "Outfits" ? (
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Outfit colour
              </p>
              <SwatchGrid
                opts={OUTFIT_COLORS}
                value={traits.outfitColor}
                onPick={(v) => update({ outfitColor: v })}
              />
            </div>
            <PictureGrid
              opts={outfits}
              value={traits.outfit}
              onPick={(o) => updateFromPicture({ outfit: o.name }, o.sheet, o.index)}
            />
          </div>
        ) : null}

        {category === "Extras" ? (
          <PictureGrid
            opts={accessories}
            value={traits.accessories.length ? traits.accessories : ["no accessories"]}
            onPick={(o) => toggleAccessory(o)}
          />
        ) : null}

      </div>

      {selfieOpen ? (
        <SelfieSheet
          onClose={() => setSelfieOpen(false)}
          onShot={(url) => {
            setSelfieOpen(false);
            baseRef.current = null;
            renderedRef.current = null;
            setFrame(null);
            void generate(SELFIE_PROMPT, url);
          }}
        />
      ) : null}
    </div>
  );
}

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
      <Button type="button" size="icon" variant="outline" onClick={onClose} className="self-end rounded-full" aria-label="Close">
        <X className="size-5" />
      </Button>
      <div className="mt-4 flex-1 overflow-hidden rounded-[2rem] border border-border bg-black">
        <video ref={videoRef} playsInline muted className="size-full object-cover" />
      </div>
      {error ? <p className="mt-3 text-center text-sm text-muted-foreground">{error}</p> : null}
      <div className="mt-5 flex items-center justify-center gap-6">
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setFacing((f) => (f === "user" ? "environment" : "user"))}
          className="size-12 rounded-full bg-surface"
          aria-label="Flip camera"
        >
          <SwitchCamera className="size-5" />
        </Button>
        <Button
          type="button"
          size="icon"
          onClick={snap}
          className="ember-fill size-20 rounded-full shadow-[0_10px_30px_-8px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
          aria-label="Take selfie"
        />
      </div>
    </div>
  );
}
