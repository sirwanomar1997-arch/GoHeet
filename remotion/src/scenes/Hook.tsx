import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate, Sequence } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Flame } from "../components/Flame";
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
  
  return (
    <AbsoluteFill>
      <Backdrop intensity={1.25} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingBottom: 60 }}>
        <Flame size={300} />
        <Sequence from={0} layout="none">
          <div style={{ textAlign: "center" }}>
            <Word text="REAL LIFE." delay={10} size={96} color={COLORS.cream} />
            <Word text="REAL PEOPLE." delay={20} size={96} color={COLORS.amber} />
            <Word text="REAL MOMENTS." delay={30} size={96} color={COLORS.ember} />
          </div>
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
