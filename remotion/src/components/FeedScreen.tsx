import {
  AbsoluteFill,
  Video,
  Img,
  staticFile,
  useCurrentFrame,
  interpolate,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS, fontFamily } from "../theme";

const Eye = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
    <defs>
      <linearGradient id="eyeg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFC861" />
        <stop offset="100%" stopColor="#FF8A2E" />
      </linearGradient>
    </defs>
    <path
      d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z"
      stroke="url(#eyeg)"
      strokeWidth="1.9"
      fill="none"
    />
    <circle cx="12" cy="12" r="3.1" fill="url(#eyeg)" />
  </svg>
);

const Bubble = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
    <path
      d="M4 5.5h16v11H9.5L5 20.2V16.5H4v-11Z"
      stroke="#FFF3E6"
      strokeWidth="1.9"
      strokeLinejoin="round"
      fill="rgba(255,255,255,0.08)"
    />
  </svg>
);

const Share = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none">
    <path d="M4 13v6h16v-6" stroke="#FFF3E6" strokeWidth="1.9" strokeLinecap="round" />
    <path d="M12 15V4m0 0 4 4m-4-4-4 4" stroke="#FFF3E6" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RailItem: React.FC<{ icon: React.ReactNode; label: string; pop?: number }> = ({
  icon,
  label,
  pop = 0,
}) => (
  <div style={{ width: 96, textAlign: "center", marginBottom: 34 }}>
    <div style={{ display: "flex", justifyContent: "center", transform: `scale(${1 + pop})` }}>{icon}</div>
    <div
      style={{
        marginTop: 6,
        color: "#fff",
        fontFamily,
        fontWeight: 700,
        fontSize: 26,
        letterSpacing: -0.3,
        textShadow: "0 2px 8px rgba(0,0,0,0.55)",
      }}
    >
      {label}
    </div>
  </div>
);

export type Moment = {
  clip: string;
  user: string;
  caption: string;
  place: string;
  heets: number;
  views: string;
  comments: string;
  avatar: string;
  tapAt?: number;
};

export const FeedScreen: React.FC<{ moment: Moment; localFrom?: number }> = ({ moment, localFrom = 0 }) => {
  const globalFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const frame = globalFrame - localFrom;
  const tapAt = moment.tapAt ?? -999;
  const since = frame - tapAt;
  const tapped = since >= 0;

  const flamePop = tapped
    ? interpolate(
        spring({ frame: since, fps, config: { damping: 7, stiffness: 220 } }),
        [0, 1],
        [0.45, 0],
      )
    : 0;
  const ringScale = tapped ? interpolate(since, [0, 22], [0.3, 2.4], { extrapolateRight: "clamp" }) : 0;
  const ringOpacity = tapped ? interpolate(since, [0, 22], [0.85, 0], { extrapolateRight: "clamp" }) : 0;
  const fingerIn = interpolate(frame, [tapAt - 18, tapAt - 2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fingerOut = interpolate(frame, [tapAt + 8, tapAt + 24], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fingerOpacity = tapAt > -900 ? fingerIn * fingerOut : 0;
  const fingerPress = tapped && since < 8 ? 0.86 : 1;

  const heets = moment.heets + (tapped ? 1 : 0);

  return (
    <AbsoluteFill>
      <Video
        src={staticFile(moment.clip)}
        muted
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* top + bottom scrims */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(6,4,3,0.75) 0%, transparent 18%, transparent 55%, rgba(6,4,3,0.85) 100%)",
        }}
      />

      {/* top tabs */}
      <div
        style={{
          position: "absolute",
          top: 42,
          left: 34,
          display: "flex",
          gap: 34,
          fontFamily,
          alignItems: "center",
        }}
      >
        <span style={{ color: "rgba(255,243,230,0.55)", fontSize: 30, fontWeight: 700 }}>Following</span>
        <span style={{ color: "#fff", fontSize: 30, fontWeight: 800, position: "relative" }}>
          Out there
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: -10,
              height: 4,
              borderRadius: 3,
              background: `linear-gradient(90deg, ${COLORS.amber}, ${COLORS.ember})`,
            }}
          />
        </span>
      </div>

      {/* right rail */}
      <div style={{ position: "absolute", right: 18, bottom: 240 }}>
        <div style={{ width: 96, textAlign: "center", marginBottom: 34, position: "relative" }}>
          {tapped ? (
            <div
              style={{
                position: "absolute",
                left: 8,
                top: -4,
                width: 80,
                height: 80,
                borderRadius: 999,
                border: `4px solid ${COLORS.ember}`,
                transform: `scale(${ringScale})`,
                opacity: ringOpacity,
              }}
            />
          ) : null}
          <div style={{ display: "flex", justifyContent: "center", transform: `scale(${1 + flamePop})` }}>
            <Img src={staticFile("flame.png")} style={{ width: 72, height: 72 }} />
          </div>
          <div
            style={{
              marginTop: 2,
              color: "#fff",
              fontFamily,
              fontWeight: 700,
              fontSize: 26,
              textShadow: "0 2px 8px rgba(0,0,0,0.55)",
            }}
          >
            {heets}
          </div>
          {tapped && since < 34 ? (
            <div
              style={{
                position: "absolute",
                left: 30,
                top: -30,
                opacity: interpolate(since, [0, 10, 34], [0, 1, 0]),
                transform: `translateY(${interpolate(since, [0, 34], [0, -120])}px)`,
                fontSize: 34,
              }}
            >
              <Img src={staticFile("flame.png")} style={{ width: 44, height: 44 }} />
            </div>
          ) : null}
        </div>
        <RailItem icon={<Eye />} label={moment.views} />
        <RailItem icon={<Bubble />} label={moment.comments} />
        <RailItem icon={<Share />} label="Share" />
      </div>

      {/* bottom meta */}
      <div style={{ position: "absolute", left: 34, right: 150, bottom: 70, fontFamily }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Img
            src={staticFile(moment.avatar)}
            style={{ width: 64, height: 64, borderRadius: 999, objectFit: "cover", border: "2px solid rgba(255,166,43,0.8)" }}
          />
          <span style={{ color: "#fff", fontWeight: 800, fontSize: 30 }}>@{moment.user}</span>
          <span
            style={{
              color: COLORS.amber,
              fontWeight: 700,
              fontSize: 22,
              border: `2px solid ${COLORS.amber}`,
              borderRadius: 999,
              padding: "4px 14px",
            }}
          >
            Follow
          </span>
        </div>
        <div style={{ marginTop: 14, color: "#fff", fontSize: 28, fontWeight: 600, lineHeight: 1.25 }}>
          {moment.caption}
        </div>
        <div style={{ marginTop: 8, color: "rgba(255,243,230,0.7)", fontSize: 24 }}>{moment.place}</div>
      </div>

      {/* finger */}
      {fingerOpacity > 0 ? (
        <div
          style={{
            position: "absolute",
            right: 44,
            bottom: 214,
            width: 108,
            height: 108,
            borderRadius: 999,
            background: "rgba(255,255,255,0.28)",
            border: "3px solid rgba(255,255,255,0.6)",
            opacity: fingerOpacity,
            transform: `scale(${fingerPress})`,
          }}
        />
      ) : null}
    </AbsoluteFill>
  );
};
