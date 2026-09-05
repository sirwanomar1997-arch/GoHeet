/**
 * Visual option tiles for the Reelzy avatar wardrobe.
 * Every choice is shown as a swatch or a drawn icon — never a plain text list.
 */

export const SWATCH: Record<string, string> = {
  // skin
  Porcelain: "#f7ded0",
  Fair: "#f0c9ab",
  "Light olive": "#dfae83",
  "Golden tan": "#c98c58",
  "Warm brown": "#9c6239",
  "Deep brown": "#6f4324",
  Ebony: "#452a18",
  // hair
  "Jet black": "#141110",
  "Dark brown": "#3b2517",
  Chestnut: "#6b3d21",
  Auburn: "#8a3b1e",
  Blonde: "#d9ab5f",
  Platinum: "#e6e0d2",
  "Salt & pepper": "#8d8985",
  Ginger: "#c05a1e",
  "Pastel pink": "#e9a3bd",
  Teal: "#2c8d8a",
  // eyes
  Hazel: "#8a6a34",
  Amber: "#b8791f",
  Green: "#3f7a48",
  Blue: "#4a7fb5",
  Grey: "#8e9aa3",
  // outfit colours
  Black: "#131313",
  White: "#f6f4f0",
  Cream: "#eddfc7",
  Charcoal: "#39393c",
  "Burnt orange": "#c2551f",
  Crimson: "#a51f36",
  Mustard: "#d1a02a",
  "Forest green": "#25563a",
  Navy: "#1e2a4a",
  "Dusty pink": "#d99aa4",
  Lavender: "#a99bd4",
  Chocolate: "#5b3722",
  Sage: "#93a888",
  "Electric blue": "#1f6ae0",
  "Champagne gold": "#dcc08a",
};

const GRADIENT: Record<string, string> = {
  "Warm orange-pink glow": "linear-gradient(135deg,#ff8a3d,#f4657f)",
  "Deep amber": "linear-gradient(135deg,#c9631a,#f0a13c)",
  "Crimson dusk": "linear-gradient(135deg,#8e1f38,#e05a54)",
  "Peach sunrise": "linear-gradient(135deg,#ffb08a,#ffd7b0)",
  "Soft sand": "linear-gradient(135deg,#e4cba7,#f4e6d0)",
  "Midnight ember": "linear-gradient(135deg,#1b1420,#7a2f2a)",
  "Rose gold": "linear-gradient(135deg,#e0a08c,#f3cfc0)",
  "Golden hour": "linear-gradient(135deg,#f0a13c,#ffd98a)",
  "Cool slate": "linear-gradient(135deg,#3d4a56,#7b8b98)",
  "Emerald haze": "linear-gradient(135deg,#1d5a45,#5aa787)",
  "Violet twilight": "linear-gradient(135deg,#3a2a63,#8f6bd0)",
  "Studio charcoal": "linear-gradient(135deg,#1c1c1e,#4a4a4f)",
};

const FABRIC_STYLE: Record<string, string> = {
  "Matte cotton": "#cfc7bb",
  "Soft knit":
    "repeating-linear-gradient(90deg,#d6bfae 0 3px,#c3a893 3px 6px)",
  "Washed denim":
    "repeating-linear-gradient(45deg,#5d7ea6 0 3px,#4a6c93 3px 6px)",
  "Glossy leather": "linear-gradient(140deg,#2a2a2c,#6a6a70 45%,#1d1d1f)",
  "Liquid satin": "linear-gradient(120deg,#c9a2c0,#f0dcea 40%,#a97fa0)",
  "Crushed velvet": "radial-gradient(circle at 30% 30%,#7d3f6a,#3c1c33)",
  "Technical nylon": "linear-gradient(160deg,#2f3a3f,#63767f)",
  "Airy linen":
    "repeating-linear-gradient(0deg,#e6dcc8 0 2px,#d6c9b0 2px 4px)",
  "Metallic sheen": "linear-gradient(120deg,#8f8f96,#f0eee9 45%,#7d7d85)",
  "Chunky wool":
    "repeating-linear-gradient(135deg,#b9a48c 0 5px,#a08b74 5px 10px)",
};

const has = (v: string, ...keys: string[]) =>
  keys.some((k) => v.toLowerCase().includes(k));

function Svg({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" className="size-full" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

const S = "currentColor";

function faceOutline(value: string) {
  if (has(value, "round")) return <circle cx="24" cy="25" r="13" stroke={S} strokeWidth="2" />;
  if (has(value, "square")) return <rect x="12" y="12" width="24" height="26" rx="7" stroke={S} strokeWidth="2" />;
  if (has(value, "heart"))
    return <path d="M12 16c0-3 4-4 6-2l6 5 6-5c2-2 6-1 6 2 0 9-6 17-12 21C18 33 12 25 12 16Z" stroke={S} strokeWidth="2" />;
  if (has(value, "long")) return <ellipse cx="24" cy="25" rx="10" ry="15" stroke={S} strokeWidth="2" />;
  if (has(value, "cheek"))
    return <path d="M24 9c8 0 12 5 12 11 0 9-6 19-12 19S12 29 12 20c0-6 4-11 12-11Z" stroke={S} strokeWidth="2" />;
  return <ellipse cx="24" cy="25" rx="11" ry="14" stroke={S} strokeWidth="2" />;
}

function hairIcon(value: string) {
  const head = <ellipse cx="24" cy="27" rx="10" ry="12" stroke={S} strokeWidth="1.6" opacity="0.45" />;
  let hair = <path d="M13 24c0-8 5-12 11-12s11 4 11 12c-3-5-7-6-11-6s-8 1-11 6Z" fill={S} />;
  if (has(value, "bald")) hair = <path d="M15 22c2-6 6-8 9-8" stroke={S} strokeWidth="1.6" />;
  else if (has(value, "buzz", "crew"))
    hair = <path d="M13 23c1-7 5-10 11-10s10 3 11 10c-4-3-7-4-11-4s-7 1-11 4Z" fill={S} />;
  else if (has(value, "afro", "coily"))
    hair = <circle cx="24" cy="19" r="12" fill={S} />;
  else if (has(value, "curly"))
    hair = <path d="M12 22a12 12 0 0 1 24 0c-2-2-3 1-5-1s-4 1-7-1-6 1-8 3-3-1-4-1Z" fill={S} />;
  else if (has(value, "long", "wavy", "shoulder"))
    hair = (
      <path d="M13 24c0-8 5-12 11-12s11 4 11 12v14c-2-2-3-6-3-10-2 3-14 3-16 0 0 4-1 8-3 10V24Z" fill={S} />
    );
  else if (has(value, "braid", "cornrow", "locs"))
    hair = (
      <g stroke={S} strokeWidth="2">
        <path d="M17 14v22M21 13v24M27 13v24M31 14v22" />
      </g>
    );
  else if (has(value, "top knot", "ponytail"))
    hair = (
      <g fill={S}>
        <circle cx="24" cy="9" r="4" />
        <path d="M13 24c0-8 5-11 11-11s11 3 11 11c-3-5-7-6-11-6s-8 1-11 6Z" />
      </g>
    );
  else if (has(value, "bob", "pixie"))
    hair = <path d="M13 24c0-8 5-12 11-12s11 4 11 12v6c-2-1-3-4-3-7-3 3-13 3-16 0 0 3-1 6-3 7v-6Z" fill={S} />;
  else if (has(value, "shaved"))
    hair = <path d="M15 22c1-7 5-10 9-10s8 3 9 10c-2-4-5-5-9-5" fill={S} />;
  else if (has(value, "hijab", "headscarf"))
    hair = <path d="M12 26c0-9 5-15 12-15s12 6 12 15c0 6-3 11-6 13H18c-3-2-6-7-6-13Z" fill={S} />;
  else if (has(value, "side part"))
    hair = <path d="M13 24c0-8 5-12 11-12s11 4 11 12c-2-6-6-7-9-5-3 2-8 1-13 5Z" fill={S} />;
  return (
    <Svg>
      {head}
      {hair}
    </Svg>
  );
}

function eyeIcon(value: string) {
  if (has(value, "round"))
    return (
      <Svg>
        <circle cx="24" cy="24" r="9" stroke={S} strokeWidth="2" />
        <circle cx="24" cy="24" r="3.5" fill={S} />
      </Svg>
    );
  if (has(value, "hooded"))
    return (
      <Svg>
        <path d="M10 20c6-6 22-6 28 0" stroke={S} strokeWidth="2" />
        <path d="M11 25c5 7 21 7 26 0-5-4-21-4-26 0Z" stroke={S} strokeWidth="2" />
        <circle cx="24" cy="25" r="3" fill={S} />
      </Svg>
    );
  if (has(value, "monolid"))
    return (
      <Svg>
        <path d="M10 24h28" stroke={S} strokeWidth="2" />
        <path d="M11 24c5 5 21 5 26 0" stroke={S} strokeWidth="2" />
        <circle cx="24" cy="26" r="3" fill={S} />
      </Svg>
    );
  if (has(value, "upturned"))
    return (
      <Svg>
        <path d="M9 27c6-9 22-11 30-6-6 8-22 10-30 6Z" stroke={S} strokeWidth="2" />
        <circle cx="24" cy="24" r="3" fill={S} />
      </Svg>
    );
  if (has(value, "wide"))
    return (
      <Svg>
        <path d="M6 24c5-6 13-6 18 0-5 6-13 6-18 0Z" stroke={S} strokeWidth="2" />
        <path d="M24 24c5-6 13-6 18 0-5 6-13 6-18 0Z" stroke={S} strokeWidth="2" />
      </Svg>
    );
  return (
    <Svg>
      <path d="M9 24c6-8 24-8 30 0-6 8-24 8-30 0Z" stroke={S} strokeWidth="2" />
      <circle cx="24" cy="24" r="3.5" fill={S} />
    </Svg>
  );
}

function browIcon(value: string) {
  if (has(value, "straight")) return <Svg><path d="M10 24h28" stroke={S} strokeWidth="3" /></Svg>;
  if (has(value, "thick", "bushy"))
    return <Svg><path d="M10 26c8-8 20-8 28 0-8-4-20-4-28 0Z" fill={S} /></Svg>;
  if (has(value, "thin")) return <Svg><path d="M10 26c8-7 20-7 28 0" stroke={S} strokeWidth="1.5" /></Svg>;
  return <Svg><path d="M10 27c8-9 20-9 28 0" stroke={S} strokeWidth="3" /></Svg>;
}

function noseIcon(value: string) {
  if (has(value, "button")) return <Svg><path d="M24 14v14c-3 1-5-1-3-3" stroke={S} strokeWidth="2" /><circle cx="24" cy="31" r="3" stroke={S} strokeWidth="2" /></Svg>;
  if (has(value, "wide")) return <Svg><path d="M24 12v16" stroke={S} strokeWidth="2" /><path d="M15 30c3 4 15 4 18 0" stroke={S} strokeWidth="2" /></Svg>;
  if (has(value, "roman")) return <Svg><path d="M24 12c3 5 1 8 3 16-3 3-8 2-6-2" stroke={S} strokeWidth="2" /></Svg>;
  if (has(value, "upturned")) return <Svg><path d="M24 12v14c-4 2-6-3-2-4" stroke={S} strokeWidth="2" /></Svg>;
  if (has(value, "narrow")) return <Svg><path d="M24 12v16" stroke={S} strokeWidth="2" /><path d="M20 31c2 2 6 2 8 0" stroke={S} strokeWidth="2" /></Svg>;
  return <Svg><path d="M24 12v16" stroke={S} strokeWidth="2" /><path d="M19 31c3 3 7 3 10 0" stroke={S} strokeWidth="2" /></Svg>;
}

function lipIcon(value: string) {
  if (has(value, "thin"))
    return <Svg><path d="M12 24c6-3 18-3 24 0-6 3-18 3-24 0Z" fill={S} /></Svg>;
  if (has(value, "full"))
    return <Svg><path d="M10 23c7-7 21-7 28 0-7 9-21 9-28 0Z" fill={S} /></Svg>;
  if (has(value, "wide smile"))
    return <Svg><path d="M9 21c9 12 21 12 30 0-9 4-21 4-30 0Z" fill={S} /></Svg>;
  return <Svg><path d="M11 23c7-5 19-5 26 0-7 6-19 6-26 0Z" fill={S} /></Svg>;
}

function earIcon(value: string) {
  const r = has(value, "large") ? 11 : has(value, "small") ? 7 : 9;
  return (
    <Svg>
      <path
        d={`M${24 - r / 2} ${24 - r} a${r} ${r} 0 1 0 ${r / 2} ${r * 1.8}`}
        stroke={S}
        strokeWidth="2"
        transform={has(value, "protrud") ? "rotate(-12 24 24)" : undefined}
      />
      <path d="M23 20c3 1 3 6 0 8" stroke={S} strokeWidth="1.5" />
    </Svg>
  );
}

function faceHairIcon(value: string) {
  const head = <ellipse cx="24" cy="22" rx="10" ry="11" stroke={S} strokeWidth="1.6" opacity="0.45" />;
  if (has(value, "clean")) return <Svg>{head}</Svg>;
  if (has(value, "stubble"))
    return (
      <Svg>
        {head}
        <g fill={S}>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={17 + i * 3.5} cy={29 + (i % 2) * 2} r="1" />
          ))}
        </g>
      </Svg>
    );
  if (has(value, "moustache"))
    return <Svg>{head}<path d="M17 26c3-2 5 0 7 0s4-2 7 0c-2 3-12 3-14 0Z" fill={S} /></Svg>;
  if (has(value, "goatee"))
    return <Svg>{head}<path d="M21 28h6v5c0 2-6 2-6 0Z" fill={S} /></Svg>;
  if (has(value, "short beard"))
    return <Svg>{head}<path d="M15 24c0 7 4 11 9 11s9-4 9-11c-3 5-15 5-18 0Z" fill={S} /></Svg>;
  return <Svg>{head}<path d="M14 21c0 11 5 18 10 18s10-7 10-18c-4 6-16 6-20 0Z" fill={S} /></Svg>;
}

function expressionIcon(value: string) {
  const base = <circle cx="24" cy="24" r="14" stroke={S} strokeWidth="2" />;
  let mouth = <path d="M17 28c4 4 10 4 14 0" stroke={S} strokeWidth="2" />;
  let eyes = (
    <g fill={S}>
      <circle cx="19" cy="21" r="1.8" />
      <circle cx="29" cy="21" r="1.8" />
    </g>
  );
  if (has(value, "joyful")) mouth = <path d="M15 26c5 8 13 8 18 0Z" fill={S} />;
  if (has(value, "smirk")) mouth = <path d="M18 29c4 2 8 0 11-3" stroke={S} strokeWidth="2" />;
  if (has(value, "calm")) mouth = <path d="M18 29h12" stroke={S} strokeWidth="2" />;
  if (has(value, "thoughtful")) {
    mouth = <path d="M18 30c4-2 8-2 12 0" stroke={S} strokeWidth="2" />;
    eyes = (
      <g stroke={S} strokeWidth="2">
        <path d="M16 21h6M27 21h5" />
      </g>
    );
  }
  if (has(value, "surprise")) {
    mouth = <circle cx="24" cy="29" r="4" stroke={S} strokeWidth="2" />;
    eyes = (
      <g stroke={S} strokeWidth="2">
        <circle cx="19" cy="21" r="2.6" />
        <circle cx="29" cy="21" r="2.6" />
      </g>
    );
  }
  return <Svg>{base}{eyes}{mouth}</Svg>;
}

function outfitIcon(value: string) {
  if (has(value, "dress", "kaftan", "slip"))
    return <Svg><path d="M18 12h12l3 7-3 3 4 16H14l4-16-3-3 3-7Z" stroke={S} strokeWidth="2" /></Svg>;
  if (has(value, "hoodie"))
    return (
      <Svg>
        <path d="M17 12h14l7 6-4 5v15H14V23l-4-5 7-6Z" stroke={S} strokeWidth="2" />
        <path d="M19 12c2 4 8 4 10 0" stroke={S} strokeWidth="2" />
        <path d="M24 22v8" stroke={S} strokeWidth="1.6" />
      </Svg>
    );
  if (has(value, "jacket", "coat", "blazer", "cardigan", "overshirt", "kimono"))
    return (
      <Svg>
        <path d="M17 12h14l7 6-4 4v16H14V22l-4-4 7-6Z" stroke={S} strokeWidth="2" />
        <path d="M22 12l2 6 2-6M24 18v20" stroke={S} strokeWidth="2" />
      </Svg>
    );
  if (has(value, "shirt", "blouse", "tunic", "sherwani", "flannel"))
    return (
      <Svg>
        <path d="M18 12h12l8 6-4 4v16H14V22l-4-4 8-6Z" stroke={S} strokeWidth="2" />
        <path d="M18 12l6 5 6-5M24 17v21" stroke={S} strokeWidth="2" />
      </Svg>
    );
  if (has(value, "tank", "bare", "mesh"))
    return <Svg><path d="M18 12c1 5 11 5 12 0l4 3-2 23H16L14 15l4-3Z" stroke={S} strokeWidth="2" /></Svg>;
  if (has(value, "jumpsuit"))
    return <Svg><path d="M17 12h14l3 8-2 18h-8l-1-10-1 10h-8l-2-18 5-8Z" stroke={S} strokeWidth="2" /></Svg>;
  return (
    <Svg>
      <path d="M18 12h12l8 6-4 4v16H14V22l-4-4 8-6Z" stroke={S} strokeWidth="2" />
      <path d="M19 12c2 4 8 4 10 0" stroke={S} strokeWidth="2" />
    </Svg>
  );
}

function headwearIcon(value: string) {
  if (has(value, "none")) return <Svg><path d="M12 30c0-9 5-14 12-14s12 5 12 14" stroke={S} strokeWidth="2" opacity="0.4" /><path d="M14 14l20 20" stroke={S} strokeWidth="2" /></Svg>;
  if (has(value, "cap")) return <Svg><path d="M12 28c0-8 5-13 12-13s12 5 12 13H12Z" fill={S} /><path d="M36 28h7" stroke={S} strokeWidth="3" /></Svg>;
  if (has(value, "beanie")) return <Svg><path d="M13 30c0-10 5-15 11-15s11 5 11 15H13Z" fill={S} /><rect x="11" y="29" width="26" height="5" rx="2" fill={S} /></Svg>;
  if (has(value, "bucket")) return <Svg><path d="M15 28c0-8 3-12 9-12s9 4 9 12H15Z" fill={S} /><path d="M9 28h30l-3 6H12l-3-6Z" fill={S} /></Svg>;
  if (has(value, "band")) return <Svg><path d="M12 26c0-8 5-12 12-12s12 4 12 12" stroke={S} strokeWidth="2" /><rect x="11" y="22" width="26" height="6" rx="3" fill={S} /></Svg>;
  if (has(value, "brim", "cowboy")) return <Svg><path d="M16 26c0-8 3-11 8-11s8 3 8 11H16Z" fill={S} /><path d="M6 28h36c-3 5-33 5-36 0Z" fill={S} /></Svg>;
  if (has(value, "beret")) return <Svg><path d="M13 27c0-8 5-12 11-12s12 3 12 9c0 4-3 5-6 5H13Z" fill={S} /><circle cx="31" cy="13" r="2" fill={S} /></Svg>;
  if (has(value, "turban", "durag", "scarf", "bandana")) return <Svg><path d="M12 29c0-10 5-15 12-15s12 5 12 15c-6 3-18 3-24 0Z" fill={S} /><path d="M34 29l7 6" stroke={S} strokeWidth="3" /></Svg>;
  if (has(value, "headphone")) return <Svg><path d="M12 28v-4a12 12 0 0 1 24 0v4" stroke={S} strokeWidth="2" /><rect x="8" y="26" width="7" height="10" rx="3" fill={S} /><rect x="33" y="26" width="7" height="10" rx="3" fill={S} /></Svg>;
  return <Svg><path d="M13 28c0-9 5-13 11-13s11 4 11 13H13Z" fill={S} /></Svg>;
}

function eyewearIcon(value: string) {
  if (has(value, "none"))
    return <Svg><circle cx="15" cy="24" r="6" stroke={S} strokeWidth="1.6" opacity="0.35" /><circle cx="33" cy="24" r="6" stroke={S} strokeWidth="1.6" opacity="0.35" /><path d="M12 34L36 14" stroke={S} strokeWidth="2" /></Svg>;
  const bridge = <path d="M21 24h6M9 22l-4-3M39 22l4-3" stroke={S} strokeWidth="2" />;
  if (has(value, "round", "wire"))
    return <Svg><circle cx="15" cy="24" r="6" stroke={S} strokeWidth="2" /><circle cx="33" cy="24" r="6" stroke={S} strokeWidth="2" />{bridge}</Svg>;
  if (has(value, "cat-eye"))
    return <Svg><path d="M9 21c4-3 10-2 11 3-3 4-11 4-11-3Z" stroke={S} strokeWidth="2" /><path d="M39 21c-4-3-10-2-11 3 3 4 11 4 11-3Z" stroke={S} strokeWidth="2" />{bridge}</Svg>;
  if (has(value, "aviator", "shades", "visor"))
    return <Svg><path d="M8 20h13l-2 8h-8l-3-8Z" fill={S} /><path d="M40 20H27l2 8h8l3-8Z" fill={S} />{bridge}</Svg>;
  return <Svg><rect x="7" y="19" width="14" height="10" rx="3" stroke={S} strokeWidth="2" /><rect x="27" y="19" width="14" height="10" rx="3" stroke={S} strokeWidth="2" />{bridge}</Svg>;
}

function jewelryIcon(value: string) {
  if (has(value, "hoop")) return <Svg><circle cx="24" cy="27" r="9" stroke={S} strokeWidth="2.5" /><path d="M20 16h8" stroke={S} strokeWidth="2" /></Svg>;
  if (has(value, "stud")) return <Svg><circle cx="24" cy="24" r="5" fill={S} /><circle cx="24" cy="24" r="9" stroke={S} strokeWidth="1.5" /></Svg>;
  if (has(value, "cuff")) return <Svg><path d="M30 14a12 12 0 1 0 0 20" stroke={S} strokeWidth="3" /></Svg>;
  if (has(value, "nose", "septum")) return <Svg><path d="M24 12v12" stroke={S} strokeWidth="2" /><circle cx="24" cy="30" r="6" stroke={S} strokeWidth="2.5" /></Svg>;
  if (has(value, "choker")) return <Svg><path d="M10 20c6 8 22 8 28 0" stroke={S} strokeWidth="4" /></Svg>;
  if (has(value, "chain")) return <Svg><path d="M9 16c6 14 24 14 30 0" stroke={S} strokeWidth="4" /></Svg>;
  if (has(value, "ring", "bangle")) return <Svg><circle cx="18" cy="24" r="7" stroke={S} strokeWidth="2.5" /><circle cx="31" cy="24" r="7" stroke={S} strokeWidth="2.5" /></Svg>;
  if (has(value, "pearl"))
    return <Svg><g fill={S}>{[0, 1, 2, 3, 4, 5].map((i) => <circle key={i} cx={10 + i * 5.6} cy={20 + Math.sin(i) * 4 + 4} r="2.6" />)}</g></Svg>;
  return <Svg><path d="M9 15c6 13 24 13 30 0" stroke={S} strokeWidth="2" /><path d="M24 27l4 5-4 5-4-5 4-5Z" fill={S} /></Svg>;
}

function makeupIcon(value: string) {
  const head = <ellipse cx="24" cy="24" rx="12" ry="14" stroke={S} strokeWidth="1.6" opacity="0.4" />;
  if (has(value, "lip", "gloss", "berry", "red"))
    return <Svg>{head}<path d="M17 28c4-4 10-4 14 0-4 5-10 5-14 0Z" fill={S} /></Svg>;
  if (has(value, "liner", "smoky", "eyelid", "winged", "graphic"))
    return <Svg>{head}<path d="M15 21c3-3 6-3 8 0M25 21c3-3 6-3 8 0" stroke={S} strokeWidth="2.5" /><path d="M33 19l4-3" stroke={S} strokeWidth="2" /></Svg>;
  if (has(value, "blush", "cheek", "contour", "bronz"))
    return <Svg>{head}<circle cx="16" cy="26" r="3.5" fill={S} opacity="0.7" /><circle cx="32" cy="26" r="3.5" fill={S} opacity="0.7" /></Svg>;
  if (has(value, "glitter", "shimmer"))
    return <Svg>{head}<g fill={S}>{[[16, 18], [30, 17], [22, 14], [34, 26], [14, 28]].map(([x, y], i) => <path key={i} d={`M${x} ${y! - 3}l1.2 2.4 2.4 1.2-2.4 1.2L${x} ${y! + 3}l-1.2-2.4L${x! - 3} ${y}l2.4-1.2Z`} />)}</g></Svg>;
  return <Svg>{head}<path d="M14 24c4 3 16 3 20 0" stroke={S} strokeWidth="2" /></Svg>;
}

function extraIcon(value: string) {
  const head = <ellipse cx="24" cy="24" rx="12" ry="14" stroke={S} strokeWidth="1.6" opacity="0.45" />;
  if (has(value, "freckle", "blushed", "sun"))
    return <Svg>{head}<g fill={S}>{[[18, 24], [21, 27], [27, 27], [30, 24], [24, 29]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.3" />)}</g></Svg>;
  if (has(value, "dimple")) return <Svg>{head}<path d="M17 27c1 2 1 3 0 4M31 27c-1 2-1 3 0 4" stroke={S} strokeWidth="2" /></Svg>;
  if (has(value, "beauty spot")) return <Svg>{head}<circle cx="29" cy="28" r="2" fill={S} /></Svg>;
  if (has(value, "vitiligo")) return <Svg>{head}<path d="M17 20c4-3 7 2 5 5s-7 2-7-1 1-3 2-4Z" fill={S} opacity="0.6" /></Svg>;
  if (has(value, "tattoo")) return <Svg>{head}<path d="M28 18c4 2 4 8 0 10M18 30c-3 2-3 6 0 7" stroke={S} strokeWidth="2" /></Svg>;
  if (has(value, "scar")) return <Svg>{head}<path d="M29 16l-4 10" stroke={S} strokeWidth="2" /><path d="M27 19h4M26 23h4" stroke={S} strokeWidth="1.5" /></Svg>;
  return <Svg>{head}<path d="M16 30c4 3 12 3 16 0" stroke={S} strokeWidth="2" /></Svg>;
}

function genderIcon(value: string) {
  if (has(value, "male") && !has(value, "female"))
    return <Svg><circle cx="20" cy="28" r="9" stroke={S} strokeWidth="2.5" /><path d="M28 20l11-11M31 9h8v8" stroke={S} strokeWidth="2.5" /></Svg>;
  if (has(value, "female"))
    return <Svg><circle cx="24" cy="19" r="9" stroke={S} strokeWidth="2.5" /><path d="M24 28v13M18 35h12" stroke={S} strokeWidth="2.5" /></Svg>;
  return <Svg><circle cx="24" cy="22" r="8" stroke={S} strokeWidth="2.5" /><path d="M24 30v10M19 36h10M30 16l8-8M31 8h7v7M18 16l-8-8M17 8h-7v7" stroke={S} strokeWidth="2" /></Svg>;
}

/** Category → visual renderer. */
export type IconKey =
  | "gender"
  | "age"
  | "skin"
  | "face"
  | "eyeColor"
  | "eyeShape"
  | "brows"
  | "nose"
  | "lips"
  | "ears"
  | "hair"
  | "hairColor"
  | "facialHair"
  | "expression"
  | "outfit"
  | "outfitColor"
  | "fabric"
  | "headwear"
  | "eyewear"
  | "makeup"
  | "jewelry"
  | "background"
  | "extras";

export function OptionVisual({ group, value }: { group: IconKey; value: string }) {
  // Pure colour / material swatches
  if (group === "skin" || group === "hairColor" || group === "eyeColor" || group === "outfitColor") {
    const color = SWATCH[value] ?? "#888";
    if (group === "eyeColor")
      return (
        <div className="grid size-full place-items-center">
          <div
            className="size-8 rounded-full ring-2 ring-foreground/15"
            style={{ background: `radial-gradient(circle at 50% 50%, #111 0 22%, ${color} 23% 72%, #ffffff33 73%)` }}
          />
        </div>
      );
    return (
      <div className="grid size-full place-items-center">
        <div
          className="size-9 rounded-full ring-2 ring-foreground/10"
          style={{ background: `radial-gradient(circle at 32% 28%, #ffffff55, transparent 55%), ${color}` }}
        />
      </div>
    );
  }
  if (group === "background")
    return (
      <div className="grid size-full place-items-center">
        <div className="size-10 rounded-xl ring-1 ring-foreground/10" style={{ background: GRADIENT[value] ?? "#555" }} />
      </div>
    );
  if (group === "fabric")
    return (
      <div className="grid size-full place-items-center">
        <div className="size-10 rounded-xl ring-1 ring-foreground/10" style={{ background: FABRIC_STYLE[value] ?? "#777" }} />
      </div>
    );
  if (group === "age")
    return (
      <div className="grid size-full place-items-center">
        <span className="data-figure text-base font-bold">{value}</span>
      </div>
    );

  const map: Record<string, React.ReactNode> = {
    gender: genderIcon(value),
    face: <Svg>{faceOutline(value)}</Svg>,
    hair: hairIcon(value),
    eyeShape: eyeIcon(value),
    brows: browIcon(value),
    nose: noseIcon(value),
    lips: lipIcon(value),
    ears: earIcon(value),
    facialHair: faceHairIcon(value),
    expression: expressionIcon(value),
    outfit: outfitIcon(value),
    headwear: headwearIcon(value),
    eyewear: eyewearIcon(value),
    jewelry: jewelryIcon(value),
    makeup: makeupIcon(value),
    extras: extraIcon(value),
  };
  return <div className="grid size-full place-items-center p-2">{map[group] ?? null}</div>;
}
