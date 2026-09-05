import faceSheet from "@/assets/av/face-sheet.png";
import noseSheet from "@/assets/av/nose-sheet.png";
import eyesSheet from "@/assets/av/eyes-sheet.png";
import browsSheet from "@/assets/av/brows-sheet.png";
import mouthSheet from "@/assets/av/mouth-sheet.png";
import hairMaleSheet from "@/assets/av/hair-male-sheet.png";
import hairFemaleSheet from "@/assets/av/hair-female-sheet.png";
import makeupSheet from "@/assets/av/makeup-sheet.png";
import beardSheet from "@/assets/av/beard-sheet.png";
import outfitSheet from "@/assets/av/outfit-sheet.png";
import accessorySheet from "@/assets/av/accessory-sheet.png";
import outfitMaleCasualSheet from "@/assets/av/outfit-male-casual.png";
import outfitMaleSmartSheet from "@/assets/av/outfit-male-smart.png";
import outfitMaleWorldSheet from "@/assets/av/outfit-male-world.png";
import outfitFemaleCasualSheet from "@/assets/av/outfit-female-casual.png";
import outfitFemaleSmartSheet from "@/assets/av/outfit-female-smart.png";
import outfitFemaleWorldSheet from "@/assets/av/outfit-female-world.png";
import baseMale from "@/assets/av/base-male.jpg";
import baseFemale from "@/assets/av/base-female.jpg";

export type Sheet = { src: string; cols: number; rows: number };
export type Cell = { name: string; index: number };
export type Swatch = { name: string; hex: string };
export type OutfitCollection = "Everyday" | "Smart" | "World";
export type OutfitOption = Cell & { collection: OutfitCollection; sheet: Sheet };
export type AvatarAge = "Teen" | "Young adult" | "Adult" | "Mature" | "60+";

export const AVATAR_AGES: { name: AvatarAge; range: string }[] = [
  { name: "Teen", range: "13–17" },
  { name: "Young adult", range: "18–29" },
  { name: "Adult", range: "30–44" },
  { name: "Mature", range: "45–59" },
  { name: "60+", range: "60 and up" },
];

export const BASE_AVATARS = { Male: baseMale, Female: baseFemale } as const;

export const SHEETS = {
  face: { src: faceSheet, cols: 5, rows: 2 },
  nose: { src: noseSheet, cols: 5, rows: 2 },
  eyes: { src: eyesSheet, cols: 5, rows: 2 },
  brows: { src: browsSheet, cols: 5, rows: 3 },
  mouth: { src: mouthSheet, cols: 5, rows: 3 },
  hairMale: { src: hairMaleSheet, cols: 5, rows: 4 },
  hairFemale: { src: hairFemaleSheet, cols: 6, rows: 5 },
  makeup: { src: makeupSheet, cols: 4, rows: 3 },
  outfit: { src: outfitSheet, cols: 5, rows: 4 },
  accessory: { src: accessorySheet, cols: 6, rows: 5 },
  outfitMaleCasual: { src: outfitMaleCasualSheet, cols: 5, rows: 4 },
  outfitMaleSmart: { src: outfitMaleSmartSheet, cols: 5, rows: 4 },
  outfitMaleWorld: { src: outfitMaleWorldSheet, cols: 5, rows: 4 },
  outfitFemaleCasual: { src: outfitFemaleCasualSheet, cols: 5, rows: 4 },
  outfitFemaleSmart: { src: outfitFemaleSmartSheet, cols: 5, rows: 4 },
  outfitFemaleWorld: { src: outfitFemaleWorldSheet, cols: 5, rows: 4 },
} satisfies Record<string, Sheet>;

const cells = (names: readonly string[]): Cell[] => names.map((name, index) => ({ name, index }));
const pickCells = (names: readonly string[], idx: readonly number[]): Cell[] =>
  idx.map((index) => ({ name: names[index]!, index }));

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
  { name: "Balayage highlights", hex: "#8a5a34" },
  { name: "Blonde streaks", hex: "#cfa96f" },
  { name: "Pastel pink streaks", hex: "#d987a5" },
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

export const OUTFIT_COLORS: Swatch[] = [
  { name: "Black", hex: "#1a1a1c" },
  { name: "Charcoal", hex: "#3a3c40" },
  { name: "White", hex: "#f3f0ea" },
  { name: "Cream", hex: "#e6dcc7" },
  { name: "Sand", hex: "#cdb08a" },
  { name: "Camel", hex: "#b98a58" },
  { name: "Rust", hex: "#a34a25" },
  { name: "Crimson", hex: "#9c2231" },
  { name: "Dusty pink", hex: "#d99aa4" },
  { name: "Olive", hex: "#5d6340" },
  { name: "Forest green", hex: "#2f5041" },
  { name: "Navy", hex: "#22314f" },
];

/* ---------------- sheet-backed options ---------------- */

export const FACES = cells([
  "Oval",
  "Round",
  "Square",
  "Heart",
  "Diamond",
  "Long oblong",
  "Triangle",
  "Inverted triangle",
  "Wide",
  "Narrow",
]);

export const NOSES = cells([
  "Straight",
  "Button",
  "Upturned",
  "Roman aquiline",
  "Wide flat",
  "Narrow",
  "Snub",
  "Hooked",
  "Broad rounded",
  "Refined pointed",
]);

export const EYE_SHAPES = cells([
  "Almond",
  "Round",
  "Wide doe",
  "Narrow",
  "Monolid",
  "Hooded",
  "Upturned",
  "Downturned",
  "Deep set",
  "Big sparkling",
]);

export const BROWS = cells([
  "Soft arched",
  "Straight",
  "Thick bold",
  "Thin",
  "High arch",
  "Rounded",
  "Angled",
  "Feathered",
  "Tapered",
  "Bushy",
  "Short",
  "Long sweeping",
  "Flat low",
  "Curved soft",
  "Sharp defined",
]);

const MOUTH_NAMES = [
  "Thin lips",
  "Medium lips",
  "Full lips",
  "Wide smile",
  "Small neutral",
  "Cupid bow",
  "Pouty",
  "Plump glossy",
  "Soft smile",
  "Closed serious",
  "Slight smirk",
  "Wide grin",
  "Downturned",
  "Bow shaped",
  "Rounded soft",
] as const;

export const MOUTHS_MALE = pickCells(MOUTH_NAMES, [0, 1, 3, 9, 10]);
export const MOUTHS_FEMALE = pickCells(MOUTH_NAMES, [1, 2, 3, 5, 6, 7, 8, 11, 13, 14]);

export const HAIR_MALE = cells([
  "Short crop",
  "Buzz cut",
  "Textured fade",
  "Quiff",
  "Pompadour",
  "Slick back",
  "Side part",
  "Curly top",
  "Afro",
  "Dreadlocks",
  "Man bun",
  "Medium waves",
  "Long straight",
  "Mohawk",
  "Cornrows",
  "Spiky",
  "Undercut",
  "Shaggy fringe",
  "Bald",
  "Swept back waves",
]);

export const HAIR_FEMALE = cells([
  "Long waves",
  "Straight long",
  "Blunt bob",
  "Wavy bob",
  "Pixie cut",
  "High ponytail",
  "Low ponytail",
  "Messy bun",
  "Top knot",
  "Braided crown",
  "Two braids",
  "Fishtail braid",
  "Curly afro",
  "Tight curls",
  "Beach waves",
  "Half up half down",
  "Side swept",
  "Bangs and long hair",
  "Bangs with bob",
  "Space buns",
  "Box braids",
  "Locs",
  "Sleek high bun",
  "Shoulder layers",
  "Wolf cut",
  "Curtain bangs",
  "Ringlets",
  "Chignon updo",
  "Very long straight",
  "Short curly",
]);

export const MAKEUP = cells([
  "None",
  "Soft nude",
  "Dewy glow",
  "Rosy blush",
  "Bold red lip",
  "Berry lip",
  "Smokey eye",
  "Winged liner",
  "Bronze shimmer",
  "Full glam",
  "Freckles",
  "Festival colour",
]);

export const OUTFITS = cells([
  "Linen shirt",
  "Hoodie",
  "Denim jacket",
  "Leather jacket",
  "Knit sweater",
  "T-shirt",
  "Polo shirt",
  "Blazer",
  "Bomber jacket",
  "Turtleneck",
  "Tank top",
  "Flannel shirt",
  "Puffer jacket",
  "Cardigan",
  "Tracksuit top",
  "Varsity jacket",
  "Silk blouse",
  "Shirt and tie",
  "Embroidered kaftan",
  "Kimono top",
]);

const outfitCollection = (
  names: readonly string[],
  collection: OutfitCollection,
  sheet: Sheet,
): OutfitOption[] => names.map((name, index) => ({ name, index, collection, sheet }));

const MALE_EVERYDAY = [
  "White linen shirt", "Black tee", "Cream knit", "Denim jacket", "Olive overshirt",
  "Charcoal hoodie", "Striped polo", "Varsity jacket", "Flannel shirt", "Suede jacket",
  "Bomber jacket", "Soft cardigan", "Henley shirt", "Rugby shirt", "Utility vest",
  "Light windbreaker", "Resort shirt", "Corduroy jacket", "Athletic tank", "Relaxed sweatshirt",
] as const;
const MALE_SMART = [
  "Navy blazer", "Charcoal suit", "Black tuxedo", "Camel blazer", "Tailored waistcoat",
  "Oxford shirt", "Turtleneck blazer", "Double-breasted suit", "Velvet dinner jacket", "Ceremonial jacket",
  "Mandarin jacket", "Pinstripe suit", "Burgundy blazer", "Linen summer suit", "Formal black shirt",
  "Checked sport coat", "Luxury trench", "Academic gown", "White dinner jacket", "Three-piece suit",
] as const;
const MALE_WORLD = [
  "Modern tracksuit", "Basketball jersey", "Football jersey", "Running jacket", "Ski jacket",
  "Puffer coat", "Rain shell", "Sailing jacket", "Embroidered kaftan", "Kurdish traditional jacket",
  "Dashiki", "Sherwani", "Changshan", "Thobe", "Japanese haori",
  "Nordic knit", "Tropical resort shirt", "Festival jacket", "Western shirt", "Shearling coat",
] as const;
const FEMALE_EVERYDAY = [
  "Dusty rose knit", "White linen blouse", "Black fitted tee", "Denim jacket", "Cream cardigan",
  "Cropped hoodie", "Striped top", "Varsity jacket", "Soft flannel", "Suede jacket",
  "Bomber jacket", "Ribbed turtleneck", "Wrap top", "Relaxed sweatshirt", "Utility vest",
  "Light windbreaker", "Floral blouse", "Corduroy jacket", "Athletic top", "Off-shoulder knit",
] as const;
const FEMALE_SMART = [
  "Ivory silk blouse", "Navy blazer", "Black evening dress", "Camel blazer", "Tailored waistcoat",
  "Oxford shirt", "Turtleneck blazer", "Double-breasted suit", "Velvet evening jacket", "Cocktail dress",
  "Mandarin jacket", "Pinstripe suit", "Burgundy blazer", "Linen summer suit", "Formal black blouse",
  "Checked sport coat", "Luxury trench", "Graduation gown", "Pearl formal jacket", "Elegant pantsuit",
] as const;
const FEMALE_WORLD = [
  "Modern tracksuit", "Basketball jersey", "Football jersey", "Running jacket", "Ski jacket",
  "Puffer coat", "Rain shell", "Sailing jacket", "Embroidered kaftan", "Kurdish traditional dress",
  "Ankara top", "Sari drape", "Qipao top", "Abaya", "Japanese kimono",
  "Nordic knit", "Tropical resort blouse", "Festival jacket", "Western shirt", "Shearling coat",
] as const;

export const OUTFITS_MALE: OutfitOption[] = [
  ...outfitCollection(MALE_EVERYDAY, "Everyday", SHEETS.outfitMaleCasual),
  ...outfitCollection(MALE_SMART, "Smart", SHEETS.outfitMaleSmart),
  ...outfitCollection(MALE_WORLD, "World", SHEETS.outfitMaleWorld),
];

export const OUTFITS_FEMALE: OutfitOption[] = [
  ...outfitCollection(FEMALE_EVERYDAY, "Everyday", SHEETS.outfitFemaleCasual),
  ...outfitCollection(FEMALE_SMART, "Smart", SHEETS.outfitFemaleSmart),
  ...outfitCollection(FEMALE_WORLD, "World", SHEETS.outfitFemaleWorld),
];

export function outfitsFor(gender: "Male" | "Female") {
  return gender === "Female" ? OUTFITS_FEMALE : OUTFITS_MALE;
}

export const ACCESSORIES = cells([
  "Gold hoop earrings",
  "Pearl stud earrings",
  "Drop earrings",
  "Gold chain necklace",
  "Pearl necklace",
  "Pendant necklace",
  "Black sunglasses",
  "Aviator sunglasses",
  "Round glasses",
  "Clear frame glasses",
  "Sport visor",
  "Baseball cap",
  "Beanie",
  "Wide brim hat",
  "Fedora",
  "Bucket hat",
  "Flat cap",
  "Cowboy hat",
  "Silk headscarf",
  "Patterned hijab",
  "Plain hijab",
  "Turban",
  "Headband",
  "Beaded headband",
  "Flower crown",
  "Wool scarf",
  "Silk scarf",
  "Silver headphones",
  "Black headphones",
  "Wireless earbuds",
]);

/* ---------------- traits ---------------- */

export type Traits = {
  gender: "Male" | "Female";
  age: AvatarAge;
  skin: string;
  face: string;
  eyeShape: string;
  eyeColor: string;
  brows: string;
  nose: string;
  mouth: string;
  hair: string;
  hairColor: string;
  makeup: string;
  outfit: string;
  outfitColor: string;
  accessories: string[];
};

export function defaultTraits(gender: "Male" | "Female"): Traits {
  const female = gender === "Female";
  return {
    gender,
    age: "Young adult",
    skin: "Light olive",
    face: female ? "Heart" : "Square",
    eyeShape: female ? "Wide doe" : "Almond",
    eyeColor: female ? "Warm brown" : "Blue",
    brows: female ? "Soft arched" : "Thick bold",
    nose: "Straight",
    mouth: female ? "Full lips" : "Slight smirk",
    hair: female ? "Long waves" : "Swept back waves",
    hairColor: female ? "Chestnut brown" : "Salt and pepper",
    makeup: female ? "Soft nude" : "None",
    outfit: female ? "Dusty rose knit" : "White linen shirt",
    outfitColor: female ? "Dusty pink" : "White",
    accessories: [],
  };
}

export function hairFor(gender: "Male" | "Female") {
  return gender === "Female"
    ? { sheet: SHEETS.hairFemale, opts: HAIR_FEMALE }
    : { sheet: SHEETS.hairMale, opts: HAIR_MALE };
}

export function mouthsFor(gender: "Male" | "Female") {
  return gender === "Female" ? MOUTHS_FEMALE : MOUTHS_MALE;
}
