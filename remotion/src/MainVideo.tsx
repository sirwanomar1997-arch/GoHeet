import { AbsoluteFill } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Hook } from "./scenes/Hook";
import { ClipScene } from "./scenes/ClipScene";
import { FeedLive } from "./scenes/FeedLive";
import { AvatarScene } from "./scenes/AvatarScene";
import { ProfileScene } from "./scenes/ProfileScene";
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
      <TransitionSeries.Sequence durationInFrames={100}>
        <Hook />
      </TransitionSeries.Sequence>
      {T()}
      <TransitionSeries.Sequence durationInFrames={340}>
        <FeedLive />
      </TransitionSeries.Sequence>
      {T()}
      <TransitionSeries.Sequence durationInFrames={150}>
        <ClipScene clip="clips/c_camera.mp4" kicker="Camera only" line={"Shot here, now.\nNo uploads. Ever."} tilt={1} />
      </TransitionSeries.Sequence>
      {T()}
      <TransitionSeries.Sequence durationInFrames={220}>
        <AvatarScene />
      </TransitionSeries.Sequence>
      {T()}
      <TransitionSeries.Sequence durationInFrames={230}>
        <ProfileScene />
      </TransitionSeries.Sequence>
      {T()}
      <TransitionSeries.Sequence durationInFrames={235}>
        <EndCard />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
