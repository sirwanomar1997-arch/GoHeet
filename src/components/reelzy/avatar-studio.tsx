import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, Check, RefreshCw, Sparkles, SwitchCamera, X } from "lucide-react";
import { saveAvatar } from "@/lib/reelzy.functions";
import { streamAvatar } from "@/lib/stream-avatar";
import {
  ACCESSORIES,
  BROWS,
  EYE_COLORS,
  EYE_SHAPES,
  FACES,
  HAIR_COLORS,
  MAKEUP,
  NOSES,
  OUTFIT_COLORS,
  OUTFITS,
  SHEETS,
  SKINS,
  defaultTraits,
  hairFor,
  mouthsFor,
  type Cell,
  type Sheet,
  type Swatch,
  type Traits,
} from "@/components/reelzy/avatar-catalog";

/* ------------------------------------------------------------------ */
/* Prompt                                                              */
/* ------------------------------------------------------------------ */

const STYLE_BASE =
  "Ultra-detailed glossy 3D animated character portrait in premium Pixar/Disney feature-film style: " +
  "head-and-shoulders close-up, slight three-quarter turn, warm friendly gaze into camera, " +
  "big glossy photoreal eyes with crisp catchlights, soft subsurface-scattering skin with fine pores " +
  "and gentle blush, individually rendered glossy hair strands, realistic cloth weave, " +
  "soft cinematic studio key light from the upper left with a warm rim light, shallow depth of field, " +
  "smooth warm orange-to-pink gradient studio backdrop, octane-quality 8k render, " +
  "vertical portrait with the WHOLE head, complete hairstyle and any headwear fully inside the frame " +
  "with generous margin above the hair, shoulders visible, nothing cropped, no text, no watermark, no logo.";

function describe(t: Traits) {
  const female = t.gender === "Female";
  const bits = [
    female ? "beautiful feminine young woman character" : "handsome masculine man character",
    `${t.skin.toLowerCase()} skin tone`,
    `${t.face.toLowerCase()} face shape`,
    `${t.eyeShape.toLowerCase()} ${t.eyeColor.toLowerCase()} eyes`,
    `${t.brows.toLowerCase()} eyebrows`,
    `${t.nose.toLowerCase()} nose`,
    `${t.mouth.toLowerCase()}`,
    t.hair === "Bald" ? "bald head" : `${t.hair.toLowerCase()} hairstyle in ${t.hairColor.toLowerCase()}`,
    t.makeup === "None" ? "" : `${t.makeup.toLowerCase()} make-up`,
    `wearing a ${t.outfitColor.toLowerCase()} ${t.outfit.toLowerCase()}`,
    t.accessories.length ? `wearing ${t.accessories.map((a) => a.toLowerCase()).join(" and ")}` : "",
  ].filter(Boolean);
  return bits.join(", ");
}

const buildPrompt = (t: Traits, seed: number) =>
  `${STYLE_BASE} The character is a ${describe(t)}. Character seed #${seed}.`;

const buildEditPrompt = (t: Traits) =>
  `${STYLE_BASE} Keep the exact same character identity from the reference image and re-render them as: ` +
  `${describe(t)}. Change only what differs from the reference; everything else stays identical.`;

const SELFIE_PROMPT =
  `${STYLE_BASE} Recreate the exact person in the reference photo as this stylized 3D character: ` +
  "keep their face shape, skin tone, eye colour and shape, nose, lips, hairstyle, hair colour, " +
  "facial hair and glasses clearly recognisable — unmistakably the same person, only in the animated film style.";

/* ------------------------------------------------------------------ */
/* Tiles                                                               */
/* ------------------------------------------------------------------ */

function SpriteTile({ sheet, index }: { sheet: Sheet; index: number }) {
  const col = index % sheet.cols;
  const rowIdx = Math.floor(index / sheet.cols);
  return (
    <span
      aria-hidden
      className="block aspect-square w-full bg-[#26262a]"
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

function Tile({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`w-[76px] shrink-0 overflow-hidden rounded-2xl border-2 bg-surface transition-transform active:scale-95 ${
        active
          ? "border-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_28%,transparent)]"
          : "border-border"
      }`}
    >
      {children}
      <span className="block truncate px-1.5 py-1 text-[10px] font-semibold">{label}</span>
    </button>
  );
}

function SheetRow({
  title,
  sheet,
  opts,
  value,
  onPick,
  multi,
}: {
  title: string;
  sheet: Sheet;
  opts: Cell[];
  value: string | string[];
  onPick: (name: string) => void;
  multi?: boolean;
}) {
  const isOn = (n: string) => (Array.isArray(value) ? value.includes(n) : value === n);
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
        <span className="max-w-[55%] truncate text-[11px] text-muted-foreground">
          {Array.isArray(value) ? (value.length ? value.join(", ") : multi ? "None" : "") : value}
        </span>
      </div>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
        {opts.map((o) => (
          <Tile key={o.name} active={isOn(o.name)} label={o.name} onClick={() => onPick(o.name)}>
            <SpriteTile sheet={sheet} index={o.index} />
          </Tile>
        ))}
      </div>
    </section>
  );
}

function SwatchRow({
  title,
  opts,
  value,
  onPick,
}: {
  title: string;
  opts: Swatch[];
  value: string;
  onPick: (name: string) => void;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{title}</h3>
        <span className="text-[11px] text-muted-foreground">{value}</span>
      </div>
      <div className="-mx-1 flex gap-2.5 overflow-x-auto px-1 pb-1">
        {opts.map((s) => (
          <button
            key={s.name}
            type="button"
            title={s.name}
            aria-label={s.name}
            aria-pressed={value === s.name}
            onClick={() => onPick(s.name)}
            className={`size-12 shrink-0 rounded-full border-2 transition-transform active:scale-95 ${
              value === s.name
                ? "border-primary shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary)_28%,transparent)]"
                : "border-border"
            }`}
            style={{ background: s.hex }}
          />
        ))}
      </div>
    </section>
  );
}

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

  const runRef = useRef(0);
  const baseRef = useRef<string | null>(null); // last finished render, used to keep identity
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hair = useMemo(() => hairFor(traits.gender), [traits.gender]);
  const mouths = useMemo(() => mouthsFor(traits.gender), [traits.gender]);

  const generate = useCallback(async (prompt: string, reference: string | null) => {
    const run = ++runRef.current;
    setBusy(true);
    setIsFinal(false);
    try {
      await streamAvatar(prompt, reference, (url, final) => {
        if (runRef.current !== run) return;
        setFrame(url);
        if (final) {
          setIsFinal(true);
          baseRef.current = url;
        }
      });
    } catch (e) {
      if (runRef.current === run) toast.error(e instanceof Error ? e.message : "Couldn't render your avatar.");
    } finally {
      if (runRef.current === run) setBusy(false);
    }
  }, []);

  const queueRender = useCallback(
    (next: Traits, fresh = false) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const base = fresh ? null : baseRef.current;
        void generate(base ? buildEditPrompt(next) : buildPrompt(next, seed), base);
      }, fresh ? 0 : 650);
    },
    [generate, seed],
  );

  useEffect(() => () => void (timerRef.current && clearTimeout(timerRef.current)), []);

  function update(patch: Partial<Traits>) {
    setTraits((t) => {
      const next = { ...t, ...patch };
      queueRender(next);
      return next;
    });
  }

  function toggleAccessory(name: string) {
    setTraits((t) => {
      const on = t.accessories.includes(name);
      const list = on ? t.accessories.filter((a) => a !== name) : [...t.accessories, name].slice(-3);
      const next = { ...t, accessories: list };
      queueRender(next);
      return next;
    });
  }

  function chooseGender(g: "Male" | "Female") {
    const next = defaultTraits(g);
    baseRef.current = null;
    setGender(g);
    setTraits(next);
    setFrame(null);
    queueRender(next, true);
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
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {(["Male", "Female"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => chooseGender(g)}
              className="overflow-hidden rounded-3xl border border-border bg-surface text-left transition-transform active:scale-[0.98]"
            >
              <SpriteTile
                sheet={g === "Female" ? SHEETS.hairFemale : SHEETS.hairMale}
                index={g === "Female" ? 0 : 19}
              />
              <span className="block px-4 py-3 font-display text-sm font-bold">{g}</span>
            </button>
          ))}
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
              setSelfieOpen(false);
              setGender("Male");
              baseRef.current = null;
              setFrame(null);
              void generate(SELFIE_PROMPT, url);
            }}
          />
        ) : null}
      </div>
    );
  }

  /* ---------------- builder ---------------- */

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-10 -mx-1 rounded-[2rem] bg-background/85 px-1 pb-3 pt-1 backdrop-blur">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-surface">
          {frame ? (
            <img
              src={frame}
              alt="Your Reelzy avatar"
              className={`aspect-[4/5] w-full object-cover transition-[filter] duration-500 ${
                isFinal ? "blur-0" : "blur-lg"
              }`}
            />
          ) : (
            <div className="grid aspect-[4/5] w-full place-items-center text-xs text-muted-foreground">
              Rendering the 3D you…
            </div>
          )}
          {busy ? (
            <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-background/80 px-4 py-2 text-xs font-semibold backdrop-blur">
              <Sparkles className="size-3.5 animate-pulse text-primary" /> Updating…
            </span>
          ) : null}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => queueRender(traits, true)}
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-surface py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw className="size-4" /> Re-render
          </button>
          <button
            type="button"
            disabled={!isFinal || saving}
            onClick={() => void keep()}
            className="ember-fill flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            <Check className="size-4" /> This is me
          </button>
        </div>
      </div>

      <div className="space-y-5">
        <SwatchRow title="Skin" opts={SKINS} value={traits.skin} onPick={(v) => update({ skin: v })} />
        <SheetRow
          title="Face shape"
          sheet={SHEETS.face}
          opts={FACES}
          value={traits.face}
          onPick={(v) => update({ face: v })}
        />
        <SheetRow
          title="Eyes"
          sheet={SHEETS.eyes}
          opts={EYE_SHAPES}
          value={traits.eyeShape}
          onPick={(v) => update({ eyeShape: v })}
        />
        <SwatchRow
          title="Eye colour"
          opts={EYE_COLORS}
          value={traits.eyeColor}
          onPick={(v) => update({ eyeColor: v })}
        />
        <SheetRow
          title="Eyebrows"
          sheet={SHEETS.brows}
          opts={BROWS}
          value={traits.brows}
          onPick={(v) => update({ brows: v })}
        />
        <SheetRow
          title="Nose"
          sheet={SHEETS.nose}
          opts={NOSES}
          value={traits.nose}
          onPick={(v) => update({ nose: v })}
        />
        <SheetRow
          title="Mouth"
          sheet={SHEETS.mouth}
          opts={mouths}
          value={traits.mouth}
          onPick={(v) => update({ mouth: v })}
        />
        <SheetRow
          title="Hairstyle"
          sheet={hair.sheet}
          opts={hair.opts}
          value={traits.hair}
          onPick={(v) => update({ hair: v })}
        />
        <SwatchRow
          title="Hair colour"
          opts={HAIR_COLORS}
          value={traits.hairColor}
          onPick={(v) => update({ hairColor: v })}
        />
        <SheetRow
          title="Make-up"
          sheet={SHEETS.makeup}
          opts={MAKEUP}
          value={traits.makeup}
          onPick={(v) => update({ makeup: v })}
        />
        <SheetRow
          title="Outfit"
          sheet={SHEETS.outfit}
          opts={OUTFITS}
          value={traits.outfit}
          onPick={(v) => update({ outfit: v })}
        />
        <SwatchRow
          title="Outfit colour"
          opts={OUTFIT_COLORS}
          value={traits.outfitColor}
          onPick={(v) => update({ outfitColor: v })}
        />
        <SheetRow
          title="Accessories"
          sheet={SHEETS.accessory}
          opts={ACCESSORIES}
          value={traits.accessories}
          onPick={toggleAccessory}
          multi
        />
      </div>

      <button
        type="button"
        onClick={() => {
          runRef.current++;
          baseRef.current = null;
          setGender(null);
          setFrame(null);
          setBusy(false);
        }}
        className="w-full pb-4 text-xs text-muted-foreground underline"
      >
        Start over
      </button>
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
