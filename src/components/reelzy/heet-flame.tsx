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
        d="M45 3c3 19-4 28-15 40C20 54 14 64 14 76c0 15 14 24 36 24s37-12 37-30c0-15-9-28-23-41 2 12-1 22-8 29-4 5-11 2-10-5 2-10-1-19-8-25-2-10 1-19 7-25Z"
        fill={filled ? `url(#${id})` : "none"}
        stroke={filled ? "none" : `url(#${id})`}
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}
