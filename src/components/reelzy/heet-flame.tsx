import { useId } from "react";

/** The single GoHeet flame used for every heet, total, and notification. */
export function HeetFlame({
  className = "size-6",
  filled = true,
  glow = false,
  shimmer = true,
}: {
  className?: string;
  filled?: boolean;
  glow?: boolean;
  shimmer?: boolean;
}) {
  const raw = useId().replace(/:/g, "");
  const id = `heet-${raw}`;
  const haloId = `heet-halo-${raw}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-hidden="true"
      style={{
        filter: glow
          ? "drop-shadow(0 0 16px oklch(0.7 0.24 28 / 60%)) drop-shadow(0 0 7px oklch(0.74 0.22 18 / 45%))"
          : "drop-shadow(0 0 6px oklch(0.72 0.22 32 / 38%))",
      }}
    >
      <defs>
        <linearGradient id={id} x1="0.28" y1="0.08" x2="0.7" y2="0.92">
          <stop offset="0%" stopColor="#FFD93B" />
          <stop offset="20%" stopColor="#FFAD35" />
          <stop offset="50%" stopColor="#FF762E" />
          <stop offset="80%" stopColor="#F74650" />
          <stop offset="100%" stopColor="#E82F72" />
        </linearGradient>
        {/* Warm outer halo — the glow that makes it read as light, not paint. */}
        <radialGradient id={haloId} cx="0.5" cy="0.6" r="0.5">
          <stop offset="0%" stopColor="#FFB347" stopOpacity="0.6" />
          <stop offset="55%" stopColor="#FF762E" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#F74650" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Soft luminous halo behind the flame */}
      <circle cx="50" cy="58" r="44" fill={`url(#${haloId})`} />

      {/* Flame body */}
      <path
        d="M43.7 7.2c2.2 14.5-2.7 23.8-10.5 33.8-6.7 8.6-10.5 17.3-9.8 27.2C24.5 84 36.7 94 52 94c17.5 0 28.5-12.5 28.5-29.1 0-9.5-4.3-18.6-11.4-25.8-1.1 7.7-4.1 14.8-9.7 17.6-3.7 1.8-8.3.5-10.3-3-2.6-4.6.1-9.9 2.3-14.9 5.4-12.3 2.6-23.1-7.7-31.6Z"
        fill={filled ? `url(#${id})` : "none"}
        stroke={filled ? "none" : `url(#${id})`}
        strokeWidth={filled ? 0 : 3}
        strokeLinejoin="round"
      />

    </svg>
  );
}
