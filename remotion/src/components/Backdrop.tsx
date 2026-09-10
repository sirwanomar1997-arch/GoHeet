import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { COLORS } from "../theme";

export const Backdrop: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = Math.sin((frame / 90) * Math.PI) * 40;
  const breathe = interpolate(Math.sin((frame / 60) * Math.PI), [-1, 1], [0.72, 1]);
  const rot = interpolate(frame, [0, durationInFrames], [0, 8]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1100px 900px at ${50 + drift / 8}% ${18 + drift / 20}%, rgba(255,90,31,${0.34 * intensity * breathe}), transparent 62%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 800px at ${20 - drift / 10}% ${88}%, rgba(255,166,43,${0.2 * intensity}), transparent 60%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "repeating-linear-gradient(115deg, rgba(255,255,255,0.028) 0px, rgba(255,255,255,0.028) 2px, transparent 2px, transparent 9px)",
          transform: `rotate(${rot / 6}deg) scale(1.2)`,
          opacity: 0.5,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(1200px 1200px at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
