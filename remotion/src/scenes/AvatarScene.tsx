import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { PhoneFrame } from "../components/PhoneFrame";
import { Caption } from "../components/Caption";
import { COLORS, fontFamily } from "../theme";

const LOOKS = ["img/outfit-male.png", "img/outfit-male-2.png", "img/hair-male.png", "img/accessory.png"];
const SWAP_EVERY = 42;

export const AvatarScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const idx = Math.min(LOOKS.length - 1, Math.floor(Math.max(0, frame - 24) / SWAP_EVERY));
  const since = Math.max(0, frame - 24) % SWAP_EVERY;
  const pop = interpolate(spring({ frame: since, fps, config: { damping: 9, stiffness: 200 } }), [0, 1], [0.12, 0]);

  return (
    <AbsoluteFill>
      <Backdrop intensity={1.1} />
      <PhoneFrame y={96} tilt={1}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg,#160E08,#0A0705)", fontFamily }}>
          <div style={{ padding: "44px 34px 0", color: "#fff" }}>
            <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: -0.5 }}>Create your avatar</div>
            <div style={{ marginTop: 8, fontSize: 24, color: "rgba(255,243,230,0.6)" }}>
              Pick a look that feels like you.
            </div>
          </div>

          <div
            style={{
              margin: "34px auto 0",
              width: 520,
              height: 660,
              borderRadius: 40,
              overflow: "hidden",
              position: "relative",
              border: "2px solid rgba(255,166,43,0.35)",
              boxShadow: "0 30px 90px rgba(255,90,31,0.25)",
              transform: `scale(${1 + pop * 0.5})`,
            }}
          >
            <Img
              src={staticFile("img/base-male.jpg")}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <AbsoluteFill
              style={{
                background: `radial-gradient(600px 400px at 50% 110%, rgba(255,90,31,${0.25 + pop}), transparent 70%)`,
              }}
            />
            <Img
              key={LOOKS[idx]}
              src={staticFile(LOOKS[idx])}
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "58%",
                objectFit: "contain",
                opacity: interpolate(since, [0, 8], [0, 1], { extrapolateRight: "clamp" }),
              }}
            />
          </div>

          <div style={{ display: "flex", gap: 18, justifyContent: "center", marginTop: 40 }}>
            {LOOKS.map((l, i) => (
              <div
                key={l}
                style={{
                  width: 116,
                  height: 116,
                  borderRadius: 26,
                  background: "rgba(255,255,255,0.06)",
                  border: i === idx ? `4px solid ${COLORS.ember}` : "2px solid rgba(255,255,255,0.12)",
                  boxShadow: i === idx ? "0 0 34px rgba(255,90,31,0.55)" : "none",
                  overflow: "hidden",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Img src={staticFile(l)} style={{ width: "88%", height: "88%", objectFit: "contain" }} />
              </div>
            ))}
          </div>

          <div
            style={{
              margin: "44px 40px 0",
              height: 92,
              borderRadius: 26,
              display: "grid",
              placeItems: "center",
              background: `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.ember})`,
              color: "#1A0B04",
              fontSize: 30,
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
      <Caption kicker="Be you" line={"Build your avatar.\nPick your outfit."} delay={8} top={86} />
    </AbsoluteFill>
  );
};
