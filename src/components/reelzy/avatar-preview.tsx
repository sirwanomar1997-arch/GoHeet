/**
 * Live, instant preview of the avatar being built.
 * Pure SVG — it redraws the moment any option is tapped, so nothing is a surprise
 * before the final 3D render is generated.
 */
import { useId } from "react";
import { SWATCH } from "@/components/reelzy/avatar-icons";

export type PreviewTraits = {
  gender: string;
  age: string;
  skin: string;
  face: string;
  eyeColor: string;
  eyeShape: string;
  brows: string;
  nose: string;
  lips: string;
  ears: string;
  hair: string;
  hairColor: string;
  facialHair: string;
  expression: string;
  outfit: string;
  outfitColor: string;
  fabric: string;
  headwear: string;
  eyewear: string;
  makeup: string[];
  jewelry: string[];
  background: string;
  extras: string[];
};

const BG: Record<string, [string, string]> = {
  "Warm orange-pink glow": ["#ff9a4d", "#f4657f"],
  "Deep amber": ["#f0a13c", "#a44d15"],
  "Crimson dusk": ["#e05a54", "#7d1a30"],
  "Peach sunrise": ["#ffd7b0", "#ff9d78"],
  "Soft sand": ["#f4e6d0", "#dcc09a"],
  "Midnight ember": ["#7a2f2a", "#171220"],
  "Rose gold": ["#f3cfc0", "#d38b76"],
  "Golden hour": ["#ffd98a", "#e88a2a"],
  "Cool slate": ["#8093a1", "#333f4a"],
  "Emerald haze": ["#5aa787", "#164536"],
  "Violet twilight": ["#9d7ade", "#31215a"],
  "Studio charcoal": ["#55555c", "#19191b"],
};

const FACE_P: Record<string, { cheek: number; jaw: number; chin: number; top: number }> = {
  Oval: { cheek: 62, jaw: 46, chin: 252, top: 72 },
  Round: { cheek: 67, jaw: 58, chin: 240, top: 78 },
  "Square jaw": { cheek: 64, jaw: 62, chin: 246, top: 74 },
  Heart: { cheek: 67, jaw: 38, chin: 254, top: 72 },
  Long: { cheek: 56, jaw: 45, chin: 268, top: 66 },
  "Sharp cheekbones": { cheek: 69, jaw: 41, chin: 254, top: 72 },
};

function hex(color: string, fallback = "#888") {
  return SWATCH[color] ?? fallback;
}

function shift(color: string, amt: number) {
  const c = color.replace("#", "");
  const n = parseInt(c.length === 3 ? c.replace(/./g, (m) => m + m) : c, 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const r = clamp(((n >> 16) & 255) + amt);
  const g = clamp(((n >> 8) & 255) + amt);
  const b = clamp((n & 255) + amt);
  return `rgb(${r},${g},${b})`;
}

const has = (v: string, ...k: string[]) => k.some((x) => v.toLowerCase().includes(x));
const hasAny = (arr: string[], ...k: string[]) => arr.some((v) => has(v, ...k));

export function AvatarPreview({ t, className }: { t: PreviewTraits; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const id = (n: string) => `${n}-${uid}`;
  const f = FACE_P[t.face] ?? FACE_P["Oval"]!;
  const skin = hex(t.skin, "#dfae83");
  const skinShade = shift(skin, -28);
  const skinLight = shift(skin, 20);
  const hair = hex(t.hairColor, "#3b2517");
  const hairLight = shift(hair, 34);
  const eye = hex(t.eyeColor, "#3b2517");
  const cloth = hex(t.outfitColor, "#222");
  const clothDark = shift(cloth, -26);
  const [bg1, bg2] = BG[t.background] ?? ["#ff9a4d", "#f4657f"];

  const cx = 150;
  const eyeY = 172;
  const headTop = f.top;
  const chin = f.chin;
  const headPath = `M${cx} ${headTop}
    C${cx - f.cheek} ${headTop} ${cx - f.cheek} ${eyeY - 40} ${cx - f.cheek} ${eyeY}
    C${cx - f.cheek} ${eyeY + 44} ${cx - f.jaw} ${chin - 18} ${cx} ${chin}
    C${cx + f.jaw} ${chin - 18} ${cx + f.cheek} ${eyeY + 44} ${cx + f.cheek} ${eyeY}
    C${cx + f.cheek} ${eyeY - 40} ${cx + f.cheek} ${headTop} ${cx} ${headTop} Z`;

  const earR = has(t.ears, "large") ? 13 : has(t.ears, "small") ? 8 : 10.5;
  const earTilt = has(t.ears, "protrud") ? 4 : 0;

  const feminine = has(t.gender, "female") || has(t.gender, "non");
  const lashes = feminine || hasAny(t.makeup, "liner", "smoky", "winged", "graphic");

  // ---- eyes -------------------------------------------------------------
  const eyeW = has(t.eyeShape, "wide") ? 24 : has(t.eyeShape, "round") ? 19 : 21;
  const eyeH = has(t.eyeShape, "round")
    ? 15
    : has(t.eyeShape, "monolid")
      ? 8
      : has(t.eyeShape, "hooded")
        ? 10
        : 12;
  const eyeGap = has(t.eyeShape, "wide") ? 40 : 34;
  const lift = has(t.eyeShape, "upturned") ? 4 : 0;

  const Eye = ({ side }: { side: -1 | 1 }) => {
    const x = cx + side * eyeGap;
    const tilt = side * lift;
    return (
      <g>
        <path
          d={`M${x - eyeW} ${eyeY + tilt} Q${x} ${eyeY - eyeH + tilt} ${x + eyeW} ${eyeY - tilt}
              Q${x} ${eyeY + eyeH + tilt * 0.5} ${x - eyeW} ${eyeY + tilt} Z`}
          fill="#fffaf5"
          stroke={shift(skin, -60)}
          strokeWidth="1.6"
        />
        <circle cx={x} cy={eyeY + tilt * 0.2} r={Math.min(eyeH * 0.75, 9)} fill={eye} />
        <circle cx={x} cy={eyeY + tilt * 0.2} r={Math.min(eyeH * 0.34, 4)} fill="#14100e" />
        <circle cx={x - 3} cy={eyeY - 4} r="2.2" fill="#fff" opacity="0.9" />
        {has(t.eyeShape, "hooded") ? (
          <path
            d={`M${x - eyeW} ${eyeY - 6 + tilt} Q${x} ${eyeY - eyeH - 6} ${x + eyeW} ${eyeY - 6 - tilt}`}
            stroke={shift(skin, -45)}
            strokeWidth="2.4"
            fill="none"
          />
        ) : null}
        {lashes ? (
          <path
            d={`M${x - eyeW} ${eyeY + tilt} Q${x} ${eyeY - eyeH - 2 + tilt} ${x + eyeW} ${eyeY - tilt}`}
            stroke="#191013"
            strokeWidth={hasAny(t.makeup, "smoky", "graphic") ? 4 : 2.6}
            fill="none"
            strokeLinecap="round"
          />
        ) : null}
        {hasAny(t.makeup, "winged", "graphic") ? (
          <path
            d={`M${x + side * eyeW} ${eyeY - tilt} l${side * 9} -6`}
            stroke="#191013"
            strokeWidth="3"
            strokeLinecap="round"
          />
        ) : null}
        {hasAny(t.makeup, "shimmer", "glitter") ? (
          <path
            d={`M${x - eyeW} ${eyeY - 4 + tilt} Q${x} ${eyeY - eyeH - 8} ${x + eyeW} ${eyeY - 4 - tilt}`}
            stroke="#f0c07a"
            strokeWidth="4"
            opacity="0.5"
            fill="none"
          />
        ) : null}
      </g>
    );
  };

  // ---- brows ------------------------------------------------------------
  const browW = 24;
  const browY = eyeY - (has(t.eyeShape, "hooded") ? 26 : 28);
  const browThick = has(t.brows, "thick", "bushy") ? 8 : has(t.brows, "thin") ? 3 : 5.5;
  const Brow = ({ side }: { side: -1 | 1 }) => {
    const x = cx + side * eyeGap;
    const arch = has(t.brows, "straight") ? 0 : has(t.brows, "thin") ? 8 : 10;
    return (
      <path
        d={`M${x - browW} ${browY + 3} Q${x} ${browY - arch} ${x + browW} ${browY + 3}`}
        stroke={shift(hair, -10)}
        strokeWidth={browThick}
        strokeLinecap="round"
        fill="none"
      />
    );
  };

  // ---- nose -------------------------------------------------------------
  const noseW = has(t.nose, "wide") ? 16 : has(t.nose, "narrow") ? 8 : has(t.nose, "button") ? 10 : 12;
  const noseBottom = 214;
  const nose = (
    <g stroke={skinShade} strokeWidth="3" fill="none" strokeLinecap="round">
      <path
        d={
          has(t.nose, "roman")
            ? `M${cx - 3} ${eyeY - 4} q6 16 3 ${noseBottom - eyeY}`
            : `M${cx - 4} ${eyeY + 6} q2 ${noseBottom - eyeY - 12} 4 ${noseBottom - eyeY - 6}`
        }
      />
      <path
        d={`M${cx - noseW} ${noseBottom} q${noseW} ${has(t.nose, "upturned") ? -7 : 7} ${noseW * 2} 0`}
      />
    </g>
  );

  // ---- mouth ------------------------------------------------------------
  const lipFull = has(t.lips, "full") ? 11 : has(t.lips, "thin") ? 5 : 8;
  const mouthW = has(t.lips, "wide") ? 30 : 24;
  const mouthY = 240;
  const lipColor = hasAny(t.makeup, "red")
    ? "#c3122f"
    : hasAny(t.makeup, "berry")
      ? "#8e2350"
      : hasAny(t.makeup, "nude", "gloss")
        ? shift(skin, -34)
        : shift(skin, -58);
  const smile = has(t.expression, "joyful")
    ? 16
    : has(t.expression, "half-smile", "smirk")
      ? 8
      : has(t.expression, "thoughtful")
        ? -3
        : 3;
  const mouth = has(t.expression, "surprise") ? (
    <ellipse cx={cx} cy={mouthY} rx={mouthW * 0.4} ry={lipFull + 4} fill={shift(lipColor, -30)} />
  ) : has(t.expression, "joyful") ? (
    <g>
      <path
        d={`M${cx - mouthW} ${mouthY - 4} Q${cx} ${mouthY + smile + 12} ${cx + mouthW} ${mouthY - 4}
            Q${cx} ${mouthY - 10} ${cx - mouthW} ${mouthY - 4} Z`}
        fill={shift(lipColor, -25)}
      />
      <path
        d={`M${cx - mouthW + 4} ${mouthY - 3} Q${cx} ${mouthY + 3} ${cx + mouthW - 4} ${mouthY - 3} Z`}
        fill="#fffaf6"
      />
    </g>
  ) : (
    <g fill={lipColor}>
      <path
        d={`M${cx - mouthW} ${mouthY} Q${cx - mouthW / 2} ${mouthY - lipFull} ${cx} ${mouthY - lipFull * 0.45}
            Q${cx + mouthW / 2} ${mouthY - lipFull} ${cx + mouthW} ${mouthY} Z`}
      />
      <path
        d={`M${cx - mouthW} ${mouthY} Q${cx} ${mouthY + lipFull + smile * 0.5} ${cx + mouthW} ${mouthY} Z`}
      />
    </g>
  );

  // ---- facial hair ------------------------------------------------------
  const beard = has(t.facialHair, "clean") ? null : has(t.facialHair, "stubble") ? (
    <path d={headPath} fill={hair} opacity="0.22" clipPath={`url(#${id("lowerFace")})`} />
  ) : has(t.facialHair, "moustache") ? (
    <path
      d={`M${cx - 20} ${mouthY - 14} q10 -7 20 0 q10 -7 20 0 q-8 9 -20 9 q-12 0 -20 -9 Z`}
      fill={hair}
      transform="translate(-10,0)"
    />
  ) : has(t.facialHair, "goatee") ? (
    <path d={`M${cx - 14} ${mouthY + 8} h28 v16 q-14 12 -28 0 Z`} fill={hair} />
  ) : (
    <path
      d={headPath}
      fill={hair}
      clipPath={`url(#${id(has(t.facialHair, "full") ? "fullBeard" : "shortBeard")})`}
    />
  );

  // ---- hair -------------------------------------------------------------
  const h = t.hair;
  const hairBack =
    has(h, "long", "wavy", "shoulder", "ponytail") && !has(h, "hijab") ? (
      <path
        d={`M${cx - f.cheek - 12} ${eyeY - 60} C${cx - f.cheek - 26} ${eyeY + 60} ${cx - f.cheek - 20} ${chin + 60} ${cx - f.cheek - 6} ${chin + 90}
            L${cx + f.cheek + 6} ${chin + 90} C${cx + f.cheek + 20} ${chin + 60} ${cx + f.cheek + 26} ${eyeY + 60} ${cx + f.cheek + 12} ${eyeY - 60} Z`}
        fill={shift(hair, -14)}
      />
    ) : has(h, "afro", "coily") ? (
      <circle cx={cx} cy={headTop + 42} r={f.cheek + 34} fill={hair} />
    ) : has(h, "curly") ? (
      <ellipse cx={cx} cy={headTop + 34} rx={f.cheek + 22} ry={f.cheek + 8} fill={hair} />
    ) : null;

  const capTop = headTop - 6;
  const hairFront = has(h, "bald") ? null : has(h, "hijab") ? (
    <g>
      <path
        d={`M${cx - f.cheek - 12} ${eyeY + 10} C${cx - f.cheek - 14} ${headTop - 34} ${cx + f.cheek + 14} ${headTop - 34} ${cx + f.cheek + 12} ${eyeY + 10}
            L${cx + f.cheek + 18} ${chin + 80} L${cx - f.cheek - 18} ${chin + 80} Z`}
        fill={cloth}
      />
      <path d={headPath} fill={skin} clipPath={`url(#${id("faceWindow")})`} />
    </g>
  ) : has(h, "buzz", "crew", "shaved") ? (
    <path
      d={`M${cx - f.cheek - 1} ${eyeY - 34} C${cx - f.cheek - 2} ${capTop - 6} ${cx + f.cheek + 2} ${capTop - 6} ${cx + f.cheek + 1} ${eyeY - 34}
          C${cx + 30} ${eyeY - 48} ${cx - 30} ${eyeY - 48} ${cx - f.cheek - 1} ${eyeY - 34} Z`}
      fill={hair}
      opacity={has(h, "buzz") ? 0.85 : 1}
    />
  ) : has(h, "braid", "cornrow", "locs") ? (
    <g fill={hair}>
      <path
        d={`M${cx - f.cheek - 2} ${eyeY - 30} C${cx - f.cheek - 4} ${capTop - 12} ${cx + f.cheek + 4} ${capTop - 12} ${cx + f.cheek + 2} ${eyeY - 30} Z`}
      />
      {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
        <rect
          key={i}
          x={cx + i * 18 - 4}
          y={headTop - 4}
          width="8"
          height={has(h, "locs") ? chin + 40 - headTop : 70}
          rx="4"
          fill={shift(hair, i % 2 ? 8 : -8)}
        />
      ))}
    </g>
  ) : has(h, "top knot") ? (
    <g fill={hair}>
      <circle cx={cx} cy={headTop - 24} r="20" />
      <path
        d={`M${cx - f.cheek - 2} ${eyeY - 32} C${cx - f.cheek - 4} ${capTop - 14} ${cx + f.cheek + 4} ${capTop - 14} ${cx + f.cheek + 2} ${eyeY - 32}
            C${cx + 26} ${eyeY - 46} ${cx - 26} ${eyeY - 46} ${cx - f.cheek - 2} ${eyeY - 32} Z`}
      />
    </g>
  ) : (
    <path
      d={`M${cx - f.cheek - 4} ${eyeY - 10} C${cx - f.cheek - 10} ${capTop - 26} ${cx + f.cheek + 10} ${capTop - 26} ${cx + f.cheek + 4} ${eyeY - 10}
          C${cx + f.cheek} ${eyeY - 52} ${cx + 20} ${eyeY - 44} ${cx - 6} ${eyeY - 40}
          C${cx - 34} ${eyeY - 36} ${cx - f.cheek + 6} ${eyeY - 46} ${cx - f.cheek - 4} ${eyeY - 10} Z`}
      fill={hair}
    />
  );

  const hairShine = has(h, "bald") || has(h, "hijab") ? null : (
    <path
      d={`M${cx - 34} ${headTop + 4} q22 -18 48 -2`}
      stroke={hairLight}
      strokeWidth="7"
      strokeLinecap="round"
      fill="none"
      opacity="0.5"
    />
  );

  // ---- headwear ---------------------------------------------------------
  const hw = t.headwear;
  const headwear = has(hw, "none") ? null : has(hw, "cap") ? (
    <g fill={cloth}>
      <path
        d={`M${cx - f.cheek - 6} ${eyeY - 34} C${cx - f.cheek - 8} ${capTop - 30} ${cx + f.cheek + 8} ${capTop - 30} ${cx + f.cheek + 6} ${eyeY - 34} Z`}
      />
      <path d={`M${cx - f.cheek - 6} ${eyeY - 34} h${f.cheek * 2 + 12} q26 4 30 12 q-40 6 -${f.cheek * 2 + 12} 0 Z`} />
    </g>
  ) : has(hw, "beanie") ? (
    <g fill={cloth}>
      <path
        d={`M${cx - f.cheek - 6} ${eyeY - 30} C${cx - f.cheek - 10} ${capTop - 44} ${cx + f.cheek + 10} ${capTop - 44} ${cx + f.cheek + 6} ${eyeY - 30} Z`}
      />
      <rect x={cx - f.cheek - 10} y={eyeY - 44} width={f.cheek * 2 + 20} height="18" rx="9" fill={clothDark} />
    </g>
  ) : has(hw, "bucket") ? (
    <g fill={cloth}>
      <path d={`M${cx - 46} ${eyeY - 34} C${cx - 46} ${capTop - 20} ${cx + 46} ${capTop - 20} ${cx + 46} ${eyeY - 34} Z`} />
      <path d={`M${cx - 84} ${eyeY - 34} h168 l-16 20 h-136 Z`} />
    </g>
  ) : has(hw, "brim", "cowboy") ? (
    <g fill={cloth}>
      <path d={`M${cx - 44} ${eyeY - 40} C${cx - 44} ${capTop - 24} ${cx + 44} ${capTop - 24} ${cx + 44} ${eyeY - 40} Z`} />
      <ellipse cx={cx} cy={eyeY - 36} rx="100" ry="16" />
    </g>
  ) : has(hw, "beret") ? (
    <path
      d={`M${cx - f.cheek - 10} ${eyeY - 40} C${cx - f.cheek - 20} ${capTop - 40} ${cx + f.cheek + 26} ${capTop - 34} ${cx + f.cheek - 6} ${eyeY - 40} Z`}
      fill={cloth}
    />
  ) : has(hw, "band") ? (
    <rect x={cx - f.cheek - 6} y={eyeY - 52} width={f.cheek * 2 + 12} height="16" rx="8" fill={cloth} />
  ) : has(hw, "turban", "durag", "scarf", "bandana") ? (
    <path
      d={`M${cx - f.cheek - 8} ${eyeY - 26} C${cx - f.cheek - 12} ${capTop - 40} ${cx + f.cheek + 12} ${capTop - 40} ${cx + f.cheek + 8} ${eyeY - 26}
          C${cx + 20} ${eyeY - 40} ${cx - 20} ${eyeY - 40} ${cx - f.cheek - 8} ${eyeY - 26} Z`}
      fill={cloth}
    />
  ) : has(hw, "clip") ? (
    <g fill={shift(cloth, 60)}>
      <rect x={cx - f.cheek + 4} y={eyeY - 48} width="20" height="7" rx="3.5" />
      <rect x={cx + f.cheek - 24} y={eyeY - 52} width="20" height="7" rx="3.5" />
    </g>
  ) : has(hw, "headphone") ? (
    <g>
      <path
        d={`M${cx - f.cheek - 10} ${eyeY + 30} a${f.cheek + 10} ${f.cheek + 10} 0 0 1 ${(f.cheek + 10) * 2} 0`}
        stroke="#1d1d20"
        strokeWidth="8"
        fill="none"
      />
      <rect x={cx - f.cheek - 20} y={eyeY + 22} width="18" height="26" rx="8" fill="#1d1d20" />
      <rect x={cx + f.cheek + 2} y={eyeY + 22} width="18" height="26" rx="8" fill="#1d1d20" />
    </g>
  ) : (
    <path
      d={`M${cx - f.cheek - 6} ${eyeY - 34} C${cx - f.cheek - 8} ${capTop - 28} ${cx + f.cheek + 8} ${capTop - 28} ${cx + f.cheek + 6} ${eyeY - 34} Z`}
      fill={cloth}
    />
  );

  // ---- eyewear ----------------------------------------------------------
  const ew = t.eyewear;
  const lensFill = has(ew, "aviator", "shades", "visor") ? "#20202499" : "#ffffff22";
  const frame = has(ew, "aviator", "shades") ? "#2c2c30" : has(ew, "clear") ? "#e9e2d6" : "#3a3a3e";
  const eyewear = has(ew, "none") ? null : (
    <g stroke={frame} strokeWidth="3.5" fill={lensFill}>
      {has(ew, "round", "wire") ? (
        <>
          <circle cx={cx - eyeGap} cy={eyeY} r="21" />
          <circle cx={cx + eyeGap} cy={eyeY} r="21" />
        </>
      ) : has(ew, "cat-eye") ? (
        <>
          <path d={`M${cx - eyeGap - 22} ${eyeY - 4} q22 -16 44 -4 q-12 18 -30 16 q-14 -2 -14 -12 Z`} />
          <path d={`M${cx + eyeGap + 22} ${eyeY - 4} q-22 -16 -44 -4 q12 18 30 16 q14 -2 14 -12 Z`} />
        </>
      ) : (
        <>
          <rect x={cx - eyeGap - 24} y={eyeY - 16} width="48" height="32" rx="9" />
          <rect x={cx + eyeGap - 24} y={eyeY - 16} width="48" height="32" rx="9" />
        </>
      )}
      <path d={`M${cx - 12} ${eyeY - 4} h24`} />
      <path
        d={`M${cx - eyeGap - 24} ${eyeY - 8} l-${f.cheek - eyeGap - 18} -6 M${cx + eyeGap + 24} ${eyeY - 8} l${f.cheek - eyeGap - 18} -6`}
      />
    </g>
  );

  // ---- outfit -----------------------------------------------------------
  const neckY = chin - 6;
  const shoulderY = chin + 52;
  const outfit = (
    <g>
      <path d={`M${cx - 26} ${neckY - 14} h52 v34 h-52 Z`} fill={shift(skin, -22)} />
      <path
        d={`M${cx - 130} 400 C${cx - 124} ${shoulderY} ${cx - 62} ${shoulderY - 14} ${cx - 34} ${neckY + 14}
            L${cx} ${neckY + 34} L${cx + 34} ${neckY + 14}
            C${cx + 62} ${shoulderY - 14} ${cx + 124} ${shoulderY} ${cx + 130} 400 Z`}
        fill={cloth}
      />
      {has(t.outfit, "hoodie") ? (
        <path
          d={`M${cx - 62} ${shoulderY - 4} q62 46 124 0 q-10 -26 -30 -30 q-32 26 -64 0 q-20 4 -30 30 Z`}
          fill={clothDark}
        />
      ) : has(t.outfit, "shirt", "blouse", "blazer", "jacket", "coat", "tunic", "flannel", "linen") ? (
        <path
          d={`M${cx - 40} ${neckY + 12} L${cx} ${neckY + 56} L${cx + 40} ${neckY + 12}
              L${cx + 26} ${neckY + 6} L${cx} ${neckY + 34} L${cx - 26} ${neckY + 6} Z`}
          fill={clothDark}
        />
      ) : has(t.outfit, "turtleneck") ? (
        <rect x={cx - 34} y={neckY - 6} width="68" height="34" rx="16" fill={clothDark} />
      ) : null}
    </g>
  );

  // ---- jewellery --------------------------------------------------------
  const gold = "#e5b45c";
  const jewellery = (
    <g>
      {hasAny(t.jewelry, "hoop") ? (
        <g stroke={gold} strokeWidth="4" fill="none">
          <circle cx={cx - f.cheek - 2} cy={eyeY + 34} r="11" />
          <circle cx={cx + f.cheek + 2} cy={eyeY + 34} r="11" />
        </g>
      ) : null}
      {hasAny(t.jewelry, "stud", "pearl") ? (
        <g fill={hasAny(t.jewelry, "pearl") ? "#f4ecdf" : gold}>
          <circle cx={cx - f.cheek - 2} cy={eyeY + 22} r="4.5" />
          <circle cx={cx + f.cheek + 2} cy={eyeY + 22} r="4.5" />
        </g>
      ) : null}
      {hasAny(t.jewelry, "cuff") ? (
        <path
          d={`M${cx + f.cheek + 2} ${eyeY + 4} a10 10 0 0 1 0 20`}
          stroke={gold}
          strokeWidth="4"
          fill="none"
        />
      ) : null}
      {hasAny(t.jewelry, "nose", "septum") ? (
        <circle cx={cx + 2} cy={noseBottom + 4} r="5" stroke={gold} strokeWidth="2.5" fill="none" />
      ) : null}
      {hasAny(t.jewelry, "choker") ? (
        <path d={`M${cx - 34} ${neckY + 8} q34 16 68 0`} stroke="#1c1c1f" strokeWidth="9" fill="none" />
      ) : null}
      {hasAny(t.jewelry, "chain", "necklace", "pendant") ? (
        <g stroke={gold} strokeWidth="4" fill="none">
          <path d={`M${cx - 40} ${neckY + 22} q40 40 80 0`} />
          {hasAny(t.jewelry, "pendant") ? <circle cx={cx} cy={neckY + 48} r="6" fill={gold} /> : null}
        </g>
      ) : null}
    </g>
  );

  // ---- extras / makeup on skin -----------------------------------------
  const blush =
    hasAny(t.makeup, "blush", "glow", "bronz", "highlight") || hasAny(t.extras, "sun", "blushed") ? (
      <g fill="#e2725b" opacity="0.28">
        <ellipse cx={cx - f.cheek + 18} cy={eyeY + 34} rx="18" ry="12" />
        <ellipse cx={cx + f.cheek - 18} cy={eyeY + 34} rx="18" ry="12" />
      </g>
    ) : null;

  const freckles = hasAny(t.extras, "freckle") ? (
    <g fill={shift(skin, -55)} opacity="0.6">
      {[-26, -18, -10, 10, 18, 26].map((dx, i) => (
        <circle key={dx} cx={cx + dx} cy={eyeY + 26 + (i % 2) * 7} r="2" />
      ))}
    </g>
  ) : null;

  const details = (
    <g>
      {freckles}
      {hasAny(t.extras, "beauty spot") ? <circle cx={cx + 20} cy={mouthY - 16} r="2.6" fill="#3a241a" /> : null}
      {hasAny(t.extras, "dimple") ? (
        <g stroke={skinShade} strokeWidth="2.6" fill="none" strokeLinecap="round">
          <path d={`M${cx - mouthW - 8} ${mouthY - 4} q-2 6 0 10`} />
          <path d={`M${cx + mouthW + 8} ${mouthY - 4} q2 6 0 10`} />
        </g>
      ) : null}
      {hasAny(t.extras, "vitiligo") ? (
        <path
          d={`M${cx - 40} ${eyeY + 30} q18 -14 26 4 q6 20 -14 22 q-20 0 -12 -26 Z`}
          fill={shift(skin, 42)}
          opacity="0.85"
        />
      ) : null}
      {hasAny(t.extras, "face tattoo") ? (
        <path d={`M${cx + 30} ${eyeY + 20} q10 10 0 20`} stroke="#2a2430" strokeWidth="3" fill="none" />
      ) : null}
      {hasAny(t.extras, "neck tattoo") ? (
        <path d={`M${cx - 20} ${neckY + 8} q8 10 0 18`} stroke="#2a2430" strokeWidth="3" fill="none" />
      ) : null}
      {hasAny(t.extras, "scar") ? (
        <path d={`M${cx + 34} ${eyeY - 24} l-6 18`} stroke={shift(skin, -50)} strokeWidth="2.4" />
      ) : null}
    </g>
  );

  const ageLines = has(t.age, "50", "60") ? (
    <g stroke={skinShade} strokeWidth="2" fill="none" opacity="0.55" strokeLinecap="round">
      <path d={`M${cx - 26} ${browY - 12} q26 -6 52 0`} />
      <path d={`M${cx - f.cheek + 12} ${eyeY + 16} q10 14 4 26`} />
      <path d={`M${cx + f.cheek - 12} ${eyeY + 16} q-10 14 -4 26`} />
    </g>
  ) : null;

  return (
    <svg viewBox="0 0 300 400" className={className} role="img" aria-label="Live preview of your avatar">
      <defs>
        <linearGradient id={id("rz-bg")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="100%" stopColor={bg2} />
        </linearGradient>
        <radialGradient id={id("rz-vig")} cx="50%" cy="38%" r="72%">
          <stop offset="55%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.35" />
        </radialGradient>
        <linearGradient id={id("rz-skin")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={skinLight} />
          <stop offset="70%" stopColor={skin} />
          <stop offset="100%" stopColor={skinShade} />
        </linearGradient>
        <clipPath id={id("lowerFace")}>
          <rect x="0" y={eyeY + 24} width="300" height="200" />
        </clipPath>
        <clipPath id={id("shortBeard")}>
          <rect x="0" y={eyeY + 46} width="300" height="200" />
        </clipPath>
        <clipPath id={id("fullBeard")}>
          <rect x="0" y={eyeY + 28} width="300" height="220" />
        </clipPath>
        <clipPath id={id("faceWindow")}>
          <ellipse cx={cx} cy={eyeY + 20} rx={f.cheek - 8} ry={(chin - eyeY) * 0.95} />
        </clipPath>
      </defs>

      <rect width="300" height="400" fill={`url(#${id("rz-bg")})`} />
      {hairBack}
      {outfit}

      <g>
        <circle cx={cx - f.cheek + 5} cy={eyeY + 26 + earTilt} r={earR} fill={skin} stroke={skinShade} strokeWidth="1.5" />
        <circle cx={cx + f.cheek - 5} cy={eyeY + 26 + earTilt} r={earR} fill={skin} stroke={skinShade} strokeWidth="1.5" />
      </g>

      <path d={headPath} fill={`url(#${id("rz-skin")})`} />
      {blush}
      {ageLines}
      {beard}
      <Eye side={-1} />
      <Eye side={1} />
      <Brow side={-1} />
      <Brow side={1} />
      {nose}
      {mouth}
      {details}
      {hairFront}
      {hairShine}
      {eyewear}
      {headwear}
      {jewellery}
      <rect width="300" height="400" fill={`url(#${id("rz-vig")})`} />
    </svg>
  );
}
