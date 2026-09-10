import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { COLORS, fontFamily } from "../theme";

export const Caption: React.FC<{
  kicker?: string;
  line: string;
  delay?: number;
  align?: "left" | "center";
  top?: number;
}> = ({ kicker, line, delay = 6, align = "left", top = 96 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 120 } });
  const y = interpolate(s, [0, 1], [40, 0]);
  const blur = interpolate(s, [0, 1], [12, 0]);

  return (
    <div
      style={{
        position: "absolute",
        top,
        left: align === "center" ? 0 : 78,
        right: align === "center" ? 0 : 78,
        textAlign: align,
        opacity: s,
        transform: `translateY(${y}px)`,
        filter: `blur(${blur}px)`,
        fontFamily,
      }}
    >
      {kicker ? (
        <div
          style={{
            color: COLORS.amber,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: 7,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          {kicker}
        </div>
      ) : null}
      <div
        style={{
          color: COLORS.cream,
          fontWeight: 900,
          fontSize: 68,
          lineHeight: 1.02,
          letterSpacing: -1.5,
          textShadow: "0 12px 40px rgba(0,0,0,0.6)",
          whiteSpace: "pre-line",
        }}
      >
        {line}
      </div>
    </div>
  );
};
