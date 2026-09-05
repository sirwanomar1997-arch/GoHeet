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

export type OverlayFont = "display" | "mono" | "serif" | "stamp";

export const OVERLAY_FONTS: Array<{ id: OverlayFont; label: string; className: string }> = [
  { id: "display", label: "Bold", className: "font-display font-extrabold tracking-[-0.04em]" },
  { id: "mono", label: "Data", className: "data-figure font-medium" },
  { id: "serif", label: "Quiet", className: "font-serif italic tracking-tight" },
  {
    id: "stamp",
    label: "Stamp",
    className: "font-display font-black uppercase tracking-[0.18em]",
  },
];

export type OverlayStyle = "plain" | "ember" | "block";
export type OverlayPlace = "top" | "middle" | "bottom";

export type MomentOverlay = {
  text: string;
  font: OverlayFont;
  style: OverlayStyle;
  place: OverlayPlace;
};

export function overlayFontClass(font?: string | null): string {
  return OVERLAY_FONTS.find((f) => f.id === font)?.className ?? OVERLAY_FONTS[0]!.className;
}

export function overlayStyleClass(style?: string | null): string {
  if (style === "ember") return "ember-text drop-shadow-[0_2px_18px_oklch(0_0_0/70%)]";
  if (style === "block")
    return "bg-[image:var(--gradient-ember)] text-primary-foreground px-3 py-1.5 rounded-xl";
  return "text-foreground drop-shadow-[0_2px_14px_oklch(0_0_0/85%)]";
}

export function overlayPlaceClass(place?: string | null): string {
  if (place === "top") return "items-start pt-20";
  if (place === "bottom") return "items-end pb-44";
  return "items-center";
}

export function parseOverlay(value: unknown): MomentOverlay | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<MomentOverlay>;
  if (!v.text || typeof v.text !== "string") return null;
  return {
    text: v.text.slice(0, 120),
    font: (v.font ?? "display") as OverlayFont,
    style: (v.style ?? "plain") as OverlayStyle,
    place: (v.place ?? "middle") as OverlayPlace,
  };
}
