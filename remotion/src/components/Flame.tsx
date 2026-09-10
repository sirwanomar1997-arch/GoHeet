import { Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const Flame: React.FC<{ size: number; delay?: number }> = ({ size, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 11, stiffness: 95 } });
  const pulse = 1 + Math.sin((frame / 15) * Math.PI) * 0.04;
  return (
    <Img
      src={staticFile("flame.png")}
      style={{
        width: size,
        height: size,
        opacity: s,
        transform: `scale(${interpolate(s, [0, 1], [0.45, 1]) * pulse})`,
        filter: "drop-shadow(0 0 80px rgba(255,90,31,0.75))",
      }}
    />
  );
};
