import {
  AbsoluteFill,
  Sequence,
  Video,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { COLORS, fontFamily } from "./theme";

const W = 1080;
const H = 1920;
const APP_W = 886;
const APP_H = 1920;

const Glow: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 90) * 40;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(900px 900px at ${50 + drift / 12}% 18%, rgba(255,90,31,0.30), transparent 65%),
                     radial-gradient(800px 800px at ${20}% 92%, rgba(255,166,43,0.18), transparent 70%),
                     linear-gradient(180deg, #120A06, #060403)`,
      }}
    />
  );
};

const Screen: React.FC<{
  src: string;
  startFrom: number;
  zoom?: number;
  pan?: number;
  dim?: number;
}> = ({ src, startFrom, zoom = 1, pan = 0, dim = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200 } });
  const s = interpolate(enter, [0, 1], [0.96, 1]) * zoom;
  const slow = interpolate(frame, [0, 300], [1, 1.03], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: APP_W,
          height: APP_H,
          transform: `scale(${s * slow}) translateY(${pan}px)`,
          overflow: "hidden",
          borderRadius: 8,
          boxShadow: "0 0 160px rgba(255,90,31,0.35)",
        }}
      >
        <Video
          src={staticFile(src)}
          startFrom={Math.round(startFrom * 30)}
          muted
          style={{ width: APP_W, height: APP_H, objectFit: "cover", display: "block" }}
        />
      </div>
      {dim > 0 ? <AbsoluteFill style={{ background: `rgba(6,4,3,${dim})` }} /> : null}
    </AbsoluteFill>
  );
};

const Kicker: React.FC<{ kicker: string; line: string; delay?: number; bottom?: boolean }> = ({
  kicker,
  line,
  delay = 0,
  bottom = false,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const y = interpolate(s, [0, 1], [26, 0]);
  return (
    <div
      style={{
        position: "absolute",
        left: 70,
        right: 70,
        ...(bottom ? { bottom: 130 } : { top: 96 }),
        opacity: s,
        transform: `translateY(${y}px)`,
        fontFamily,
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-block",
          color: "#1A0B04",
          background: `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.ember})`,
          borderRadius: 999,
          padding: "8px 24px",
          fontWeight: 900,
          fontSize: 30,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          marginTop: 16,
          color: "#fff",
          fontWeight: 900,
          fontSize: 62,
          lineHeight: 1.1,
          letterSpacing: -1.2,
          whiteSpace: "pre-line",
          textShadow: "0 8px 40px rgba(0,0,0,0.85)",
        }}
      >
        {line}
      </div>
    </div>
  );
};

const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = ["REAL LIFE.", "REAL PEOPLE.", "REAL MOMENTS."];
  return (
    <AbsoluteFill>
      <Screen src="app/s_hook.mp4" startFrom={0} zoom={1.18} dim={0.55} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily }}>
        {words.map((w, i) => {
          const s = spring({ frame: frame - i * 12, fps, config: { damping: 14, stiffness: 140 } });
          return (
            <div
              key={w}
              style={{
                color: i === 2 ? COLORS.amber : "#fff",
                fontWeight: 900,
                fontSize: 96,
                letterSpacing: -3,
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [50, 0])}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`,
                textShadow: "0 10px 60px rgba(0,0,0,0.9)",
              }}
            >
              {w}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const End: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12, stiffness: 130 } });
  const pulse = 1 + Math.sin(frame / 9) * 0.03;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", fontFamily }}>
      <div
        style={{
          fontSize: 190,
          transform: `scale(${interpolate(s, [0, 1], [0.5, 1]) * pulse})`,
          filter: "drop-shadow(0 0 90px rgba(255,90,31,0.8))",
        }}
      >
        🔥
      </div>
      <div
        style={{
          marginTop: 10,
          color: "#fff",
          fontWeight: 900,
          fontSize: 128,
          letterSpacing: 6,
          opacity: s,
        }}
      >
        GOHEET
      </div>
      <div style={{ marginTop: 18, color: COLORS.amber, fontWeight: 700, fontSize: 44, letterSpacing: 2 }}>
        Real life. Real people. Real moments.
      </div>
      <div
        style={{
          marginTop: 54,
          color: "#1A0B04",
          background: `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.ember})`,
          padding: "22px 58px",
          borderRadius: 999,
          fontWeight: 900,
          fontSize: 48,
          transform: `scale(${interpolate(spring({ frame: frame - 14, fps, config: { damping: 10 } }), [0, 1], [0.8, 1])})`,
        }}
      >
        Download GoHeet
      </div>
    </AbsoluteFill>
  );
};

export const RealPromo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#060403", width: W, height: H }}>
    <Glow />
    <Sequence from={0} durationInFrames={92}>
      <Hook />
    </Sequence>
    <Sequence from={90} durationInFrames={300}>
      <Screen src="app/s_feed1.mp4" startFrom={0} />
      <Kicker kicker="One tap" line={"Tap the flame.\nHeet the moment."} delay={6} />
    </Sequence>
    <Sequence from={390} durationInFrames={150}>
      <Screen src="app/s_feed2.mp4" startFrom={0} />
      <Kicker kicker="Out there" line={"Real moments,\nfilmed right now."} delay={6} bottom />
    </Sequence>
    <Sequence from={540} durationInFrames={120}>
      <Screen src="app/s_discover.mp4" startFrom={0} />
      <Kicker kicker="Discover" line={"Find people\nnear you."} delay={6} />
    </Sequence>
    <Sequence from={660} durationInFrames={120}>
      <Screen src="app/s_camera.mp4" startFrom={0} />
      <Kicker kicker="Camera only" line={"No uploads.\nEver."} delay={6} />
    </Sequence>
    <Sequence from={780} durationInFrames={180}>
      <Screen src="app/s_avatar.mp4" startFrom={0} />
      <Kicker kicker="Be you" line={"Build your avatar."} delay={6} />
    </Sequence>
    <Sequence from={960} durationInFrames={150}>
      <Screen src="app/s_profile.mp4" startFrom={0} />
      <Kicker kicker="Your profile" line={"Watch your\nHeets rise."} delay={6} bottom />
    </Sequence>
    <Sequence from={1110} durationInFrames={90}>
      <End />
    </Sequence>
  </AbsoluteFill>
);
