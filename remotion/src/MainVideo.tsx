import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Hook } from "./scenes/Hook";
import { ClipScene } from "./scenes/ClipScene";
import { EndCard } from "./scenes/EndCard";

const T = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })}
  />
);

export const MainVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#0A0705" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={105}>
        <Hook />
      </TransitionSeries.Sequence>
      {T()}
      <TransitionSeries.Sequence durationInFrames={195}>
        <ClipScene clip="clips/seg_feed.mp4" kicker="One tap" line={"Tap the flame.\nHeet the moment."} tilt={-1} />
      </TransitionSeries.Sequence>
      {T()}
      <TransitionSeries.Sequence durationInFrames={96}>
        <ClipScene clip="clips/seg_discover.mp4" kicker="Discover" line={"Find real people\nworth following."} tilt={1} />
      </TransitionSeries.Sequence>
      {T()}
      <TransitionSeries.Sequence durationInFrames={138}>
        <ClipScene clip="clips/seg_camera.mp4" kicker="Camera only" line={"Shot here, now.\nNo uploads. Ever."} tilt={-1} />
      </TransitionSeries.Sequence>
      {T()}
      <TransitionSeries.Sequence durationInFrames={165}>
        <ClipScene clip="clips/seg_profile.mp4" kicker="Your profile" line={"Every Heet\nadds up."} tilt={1} />
      </TransitionSeries.Sequence>
      {T()}
      <TransitionSeries.Sequence durationInFrames={270}>
        <EndCard />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
