import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { COLORS, fontFamily } from "../theme";

export const EndCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flame = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const name = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  const tag = spring({ frame: frame - 26, fps, config: { damping: 200 } });
  const rule = spring({ frame: frame - 40, fps, config: { damping: 200 } });
  const pulse = 1 + Math.sin((frame / 16) * Math.PI) * 0.03;

  return (
    <AbsoluteFill>
      <Backdrop intensity={1.35} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily }}>
        <div
          style={{
            fontSize: 170,
            transform: `scale(${interpolate(flame, [0, 1], [0.5, 1]) * pulse})`,
            filter: "drop-shadow(0 0 80px rgba(255,90,31,0.8))",
          }}
        >
          🔥
        </div>
        <div
          style={{
            marginTop: 22,
            fontSize: 148,
            fontWeight: 900,
            letterSpacing: -5,
            color: COLORS.cream,
            opacity: name,
            transform: `translateY(${interpolate(name, [0, 1], [40, 0])}px)`,
          }}
        >
          GoHeet
        </div>
        <div
          style={{
            marginTop: 10,
            fontSize: 34,
            fontWeight: 700,
            letterSpacing: 8,
            color: COLORS.amber,
            textTransform: "uppercase",
            opacity: tag,
          }}
        >
          Real life. Real people. Real moments.
        </div>
        <div
          style={{
            marginTop: 56,
            width: interpolate(rule, [0, 1], [0, 520]),
            height: 4,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.ember})`,
          }}
        />
        <div style={{ marginTop: 40, fontSize: 40, fontWeight: 700, color: COLORS.dim, opacity: rule }}>
          Capture it. Heet it.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
