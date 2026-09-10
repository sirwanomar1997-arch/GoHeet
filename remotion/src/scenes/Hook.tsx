import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { COLORS, fontFamily } from "../theme";

const Word: React.FC<{ text: string; delay: number; size: number; color: string }> = ({ text, delay, size, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 140 } });
  const y = interpolate(s, [0, 1], [90, 0]);
  const sc = interpolate(s, [0, 1], [1.18, 1]);
  return (
    <div
      style={{
        color,
        fontFamily,
        fontWeight: 900,
        fontSize: size,
        letterSpacing: -3,
        lineHeight: 0.95,
        opacity: s,
        transform: `translateY(${y}px) scale(${sc})`,
        textShadow: "0 20px 60px rgba(0,0,0,0.55)",
      }}
    >
      {text}
    </div>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const flame = spring({ frame, fps, config: { damping: 10, stiffness: 90 } });
  const pulse = 1 + Math.sin((frame / 14) * Math.PI) * 0.035;

  return (
    <AbsoluteFill>
      <Backdrop intensity={1.25} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 60 }}>
        <div
          style={{
            fontSize: 190,
            opacity: flame,
            transform: `scale(${interpolate(flame, [0, 1], [0.4, 1]) * pulse})`,
            filter: "drop-shadow(0 0 70px rgba(255,90,31,0.75))",
            marginBottom: 34,
          }}
        >
          🔥
        </div>
        <Sequence from={0}>
          <div style={{ textAlign: "center" }}>
            <Word text="REAL LIFE." delay={10} size={104} color={COLORS.cream} />
            <Word text="REAL PEOPLE." delay={20} size={104} color={COLORS.amber} />
            <Word text="REAL MOMENTS." delay={30} size={104} color={COLORS.ember} />
          </div>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
