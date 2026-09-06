import hairMaleSheet from "@/assets/av2/hair-male.png";
import hairFemaleSheet from "@/assets/av2/hair-female.png";
import outfitMaleSheet from "@/assets/av2/outfit-male.png";
import outfitFemaleSheet from "@/assets/av2/outfit-female.png";
import accessorySheet from "@/assets/av2/accessory.png";
import wrinklesSheet from "@/assets/av2/wrinkles.png";
import beardsSheet from "@/assets/av2/beards.png";
import baseMale from "@/assets/av2/base-male.jpg";
import baseFemale from "@/assets/av2/base-female.jpg";
import styleReference from "@/assets/av2/style-reference.jpg";

export type Sheet = { src: string; cols: number; rows: number };
export type Cell = { name: string; index: number };
export type Swatch = { name: string; hex: string };

export const BASE_AVATARS = { Male: baseMale, Female: baseFemale } as const;
export const STYLE_REFERENCE = styleReference;

export const SHEETS = {
  hairMale: { src: hairMaleSheet, cols: 5, rows: 4 },
  hairFemale: { src: hairFemaleSheet, cols: 5, rows: 4 },
  outfitMale: { src: outfitMaleSheet, cols: 5, rows: 4 },
  outfitFemale: { src: outfitFemaleSheet, cols: 5, rows: 4 },
  accessory: { src: accessorySheet, cols: 5, rows: 4 },
  wrinkles: { src: wrinklesSheet, cols: 5, rows: 4 },
  beards: { src: beardsSheet, cols: 5, rows: 4 },
} satisfies Record<string, Sheet>;

const cells = (names: readonly string[]): Cell[] => names.map((name, index) => ({ name, index }));

/* ---------------- colours ---------------- */

export const SKINS: Swatch[] = [
  { name: "Porcelain", hex: "#f7ded0" },
  { name: "Ivory", hex: "#f2d3bd" },
  { name: "Fair", hex: "#eec3a4" },
  { name: "Light beige", hex: "#e6b48f" },
  { name: "Light olive", hex: "#dda57b" },
  { name: "Sand", hex: "#d69a6b" },
  { name: "Golden", hex: "#c98a56" },
  { name: "Honey", hex: "#bd7c47" },
  { name: "Warm tan", hex: "#ad6c3c" },
  { name: "Caramel", hex: "#9c5f33" },
  { name: "Bronze", hex: "#8a512b" },
  { name: "Chestnut", hex: "#764424" },
  { name: "Deep brown", hex: "#61371d" },
  { name: "Espresso", hex: "#4b2a16" },
  { name: "Ebony", hex: "#38200f" },
];

export const HAIR_COLORS: Swatch[] = [
  { name: "Jet black", hex: "#14100f" },
  { name: "Soft black", hex: "#221b19" },
  { name: "Dark brown", hex: "#3b2519" },
  { name: "Chestnut brown", hex: "#5a3520" },
  { name: "Chocolate", hex: "#6b402a" },
  { name: "Light brown", hex: "#87573a" },
  { name: "Caramel", hex: "#a4703f" },
  { name: "Honey blonde", hex: "#c39355" },
  { name: "Golden blonde", hex: "#dcb168" },
  { name: "Platinum blonde", hex: "#ecdcb6" },
  { name: "Strawberry blonde", hex: "#d79a6a" },
  { name: "Auburn", hex: "#8c3b1e" },
  { name: "Copper red", hex: "#b1481f" },
  { name: "Ginger", hex: "#c96a2b" },
  { name: "Burgundy", hex: "#5c1a24" },
  { name: "Silver grey", hex: "#b9bcc0" },
  { name: "Salt and pepper", hex: "#6d6c6b" },
  { name: "Pastel pink", hex: "#d987a5" },
];

export const EYE_COLORS: Swatch[] = [
  { name: "Dark brown", hex: "#42281a" },
  { name: "Warm brown", hex: "#6b4322" },
  { name: "Hazel", hex: "#96702e" },
  { name: "Amber", hex: "#b3762a" },
  { name: "Green", hex: "#4a7a4a" },
  { name: "Emerald", hex: "#2f6b52" },
  { name: "Blue", hex: "#4c7fae" },
  { name: "Ice blue", hex: "#8fb9d6" },
  { name: "Grey", hex: "#8b8f93" },
  { name: "Violet", hex: "#7a5f9e" },
];

/* ---------------- picture options ---------------- */

export const HAIR_MALE = cells([
  "short crop",
  "buzz cut",
  "textured fade",
  "quiff",
  "pompadour",
  "slick back",
  "side part",
  "curly top",
  "afro",
  "dreadlocks",
  "man bun",
  "medium waves",
  "long straight hair",
  "mohawk",
  "cornrows",
  "spiky hair",
  "undercut",
  "shaggy fringe",
  "bald head",
  "swept back waves",
]);

export const HAIR_FEMALE = cells([
  "long waves",
  "straight long hair",
  "blunt bob",
  "wavy bob",
  "pixie cut",
  "high ponytail",
  "low ponytail",
  "messy bun",
  "braided crown",
  "two braids",
  "curly afro",
  "tight curls",
  "beach waves",
  "half up half down",
  "side swept hair",
  "long hair with bangs",
  "bob with bangs",
  "space buns",
  "box braids",
  "sleek high bun",
]);

export const OUTFITS_MALE = cells([
  "white t-shirt",
  "black tee",
  "grey hoodie",
  "denim jacket over a white tee",
  "olive overshirt",
  "plaid flannel shirt",
  "navy blazer with a white shirt",
  "black suit with a tie",
  "cream cable-knit sweater",
  "black leather jacket",
  "olive bomber jacket",
  "striped polo shirt",
  "navy varsity jacket",
  "black puffer coat",
  "navy tracksuit top",
  "basketball jersey",
  "linen resort shirt",
  "black turtleneck",
  "colourful dashiki",
  "white thobe",
]);

export const OUTFITS_FEMALE = cells([
  "pink knit sweater",
  "white linen blouse",
  "black fitted tee",
  "denim jacket",
  "cream cardigan",
  "floral summer top",
  "navy blazer with a white shirt",
  "black evening dress",
  "ivory silk blouse",
  "black leather jacket",
  "olive bomber jacket",
  "striped top",
  "navy varsity jacket",
  "cream puffer coat",
  "light blue tracksuit top",
  "black sports top",
  "tropical resort blouse",
  "beige ribbed turtleneck",
  "colourful ankara print top",
  "black abaya",
]);

export const ACCESSORIES = cells([
  "no accessories",
  "black sunglasses",
  "aviator sunglasses",
  "round eyeglasses",
  "clear frame eyeglasses",
  "black baseball cap",
  "black beanie",
  "wide brim straw hat",
  "brown fedora",
  "black bucket hat",
  "patterned hijab",
  "beige hijab",
  "black turban",
  "knotted headband",
  "flower crown",
  "gold hoop earrings",
  "pearl necklace",
  "cream wool scarf",
  "silver over-ear headphones",
  "wireless earbuds",
]);

export function hairFor(gender: "Male" | "Female") {
  return gender === "Female" ? HAIR_FEMALE : HAIR_MALE;
}
export function hairSheetFor(gender: "Male" | "Female") {
  return gender === "Female" ? SHEETS.hairFemale : SHEETS.hairMale;
}
export function outfitsFor(gender: "Male" | "Female") {
  return gender === "Female" ? OUTFITS_FEMALE : OUTFITS_MALE;
}
export function outfitSheetFor(gender: "Male" | "Female") {
  return gender === "Female" ? SHEETS.outfitFemale : SHEETS.outfitMale;
}

/* ---------------- traits ---------------- */

export type Traits = {
  gender: "Male" | "Female";
  skin: string;
  eyeColor: string;
  hairColor: string;
  hair: string;
  outfit: string;
  accessories: string[];
};

export function defaultTraits(gender: "Male" | "Female"): Traits {
  const female = gender === "Female";
  return {
    gender,
    skin: "Light olive",
    eyeColor: female ? "Warm brown" : "Dark brown",
    hairColor: female ? "Chestnut brown" : "Dark brown",
    hair: female ? "long waves" : "short crop",
    outfit: female ? "pink knit sweater" : "white t-shirt",
    accessories: [],
  };
}
