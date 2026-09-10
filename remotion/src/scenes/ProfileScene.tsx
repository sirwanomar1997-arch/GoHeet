import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { PhoneFrame } from "../components/PhoneFrame";
import { Caption } from "../components/Caption";
import { COLORS, fontFamily } from "../theme";

const TILES = [
  "img/skate-sunset.jpg",
  "img/dog-frisbee.jpg",
  "img/coffee.jpg",
  "img/city.jpg",
  "img/mountain.jpg",
  "img/sunset.jpg",
];

function sv(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(".", ",")} tn`;
  return String(n);
}

export const ProfileScene: React.FC = () => {
  const frame = useCurrentFrame();
  const total = Math.round(
    interpolate(frame, [20, 140], [89_400, 132_900], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  const followers = Math.round(
    interpolate(frame, [20, 140], [12_400, 18_600], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  const beat = 1 + Math.abs(Math.sin((frame / 9) * Math.PI)) * (frame < 145 ? 0.05 : 0.02);

  return (
    <AbsoluteFill>
      <Backdrop intensity={1.15} />
      <PhoneFrame y={96} tilt={-1}>
        <AbsoluteFill style={{ background: "linear-gradient(180deg,#170F08,#0A0705)", fontFamily, color: "#fff" }}>
          <div style={{ paddingTop: 56, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <Img
              src={staticFile("img/avatar-2.jpg")}
              style={{
                width: 190,
                height: 190,
                borderRadius: 999,
                objectFit: "cover",
                border: "4px solid rgba(255,166,43,0.75)",
                boxShadow: "0 0 60px rgba(255,90,31,0.4)",
              }}
            />
            <div style={{ marginTop: 18, fontSize: 40, fontWeight: 900, letterSpacing: -1 }}>@maya</div>

            {/* heet total beside the flame */}
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
              <Img
                src={staticFile("flame.png")}
                style={{ width: 86, height: 86, transform: `scale(${beat})` }}
              />
              <span style={{ fontSize: 62, fontWeight: 900, letterSpacing: -2 }}>{sv(total)}</span>
            </div>

            <div
              style={{
                marginTop: 26,
                display: "flex",
                borderRadius: 28,
                border: "2px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                overflow: "hidden",
              }}
            >
              {[
                ["Followers", sv(followers)],
                ["Following", "312"],
                ["Moments", "148"],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: "18px 40px", textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 900 }}>{val}</div>
                  <div style={{ fontSize: 22, color: "rgba(255,243,230,0.6)", fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 40,
              padding: "0 22px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
            }}
          >
            {TILES.map((t, i) => (
              <div
                key={t}
                style={{
                  position: "relative",
                  height: 240,
                  borderRadius: 20,
                  overflow: "hidden",
                  opacity: interpolate(frame, [10 + i * 6, 30 + i * 6], [0, 1], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  }),
                }}
              >
                <Img src={staticFile(t)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <div
                  style={{
                    position: "absolute",
                    left: 10,
                    bottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 22,
                    fontWeight: 800,
                    textShadow: "0 2px 8px rgba(0,0,0,0.6)",
                  }}
                >
                  <Img src={staticFile("flame.png")} style={{ width: 28, height: 28 }} />
                  {sv(2400 + i * 1830 + Math.round(interpolate(frame, [20, 140], [0, 640])))}
                </div>
              </div>
            ))}
          </div>
        </AbsoluteFill>
      </PhoneFrame>
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(10,7,5,0.95) 0%, rgba(10,7,5,0.5) 15%, transparent 25%)",
        }}
      />
      <Caption kicker="Your profile" line={"Every Heet\nadds up."} delay={8} top={86} />
      <div
        style={{
          position: "absolute",
          bottom: 54,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily,
          color: COLORS.dim,
          fontSize: 30,
          fontWeight: 700,
        }}
      >
        goheet.app
      </div>
    </AbsoluteFill>
  );
};
