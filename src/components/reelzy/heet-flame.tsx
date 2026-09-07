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
        d="M44 4c20 13 31 34 24 61 9-4 15-12 17-24 14 17 17 34 8 47-9 13-25 18-43 18-22 0-39-9-46-25-7-17 0-34 12-48C28 20 39 15 44 4Z"
        fill={filled ? `url(#${id})` : "none"}
        stroke={filled ? "none" : `url(#${id})`}
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}
