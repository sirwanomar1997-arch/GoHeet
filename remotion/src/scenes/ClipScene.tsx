import { AbsoluteFill } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Phone } from "../components/Phone";
import { Caption } from "../components/Caption";

export const ClipScene: React.FC<{
  clip: string;
  kicker: string;
  line: string;
  tilt?: number;
  captionDelay?: number;
}> = ({ clip, kicker, line, tilt = 0, captionDelay = 8 }) => (
  <AbsoluteFill>
    <Backdrop />
    <Phone clip={clip} y={110} tilt={tilt} />
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, rgba(10,7,5,0.94) 0%, rgba(10,7,5,0.55) 16%, transparent 26%)",
      }}
    />
    <Caption kicker={kicker} line={line} delay={captionDelay} top={92} />
  </AbsoluteFill>
);
