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
      </defs>
      <path
        d="M47 2c3 18-3 28-13 39-9 10-14 21-14 33 0 15 12 26 30 26s30-11 30-28c0-14-8-26-19-38 1 12-2 21-9 29-3 4-9 2-9-3 1-7 1-13-3-20-3-5-7-9-12-12 2-10 2-19 0-28Z"
        fill={filled ? `url(#${id})` : "none"}
        stroke={filled ? "none" : `url(#${id})`}
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}
