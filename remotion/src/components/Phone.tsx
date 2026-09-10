import { AbsoluteFill, Video, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const W = 690;
const H = 1496;

export const Phone: React.FC<{
  clip: string;
  y?: number;
  startFrom?: number;
  tilt?: number;
  scaleFrom?: number;
}> = ({ clip, y = 0, startFrom = 0, tilt = 0, scaleFrom = 0.94 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const scale = interpolate(enter, [0, 1], [scaleFrom, 1]);
  const float = Math.sin((frame / 78) * Math.PI) * 9;
  const slowZoom = interpolate(frame, [0, 220], [1, 1.035], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: W,
          height: H,
          transform: `translateY(${y + float}px) scale(${scale * slowZoom}) rotate(${tilt}deg)`,
          borderRadius: 62,
          padding: 8,
          background: "linear-gradient(160deg, rgba(255,166,43,0.85), rgba(255,90,31,0.35) 45%, rgba(255,255,255,0.08))",
          boxShadow: "0 60px 140px rgba(255,90,31,0.28), 0 0 0 1px rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ width: "100%", height: "100%", borderRadius: 54, overflow: "hidden", background: "#000" }}>
          <Video
            src={staticFile(clip)}
            startFrom={startFrom}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
