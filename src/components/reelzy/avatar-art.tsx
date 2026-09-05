/**
 * Reelzy avatar art.
 *
 * One parametric drawing of a stylized head. Every option tile in the studio
 * draws THIS SAME head with only the one feature changed, so what you tap is
 * exactly what you get — no mismatched sprite sheets.
 */
import type { JSX } from "react";

/* ------------------------------------------------------------------ */
/* Catalogs                                                            */
/* ------------------------------------------------------------------ */

export const SKINS = [
  { name: "Porcelain", base: "#f7d9c4", shade: "#e6bda2", blush: "#f0a68f" },
  { name: "Fair", base: "#f0c8a8", shade: "#dda986", blush: "#e89478" },
  { name: "Light olive", base: "#e0b188", shade: "#c8946a", blush: "#d2825f" },
  { name: "Golden tan", base: "#cf9a68", shade: "#b47d4d", blush: "#b96e46" },
  { name: "Warm brown", base: "#a9713f", shade: "#8d5a2e", blush: "#94512a" },
  { name: "Deep brown", base: "#7d4c26", shade: "#63391a", blush: "#6d3418" },
  { name: "Ebony", base: "#54301a", shade: "#3f2211", blush: "#4a2110" },
] as const;

export const HAIR_COLORS = [
  { name: "Jet black", base: "#1b1620", shade: "#0d0a10" },
  { name: "Dark brown", base: "#3d2517", shade: "#28170e" },
  { name: "Chestnut", base: "#6b3c1f", shade: "#4d2915" },
  { name: "Auburn", base: "#8b3a1d", shade: "#652713" },
  { name: "Ginger", base: "#c25a1d", shade: "#9a4213" },
  { name: "Blonde", base: "#d9a martingale", shade: "#b8853c" },
  { name: "Platinum", base: "#e5dccb", shade: "#c2b6a2" },
  { name: "Salt & pepper", base: "#6f6a6b", shade: "#4b4647" },
  { name: "Silver", base: "#c9c6ce", shade: "#a09da6" },
  { name: "Pastel pink", base: "#e8859f", shade: "#c8617e" },
  { name: "Teal", base: "#2f8f8b", shade: "#1f6a67" },
] as const;

export const EYE_COLORS = [
  { name: "Dark brown", base: "#4a2a17" },
  { name: "Hazel", base: "#8a6122" },
  { name: "Amber", base: "#b5731d" },
  { name: "Green", base: "#3f7a4a" },
  { name: "Blue", base: "#3a72a8" },
  { name: "Grey", base: "#6b7480" },
] as const;

export const OUTFIT_COLORS = [
  { name: "Black", base: "#1c1a1e", shade: "#111015" },
  { name: "Cream", base: "#eee2d2", shade: "#d5c6b3" },
  { name: "Charcoal", base: "#3b3a40", shade: "#2a292e" },
  { name: "Burnt orange", base: "#d3671f", shade: "#a94d14" },
  { name: "Crimson", base: "#b32a35", shade: "#8b1e27" },
  { name: "Mustard", base: "#d0a02a", shade: "#a97d1c" },
  { name: "Forest green", base: "#2f6247", shade: "#214a34" },
  { name: "Navy", base: "#26365e", shade: "#1a2643" },
  { name: "Dusty pink", base: "#e3a6ac", shade: "#c4848b" },
  { name: "Lavender", base: "#a99ad6", shade: "#8a79bd" },
  { name: "Teal", base: "#2b7f86", shade: "#1d6169" },
] as const;

export const FACE_SHAPES = ["Oval", "Round", "Square", "Heart", "Long", "Diamond"] as const;
export const EYE_SHAPES = ["Almond", "Round", "Wide", "Hooded", "Upturned", "Narrow"] as const;
export const BROWS = ["Soft arched", "Straight", "Bold", "Thin", "Angled"] as const;
export const NOSES = ["Straight", "Button", "Wide", "Roman", "Upturned"] as const;
export const LIPS = ["Medium", "Full", "Thin", "Bow", "Wide"] as const;
export const EARS = ["Small", "Medium", "Large", "Pointed"] as const;

export const HAIR_MALE = [
  "Buzz cut",
  "Short crop",
  "Swept back",
  "Side part",
  "Curly top",
  "Messy fringe",
  "Man bun",
  "Afro",
  "Dreads",
  "Bald",
] as const;

export const HAIR_FEMALE = [
  "Long waves",
  "Straight long",
  "Shoulder bob",
  "Pixie cut",
  "High ponytail",
  "Top bun",
  "Curly volume",
  "Braids",
  "Afro puff",
  "Short crop",
] as const;

export const FACIAL_HAIR = [
  "Clean shaven",
  "Light stubble",
  "Full beard",
  "Short boxed beard",
  "Goatee",
  "Moustache",
] as const;

export const OUTFITS_MALE = [
  "Hoodie",
  "T-shirt",
  "Denim jacket",
  "Linen shirt",
  "Bomber jacket",
  "Knit sweater",
  "Tank top",
  "Blazer",
] as const;

export const OUTFITS_FEMALE = [
  "Knit sweater",
  "T-shirt",
  "Denim jacket",
  "Blouse",
  "Hoodie",
  "Off-shoulder top",
  "Blazer",
  "Turtleneck",
] as const;

export const EYEWEAR = ["None", "Round glasses", "Square glasses", "Sunglasses"] as const;
export const HEADWEAR_MALE = ["None", "Cap", "Beanie", "Bucket hat"] as const;
export const HEADWEAR_FEMALE = ["None", "Cap", "Beanie", "Headband"] as const;

export const EXPRESSIONS = [
  "Warm half-smile",
  "Big joyful grin",
  "Calm and confident",
  "Playful smirk",
] as const;

export const BACKDROPS = [
  { name: "Warm orange-pink glow", from: "#ff8a3d", to: "#f2657f" },
  { name: "Deep amber", from: "#f2a53c", to: "#d1521f" },
  { name: "Crimson dusk", from: "#e0503f", to: "#7c1f45" },
  { name: "Peach sunrise", from: "#ffb27a", to: "#ff7fa3" },
  { name: "Golden hour", from: "#ffc75c", to: "#f4843f" },
  { name: "Violet twilight", from: "#8b6cd6", to: "#e0578c" },
  { name: "Emerald haze", from: "#3fa88a", to: "#1f6f6b" },
  { name: "Studio charcoal", from: "#4a4750", to: "#232128" },
] as const;

export type Traits = {
  gender: "Male" | "Female" | "";
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
  eyewear: string;
  headwear: string;
  backdrop: string;
};

/* ------------------------------------------------------------------ */
/* Lookups                                                             */
/* ------------------------------------------------------------------ */

const skinOf = (n: string) => SKINS.find((s) => s.name === n) ?? SKINS[2];
const hairOf = (n: string) => HAIR_COLORS.find((s) => s.name === n) ?? HAIR_COLORS[1];
const eyeOf = (n: string) => EYE_COLORS.find((s) => s.name === n) ?? EYE_COLORS[0];
const outfitOf = (n: string) => OUTFIT_COLORS.find((s) => s.name === n) ?? OUTFIT_COLORS[0];
const backOf = (n: string) => BACKDROPS.find((s) => s.name === n) ?? BACKDROPS[0];

/** Head outline per face shape, drawn in a 100x120 box. */
function facePath(shape: string): string {
  switch (shape) {
    case "Round":
      return "M50 22c19 0 29 14 29 32s-13 34-29 34-29-16-29-34 10-32 29-32z";
    case "Square":
      return "M50 22c19 0 28 12 28 30v14c0 15-12 24-28 24s-28-9-28-24V52c0-18 9-30 28-30z";
    case "Heart":
      return "M50 22c20 0 30 13 30 30 0 20-16 36-30 36S20 72 20 52c0-17 10-30 30-30z";
    case "Long":
      return "M50 20c17 0 26 12 26 30v18c0 17-11 28-26 28s-26-11-26-28V50c0-18 9-30 26-30z";
    case "Diamond":
      return "M50 20c14 0 22 10 26 24 3 11 1 22-6 32-6 8-13 12-20 12s-14-4-20-12c-7-10-9-21-6-32 4-14 12-24 26-24z";
    default: // Oval
      return "M50 21c18 0 27 13 27 31s-11 35-27 35-27-17-27-35 9-31 27-31z";
  }
}

function eyeShapeProps(shape: string) {
  switch (shape) {
    case "Round":
      return { rx: 6, ry: 6, lidY: 0, tilt: 0 };
    case "Wide":
      return { rx: 7.6, ry: 5.4, lidY: 0, tilt: 0 };
    case "Hooded":
      return { rx: 6.6, ry: 4.6, lidY: 1.6, tilt: 0 };
    case "Upturned":
      return { rx: 6.6, ry: 5, lidY: 0, tilt: -8 };
    case "Narrow":
      return { rx: 6.4, ry: 3.6, lidY: 0, tilt: 0 };
    default: // Almond
      return { rx: 6.8, ry: 5, lidY: 0, tilt: -3 };
  }
}

function browPath(kind: string, flip: boolean): { d: string; w: number } {
  const mirror = (d: string) => d;
  switch (kind) {
    case "Straight":
      return { d: mirror("M-8 0 h16"), w: 3 };
    case "Bold":
      return { d: mirror("M-9 1 Q0 -3.4 9 0.6"), w: 4.6 };
    case "Thin":
      return { d: mirror("M-8 0.6 Q0 -2.6 8 0.2"), w: 1.8 };
    case "Angled":
      return { d: flip ? mirror("M-8 1.6 L2 -2.4 L8 -0.6") : mirror("M-8 -0.6 L-2 -2.4 L8 1.6"), w: 3.2 };
    default: // Soft arched
      return { d: mirror("M-8 1 Q0 -3.2 8 0.4"), w: 3 };
  }
}

function nosePath(kind: string): string {
  switch (kind) {
    case "Button":
      return "M50 56 q-1 6 -4 8 q3 2 8 0";
    case "Wide":
      return "M50 55 q-2 8 -7 10 q7 3 14 0";
    case "Roman":
      return "M49 53 q3 8 -2 12 q5 2 9 -1";
    case "Upturned":
      return "M50 56 q-2 6 -4 9 q4 -1 8 -3";
    default: // Straight
      return "M50 54 q-1 8 -4 11 q4 2 8 0";
  }
}

function lipsPaths(kind: string, smile: number) {
  const y = 78;
  switch (kind) {
    case "Full":
      return { top: `M40 ${y} Q50 ${y - 4} 60 ${y}`, bottom: `M40 ${y} Q50 ${y + 7 + smile} 60 ${y}` };
    case "Thin":
      return { top: `M42 ${y} Q50 ${y - 1.5} 58 ${y}`, bottom: `M42 ${y} Q50 ${y + 3 + smile} 58 ${y}` };
    case "Bow":
      return {
        top: `M41 ${y} Q45 ${y - 4} 50 ${y - 1} Q55 ${y - 4} 59 ${y}`,
        bottom: `M41 ${y} Q50 ${y + 5.5 + smile} 59 ${y}`,
      };
    case "Wide":
      return { top: `M37 ${y} Q50 ${y - 3} 63 ${y}`, bottom: `M37 ${y} Q50 ${y + 5 + smile} 63 ${y}` };
    default: // Medium
      return { top: `M41 ${y} Q50 ${y - 3} 59 ${y}`, bottom: `M41 ${y} Q50 ${y + 5 + smile} 59 ${y}` };
  }
}

const earSize = (kind: string) => (kind === "Small" ? 4.6 : kind === "Large" ? 7.4 : 6);

/* ------------------------------------------------------------------ */
/* Hair                                                                */
/* ------------------------------------------------------------------ */

function HairBack({ style, c }: { style: string; c: { base: string; shade: string } }) {
  switch (style) {
    case "Long waves":
      return (
        <path
          d="M18 46c0-18 13-28 32-28s32 10 32 28c0 16 4 26 6 44-8 3-13 1-16-4 2-14 1-26-2-34-8 6-32 6-40 0-3 8-4 20-2 34-3 5-8 7-16 4 2-18 6-28 6-44z"
          fill={c.shade}
        />
      );
    case "Straight long":
      return (
        <path
          d="M19 48c0-19 13-30 31-30s31 11 31 30v42c-6 2-11 1-14-2V56c-8 5-26 5-34 0v32c-3 3-8 4-14 2z"
          fill={c.shade}
        />
      );
    case "Curly volume":
      return (
        <path
          d="M16 48c0-20 15-31 34-31s34 11 34 31c0 14 3 22 4 34-7 4-13 2-16-3 2-11 1-20-1-27-10 7-32 7-42 0-2 7-3 16-1 27-3 5-9 7-16 3 1-12 4-20 4-34z"
          fill={c.shade}
        />
      );
    case "Braids":
      return (
        <path
          d="M20 48c0-18 13-29 30-29s30 11 30 29v40c-5 2-9 1-11-2V56c-8 5-30 5-38 0v30c-2 3-6 4-11 2z"
          fill={c.shade}
        />
      );
    case "High ponytail":
      return <path d="M72 30c12 2 18 12 16 26-2 12-8 18-14 20 5-10 6-20 2-28-3-7-6-12-4-18z" fill={c.shade} />;
    case "Afro":
    case "Afro puff":
      return <circle cx="50" cy="42" r="33" fill={c.shade} />;
    case "Dreads":
      return (
        <path
          d="M20 46c0-17 13-27 30-27s30 10 30 27v34c-4 2-7 1-9-1V56c-9 5-33 5-42 0v23c-2 2-5 3-9 1z"
          fill={c.shade}
        />
      );
    default:
      return null;
  }
}

function HairFront({ style, c }: { style: string; c: { base: string; shade: string } }) {
  const shine = (d: string) => <path d={d} fill="#ffffff" opacity="0.18" />;
  switch (style) {
    case "Bald":
      return null;
    case "Buzz cut":
      return (
        <>
          <path d="M23 48c0-16 11-27 27-27s27 11 27 27c-4-10-13-15-27-15s-23 5-27 15z" fill={c.base} />
        </>
      );
    case "Short crop":
      return (
        <>
          <path d="M22 50c0-19 12-30 28-30s28 11 28 30c-3-12-8-18-15-16-6 2-9 4-17 3-9-1-12 2-16 6-3 3-6 4-8 7z" fill={c.base} />
          {shine("M34 30q10-7 22-5-10 1-22 5z")}
        </>
      );
    case "Swept back":
      return (
        <>
          <path d="M22 50c-1-21 11-32 28-32s29 10 29 27c-2-6-7-9-12-8 3-6 0-9-6-9-9 0-22 3-30 12-4 4-7 6-9 10z" fill={c.base} />
          {shine("M40 24q14-4 26 3-14-4-26-3z")}
        </>
      );
    case "Side part":
      return (
        <>
          <path d="M22 50c0-20 12-31 28-31s28 11 28 29c-4-9-11-14-20-15-6 5-14 8-24 9-5 1-9 4-12 8z" fill={c.base} />
          {shine("M36 26q12-5 22 0-11-2-22 0z")}
        </>
      );
    case "Curly top":
      return (
        <>
          <circle cx="34" cy="30" r="10" fill={c.base} />
          <circle cx="50" cy="24" r="12" fill={c.base} />
          <circle cx="66" cy="30" r="10" fill={c.base} />
          <circle cx="26" cy="42" r="8" fill={c.base} />
          <circle cx="74" cy="42" r="8" fill={c.base} />
        </>
      );
    case "Messy fringe":
      return (
        <>
          <path d="M22 52c0-21 12-33 28-33s28 12 28 31c-4-8-7-11-11-8-3-9-8-6-12-2-4-5-9-3-12 2-4-4-8-2-11 3-4 2-8 3-10 7z" fill={c.base} />
          {shine("M38 26q10-4 18 1-9-3-18-1z")}
        </>
      );
    case "Man bun":
      return (
        <>
          <circle cx="50" cy="12" r="9" fill={c.shade} />
          <path d="M23 48c0-19 12-29 27-29s27 10 27 29c-3-11-9-16-19-17-8-1-14 1-21 6-6 4-11 6-14 11z" fill={c.base} />
        </>
      );
    case "Afro":
    case "Afro puff":
      return (
        <>
          <path d="M50 9c19 0 33 14 33 33 0 6-1 10-3 14-2-16-13-25-30-25s-28 9-30 25c-2-4-3-8-3-14C17 23 31 9 50 9z" fill={c.base} />
          {shine("M32 20q16-9 32-2-16-4-32 2z")}
        </>
      );
    case "Dreads":
      return (
        <>
          <path d="M22 48c0-20 12-31 28-31s28 11 28 31c-3-9-8-13-14-14-2 5-4 6-7 2-3 5-6 6-9 1-3 5-6 5-9 0-3 4-6 4-8-1-4 2-7 5-9 12z" fill={c.base} />
        </>
      );
    case "Pixie cut":
      return (
        <>
          <path d="M21 50c0-20 12-31 29-31s29 11 29 30c-3-10-9-15-18-16-5 6-15 9-26 9-6 2-11 4-14 8z" fill={c.base} />
          {shine("M35 27q12-6 22-1-11-2-22 1z")}
        </>
      );
    case "Shoulder bob":
      return (
        <>
          <path d="M20 52c0-21 13-33 30-33s30 12 30 33v14c-3 1-6 0-7-3V56c-9 6-28 8-40 3-4 3-7 7-8 12-2 1-4 0-5-3z" fill={c.base} />
          {shine("M36 28q13-6 24 0-12-3-24 0z")}
        </>
      );
    case "Top bun":
      return (
        <>
          <circle cx="50" cy="10" r="10" fill={c.shade} />
          <path d="M22 48c0-20 12-30 28-30s28 10 28 30c-4-11-10-16-19-17-8-1-15 1-22 6-6 4-12 6-15 11z" fill={c.base} />
        </>
      );
    case "High ponytail":
      return (
        <>
          <path d="M22 48c0-20 12-30 28-30s28 10 28 30c-4-11-10-16-19-17-8-1-15 1-22 6-6 4-12 6-15 11z" fill={c.base} />
          {shine("M36 26q13-5 23 1-12-3-23-1z")}
        </>
      );
    case "Braids":
      return (
        <>
          <path d="M22 50c0-20 12-31 28-31s28 11 28 31c-4-10-10-15-19-16-8-1-15 1-22 5-6 4-12 6-15 11z" fill={c.base} />
          <path d="M28 46v34M72 46v34" stroke={c.shade} strokeWidth="5" strokeLinecap="round" opacity="0.9" />
        </>
      );
    case "Straight long":
    case "Long waves":
    case "Curly volume":
    default:
      return (
        <>
          <path d="M20 52c0-22 13-34 30-34s30 12 30 34c-4-12-10-18-20-19-9-1-17 2-24 7-7 4-13 7-16 12z" fill={c.base} />
          {shine("M35 28q14-7 26 0-13-3-26 0z")}
        </>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Extras                                                              */
/* ------------------------------------------------------------------ */

function FacialHair({ kind, c }: { kind: string; c: { base: string; shade: string } }) {
  if (!kind || kind === "Clean shaven") return null;
  if (kind === "Light stubble")
    return <path d="M28 66c2 14 10 23 22 23s20-9 22-23c2 16-6 30-22 30S26 82 28 66z" fill={c.shade} opacity="0.35" />;
  if (kind === "Moustache") return <path d="M42 73q8-4 16 0-8 3-16 0z" fill={c.base} />;
  if (kind === "Goatee")
    return (
      <>
        <path d="M42 73q8-4 16 0-8 3-16 0z" fill={c.base} />
        <path d="M44 84q6 6 12 0 0 9-6 10t-6-10z" fill={c.base} />
      </>
    );
  if (kind === "Short boxed beard")
    return (
      <>
        <path d="M29 66c2 15 10 25 21 25s19-10 21-25c3 18-6 32-21 32S26 84 29 66z" fill={c.base} />
        <path d="M42 73q8-4 16 0-8 3-16 0z" fill={c.base} />
      </>
    );
  return (
    <>
      <path d="M27 62c1 20 10 34 23 34s22-14 23-34c4 24-8 42-23 42S23 86 27 62z" fill={c.base} />
      <path d="M41 72q9-5 18 0-9 4-18 0z" fill={c.base} />
    </>
  );
}

function Eyewear({ kind }: { kind: string }) {
  if (!kind || kind === "None") return null;
  const stroke = "#2a2530";
  if (kind === "Sunglasses")
    return (
      <g>
        <rect x="27" y="54" width="19" height="12" rx="5" fill="#26222c" />
        <rect x="54" y="54" width="19" height="12" rx="5" fill="#26222c" />
        <path d="M46 59h8" stroke={stroke} strokeWidth="2" />
      </g>
    );
  if (kind === "Square glasses")
    return (
      <g fill="none" stroke={stroke} strokeWidth="2">
        <rect x="27" y="53" width="19" height="13" rx="3" />
        <rect x="54" y="53" width="19" height="13" rx="3" />
        <path d="M46 59h8" />
      </g>
    );
  return (
    <g fill="none" stroke={stroke} strokeWidth="2">
      <circle cx="36.5" cy="59.5" r="8" />
      <circle cx="63.5" cy="59.5" r="8" />
      <path d="M44.5 59.5h11" />
    </g>
  );
}

function Headwear({ kind, color }: { kind: string; color: { base: string; shade: string } }) {
  if (!kind || kind === "None") return null;
  if (kind === "Cap")
    return (
      <g>
        <path d="M22 40c0-16 12-26 28-26s28 10 28 26z" fill={color.base} />
        <path d="M78 40c10 1 14 4 15 8H62z" fill={color.shade} />
      </g>
    );
  if (kind === "Beanie")
    return (
      <g>
        <path d="M22 42c0-18 12-28 28-28s28 10 28 28z" fill={color.base} />
        <rect x="20" y="38" width="60" height="9" rx="4.5" fill={color.shade} />
      </g>
    );
  if (kind === "Bucket hat")
    return (
      <g>
        <path d="M26 38c0-14 10-22 24-22s24 8 24 22z" fill={color.base} />
        <path d="M16 38h68c0 6-15 9-34 9s-34-3-34-9z" fill={color.shade} />
      </g>
    );
  return <path d="M22 42c4-8 12-11 28-11s24 3 28 11c-3 3-6 3-9 1-6-3-12-4-19-4s-13 1-19 4c-3 2-6 2-9-1z" fill={color.base} />;
}

/* ------------------------------------------------------------------ */
/* The head                                                            */
/* ------------------------------------------------------------------ */

export function AvatarArt({
  traits,
  zoom = "head",
  className,
}: {
  traits: Traits;
  zoom?: "head" | "face" | "bust";
  className?: string;
}) {
  const skin = skinOf(traits.skin);
  const hair = hairOf(traits.hairColor);
  const eye = eyeOf(traits.eyeColor);
  const outfit = outfitOf(traits.outfitColor);
  const back = backOf(traits.backdrop);
  const female = traits.gender === "Female";
  const es = eyeShapeProps(traits.eyeShape);
  const smile =
    traits.expression === "Big joyful grin" ? 4 : traits.expression === "Calm and confident" ? -1 : 1.5;
  const lips = lipsPaths(traits.lips, smile);
  const ear = earSize(traits.ears);
  const uid = `${traits.skin}-${traits.hairColor}-${traits.outfitColor}`.replace(/[^a-z0-9]/gi, "");

  const viewBox = zoom === "face" ? "24 30 52 56" : zoom === "bust" ? "6 60 88 56" : "0 0 100 116";

  const Eye = ({ cx }: { cx: number }) => (
    <g transform={`translate(${cx} 59) rotate(${cx < 50 ? es.tilt : -es.tilt})`}>
      <ellipse rx={es.rx} ry={es.ry} fill="#fffaf5" />
      <circle r={Math.min(es.ry, 4.1)} cy="0.2" fill={eye.base} />
      <circle r={Math.min(es.ry, 4.1) * 0.45} cy="0.2" fill="#150f14" />
      <circle r="1.15" cx="-1.4" cy="-1.5" fill="#ffffff" opacity="0.95" />
      {es.lidY ? <path d={`M${-es.rx} ${-es.ry + es.lidY} h${es.rx * 2}`} stroke={skin.shade} strokeWidth="2.4" /> : null}
      <path
        d={`M${-es.rx} ${-es.ry - 0.4} Q0 ${-es.ry - 2.8} ${es.rx} ${-es.ry - 0.4}`}
        fill="none"
        stroke="#2a1f26"
        strokeWidth={female ? 1.7 : 1.2}
        strokeLinecap="round"
      />
    </g>
  );

  const brow = browPath(traits.brows, false);

  return (
    <svg viewBox={viewBox} className={className} role="img" aria-label="Avatar preview">
      <defs>
        <linearGradient id={`bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={back.from} />
          <stop offset="100%" stopColor={back.to} />
        </linearGradient>
        <radialGradient id={`skin-${uid}`} cx="0.38" cy="0.3" r="0.85">
          <stop offset="0%" stopColor={skin.base} />
          <stop offset="100%" stopColor={skin.shade} />
        </radialGradient>
      </defs>

      <rect x="-10" y="-10" width="130" height="140" fill={`url(#bg-${uid})`} />

      {/* shoulders / outfit */}
      <g>
        <path d="M50 88c-19 0-34 10-38 28h76c-4-18-19-28-38-28z" fill={outfit.base} />
        <path d="M50 88c-6 0-11 1-16 3 4 7 9 11 16 11s12-4 16-11c-5-2-10-3-16-3z" fill={skin.base} />
        {traits.outfit === "Hoodie" ? (
          <path d="M34 91c4 9 9 14 16 14s12-5 16-14c5 2 8 5 10 9-8 7-16 10-26 10s-18-3-26-10c2-4 5-7 10-9z" fill={outfit.shade} />
        ) : null}
        {traits.outfit === "Turtleneck" ? (
          <path d="M36 88h28c-1 8-6 12-14 12s-13-4-14-12z" fill={outfit.shade} />
        ) : null}
        {traits.outfit === "Blazer" || traits.outfit === "Denim jacket" || traits.outfit === "Bomber jacket" ? (
          <path d="M42 94 50 116 58 94l10 5-4 17H36l-4-17z" fill={outfit.shade} />
        ) : null}
        {traits.outfit === "Linen shirt" || traits.outfit === "Blouse" ? (
          <path d="M43 92 50 104 57 92l6 3-13 13-13-13z" fill="#ffffff" opacity="0.25" />
        ) : null}
      </g>

      <HairBack style={traits.hair} c={hair} />

      {/* ears */}
      <ellipse cx="22.5" cy="62" rx={ear * 0.8} ry={ear} fill={skin.shade} />
      <ellipse cx="77.5" cy="62" rx={ear * 0.8} ry={ear} fill={skin.shade} />
      {traits.ears === "Pointed" ? (
        <>
          <path d={`M22 ${62 - ear}l-3-7 6 3z`} fill={skin.shade} />
          <path d={`M78 ${62 - ear}l3-7-6 3z`} fill={skin.shade} />
        </>
      ) : null}

      {/* head */}
      <path d={facePath(traits.face)} fill={`url(#skin-${uid})`} />

      {/* blush */}
      <ellipse cx="34" cy="70" rx="7" ry="4" fill={skin.blush} opacity="0.35" />
      <ellipse cx="66" cy="70" rx="7" ry="4" fill={skin.blush} opacity="0.35" />

      <Eye cx={36.5} />
      <Eye cx={63.5} />

      {/* brows */}
      <g stroke="#2a1c22" strokeLinecap="round" fill="none" opacity="0.92">
        <path d={brow.d} strokeWidth={brow.w} transform="translate(36.5 49)" />
        <path d={brow.d} strokeWidth={brow.w} transform="translate(63.5 49) scale(-1 1)" />
      </g>

      {/* nose */}
      <path d={nosePath(traits.nose)} fill="none" stroke={skin.shade} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

      {/* lips */}
      <g>
        <path d={lips.top} fill={female ? "#c9536a" : "#b06a63"} />
        <path d={lips.bottom} fill={female ? "#d9647c" : "#bd7871"} />
        {traits.expression === "Big joyful grin" ? (
          <path d={lips.top} fill="#ffffff" opacity="0.9" transform="translate(0 1.5)" />
        ) : null}
      </g>

      <FacialHair kind={female ? "Clean shaven" : traits.facialHair} c={hair} />
      <HairFront style={traits.hair} c={hair} />
      <Eyewear kind={traits.eyewear} />
      <Headwear kind={traits.headwear} color={outfit} />
    </svg>
  );
}
