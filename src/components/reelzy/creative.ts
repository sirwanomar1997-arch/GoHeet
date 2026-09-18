/**
 * GoHeet creative kit — the small, opinionated set of looks and type styles a
 * moment can carry. Kept deliberately tight: GoHeet is about the real frame,
 * so the treatments are graded like film stock, never like face filters.
 */

export type FilterCategory =
  | "Exclusive"
  | "Signature"
  | "Cinema"
  | "Film"
  | "Street"
  | "Glow"
  | "Night"
  | "Mono"
  | "Retro"
  | "Dreamy";

export const FILTER_CATEGORIES: FilterCategory[] = [
  "Exclusive",
  "Signature",
  "Cinema",
  "Film",
  "Street",
  "Glow",
  "Night",
  "Mono",
  "Retro",
  "Dreamy",
];

export type FilterId = string;

/** A grade layer sits over the frame and is blended into it, like a LUT pass. */
export type GradeLayer = { bg: string; blend: string; opacity?: number };

type FilterDef = {
  id: string;
  label: string;
  category: FilterCategory;
  /** Base tone curve applied to the pixels. */
  css: string;
  /** Colour passes blended on top — this is what makes a look feel graded. */
  layers?: GradeLayer[];
  swatch: string;
};

const VIGNETTE_SOFT: GradeLayer = {
  bg: "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.42) 100%)",
  blend: "multiply",
};
const VIGNETTE_HARD: GradeLayer = {
  bg: "radial-gradient(110% 80% at 50% 45%, rgba(0,0,0,0) 42%, rgba(0,0,0,0.7) 100%)",
  blend: "multiply",
};
const HALATION: GradeLayer = {
  bg: "radial-gradient(80% 60% at 50% 40%, rgba(255,168,96,0.35), rgba(255,120,60,0) 70%)",
  blend: "screen",
  opacity: 0.7,
};

/**
 * A pro grade library. Each look is a tone curve plus blended colour passes —
 * shadows, highlights, bloom and vignette — so the frame is transformed the way
 * a LUT would, never warped like a face filter.
 */
export const FILTERS: FilterDef[] = [
  // ── Exclusive: the headline grades. Each one is a full LUT-style stack —
  // split-toned shadows and highlights, bloom, and a shaped vignette.
  {
    id: "aurora",
    label: "Aurora",
    category: "Exclusive",
    css: "contrast(1.24) saturate(1.3) brightness(1.02)",
    layers: [
      { bg: "linear-gradient(190deg, rgba(0,255,200,0.26), rgba(0,0,0,0) 48%, rgba(150,70,255,0.3))", blend: "soft-light" },
      { bg: "radial-gradient(70% 50% at 50% 22%, rgba(120,255,225,0.28), rgba(0,0,0,0) 72%)", blend: "screen", opacity: 0.8 },
      { bg: "linear-gradient(180deg, rgba(4,10,28,0.34), rgba(0,0,0,0) 55%)", blend: "multiply", opacity: 0.8 },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#5ef0c8,#7a3cff)",
  },
  {
    id: "velvet",
    label: "Velvet",
    category: "Exclusive",
    css: "contrast(1.3) saturate(1.08) brightness(0.97)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(255,90,140,0.22), rgba(18,6,30,0.42))", blend: "soft-light" },
      { bg: "radial-gradient(75% 55% at 50% 42%, rgba(255,180,200,0.2), rgba(0,0,0,0) 70%)", blend: "screen", opacity: 0.65 },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#ff6a9c,#1a0720)",
  },
  {
    id: "goldhour",
    label: "Gold Hour",
    category: "Exclusive",
    css: "contrast(1.18) saturate(1.22) brightness(1.05) sepia(0.06)",
    layers: [
      { bg: "linear-gradient(200deg, rgba(255,196,92,0.34), rgba(255,120,50,0.2) 60%, rgba(40,20,10,0.3))", blend: "soft-light" },
      HALATION,
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#ffd27a,#c2521a)",
  },
  {
    id: "obsidian",
    label: "Obsidian",
    category: "Exclusive",
    css: "contrast(1.42) saturate(0.82) brightness(0.95)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(180,210,255,0.16), rgba(0,0,0,0.5))", blend: "soft-light" },
      { bg: "radial-gradient(85% 65% at 50% 38%, rgba(255,255,255,0.12), rgba(0,0,0,0) 68%)", blend: "screen", opacity: 0.6 },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#7f8c9c,#07090d)",
  },
  {
    id: "porcelain",
    label: "Porcelain",
    category: "Exclusive",
    css: "contrast(1.06) saturate(1.04) brightness(1.08)",
    layers: [
      { bg: "radial-gradient(78% 58% at 50% 32%, rgba(255,246,238,0.32), rgba(255,255,255,0) 74%)", blend: "screen" },
      { bg: "linear-gradient(180deg, rgba(255,225,210,0.18), rgba(200,215,235,0.2))", blend: "soft-light" },
      { bg: "radial-gradient(130% 95% at 50% 45%, rgba(0,0,0,0) 60%, rgba(30,26,24,0.28) 100%)", blend: "multiply" },
    ],
    swatch: "linear-gradient(135deg,#fff4ec,#d7e2ee)",
  },
  {
    id: "neonrain",
    label: "Neon Rain",
    category: "Exclusive",
    css: "contrast(1.34) saturate(1.5) brightness(0.98)",
    layers: [
      { bg: "linear-gradient(160deg, rgba(0,190,255,0.32), rgba(0,0,0,0) 50%, rgba(255,0,140,0.34))", blend: "soft-light" },
      { bg: "radial-gradient(60% 45% at 30% 30%, rgba(0,220,255,0.26), rgba(0,0,0,0) 70%)", blend: "screen" },
      { bg: "radial-gradient(60% 45% at 75% 70%, rgba(255,40,160,0.24), rgba(0,0,0,0) 70%)", blend: "screen" },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#00d9ff,#ff1f8f)",
  },
  {
    id: "desertsilk",
    label: "Desert Silk",
    category: "Exclusive",
    css: "contrast(1.12) saturate(1.1) brightness(1.04) sepia(0.12)",
    layers: [
      { bg: "linear-gradient(190deg, rgba(240,190,140,0.3), rgba(150,110,90,0.26))", blend: "soft-light" },
      { bg: "radial-gradient(80% 60% at 50% 30%, rgba(255,230,200,0.24), rgba(0,0,0,0) 72%)", blend: "screen", opacity: 0.7 },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#efc79a,#8d6248)",
  },
  {
    id: "midnightblue",
    label: "Midnight Blue",
    category: "Exclusive",
    css: "contrast(1.28) saturate(1.06) brightness(0.97)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(90,150,255,0.3), rgba(6,10,32,0.44))", blend: "soft-light" },
      { bg: "radial-gradient(70% 50% at 50% 34%, rgba(190,220,255,0.18), rgba(0,0,0,0) 70%)", blend: "screen", opacity: 0.7 },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#5b95ff,#060a20)",
  },
  {
    id: "emberglass",
    label: "Ember Glass",
    category: "Exclusive",
    css: "contrast(1.26) saturate(1.24) brightness(1.01)",
    layers: [
      { bg: "linear-gradient(210deg, rgba(255,120,40,0.28), rgba(0,0,0,0) 55%, rgba(0,120,160,0.26))", blend: "soft-light" },
      HALATION,
      { bg: "linear-gradient(0deg, rgba(60,20,0,0.3), rgba(0,0,0,0) 58%)", blend: "multiply", opacity: 0.8 },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#ff8a3c,#0b6a86)",
  },
  {
    id: "platinum",
    label: "Platinum",
    category: "Exclusive",
    css: "contrast(1.2) saturate(0.2) brightness(1.05)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(220,235,255,0.2), rgba(255,240,225,0.18))", blend: "soft-light" },
      { bg: "radial-gradient(80% 60% at 50% 30%, rgba(255,255,255,0.2), rgba(0,0,0,0) 72%)", blend: "screen", opacity: 0.7 },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#eef3f8,#9aa4ad)",
  },
  {
    id: "rosegold",
    label: "Rose Gold",
    category: "Exclusive",
    css: "contrast(1.14) saturate(1.16) brightness(1.06)",
    layers: [
      { bg: "linear-gradient(200deg, rgba(255,190,175,0.32), rgba(255,215,150,0.22) 60%, rgba(90,50,60,0.24))", blend: "soft-light" },
      { bg: "radial-gradient(70% 52% at 45% 30%, rgba(255,225,215,0.26), rgba(0,0,0,0) 72%)", blend: "screen", opacity: 0.75 },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#ffcabb,#c98a63)",
  },
  {
    id: "jade",
    label: "Jade",
    category: "Exclusive",
    css: "contrast(1.22) saturate(1.18) brightness(1.0)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(60,200,160,0.28), rgba(10,40,35,0.34))", blend: "soft-light" },
      { bg: "radial-gradient(72% 54% at 50% 32%, rgba(210,255,240,0.2), rgba(0,0,0,0) 70%)", blend: "screen", opacity: 0.7 },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#43d6a5,#0b2a24)",
  },
  {
    id: "supernova",
    label: "Supernova",
    category: "Exclusive",
    css: "contrast(1.3) saturate(1.34) brightness(1.04)",
    layers: [
      { bg: "radial-gradient(55% 40% at 50% 28%, rgba(255,235,180,0.4), rgba(0,0,0,0) 70%)", blend: "screen" },
      { bg: "linear-gradient(200deg, rgba(255,110,60,0.26), rgba(120,60,255,0.26))", blend: "soft-light" },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#ffe9a8,#7a3cff)",
  },
  {
    id: "noirlux",
    label: "Noir Lux",
    category: "Exclusive",
    css: "contrast(1.5) saturate(0.06) brightness(0.98)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(255,240,215,0.14), rgba(0,0,0,0.42))", blend: "soft-light" },
      { bg: "radial-gradient(62% 46% at 50% 34%, rgba(255,255,255,0.16), rgba(0,0,0,0) 70%)", blend: "screen", opacity: 0.7 },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#f2ede4,#101010)",
  },

  { id: "none", label: "Real", category: "Signature", css: "none", swatch: "linear-gradient(135deg,#8d8d8d,#e6e6e6)" },
  {
    id: "goheet",
    label: "GoHeet",
    category: "Signature",
    css: "contrast(1.16) saturate(1.14) brightness(1.02)",
    layers: [
      { bg: "linear-gradient(200deg, rgba(255,140,60,0.30), rgba(255,60,120,0.16) 55%, rgba(10,20,40,0.28))", blend: "soft-light" },
      { bg: "linear-gradient(0deg, rgba(255,110,40,0.16), rgba(0,0,0,0) 60%)", blend: "screen" },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#ff8a3c,#ff2f7a)",
  },
  {
    id: "crisp",
    label: "Crisp",
    category: "Signature",
    css: "contrast(1.12) saturate(1.1) brightness(1.03) sepia(0.03)",
    layers: [{ bg: "linear-gradient(180deg, rgba(180,220,255,0.12), rgba(255,240,220,0.12))", blend: "soft-light" }],
    swatch: "linear-gradient(135deg,#dfe9f0,#ffffff)",
  },
  {
    id: "punch",
    label: "Punch",
    category: "Signature",
    css: "contrast(1.28) saturate(1.32) brightness(0.99)",
    layers: [
      { bg: "linear-gradient(160deg, rgba(255,80,40,0.16), rgba(0,90,255,0.18))", blend: "soft-light" },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#ff5722,#2962ff)",
  },
  {
    id: "clean4k",
    label: "Clean",
    category: "Signature",
    css: "contrast(1.07) saturate(1.06) brightness(1.04)",
    layers: [{ bg: "radial-gradient(90% 70% at 50% 35%, rgba(255,255,255,0.14), rgba(255,255,255,0) 70%)", blend: "soft-light" }],
    swatch: "linear-gradient(135deg,#f2f2f2,#c9d4dc)",
  },

  {
    id: "tealorange",
    label: "Teal & Orange",
    category: "Cinema",
    css: "contrast(1.22) saturate(1.12) brightness(0.98)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(0,150,180,0.30), rgba(255,150,70,0.26))", blend: "soft-light" },
      { bg: "linear-gradient(180deg, rgba(0,40,60,0.35), rgba(0,0,0,0) 60%)", blend: "multiply", opacity: 0.7 },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#0f3b45,#e2a05a)",
  },
  {
    id: "blockbuster",
    label: "Blockbuster",
    category: "Cinema",
    css: "contrast(1.32) saturate(1.06) brightness(0.95)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(20,60,90,0.4), rgba(255,120,50,0.22))", blend: "overlay", opacity: 0.75 },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#0d2233,#c96a2e)",
  },
  {
    id: "anamorphic",
    label: "Anamorphic",
    category: "Cinema",
    css: "contrast(1.24) saturate(0.94) brightness(0.96)",
    layers: [
      { bg: "linear-gradient(90deg, rgba(60,140,255,0.22), rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(60,140,255,0.22))", blend: "screen", opacity: 0.6 },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#12212b,#8fa6b2)",
  },
  {
    id: "noirfilm",
    label: "Thriller",
    category: "Cinema",
    css: "contrast(1.4) saturate(0.72) brightness(0.9)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(0,30,60,0.5), rgba(0,0,0,0.2))", blend: "multiply", opacity: 0.6 },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#0a0f16,#7a8a99)",
  },
  {
    id: "desert",
    label: "Desert",
    category: "Cinema",
    css: "contrast(1.18) saturate(1.1) sepia(0.14) brightness(1.03)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(255,190,110,0.3), rgba(120,60,20,0.2))", blend: "soft-light" },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#e2b06a,#8a4a24)",
  },

  {
    id: "kodak",
    label: "Kodak 250D",
    category: "Film",
    css: "contrast(1.1) saturate(1.18) sepia(0.14) brightness(1.03)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(255,210,150,0.24), rgba(60,90,120,0.16))", blend: "soft-light" },
      HALATION,
    ],
    swatch: "linear-gradient(135deg,#f2c14e,#c1662f)",
  },
  {
    id: "portra",
    label: "Portra",
    category: "Film",
    css: "contrast(1.04) saturate(0.98) brightness(1.06) sepia(0.08)",
    layers: [{ bg: "linear-gradient(180deg, rgba(255,200,180,0.24), rgba(200,220,255,0.14))", blend: "soft-light" }],
    swatch: "linear-gradient(135deg,#f2d3c2,#e8cfae)",
  },
  {
    id: "cinestill",
    label: "Cinestill",
    category: "Film",
    css: "contrast(1.16) saturate(1.12) brightness(1.02)",
    layers: [
      { bg: "radial-gradient(70% 50% at 50% 45%, rgba(255,60,60,0.28), rgba(255,60,60,0) 72%)", blend: "screen", opacity: 0.8 },
      { bg: "linear-gradient(180deg, rgba(0,60,120,0.24), rgba(0,0,0,0))", blend: "soft-light" },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#ff5f6d,#123a63)",
  },
  {
    id: "super8",
    label: "Super 8",
    category: "Film",
    css: "contrast(1.2) saturate(1.34) sepia(0.34) brightness(0.99)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(255,170,60,0.3), rgba(90,40,10,0.28))", blend: "overlay", opacity: 0.7 },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#d9a441,#7a3b1e)",
  },
  {
    id: "grainbw",
    label: "Tri-X",
    category: "Film",
    css: "grayscale(1) contrast(1.34) brightness(0.98)",
    layers: [VIGNETTE_HARD],
    swatch: "linear-gradient(135deg,#1a1a1a,#cfcfcf)",
  },

  {
    id: "streetpop",
    label: "Street Pop",
    category: "Street",
    css: "contrast(1.24) saturate(1.42) brightness(1.02)",
    layers: [
      { bg: "linear-gradient(150deg, rgba(255,60,120,0.2), rgba(0,180,255,0.2))", blend: "soft-light" },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#ff2e63,#00b8ff)",
  },
  {
    id: "concrete",
    label: "Concrete",
    category: "Street",
    css: "contrast(1.2) saturate(0.82) brightness(1.0)",
    layers: [{ bg: "linear-gradient(180deg, rgba(150,170,190,0.24), rgba(40,40,45,0.24))", blend: "soft-light" }],
    swatch: "linear-gradient(135deg,#8d97a1,#3b3f45)",
  },
  {
    id: "tokyo",
    label: "Tokyo",
    category: "Street",
    css: "contrast(1.26) saturate(1.34) brightness(1.0)",
    layers: [
      { bg: "linear-gradient(200deg, rgba(255,40,150,0.24), rgba(40,90,255,0.28))", blend: "overlay", opacity: 0.7 },
      { bg: "radial-gradient(80% 60% at 50% 60%, rgba(255,120,200,0.2), rgba(0,0,0,0) 70%)", blend: "screen" },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#ff2f9e,#2a5bff)",
  },
  {
    id: "skate",
    label: "Skate",
    category: "Street",
    css: "contrast(1.3) saturate(1.16) brightness(1.01) sepia(0.06)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(255,220,140,0.22), rgba(0,50,90,0.24))", blend: "soft-light" },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#f0c56a,#173a55)",
  },

  {
    id: "goldenhour",
    label: "Golden Hour",
    category: "Glow",
    css: "contrast(1.08) saturate(1.2) brightness(1.06) sepia(0.12)",
    layers: [
      { bg: "linear-gradient(200deg, rgba(255,190,90,0.36), rgba(255,110,60,0.18))", blend: "screen", opacity: 0.6 },
      HALATION,
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#ffcf7a,#f08a3c)",
  },
  {
    id: "sunkissed",
    label: "Sunkissed",
    category: "Glow",
    css: "contrast(1.06) saturate(1.24) brightness(1.08) sepia(0.1)",
    layers: [{ bg: "radial-gradient(70% 60% at 65% 25%, rgba(255,220,150,0.42), rgba(255,180,90,0) 70%)", blend: "screen" }],
    swatch: "linear-gradient(135deg,#ffb26b,#ffe7c2)",
  },
  {
    id: "bloom",
    label: "Bloom",
    category: "Glow",
    css: "contrast(1.02) saturate(1.14) brightness(1.08)",
    layers: [
      { bg: "radial-gradient(90% 70% at 50% 40%, rgba(255,255,255,0.34), rgba(255,255,255,0) 72%)", blend: "screen", opacity: 0.8 },
      { bg: "linear-gradient(180deg, rgba(255,190,220,0.18), rgba(180,220,255,0.18))", blend: "soft-light" },
    ],
    swatch: "linear-gradient(135deg,#ffe9f3,#dff0ff)",
  },
  {
    id: "ember",
    label: "Ember",
    category: "Glow",
    css: "contrast(1.16) saturate(1.3) brightness(1.02)",
    layers: [
      { bg: "linear-gradient(0deg, rgba(255,90,30,0.34), rgba(255,40,90,0.12) 55%, rgba(0,0,0,0))", blend: "screen", opacity: 0.75 },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#ffb547,#e5484d)",
  },

  {
    id: "neonnight",
    label: "Neon",
    category: "Night",
    css: "contrast(1.28) saturate(1.5) brightness(1.06)",
    layers: [
      { bg: "linear-gradient(200deg, rgba(120,40,255,0.3), rgba(255,40,140,0.26))", blend: "overlay", opacity: 0.75 },
      { bg: "radial-gradient(80% 60% at 50% 60%, rgba(0,220,255,0.22), rgba(0,0,0,0) 70%)", blend: "screen" },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#5b2bd6,#ff4fa3)",
  },
  {
    id: "midnight",
    label: "Midnight",
    category: "Night",
    css: "contrast(1.18) saturate(1.06) brightness(1.14)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(20,40,90,0.4), rgba(0,10,30,0.36))", blend: "soft-light" },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#0e1524,#4a5c85)",
  },
  {
    id: "citylight",
    label: "City Lights",
    category: "Night",
    css: "contrast(1.14) saturate(1.18) brightness(1.16) sepia(0.06)",
    layers: [
      { bg: "radial-gradient(70% 60% at 50% 55%, rgba(255,180,90,0.28), rgba(0,0,0,0) 70%)", blend: "screen" },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#2b2b38,#ffb96b)",
  },
  {
    id: "clubhouse",
    label: "Club",
    category: "Night",
    css: "contrast(1.34) saturate(1.44) brightness(1.04)",
    layers: [
      { bg: "linear-gradient(120deg, rgba(255,0,120,0.28), rgba(0,90,255,0.3))", blend: "overlay", opacity: 0.7 },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#ff0078,#0a5bff)",
  },

  {
    id: "noir",
    label: "Noir",
    category: "Mono",
    css: "grayscale(1) contrast(1.36) brightness(0.94)",
    layers: [VIGNETTE_HARD],
    swatch: "linear-gradient(135deg,#101010,#d8d8d8)",
  },
  {
    id: "silver",
    label: "Silver",
    category: "Mono",
    css: "grayscale(1) contrast(1.08) brightness(1.1)",
    swatch: "linear-gradient(135deg,#7d7d7d,#f2f2f2)",
  },
  {
    id: "sepiatone",
    label: "Sepia",
    category: "Mono",
    css: "grayscale(1) sepia(0.5) contrast(1.14) brightness(1.02)",
    layers: [{ bg: "linear-gradient(180deg, rgba(255,200,140,0.24), rgba(90,50,20,0.2))", blend: "soft-light" }],
    swatch: "linear-gradient(135deg,#d8b483,#5a3a20)",
  },
  {
    id: "bluemono",
    label: "Blue Mono",
    category: "Mono",
    css: "grayscale(1) contrast(1.22) brightness(1.0)",
    layers: [{ bg: "linear-gradient(180deg, rgba(90,150,255,0.36), rgba(10,20,50,0.3))", blend: "soft-light" }],
    swatch: "linear-gradient(135deg,#20304f,#b9cbe8)",
  },

  {
    id: "vhs",
    label: "VHS",
    category: "Retro",
    css: "contrast(1.14) saturate(1.4) brightness(1.04)",
    layers: [
      { bg: "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, rgba(0,0,0,0) 1px 3px)", blend: "overlay" },
      { bg: "linear-gradient(90deg, rgba(255,0,80,0.16), rgba(0,180,255,0.16))", blend: "screen", opacity: 0.6 },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#ff2e88,#00c2ff)",
  },
  {
    id: "polaroid",
    label: "Polaroid",
    category: "Retro",
    css: "contrast(0.96) saturate(0.94) brightness(1.1) sepia(0.16)",
    layers: [{ bg: "linear-gradient(180deg, rgba(255,240,210,0.3), rgba(150,180,160,0.16))", blend: "soft-light" }],
    swatch: "linear-gradient(135deg,#e8dcc8,#b9c7bd)",
  },
  {
    id: "faded90",
    label: "'90s",
    category: "Retro",
    css: "contrast(0.94) saturate(0.86) brightness(1.1)",
    layers: [{ bg: "linear-gradient(180deg, rgba(255,220,200,0.28), rgba(120,140,160,0.22))", blend: "screen", opacity: 0.5 }],
    swatch: "linear-gradient(135deg,#cfc3b8,#ece7e0)",
  },
  {
    id: "disposable",
    label: "Disposable",
    category: "Retro",
    css: "contrast(1.24) saturate(1.28) brightness(1.06)",
    layers: [
      { bg: "radial-gradient(60% 45% at 50% 40%, rgba(255,255,220,0.32), rgba(0,0,0,0) 70%)", blend: "screen" },
      VIGNETTE_HARD,
    ],
    swatch: "linear-gradient(135deg,#fff2b0,#3a3a3a)",
  },

  {
    id: "pastel",
    label: "Pastel",
    category: "Dreamy",
    css: "contrast(0.96) saturate(1.08) brightness(1.1)",
    layers: [{ bg: "linear-gradient(200deg, rgba(255,190,220,0.28), rgba(170,220,255,0.26))", blend: "soft-light" }],
    swatch: "linear-gradient(135deg,#ffc8e0,#bfe4ff)",
  },
  {
    id: "haze",
    label: "Haze",
    category: "Dreamy",
    css: "contrast(0.98) saturate(1.06) brightness(1.08)",
    layers: [
      { bg: "linear-gradient(0deg, rgba(255,255,255,0.24), rgba(255,255,255,0) 60%)", blend: "screen" },
      { bg: "linear-gradient(180deg, rgba(255,200,160,0.2), rgba(140,180,220,0.2))", blend: "soft-light" },
    ],
    swatch: "linear-gradient(135deg,#f6e6de,#cfe0f0)",
  },
  {
    id: "cotton",
    label: "Cotton",
    category: "Dreamy",
    css: "contrast(1.0) saturate(1.16) brightness(1.06)",
    layers: [{ bg: "radial-gradient(80% 60% at 30% 25%, rgba(255,180,255,0.28), rgba(160,255,235,0.22))", blend: "soft-light" }],
    swatch: "linear-gradient(135deg,#ffb3f0,#a6ffe6)",
  },
  {
    id: "moonlight",
    label: "Moonlight",
    category: "Dreamy",
    css: "contrast(1.12) saturate(0.9) brightness(1.06)",
    layers: [
      { bg: "linear-gradient(180deg, rgba(150,190,255,0.32), rgba(20,30,60,0.26))", blend: "soft-light" },
      VIGNETTE_SOFT,
    ],
    swatch: "linear-gradient(135deg,#9fc0ff,#1b2440)",
  },
];

export function filterCss(id?: string | null): string | undefined {
  if (!id || id === "none") return undefined;
  return FILTERS.find((f) => f.id === id)?.css;
}

/** Blend passes for a look, ready to render as stacked absolute layers. */
export function filterLayers(id?: string | null): GradeLayer[] {
  if (!id || id === "none") return [];
  return FILTERS.find((f) => f.id === id)?.layers ?? [];
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
    text: v.text.slice(0, 200),
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

