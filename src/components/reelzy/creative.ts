/**
 * Reelzy creative kit — the small, opinionated set of looks and type styles a
 * moment can carry. Kept deliberately tight: Reelzy is about the real frame,
 * so the treatments are graded like film stock, never like face filters.
 */

export type FilterCategory =
  | "Natural"
  | "Cinematic"
  | "Luxury"
  | "Warm"
  | "Cool"
  | "Night"
  | "Mono"
  | "Vintage"
  | "Social";

export const FILTER_CATEGORIES: FilterCategory[] = [
  "Natural",
  "Cinematic",
  "Luxury",
  "Warm",
  "Cool",
  "Night",
  "Mono",
  "Vintage",
  "Social",
];

export type FilterId = string;

type FilterDef = {
  id: string;
  label: string;
  category: FilterCategory;
  css: string;
  swatch: string;
};

/**
 * A curated grade library. Every look is a colour grade — never a face warp —
 * so skin stays honest and the frame stays the real moment.
 */
export const FILTERS: FilterDef[] = [
  { id: "none", label: "Real", category: "Natural", css: "none", swatch: "linear-gradient(135deg,#8d8d8d,#e6e6e6)" },
  { id: "clarity", label: "Clarity", category: "Natural", css: "contrast(1.04) saturate(1.05) brightness(1.02)", swatch: "linear-gradient(135deg,#cfd8dc,#f7f7f7)" },
  { id: "airy", label: "Airy", category: "Natural", css: "brightness(1.07) contrast(0.98) saturate(1.02)", swatch: "linear-gradient(135deg,#f3ece5,#ffffff)" },
  { id: "truetone", label: "True", category: "Natural", css: "saturate(1.08) contrast(1.02)", swatch: "linear-gradient(135deg,#d9c7b3,#efe6dc)" },

  { id: "teal", label: "Teal", category: "Cinematic", css: "contrast(1.14) saturate(1.06) hue-rotate(-6deg) brightness(0.98)", swatch: "linear-gradient(135deg,#0f3b45,#e2a05a)" },
  { id: "anamorphic", label: "Anamorphic", category: "Cinematic", css: "contrast(1.2) saturate(0.95) brightness(0.96)", swatch: "linear-gradient(135deg,#12212b,#8fa6b2)" },
  { id: "dusk", label: "Dusk", category: "Cinematic", css: "saturate(1.1) contrast(1.12) brightness(0.9) hue-rotate(-16deg)", swatch: "linear-gradient(135deg,#4b2d63,#ff8a5b)" },
  { id: "drama", label: "Drama", category: "Cinematic", css: "contrast(1.3) saturate(1.02) brightness(0.94)", swatch: "linear-gradient(135deg,#1a1a1a,#b56b3c)" },

  { id: "atelier", label: "Atelier", category: "Luxury", css: "contrast(1.08) saturate(0.92) brightness(1.04) sepia(0.06)", swatch: "linear-gradient(135deg,#d8cfc4,#f6f1ea)" },
  { id: "editorial", label: "Editorial", category: "Luxury", css: "contrast(1.16) saturate(0.88) brightness(1.02)", swatch: "linear-gradient(135deg,#b9b3ac,#ece7e1)" },
  { id: "champagne", label: "Champagne", category: "Luxury", css: "sepia(0.14) saturate(1.06) contrast(1.05) brightness(1.05)", swatch: "linear-gradient(135deg,#e6cfa3,#fdf6e6)" },
  { id: "marble", label: "Marble", category: "Luxury", css: "saturate(0.8) contrast(1.1) brightness(1.06)", swatch: "linear-gradient(135deg,#e8e6e3,#c2bcb6)" },

  { id: "ember", label: "Ember", category: "Warm", css: "saturate(1.25) contrast(1.08) sepia(0.18) hue-rotate(-8deg) brightness(1.02)", swatch: "linear-gradient(135deg,#ffb547,#e5484d)" },
  { id: "goldenhour", label: "Golden", category: "Warm", css: "sepia(0.2) saturate(1.2) brightness(1.06) contrast(1.04)", swatch: "linear-gradient(135deg,#ffcf7a,#f08a3c)" },
  { id: "honey", label: "Honey", category: "Warm", css: "sepia(0.12) saturate(1.14) brightness(1.04)", swatch: "linear-gradient(135deg,#f5c26b,#ffe9c2)" },
  { id: "terracotta", label: "Terracotta", category: "Warm", css: "sepia(0.22) saturate(1.3) contrast(1.06) hue-rotate(-10deg)", swatch: "linear-gradient(135deg,#c86a4a,#f0a878)" },

  { id: "frost", label: "Frost", category: "Cool", css: "saturate(0.9) contrast(1.06) hue-rotate(180deg) brightness(1.05)", swatch: "linear-gradient(135deg,#a8d8ff,#e8f4ff)" },
  { id: "arctic", label: "Arctic", category: "Cool", css: "saturate(0.86) brightness(1.08) contrast(1.06) hue-rotate(190deg)", swatch: "linear-gradient(135deg,#cfe8f5,#ffffff)" },
  { id: "steel", label: "Steel", category: "Cool", css: "saturate(0.78) contrast(1.14) brightness(0.99)", swatch: "linear-gradient(135deg,#6f7b85,#c8d2d8)" },
  { id: "azure", label: "Azure", category: "Cool", css: "saturate(1.12) contrast(1.06) hue-rotate(170deg)", swatch: "linear-gradient(135deg,#3f7fd4,#a9d3ff)" },

  { id: "midnight", label: "Midnight", category: "Night", css: "brightness(1.16) contrast(1.1) saturate(1.04)", swatch: "linear-gradient(135deg,#0e1524,#4a5c85)" },
  { id: "neon", label: "Neon", category: "Night", css: "brightness(1.08) contrast(1.2) saturate(1.4) hue-rotate(-12deg)", swatch: "linear-gradient(135deg,#5b2bd6,#ff4fa3)" },
  { id: "citylight", label: "City", category: "Night", css: "brightness(1.2) contrast(1.06) saturate(1.1) sepia(0.08)", swatch: "linear-gradient(135deg,#2b2b38,#ffb96b)" },

  { id: "noir", label: "Noir", category: "Mono", css: "grayscale(1) contrast(1.28) brightness(0.95)", swatch: "linear-gradient(135deg,#101010,#d8d8d8)" },
  { id: "silver", label: "Silver", category: "Mono", css: "grayscale(1) contrast(1.06) brightness(1.08)", swatch: "linear-gradient(135deg,#7d7d7d,#f2f2f2)" },
  { id: "ink", label: "Ink", category: "Mono", css: "grayscale(1) contrast(1.5) brightness(0.92)", swatch: "linear-gradient(135deg,#000000,#9a9a9a)" },
  { id: "bleach", label: "Bleach", category: "Mono", css: "saturate(0.45) contrast(1.3) brightness(1.12)", swatch: "linear-gradient(135deg,#e9e2d6,#9aa0a6)" },

  { id: "kodak", label: "Kodak", category: "Vintage", css: "sepia(0.32) saturate(1.35) contrast(1.05) brightness(1.04)", swatch: "linear-gradient(135deg,#f2c14e,#c1662f)" },
  { id: "super8", label: "Super 8", category: "Vintage", css: "sepia(0.45) saturate(1.5) contrast(1.15) brightness(0.98)", swatch: "linear-gradient(135deg,#d9a441,#7a3b1e)" },
  { id: "polaroid", label: "Polaroid", category: "Vintage", css: "sepia(0.18) saturate(0.92) contrast(0.96) brightness(1.1)", swatch: "linear-gradient(135deg,#e8dcc8,#b9c7bd)" },
  { id: "faded", label: "Faded", category: "Vintage", css: "saturate(0.7) contrast(0.92) brightness(1.1) sepia(0.1)", swatch: "linear-gradient(135deg,#cfc3b8,#ece7e0)" },

  { id: "pop", label: "Pop", category: "Social", css: "saturate(1.45) contrast(1.12) brightness(1.03)", swatch: "linear-gradient(135deg,#ff5f6d,#ffc371)" },
  { id: "candy", label: "Candy", category: "Social", css: "saturate(1.35) contrast(1.05) brightness(1.06) hue-rotate(8deg)", swatch: "linear-gradient(135deg,#ff9ad5,#9ad7ff)" },
  { id: "vivid", label: "Vivid", category: "Social", css: "saturate(1.6) contrast(1.18)", swatch: "linear-gradient(135deg,#00c6ff,#ff007a)" },
  { id: "sunkissed", label: "Sunkissed", category: "Social", css: "sepia(0.16) saturate(1.3) brightness(1.08) contrast(1.04)", swatch: "linear-gradient(135deg,#ffb26b,#ffe7c2)" },
];

export function filterCss(id?: string | null): string | undefined {
  if (!id || id === "none") return undefined;
  return FILTERS.find((f) => f.id === id)?.css;
}


export type OverlayFont =
  | "display"
  | "mono"
  | "serif"
  | "stamp"
  | "party"
  | "arcade"
  | "puffy"
  | "marker"
  | "script"
  | "groove"
  | "heavy"
  | "hand"
  | "candy"
  | "chunk";

type FontDef = {
  id: OverlayFont;
  label: string;
  family: string;
  weight: number;
  spacing: string;
  upper?: boolean;
};

/** Fat, playful type voices. Loaded in the root head. */
export const OVERLAY_FONTS: FontDef[] = [
  { id: "party", label: "Party", family: '"Luckiest Guy", cursive', weight: 400, spacing: "0.01em" },
  { id: "arcade", label: "Arcade", family: '"Bungee", cursive', weight: 400, spacing: "0.02em" },
  { id: "puffy", label: "Puffy", family: '"Fredoka", sans-serif', weight: 700, spacing: "-0.01em" },
  { id: "marker", label: "Marker", family: '"Permanent Marker", cursive', weight: 400, spacing: "0em" },
  { id: "script", label: "Breeze", family: '"Pacifico", cursive', weight: 400, spacing: "0em" },
  { id: "groove", label: "Groove", family: '"Righteous", cursive', weight: 400, spacing: "0.01em" },
  { id: "heavy", label: "Heavy", family: '"Archivo Black", sans-serif', weight: 400, spacing: "-0.02em" },
  { id: "hand", label: "Hand", family: '"Caveat", cursive', weight: 700, spacing: "0em" },
  { id: "candy", label: "Candy", family: '"Shrikhand", cursive', weight: 400, spacing: "0em" },
  { id: "chunk", label: "Chunk", family: '"Rubik Mono One", monospace', weight: 400, spacing: "-0.01em" },
  { id: "display", label: "Bold", family: 'var(--font-display)', weight: 800, spacing: "-0.04em" },
  { id: "stamp", label: "Stamp", family: 'var(--font-display)', weight: 900, spacing: "0.18em", upper: true },
  { id: "mono", label: "Data", family: 'var(--font-mono)', weight: 500, spacing: "0.02em" },
  { id: "serif", label: "Quiet", family: "ui-serif, Georgia, serif", weight: 500, spacing: "-0.01em" },
];

export const OVERLAY_COLORS: Array<{ id: string; label: string; value: string }> = [
  { id: "white", label: "White", value: "#ffffff" },
  { id: "black", label: "Ink", value: "#0d0d0d" },
  { id: "amber", label: "Amber", value: "#ffb547" },
  { id: "crimson", label: "Crimson", value: "#e5484d" },
  { id: "hot", label: "Hot pink", value: "#ff4fa3" },
  { id: "sun", label: "Sun", value: "#ffe14d" },
  { id: "lime", label: "Lime", value: "#a3f04d" },
  { id: "mint", label: "Mint", value: "#3ee0b0" },
  { id: "sky", label: "Sky", value: "#4fc3ff" },
  { id: "violet", label: "Violet", value: "#a97bff" },
  { id: "peach", label: "Peach", value: "#ff9b6a" },
  { id: "cocoa", label: "Cocoa", value: "#8a5a3c" },
];

export type OverlayStyle =
  | "plain"
  | "ember"
  | "block"
  | "outline"
  | "glow"
  | "sticker"
  | "shadow"
  | "tape";

export const OVERLAY_STYLES: Array<{ id: OverlayStyle; label: string }> = [
  { id: "plain", label: "Clean" },
  { id: "shadow", label: "Pop" },
  { id: "outline", label: "Outline" },
  { id: "glow", label: "Glow" },
  { id: "sticker", label: "Sticker" },
  { id: "block", label: "Ember bar" },
  { id: "tape", label: "Tape" },
  { id: "ember", label: "Fire" },
];

export type OverlayPlace = "top" | "middle" | "bottom";

export type MomentOverlay = {
  text: string;
  font: OverlayFont;
  style: OverlayStyle;
  place: OverlayPlace;
  color: string;
  x: number; // 0-100, centre of the text block
  y: number; // 0-100
  size: number; // px at a 9:16 preview width
  rotate: number; // degrees
};

export const DEFAULT_OVERLAY: Omit<MomentOverlay, "text"> = {
  font: "party",
  style: "shadow",
  place: "middle",
  color: "#ffffff",
  x: 50,
  y: 50,
  size: 30,
  rotate: 0,
};

function fontDef(font?: string | null): FontDef {
  return OVERLAY_FONTS.find((f) => f.id === font) ?? OVERLAY_FONTS[0]!;
}

export function overlayFontStyle(font?: string | null): React.CSSProperties {
  const f = fontDef(font);
  return {
    fontFamily: f.family,
    fontWeight: f.weight,
    letterSpacing: f.spacing,
    textTransform: f.upper ? "uppercase" : undefined,
  };
}

/** Legacy helper kept so older render paths keep working. */
export function overlayFontClass(): string {
  return "";
}

export function overlayStyleProps(
  style: string | null | undefined,
  color: string,
): { className: string; style: React.CSSProperties } {
  switch (style) {
    case "ember":
      return {
        className: "ember-text",
        style: { filter: "drop-shadow(0 2px 18px rgba(0,0,0,0.7))" },
      };
    case "block":
      return {
        className: "px-3 py-1.5 rounded-xl text-primary-foreground",
        style: { backgroundImage: "var(--gradient-ember)" },
      };
    case "outline":
      return {
        className: "",
        style: {
          color,
          WebkitTextStroke: "2px rgba(0,0,0,0.9)",
          paintOrder: "stroke fill",
          textShadow: "0 4px 16px rgba(0,0,0,0.45)",
        } as React.CSSProperties,
      };
    case "glow":
      return {
        className: "",
        style: { color, textShadow: `0 0 10px ${color}, 0 0 28px ${color}, 0 2px 10px rgba(0,0,0,0.6)` },
      };
    case "sticker":
      return {
        className: "px-3.5 py-1.5 rounded-2xl",
        style: { background: "#fff", color: color === "#ffffff" ? "#0d0d0d" : color, boxShadow: "0 8px 24px rgba(0,0,0,0.35)" },
      };
    case "tape":
      return {
        className: "px-3.5 py-1.5 rounded-md",
        style: {
          background: "rgba(0,0,0,0.55)",
          color,
          backdropFilter: "blur(6px)",
          boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        },
      };
    case "shadow":
      return {
        className: "",
        style: { color, textShadow: "0 3px 0 rgba(0,0,0,0.55), 0 10px 26px rgba(0,0,0,0.5)" },
      };
    default:
      return { className: "", style: { color, textShadow: "0 2px 14px rgba(0,0,0,0.85)" } };
  }
}

/** Legacy helper kept so older render paths keep working. */
export function overlayStyleClass(): string {
  return "";
}

export function overlayPlaceClass(place?: string | null): string {
  if (place === "top") return "items-start pt-20";
  if (place === "bottom") return "items-end pb-44";
  return "items-center";
}

function num(v: unknown, fallback: number, min: number, max: number): number {
  const n = typeof v === "number" && Number.isFinite(v) ? v : fallback;
  return Math.min(max, Math.max(min, n));
}

export function parseOverlay(value: unknown): MomentOverlay | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<MomentOverlay>;
  if (!v.text || typeof v.text !== "string") return null;
  const place = (v.place ?? "middle") as OverlayPlace;
  const fallbackY = place === "top" ? 18 : place === "bottom" ? 80 : 50;
  return {
    text: v.text.slice(0, 120),
    font: (v.font ?? DEFAULT_OVERLAY.font) as OverlayFont,
    style: (v.style ?? DEFAULT_OVERLAY.style) as OverlayStyle,
    place,
    color: typeof v.color === "string" ? v.color.slice(0, 12) : DEFAULT_OVERLAY.color,
    x: num(v.x, 50, 4, 96),
    y: num(v.y, fallbackY, 4, 96),
    size: num(v.size, DEFAULT_OVERLAY.size, 14, 64),
    rotate: num(v.rotate, 0, -30, 30),
  };
}

