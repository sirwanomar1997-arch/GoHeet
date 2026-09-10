import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { RealPromo } from "./RealPromo";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="main" component={MainVideo} durationInFrames={1200} fps={30} width={1080} height={1920} />
    <Composition id="real" component={RealPromo} durationInFrames={1200} fps={30} width={1080} height={1920} />
  </>
);
