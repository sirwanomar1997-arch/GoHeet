import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const SCREEN_W = 690;
export const SCREEN_H = 1496;

export const PhoneFrame: React.FC<{
  children: React.ReactNode;
  y?: number;
  tilt?: number;
  scaleFrom?: number;
}> = ({ children, y = 0, tilt = 0, scaleFrom = 0.94 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const scale = interpolate(enter, [0, 1], [scaleFrom, 1]);
  const float = Math.sin((frame / 78) * Math.PI) * 8;

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: SCREEN_W,
          height: SCREEN_H,
          transform: `translateY(${y + float}px) scale(${scale}) rotate(${tilt}deg)`,
          borderRadius: 62,
          padding: 8,
          background:
            "linear-gradient(160deg, rgba(255,166,43,0.85), rgba(255,90,31,0.35) 45%, rgba(255,255,255,0.08))",
          boxShadow: "0 60px 140px rgba(255,90,31,0.28), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 54,
            overflow: "hidden",
            background: "#0A0705",
            position: "relative",
          }}
        >
          {children}
        </div>
      </div>
    </AbsoluteFill>
  );
};
