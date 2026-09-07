import { useId } from "react";

/**
 * The GoHeet flame — one smooth teardrop flame with a small ember flake
 * drifting off its left side. Warm orange at the tip, red through the body,
 * with just a touch of dark pink at the base.
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
      style={glow ? { filter: "drop-shadow(0 0 10px oklch(0.67 0.22 28 / 45%))" } : undefined}
    >
      <defs>
        <linearGradient id={id} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFA51C" />
          <stop offset="45%" stopColor="#F8531F" />
          <stop offset="82%" stopColor="#EA2350" />
          <stop offset="100%" stopColor="#C41B57" />
        </linearGradient>
      </defs>

      {/* Main flame body — a single clean silhouette. */}
      <path
        d="M60 4c3 21-6 30-16 41-11 12-17 21-17 32 0 15 12 25 27 25s28-11 28-27c0-19-13-38-22-71Z"
        fill={filled ? `url(#${id})` : "none"}
        stroke={filled ? "none" : `url(#${id})`}
        strokeWidth={filled ? 0 : 2}
        strokeLinejoin="round"
      />

      {/* The little ember flake that drifts off the left. */}
      <path
        d="M15 44c2 7-3 10-6 15-2 4-3 7-3 10 0 7 5 11 11 11s10-5 10-11c0-8-6-15-12-25Z"
        fill={filled ? `url(#${id})` : "none"}
        stroke={filled ? "none" : `url(#${id})`}
        strokeWidth={filled ? 0 : 2}
        strokeLinejoin="round"
        opacity={filled ? 0.92 : 1}
      />
    </svg>
  );
}
