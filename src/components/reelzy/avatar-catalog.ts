import hairMaleSheet from "@/assets/av2/hair-male.png";
import hairMaleSheet2 from "@/assets/av2/hair-male-2.png";
import hairFemaleSheet from "@/assets/av2/hair-female.png";
import outfitMaleSheet from "@/assets/av2/outfit-male.png";
import outfitFemaleSheet from "@/assets/av2/outfit-female.png";
import outfitMaleSheet2 from "@/assets/av2/outfit-male-2.png";
import outfitFemaleSheet2 from "@/assets/av2/outfit-female-2.png";
import accessorySheet from "@/assets/av2/accessory.png";
import accessoryMaleSheet from "@/assets/av2/accessory-male.png";
import accessorySheet2 from "@/assets/av2/accessory-female-2.png";
import accessoryMaleSheet2 from "@/assets/av2/accessory-male-2.png";
import jewelryFemaleSheet from "@/assets/av2/jewelry-female.png";
import piercingsMaleSheet from "@/assets/av2/piercings-male.png";
import piercingsFemaleSheet from "@/assets/av2/piercings-female.png";
import wrinklesSheet from "@/assets/av2/wrinkles.png";
import beardsSheet from "@/assets/av2/beards.png";
import baseMale from "@/assets/av2/base-male.jpg";
import baseFemale from "@/assets/av2/base-female.jpg";
import styleReference from "@/assets/av2/style-reference.jpg";

export type Sheet = { src: string; cols: number; rows: number };
export type Cell = { name: string; index: number };
/** A picture option that knows which sprite sheet it lives on. */
export type Pic = { name: string; index: number; sheet: Sheet };
export type Swatch = { name: string; hex: string };

export const BASE_AVATARS = { Male: baseMale, Female: baseFemale } as const;
export const STYLE_REFERENCE = styleReference;

export const SHEETS = {
  hairMale: { src: hairMaleSheet, cols: 5, rows: 4 },
  hairMale2: { src: hairMaleSheet2, cols: 5, rows: 4 },
  hairFemale: { src: hairFemaleSheet, cols: 5, rows: 4 },
  outfitMale: { src: outfitMaleSheet, cols: 5, rows: 4 },
  outfitFemale: { src: outfitFemaleSheet, cols: 5, rows: 4 },
  outfitMale2: { src: outfitMaleSheet2, cols: 5, rows: 4 },
  outfitFemale2: { src: outfitFemaleSheet2, cols: 5, rows: 4 },
  accessory: { src: accessorySheet, cols: 5, rows: 4 },
  accessoryMale: { src: accessoryMaleSheet, cols: 5, rows: 4 },
  accessory2: { src: accessorySheet2, cols: 5, rows: 4 },
  accessoryMale2: { src: accessoryMaleSheet2, cols: 5, rows: 4 },
  jewelryFemale: { src: jewelryFemaleSheet, cols: 5, rows: 4 },
  piercingsMale: { src: piercingsMaleSheet, cols: 5, rows: 4 },
  piercingsFemale: { src: piercingsFemaleSheet, cols: 5, rows: 4 },
  wrinkles: { src: wrinklesSheet, cols: 5, rows: 4 },
  beards: { src: beardsSheet, cols: 5, rows: 4 },
} satisfies Record<string, Sheet>;

const pics = (sheet: Sheet, names: readonly string[]): Pic[] =>
  names.map((name, index) => ({ name, index, sheet }));

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

/** Exclusive colourways any outfit can be recoloured to. */
export const OUTFIT_COLORS: Swatch[] = [
  { name: "As shown", hex: "linear-gradient(45deg, transparent 45%, #c0392b 45%, #c0392b 55%, transparent 55%), #f5f5f5" },
  { name: "Midnight black", hex: "#15161a" },
  { name: "Pure white", hex: "#f7f7f5" },
  { name: "Ivory cream", hex: "#efe4d1" },
  { name: "Champagne", hex: "#e3cfa8" },
  { name: "Camel", hex: "#c89a63" },
  { name: "Cognac brown", hex: "#8a4f2b" },
  { name: "Espresso", hex: "#4a3529" },
  { name: "Sand beige", hex: "#d9c3a5" },
  { name: "Dove grey", hex: "#b3b6bb" },
  { name: "Charcoal", hex: "#3c3f45" },
  { name: "Navy", hex: "#1e2a4a" },
  { name: "Royal blue", hex: "#2a4fbf" },
  { name: "Powder blue", hex: "#a9c8e6" },
  { name: "Teal", hex: "#146b70" },
  { name: "Emerald", hex: "#116a4a" },
  { name: "Sage green", hex: "#9aae8e" },
  { name: "Olive", hex: "#6a6a35" },
  { name: "Forest green", hex: "#26402a" },
  { name: "Mustard gold", hex: "#c99a25" },
  { name: "Burnt orange", hex: "#c0562a" },
  { name: "Terracotta", hex: "#b26a4f" },
  { name: "Crimson red", hex: "#a51c30" },
  { name: "Burgundy", hex: "#5c1a2b" },
  { name: "Blush pink", hex: "#e8b7bd" },
  { name: "Hot pink", hex: "#d63f80" },
  { name: "Lilac", hex: "#b9a5dd" },
  { name: "Deep purple", hex: "#4b2a6b" },
  { name: "Ice silver", hex: "#d7dbe0" },
  { name: "Metallic gold", hex: "#c9a227" },
];

/* ---------------- picture options ---------------- */

export const HAIR_MALE: Pic[] = [
  ...pics(SHEETS.hairMale, [
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
  ]),
  ...pics(SHEETS.hairMale2, [
    "crew cut",
    "caesar cut with a straight fringe",
    "high and tight military cut",
    "comb over fade",
    "curtain fringe",
    "long layered surfer hair",
    "wolf cut",
    "low taper fade with waves",
    "twisted sponge curls",
    "braided cornrow ponytail",
    "short dreadlock top knot",
    "shoulder length straight hair tucked behind the ears",
    "messy bedhead fringe",
    "flat top",
    "curly fringe with faded sides",
    "slicked wet look side part",
    "half up top knot with loose sides",
    "shoulder length curly hair",
    "buzz cut with a hard side part line",
    "long wavy hair tied in a low ponytail",
  ]),
];

export const HAIR_FEMALE = pics(SHEETS.hairFemale, [
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

export const OUTFITS_MALE: Pic[] = [
  ...pics(SHEETS.outfitMale, [
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
  ]),
  ...pics(SHEETS.outfitMale2, [
    "black puffer vest over a grey hoodie",
    "tan trench coat over a black turtleneck",
    "cream zip hoodie",
    "denim dungarees over a cream tee",
    "olive military field jacket",
    "cricket knit vest over a white shirt",
    "brown corduroy jacket",
    "red and black motorcycle racing jacket",
    "black tuxedo with a bow tie",
    "indigo kimono jacket",
    "olive cargo utility jacket",
    "cream ribbed henley shirt",
    "oversized black graphic tee",
    "white chef jacket",
    "blue medical scrubs",
    "pilot uniform shirt with epaulettes and tie",
    "blue football kit shirt",
    "blue and black ski jacket",
    "grey tailored waistcoat with rolled sleeves",
    "beige wool poncho",
  ]),
];

export const OUTFITS_FEMALE: Pic[] = [
  ...pics(SHEETS.outfitFemale, [
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
  ]),
  ...pics(SHEETS.outfitFemale2, [
    "sage green satin slip dress",
    "beige trench coat",
    "oversized taupe blazer",
    "cream cropped puffer jacket",
    "lilac wrap top",
    "brown pinafore over a cream turtleneck",
    "black leather corset top",
    "ivory ruffled peasant blouse",
    "gold sequin party top",
    "denim dungarees over an off-shoulder blouse",
    "green and gold sari drape",
    "red embroidered cheongsam top",
    "pink floral kimono",
    "mauve yoga crop top",
    "blue nurse scrubs",
    "black business suit with a white shirt",
    "cream wool coat with a scarf collar",
    "ivory crochet summer top",
    "navy varsity cardigan",
    "pale blue off-shoulder ball gown",
  ]),
];

export const ACCESSORIES_FEMALE: Pic[] = [
  ...pics(SHEETS.accessory, [
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
  ]),
  ...pics(SHEETS.accessory2, [
    "black beret",
    "brown cowboy hat",
    "black newsboy cap",
    "champagne silk head wrap",
    "black lace veil",
    "crystal tiara",
    "cat-eye sunglasses",
    "oversized square sunglasses",
    "red heart shaped sunglasses",
    "thin gold eyeglasses",
    "ski goggles on the forehead",
    "black satin hair bow",
    "pearl hair clips",
    "braided headband",
    "wide straw sun visor",
    "chunky knit scarf",
    "silk neck scarf tied at the throat",
    "black face mask pulled under the chin",
    "feather hair accessory",
    "butterfly hair pins",
  ]),
];

export const ACCESSORIES_MALE: Pic[] = [
  ...pics(SHEETS.accessoryMale, [
    "no accessories",
    "black sunglasses",
    "gold aviator sunglasses",
    "round metal eyeglasses",
    "clear frame eyeglasses",
    "black baseball cap",
    "grey knitted beanie",
    "wide brim straw hat",
    "brown fedora hat",
    "black bucket hat",
    "white muslim kufi prayer cap",
    "black turban",
    "red and white keffiyeh headscarf",
    "silver over-ear headphones",
    "white wireless earbuds",
    "chunky grey wool scarf",
    "gold chain necklace",
    "silver stud earring",
    "black sport headband",
    "backwards snapback cap",
  ]),
  ...pics(SHEETS.accessoryMale2, [
    "brown cowboy hat",
    "grey flat cap",
    "black beret",
    "fur trapper hat with ear flaps",
    "black visor cap",
    "black durag",
    "bandana headband",
    "white sports sweatband",
    "VR headset pushed up on the forehead",
    "aviator pilot headset with microphone",
    "ski goggles on the forehead",
    "gold monocle on a chain",
    "black sport wrap sunglasses",
    "half-rim eyeglasses",
    "black neck gaiter",
    "black bow tie",
    "grey shirt collar with a dark tie",
    "leather cord necklace",
    "silver dog tag chain",
    "gold ear cuff",
  ]),
];

export const JEWELRY_FEMALE = pics(SHEETS.jewelryFemale, [
  "large gold hoop earrings",
  "diamond stud earrings",
  "pearl drop earrings",
  "gold chandelier earrings",
  "emerald teardrop earrings",
  "gold ear cuff with a chain",
  "layered gold necklaces",
  "single diamond pendant necklace",
  "chunky gold chain choker",
  "black velvet choker",
  "pearl choker",
  "turquoise beaded necklace",
  "ruby statement necklace",
  "silver locket necklace",
  "delicate gold body chain over the collarbones",
  "ornate indian bridal necklace with a maang tikka",
  "brass tribal neck rings",
  "silver hoop earrings with charms",
  "rose gold heart pendant",
  "opal collar necklace",
]);

export const PIERCINGS_MALE = pics(SHEETS.piercingsMale, [
  "no piercings",
  "small silver nose stud",
  "nose ring hoop",
  "septum ring",
  "eyebrow barbell",
  "double eyebrow rings",
  "labret lip stud below the lip",
  "snake bite lip rings",
  "medusa stud above the upper lip",
  "lip ring hoop",
  "single ear lobe stud",
  "double ear lobe studs",
  "ear helix hoop",
  "industrial ear barbell",
  "ear tunnel plug gauges",
  "tragus stud",
  "bridge piercing between the eyes",
  "cheek dimple piercings",
  "chin stud",
  "septum ring with an eyebrow barbell",
]);

export const PIERCINGS_FEMALE = pics(SHEETS.piercingsFemale, [
  "no piercings",
  "tiny diamond nose stud",
  "delicate gold nose ring hoop",
  "septum ring",
  "indian nath nose ring with a chain",
  "eyebrow barbell",
  "monroe stud beside the upper lip",
  "medusa stud above the upper lip",
  "lower lip ring",
  "snake bite lip rings",
  "single ear lobe stud",
  "stacked triple lobe studs",
  "helix hoop",
  "forward helix stud",
  "industrial ear barbell",
  "tragus stud",
  "daith ring",
  "conch hoop",
  "bridge piercing between the eyes",
  "nose hoop with multiple ear studs",
]);

export const WRINKLES = pics(SHEETS.wrinkles, [
  "smooth skin, no wrinkles",
  "subtle forehead lines",
  "deep forehead furrows",
  "frown lines between the brows",
  "crow's feet around the eyes",
  "under-eye lines",
  "smile lines",
  "marionette lines around the mouth",
  "laugh lines on the cheeks",
  "chin crease",
  "fine lines all over the face",
  "forehead lines and crow's feet",
  "full mature wrinkles with grey streaks",
  "deep elderly wrinkles over the whole face",
  "forehead lines and frown lines",
  "crow's feet and smile lines",
  "weathered sun-aged fine lines",
  "under-eye circles with lines",
  "light expression lines",
  "full senior ageing with jowls",
]);

export const BEARDS = pics(SHEETS.beards, [
  "clean shaven",
  "light stubble",
  "heavy stubble",
  "short boxed beard",
  "full short beard",
  "full long beard",
  "goatee",
  "circle beard",
  "van dyke beard",
  "soul patch",
  "chin strap beard",
  "anchor beard",
  "balbo beard",
  "mutton chop sideburns",
  "horseshoe mustache",
  "handlebar mustache",
  "chevron mustache",
  "pencil mustache",
  "walrus mustache",
  "full beard with handlebar mustache",
]);

export function hairFor(gender: "Male" | "Female") {
  return gender === "Female" ? HAIR_FEMALE : HAIR_MALE;
}
export function accessoriesFor(gender: "Male" | "Female"): Pic[] {
  return gender === "Female" ? [...ACCESSORIES_FEMALE, ...JEWELRY_FEMALE] : ACCESSORIES_MALE;
}
export function outfitsFor(gender: "Male" | "Female") {
  return gender === "Female" ? OUTFITS_FEMALE : OUTFITS_MALE;
}
export function piercingsFor(gender: "Male" | "Female") {
  return gender === "Female" ? PIERCINGS_FEMALE : PIERCINGS_MALE;
}

/* ---------------- traits ---------------- */

export type Traits = {
  gender: "Male" | "Female";
  skin: string;
  eyeColor: string;
  hairColor: string;
  hair: string;
  wrinkles: string;
  beard: string;
  piercing: string;
  outfit: string;
  outfitColor: string;
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
    wrinkles: "smooth skin, no wrinkles",
    beard: "clean shaven",
    piercing: "no piercings",
    outfit: female ? "pink knit sweater" : "white t-shirt",
    outfitColor: "As shown",
    accessories: [],
  };
}
