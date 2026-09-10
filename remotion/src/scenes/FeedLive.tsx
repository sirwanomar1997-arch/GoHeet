import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { PhoneFrame, SCREEN_H } from "../components/PhoneFrame";
import { FeedScreen, Moment } from "../components/FeedScreen";
import { Caption } from "../components/Caption";

const MOMENTS: Moment[] = [
  {
    clip: "clips/real_skate.mp4",
    user: "leo.k",
    caption: "Golden hour, one last run 🛹",
    place: "Södermalm · now",
    heets: 512,
    views: "2,8 tn",
    comments: "184",
    avatar: "img/avatar-2.jpg",
    tapAt: 62,
  },
  {
    clip: "clips/real_cafe.mp4",
    user: "maya",
    caption: "She said the coffee was fine. It was not.",
    place: "Kafé Esaias · now",
    heets: 1249,
    views: "7,1 tn",
    comments: "302",
    avatar: "img/avatar-1.jpg",
    tapAt: 58,
  },
  {
    clip: "clips/real_dog.mp4",
    user: "noor",
    caption: "Bruno gets it on the first try 🐕",
    place: "Vasaparken · now",
    heets: 3841,
    views: "12,8 tn",
    comments: "521",
    avatar: "img/avatar-3.jpg",
    tapAt: 52,
  },
];

const SCROLL_1 = 130;
const SCROLL_2 = 250;
const SCROLL_LEN = 22;

export const FeedLive: React.FC = () => {
  const frame = useCurrentFrame();

  const offset =
    interpolate(frame, [SCROLL_1, SCROLL_1 + SCROLL_LEN], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.15, 1),
    }) +
    interpolate(frame, [SCROLL_2, SCROLL_2 + SCROLL_LEN], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.4, 0, 0.15, 1),
    });

  const starts = [0, SCROLL_1 + SCROLL_LEN, SCROLL_2 + SCROLL_LEN];

  return (
    <AbsoluteFill>
      <Backdrop />
      <PhoneFrame y={96} tilt={-1}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translateY(${-offset * SCREEN_H}px)`,
          }}
        >
          {MOMENTS.map((m, i) => (
            <div key={m.clip} style={{ position: "absolute", top: i * SCREEN_H, left: 0, right: 0, height: SCREEN_H }}>
              <FeedScreen moment={m} localFrom={starts[i]} />
            </div>
          ))}
        </div>
      </PhoneFrame>
      <AbsoluteFill
        style={{
          background: "linear-gradient(180deg, rgba(10,7,5,0.95) 0%, rgba(10,7,5,0.5) 15%, transparent 25%)",
        }}
      />
      <Caption kicker="One tap" line={"Tap the flame.\nHeet the moment."} delay={8} top={86} />
    </AbsoluteFill>
  );
};
