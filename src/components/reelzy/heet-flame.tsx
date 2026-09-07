import { useId } from "react";

/**
 * The GoHeet flame — the single reaction mark of the platform.
 * Warm orange at the top, deepening through red with a restrained dark-pink base.
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
      style={glow ? { filter: "drop-shadow(0 0 10px oklch(0.67 0.22 28 / 50%))" } : undefined}
    >
      <defs>
        <linearGradient id={id} x1="0.3" y1="0" x2="0.65" y2="1">
          <stop offset="0%" stopColor="#FF991F" />
          <stop offset="58%" stopColor="#F43B20" />
          <stop offset="88%" stopColor="#D91E43" />
          <stop offset="100%" stopColor="#BE174B" />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1="0.4" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#FFE066" />
          <stop offset="55%" stopColor="#FFB020" />
          <stop offset="100%" stopColor="#FF6A1F" />
        </linearGradient>
      </defs>
      <path
        d="M45 3c3 19-4 28-15 40C20 54 14 64 14 76c0 15 14 24 36 24s37-12 37-30c0-15-9-28-23-41 2 12-1 22-8 29-4 5-11 2-10-5 2-10-1-19-8-25-2-10 1-19 7-25Z"
        fill={filled ? `url(#${id})` : "none"}
        stroke={filled ? "none" : `url(#${id})`}
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
      {filled && (
        <path
          d="M50 40c2 9-2 15-7 21-4 5-6 9-6 14 0 8 6 13 14 13s13-5 13-14c0-7-4-13-9-18 1 5-1 9-4 11-2 1-4 0-4-3 1-6 0-12-3-17-1-3 0-6 2-8Z"
          fill={`url(#${id}-inner)`}
          opacity="0.92"
        />
      )}
    </svg>
  );
}
