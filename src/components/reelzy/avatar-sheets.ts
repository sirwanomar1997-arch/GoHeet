/**
 * Real rendered picture tiles for the wardrobe.
 * Every option the user can tap maps to a cell of a rendered sprite sheet, so
 * they SEE the hairstyle / outfit / nose / earring instead of reading its name.
 */
import hairMale from "@/assets/hair-male-sheet.png";
import hairMale2 from "@/assets/hair-male-sheet-2.png";
import hairFemale from "@/assets/hair-female-sheet.png";
import hairFemale2 from "@/assets/hair-female-sheet-2.png";
import outfitMale from "@/assets/outfit-male-sheet.png";
import outfitMale2 from "@/assets/outfit-male-sheet-2.png";
import outfitFemale from "@/assets/outfit-female-sheet.png";
import outfitFemale2 from "@/assets/outfit-female-sheet-2.png";
import faceMale from "@/assets/face-male-sheet.png";
import faceFemale from "@/assets/face-female-sheet.png";
import eyesMale from "@/assets/eyes-male-sheet.png";
import eyesFemale from "@/assets/eyes-female-sheet.png";
import browsMale from "@/assets/brows-male-sheet.png";
import browsFemale from "@/assets/brows-female-sheet.png";
import lipsMale from "@/assets/lips-male-sheet.png";
import lipsFemale from "@/assets/lips-female-sheet.png";
import noseSheet from "@/assets/nose-sheet.png";
import earsSheet from "@/assets/ears-sheet.png";
import eyewearSheet from "@/assets/eyewear-sheet.png";
import headwearMale from "@/assets/headwear-male-sheet.png";
import headwearFemale from "@/assets/headwear-female-sheet.png";
import jewelryMale from "@/assets/jewelry-male-sheet.png";
import jewelryFemale from "@/assets/jewelry-female-sheet.png";
import makeupSheet from "@/assets/makeup-sheet.png";
import beardSheet from "@/assets/beard-sheet.png";

export type Cell = { sheet: string; index: number; cols: number; rows: number };

type SheetDef = { sheet: string; cols: number; rows: number };

/** Sequential names → cells 0,1,2… of one sheet. */
function seq(def: SheetDef, names: readonly string[], offset = 0) {
  const out: Record<string, Cell> = {};
  names.forEach((n, i) => {
    out[n] = { sheet: def.sheet, index: i + offset, cols: def.cols, rows: def.rows };
  });
  return out;
}

/** Explicit name → cell index, for sheets where only some tiles are usable. */
function at(def: SheetDef, map: Record<string, number>) {
  const out: Record<string, Cell> = {};
  for (const [n, i] of Object.entries(map)) {
    out[n] = { sheet: def.sheet, index: i, cols: def.cols, rows: def.rows };
  }
  return out;
}

const S = {
  hairM: { sheet: hairMale, cols: 4, rows: 4 },
  hairM2: { sheet: hairMale2, cols: 4, rows: 4 },
  hairF: { sheet: hairFemale, cols: 4, rows: 4 },
  hairF2: { sheet: hairFemale2, cols: 4, rows: 4 },
  outM: { sheet: outfitMale, cols: 4, rows: 4 },
  outM2: { sheet: outfitMale2, cols: 4, rows: 4 },
  outF: { sheet: outfitFemale, cols: 4, rows: 4 },
  outF2: { sheet: outfitFemale2, cols: 4, rows: 4 },
  faceM: { sheet: faceMale, cols: 4, rows: 2 },
  faceF: { sheet: faceFemale, cols: 4, rows: 2 },
  eyesM: { sheet: eyesMale, cols: 4, rows: 2 },
  eyesF: { sheet: eyesFemale, cols: 4, rows: 2 },
  browsM: { sheet: browsMale, cols: 3, rows: 2 },
  browsF: { sheet: browsFemale, cols: 3, rows: 2 },
  lipsM: { sheet: lipsMale, cols: 3, rows: 2 },
  lipsF: { sheet: lipsFemale, cols: 3, rows: 3 },
  nose: { sheet: noseSheet, cols: 4, rows: 2 },
  ears: { sheet: earsSheet, cols: 3, rows: 2 },
  eyewear: { sheet: eyewearSheet, cols: 4, rows: 2 },
  headM: { sheet: headwearMale, cols: 4, rows: 4 },
  headF: { sheet: headwearFemale, cols: 4, rows: 3 },
  jewM: { sheet: jewelryMale, cols: 4, rows: 2 },
  jewF: { sheet: jewelryFemale, cols: 4, rows: 4 },
  makeup: { sheet: makeupSheet, cols: 4, rows: 4 },
  beard: { sheet: beardSheet, cols: 3, rows: 2 },
} satisfies Record<string, SheetDef>;

/* ---------------------------------------------------------------- hair --- */

export const HAIR_MALE = [
  "Buzz cut", "Crew cut", "Short swept-back", "Textured crop",
  "Messy fringe", "Side part", "Quiff", "Curly fade",
  "Afro", "Short dreadlocks", "Cornrows", "Man bun",
  "Shoulder-length waves", "Slicked-back long", "Mullet", "Bald",
  "Long layered", "Braided top knot", "High top fade", "Waves with fade",
  "Curtain hair", "Pompadour", "Slicked undercut", "Spiky short",
  "Bowl cut", "Twist-outs", "Long dreadlocks", "Half-up top knot",
  "Shaggy layers", "Faux hawk", "Buzz with line-up", "Loose curls",
] as const;

export const HAIR_FEMALE = [
  "Long straight", "Long loose waves", "Big bouncy curls", "Beach waves",
  "Chin-length bob", "Blunt lob with fringe", "Pixie cut", "Curtain bangs",
  "High ponytail", "Sleek low bun", "Messy top knot", "Half-up half-down",
  "Long box braids", "Cornrow braids", "Natural curly afro", "Space buns",
  "Sleek high bun", "Fishtail braid", "Dutch braids", "Bubble ponytail",
  "Ponytail with hair wrap", "Voluminous blowout", "Layered wolf cut", "Shag with bangs",
  "Micro braids", "Faux locs", "Bantu knots", "Finger waves",
  "Side-swept curls", "Low pigtails", "Chignon updo", "Straight hime cut",
] as const;

/* -------------------------------------------------------------- outfits --- */

export const OUTFIT_MALE = [
  "Crisp white shirt", "Oversized hoodie", "Denim jacket", "Leather biker jacket",
  "Crewneck sweater", "Ribbed turtleneck", "Tank top", "Tailored blazer",
  "Graphic tee", "Flannel shirt", "Varsity jacket", "Puffer coat",
  "Trench coat", "Open-collar linen shirt", "Track jacket", "Embroidered sherwani",
  "Suit and tie", "Polo shirt", "Bomber jacket", "Denim overshirt",
  "Wool overcoat", "Zip hoodie", "Baseball jersey", "Rugby shirt",
  "Utility vest", "Cable knit sweater", "Silk shirt", "Windbreaker",
  "Cardigan", "Kimono jacket", "Dashiki", "Turtleneck under blazer",
] as const;

export const OUTFIT_FEMALE = [
  "Soft knit sweater", "Silk slip dress", "Satin blouse", "Cropped denim jacket",
  "Ruffled blouse", "Ribbed turtleneck", "Floral summer dress", "Tailored blazer",
  "Oversized hoodie", "Knit cardigan", "Off-shoulder top", "Leather jacket",
  "Evening gown", "Linen shirt dress", "Crop top and jacket", "Embroidered kaftan",
  "Blazer dress", "Puff-sleeve blouse", "Corset top", "Wrap dress",
  "Trench coat", "Turtleneck sweater dress", "Sequin top", "Halter top",
  "Puffer coat", "Tweed jacket", "Silk kimono", "Cropped sporty hoodie",
  "Lace blouse", "Denim jacket over tee", "Velvet gown", "Saree drape",
] as const;

/* ------------------------------------------------------------- features --- */

export const FACE_SHAPES = [
  "Oval", "Round", "Square jaw", "Heart",
  "Long", "Sharp cheekbones", "Diamond", "Broad",
] as const;

export const EYE_SHAPES = [
  "Almond", "Round", "Wide-set", "Hooded",
  "Monolid", "Upturned", "Downturned", "Deep-set",
] as const;

export const BROWS_MALE = [
  "Soft arched", "Straight", "Thick bold", "Thin", "Bushy", "Angular",
] as const;

export const BROWS_FEMALE = [
  "Soft arched", "Sculpted arch", "Straight", "Feathered", "Thin", "Bold defined",
] as const;

export const LIPS_MALE = [
  "Thin", "Medium", "Full", "Wide smile", "Downturned", "Cupid's bow",
] as const;

export const LIPS_FEMALE = [
  "Full pout", "Heart-shaped", "Medium", "Wide smile", "Cupid's bow",
  "Thin", "Soft pout", "Rounded", "Defined edge",
] as const;

export const NOSES = [
  "Small button", "Straight", "Narrow", "Wide",
  "Roman bridge", "Upturned", "Rounded tip", "Aquiline",
] as const;

export const EARS = [
  "Small", "Medium", "Large", "Slightly protruding", "Pointed lobes", "Attached lobes",
] as const;

export const FACIAL_HAIR = [
  "Clean shaven", "Stubble", "Short beard", "Full beard", "Moustache", "Goatee",
] as const;

/* ---------------------------------------------------------- accessories --- */

export const EYEWEAR = [
  "None",
  "Thin metal glasses", "Bold square frames", "Round wire glasses", "Cat-eye frames",
  "Aviator sunglasses", "Retro shades", "Sport visor shades", "Clear-frame glasses",
] as const;

export const HEADWEAR_MALE = [
  "None", "Cap", "Beanie", "Bucket hat", "Bandana",
  "Cowboy hat", "Flat cap", "Backwards cap", "Headphones around neck",
] as const;

export const HEADWEAR_FEMALE = [
  "None", "Headband", "Beret", "Bucket hat", "Silk scarf tied back",
  "Hair bow", "Beanie", "Flower crown", "Headscarf", "Cap", "Sun visor",
] as const;

export const JEWELRY_MALE = [
  "Stud earrings", "Hoop earring", "Chunky chain", "Ear cuff",
  "Silver hoop", "Signet ring", "Leather cord necklace", "Nose ring",
] as const;

export const JEWELRY_FEMALE = [
  "Hoop earrings", "Stud earrings", "Drop earrings", "Pearl set",
  "Layered necklaces", "Chunky chain", "Delicate chain", "Pendant necklace",
  "Choker", "Ear cuff", "Statement rings", "Gold bangles",
] as const;

export const MAKEUP = [
  "Natural glow", "Soft matte base", "Winged eyeliner", "Smoky eyes",
  "Bold red lip", "Nude gloss", "Berry lip", "Warm blush",
  "Highlighted cheekbones", "Shimmer eyelids", "Graphic liner", "Bronzed contour",
] as const;

/* -------------------------------------------------------------- lookups --- */

const MALE: Record<string, Record<string, Cell>> = {
  hair: { ...seq(S.hairM, HAIR_MALE.slice(0, 16)), ...seq(S.hairM2, HAIR_MALE.slice(16)) },
  outfit: { ...seq(S.outM, OUTFIT_MALE.slice(0, 16)), ...seq(S.outM2, OUTFIT_MALE.slice(16)) },
  face: seq(S.faceM, FACE_SHAPES),
  eyeShape: seq(S.eyesM, EYE_SHAPES),
  brows: seq(S.browsM, BROWS_MALE),
  lips: seq(S.lipsM, LIPS_MALE),
  nose: seq(S.nose, NOSES),
  ears: seq(S.ears, EARS),
  facialHair: seq(S.beard, FACIAL_HAIR),
  eyewear: seq(S.eyewear, EYEWEAR.slice(1)),
  headwear: at(S.headM, {
    Cap: 0,
    Beanie: 1,
    "Bucket hat": 2,
    Bandana: 8,
    "Cowboy hat": 9,
    "Flat cap": 10,
    "Backwards cap": 11,
    "Headphones around neck": 15,
  }),
  jewelry: seq(S.jewM, JEWELRY_MALE),
};

const FEMALE: Record<string, Record<string, Cell>> = {
  hair: { ...seq(S.hairF, HAIR_FEMALE.slice(0, 16)), ...seq(S.hairF2, HAIR_FEMALE.slice(16)) },
  outfit: { ...seq(S.outF, OUTFIT_FEMALE.slice(0, 16)), ...seq(S.outF2, OUTFIT_FEMALE.slice(16)) },
  face: seq(S.faceF, FACE_SHAPES),
  eyeShape: seq(S.eyesF, EYE_SHAPES),
  brows: seq(S.browsF, BROWS_FEMALE),
  lips: seq(S.lipsF, LIPS_FEMALE),
  nose: seq(S.nose, NOSES),
  ears: seq(S.ears, EARS),
  eyewear: seq(S.eyewear, EYEWEAR.slice(1)),
  headwear: at(S.headF, {
    Headband: 0,
    Beret: 1,
    "Bucket hat": 2,
    "Silk scarf tied back": 4,
    "Hair bow": 5,
    Beanie: 6,
    "Flower crown": 7,
    Headscarf: 9,
    Cap: 10,
    "Sun visor": 11,
  }),
  jewelry: at(S.jewF, {
    "Hoop earrings": 0,
    "Stud earrings": 1,
    "Drop earrings": 2,
    "Pearl set": 3,
    "Layered necklaces": 5,
    "Chunky chain": 6,
    "Delicate chain": 8,
    "Pendant necklace": 9,
    Choker: 10,
    "Ear cuff": 12,
    "Statement rings": 13,
    "Gold bangles": 14,
  }),
  makeup: seq(S.makeup, MAKEUP),
};

/** Sprite cell for an option, when a rendered picture exists for it. */
export function cellFor(group: string, value: string, gender?: string): Cell | null {
  const table = gender === "Female" ? FEMALE : MALE;
  return table[group]?.[value] ?? null;
}

/** Inline style that crops the sheet down to a single cell. */
export function cellStyle(cell: Cell): React.CSSProperties {
  const col = cell.index % cell.cols;
  const row = Math.floor(cell.index / cell.cols);
  return {
    backgroundImage: `url(${cell.sheet})`,
    backgroundSize: `${cell.cols * 100}% ${cell.rows * 100}%`,
    backgroundPosition: `${(col * 100) / (cell.cols - 1)}% ${(row * 100) / (cell.rows - 1)}%`,
  };
}
