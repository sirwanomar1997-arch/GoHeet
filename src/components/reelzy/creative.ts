/**
 * Reelzy creative kit — the small, opinionated set of looks and type styles a
 * moment can carry. Kept deliberately tight: Reelzy is about the real frame,
 * so the treatments are graded like film stock, never like face filters.
 */

export type FilterId =
  | "none"
  | "ember"
  | "noir"
  | "kodak"
  | "frost"
  | "dusk"
  | "bleach"
  | "super8";

export const FILTERS: Array<{ id: FilterId; label: string; css: string; swatch: string }> = [
  { id: "none", label: "Real", css: "none", swatch: "linear-gradient(135deg,#8d8d8d,#e6e6e6)" },
  {
    id: "ember",
    label: "Ember",
    css: "saturate(1.25) contrast(1.08) sepia(0.18) hue-rotate(-8deg) brightness(1.02)",
    swatch: "linear-gradient(135deg,#ffb547,#e5484d)",
  },
  {
    id: "noir",
    label: "Noir",
    css: "grayscale(1) contrast(1.28) brightness(0.95)",
    swatch: "linear-gradient(135deg,#101010,#d8d8d8)",
  },
  {
    id: "kodak",
    label: "Kodak",
    css: "sepia(0.32) saturate(1.35) contrast(1.05) brightness(1.04)",
    swatch: "linear-gradient(135deg,#f2c14e,#c1662f)",
  },
  {
    id: "frost",
    label: "Frost",
    css: "saturate(0.85) contrast(1.06) hue-rotate(180deg) brightness(1.05)",
    swatch: "linear-gradient(135deg,#a8d8ff,#e8f4ff)",
  },
  {
    id: "dusk",
    label: "Dusk",
    css: "saturate(1.1) contrast(1.12) brightness(0.9) hue-rotate(-16deg)",
    swatch: "linear-gradient(135deg,#4b2d63,#ff8a5b)",
  },
  {
    id: "bleach",
    label: "Bleach",
    css: "saturate(0.45) contrast(1.3) brightness(1.12)",
    swatch: "linear-gradient(135deg,#e9e2d6,#9aa0a6)",
  },
  {
    id: "super8",
    label: "Super 8",
    css: "sepia(0.45) saturate(1.5) contrast(1.15) brightness(0.98)",
    swatch: "linear-gradient(135deg,#d9a441,#7a3b1e)",
  },
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

