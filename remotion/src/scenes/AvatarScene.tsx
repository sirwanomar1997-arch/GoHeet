import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { PhoneFrame } from "../components/PhoneFrame";
import { Caption } from "../components/Caption";
import { COLORS, fontFamily } from "../theme";

const LOOKS = ["img/avatar-1.jpg", "img/avatar-3.jpg", "img/avatar-4.jpg", "img/avatar-2.jpg"];
const NAMES = ["Street", "Sunset", "Studio", "Night"];
const SWAP_EVERY = 44;

export const AvatarScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = Math.min(LOOKS.length - 1, Math.floor(Math.max(0, frame - 20) / SWAP_EVERY));
  const since = Math.max(0, frame - 20) % SWAP_EVERY;
  const pop = interpolate(spring({ frame: since, fps, config: { damping: 9, stiffness: 200 } }), [0, 1], [0.1, 0]);

  return (
    <AbsoluteFill>
      <Backdrop intensity={1.1} />
      <PhoneFrame y={96} tilt={1}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg,#160E08,#0A0705)", fontFamily }}>
          <div style={{ padding: "44px 34px 0", color: "#fff" }}>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -0.5 }}>Create your avatar</div>
            <div style={{ marginTop: 8, fontSize: 24, color: "rgba(255,243,230,0.6)" }}>
              Pick the look that feels like you.
            </div>
          </div>

          <div
            style={{
              margin: "40px auto 0",
              width: 540,
              height: 700,
              borderRadius: 44,
              overflow: "hidden",
              position: "relative",
              border: "2px solid rgba(255,166,43,0.35)",
              boxShadow: "0 30px 90px rgba(255,90,31,0.28)",
              transform: `scale(${1 + pop * 0.4})`,
            }}
          >
            <Img
              key={LOOKS[idx]}
              src={staticFile(LOOKS[idx])}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: interpolate(since, [0, 7], [0.2, 1], { extrapolateRight: "clamp" }),
                transform: `scale(${interpolate(since, [0, 40], [1.06, 1.0])})`,
              }}
            />
            <AbsoluteFill
              style={{
                background: `linear-gradient(180deg, transparent 55%, rgba(8,5,3,0.9) 100%), radial-gradient(600px 400px at 50% 108%, rgba(255,90,31,${0.22 + pop}), transparent 70%)`,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 28,
                bottom: 26,
                color: "#fff",
                fontSize: 34,
                fontWeight: 900,
                letterSpacing: -0.5,
              }}
            >
              {NAMES[idx]} look
            </div>
          </div>

          <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 42 }}>
            {LOOKS.map((l, i) => (
              <div
                key={l}
                style={{
                  width: 118,
                  height: 118,
                  borderRadius: 999,
                  border: i === idx ? `5px solid ${COLORS.ember}` : "2px solid rgba(255,255,255,0.14)",
                  boxShadow: i === idx ? "0 0 34px rgba(255,90,31,0.6)" : "none",
                  overflow: "hidden",
                }}
              >
                <Img src={staticFile(l)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>

          <div
            style={{
              margin: "46px 40px 0",
              height: 96,
              borderRadius: 28,
              display: "grid",
              placeItems: "center",
              background: `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.ember})`,
              color: "#1A0B04",
              fontSize: 32,
              fontWeight: 900,
            }}
          >
            Save my avatar
          </div>
        </AbsoluteFill>
      </PhoneFrame>
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(10,7,5,0.95) 0%, rgba(10,7,5,0.5) 15%, transparent 25%)",
        }}
      />
      <Caption kicker="Be you" line={"Build your avatar.\nPick your look."} delay={8} top={86} />
    </AbsoluteFill>
  );
};
