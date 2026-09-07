import { useId } from "react";

/**
 * The GoHeet flame — the single reaction mark of the platform.
 * Orange at the top, deepening into crimson-pink at the base.
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
      viewBox="0 0 24 24"
      className={className}
      role="img"
      aria-hidden="true"
      style={glow ? { filter: "drop-shadow(0 0 10px oklch(0.7 0.24 20 / 55%))" } : undefined}
    >
      <defs>
        <linearGradient id={id} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFA51F" />
          <stop offset="45%" stopColor="#FF6B24" />
          <stop offset="100%" stopColor="#FF2D8A" />
        </linearGradient>
      </defs>
      <path
        d="M13.6 1.6c.6 2.9-.5 4.7-2 6.4-1.6 1.8-3.5 3.4-4.6 5.7-1.6 3.4.1 7.4 3.6 8.9 4 1.7 8.7-.5 9.8-4.7.8-3-.3-5.6-2.1-7.9-.4 1.3-1.1 2.2-2 2.6.7-3.9-.6-7.6-4-10.2-.3-.2-.6-.4-.9-.6-.2.2-.2.4.2.8Z"
        fill={filled ? `url(#${id})` : "none"}
        stroke={filled ? "none" : `url(#${id})`}
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}
