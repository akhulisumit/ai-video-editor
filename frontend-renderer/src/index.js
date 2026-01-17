import { registerRoot, Composition } from "remotion";
import { MyVideo } from "./VideoComposition";
import data from "./sample.json";

const fps = 30;

// Handle empty segments gracefully
const durationInFrames = Math.ceil(
  (data.editPlan?.segments?.length > 0 
    ? Math.max(...data.editPlan.segments.map(s => s.end))
    : 10) * fps
);

export const RemotionRoot = () => (
  <Composition
    id="AutoEditor"
    component={MyVideo}
    durationInFrames={durationInFrames}
    fps={fps}
    width={data.metadata?.width || 1920}
    height={data.metadata?.height || 1080}
    defaultProps={{
      videoSrc: data.video,
      audioSrc: data.audio,
      segments: data.editPlan?.segments || []
    }}
  />
);

registerRoot(RemotionRoot);
