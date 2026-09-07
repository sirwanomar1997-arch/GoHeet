import { useId } from "react";

/** The single GoHeet flame used for every heet, total, and notification. */
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
        <linearGradient id={id} x1="0.28" y1="0.08" x2="0.7" y2="0.92">
          <stop offset="0%" stopColor="#FFAD35" />
          <stop offset="38%" stopColor="#FF762E" />
          <stop offset="72%" stopColor="#F74650" />
          <stop offset="100%" stopColor="#E82F72" />
        </linearGradient>
      </defs>

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
