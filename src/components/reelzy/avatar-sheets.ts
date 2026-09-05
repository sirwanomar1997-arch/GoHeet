/**
 * Real rendered picture tiles for the wardrobe.
 * Each sprite sheet is a 4x4 grid of 3D renders; options map to a cell so the
 * user sees the actual hairstyle / outfit instead of reading its name.
 */
import hairMale from "@/assets/hair-male-sheet.png";
import hairFemale from "@/assets/hair-female-sheet.png";
import outfitMale from "@/assets/outfit-male-sheet.png";
import outfitFemale from "@/assets/outfit-female-sheet.png";

export type Cell = { sheet: string; index: number };

const sheetMap = (sheet: string, names: readonly string[]) =>
  Object.fromEntries(names.map((n, i) => [n, { sheet, index: i }])) as Record<string, Cell>;

/** 16 male cuts, in sprite-sheet order. */
export const HAIR_MALE = [
  "Buzz cut",
  "Crew cut",
  "Short swept-back",
  "Textured crop",
  "Messy fringe",
  "Side part",
  "Quiff",
  "Curly fade",
  "Afro",
  "Short dreadlocks",
  "Cornrows",
  "Man bun",
  "Shoulder-length waves",
  "Slicked-back long",
  "Mullet",
  "Bald",
] as const;

/** 16 feminine styles, in sprite-sheet order. */
export const HAIR_FEMALE = [
  "Long straight",
  "Long loose waves",
  "Big bouncy curls",
  "Beach waves",
  "Chin-length bob",
  "Blunt lob with fringe",
  "Pixie cut",
  "Curtain bangs",
  "High ponytail",
  "Sleek low bun",
  "Messy top knot",
  "Half-up half-down",
  "Long box braids",
  "Cornrow braids",
  "Natural curly afro",
  "Space buns",
] as const;

export const OUTFIT_MALE = [
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
  "Open-collar linen shirt",
  "Track jacket",
  "Embroidered sherwani",
] as const;

export const OUTFIT_FEMALE = [
  "Soft knit sweater",
  "Silk slip dress",
  "Satin blouse",
  "Cropped denim jacket",
  "Ruffled blouse",
  "Ribbed turtleneck",
  "Floral summer dress",
  "Tailored blazer",
  "Oversized hoodie",
  "Knit cardigan",
  "Off-shoulder top",
  "Leather jacket",
  "Evening gown",
  "Linen shirt dress",
  "Crop top and jacket",
  "Embroidered kaftan",
] as const;

export const CELLS: Record<string, Cell> = {
  ...sheetMap(hairMale, HAIR_MALE),
  ...sheetMap(hairFemale, HAIR_FEMALE),
  ...sheetMap(outfitMale, OUTFIT_MALE),
  ...sheetMap(outfitFemale, OUTFIT_FEMALE),
};

/** Sprite cell for an option, when a rendered picture exists for it. */
export function cellFor(group: string, value: string): Cell | null {
  if (group !== "hair" && group !== "outfit") return null;
  return CELLS[value] ?? null;
}

/** Inline style that crops the sheet down to a single cell. */
export function cellStyle(cell: Cell): React.CSSProperties {
  const col = cell.index % 4;
  const row = Math.floor(cell.index / 4);
  return {
    backgroundImage: `url(${cell.sheet})`,
    backgroundSize: "400% 400%",
    backgroundPosition: `${(col * 100) / 3}% ${(row * 100) / 3}%`,
  };
}
