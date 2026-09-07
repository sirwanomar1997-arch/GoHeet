import { useId } from "react";

/**
 * The GoHeet flame — one smooth silhouette: a tall tip leaning right, a soft
 * round body, and a single inner notch on the lower left. Orange at the tip,
 * red through the body, a touch of pink at the base.
 */
export function HeetFlame({
  className = "size-6",
  filled = true,
  glow = false,
}: {
  className?: string;
  filled?: boolean;
  glow?: boolean;
}) {
  const id = `heet-${useId().replace(/:/g, "")}`;
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-hidden="true"
      style={glow ? { filter: "drop-shadow(0 0 12px oklch(0.67 0.22 32 / 45%))" } : undefined}
    >
      <defs>
        <linearGradient id={id} x1="0.42" y1="0" x2="0.62" y2="1">
          <stop offset="0%" stopColor="#FFA429" />
          <stop offset="38%" stopColor="#FB6A2A" />
          <stop offset="72%" stopColor="#F2405C" />
          <stop offset="100%" stopColor="#EA3B7E" />
        </linearGradient>
      </defs>

      <path
        d="M58.5 5c1.5 17.5-4.5 27.5-12 37.5-3-5-4.5-9.5-5-14.5-9 10-17.5 21.5-17.5 35C24 80 36 94 51.5 94S79 81 79 64.5C79 45 66 27 58.5 5Z"
        fill={filled ? `url(#${id})` : "none"}
        stroke={filled ? "none" : `url(#${id})`}
        strokeWidth={filled ? 0 : 3}
        strokeLinejoin="round"
      />
    </svg>
  );
}
