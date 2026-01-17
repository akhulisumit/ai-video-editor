import React from "react";
import {
  AbsoluteFill,
  Video,
  Audio,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";

import { Caption } from "./Subtitle";
import editPlan from "./sample.json";

export const MyVideo = ({ videoSrc, audioSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const segments = editPlan.segments;
  const currentTime = frame / fps;

  const activeSegment = segments.find(
    (s) => currentTime >= s.start && currentTime < s.end
  );

  // ---------------- VIDEO ANIMATION ----------------

  let videoStyle = {
    width: "100%",
    height: "100%",
    transform: "none",
    opacity: 1,
  };

  if (activeSegment?.isSceneChange) {
    const startFrame = Math.floor(activeSegment.start * fps);
    const localFrame = frame - startFrame;

    const progress = spring({
      frame: localFrame,
      fps,
      config: { damping: 200 },
    });

    if (activeSegment.animation === "SLIDE_UP") {
      videoStyle.transform = `translateY(${(1 - progress) * 40}px)`;
    }

    if (activeSegment.animation === "POP") {
      videoStyle.transform = `scale(${1 + 0.05 * progress})`;
    }

    if (activeSegment.animation === "FADE") {
      videoStyle.opacity = progress;
    }
  }

  // ---------------- RENDER ----------------

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill style={videoStyle}>
        <Video src={staticFile(videoSrc)} />
      </AbsoluteFill>

      <Audio src={staticFile(audioSrc)} />

      {activeSegment && (
        <Caption
          text={activeSegment.text}
          start={activeSegment.start}
          end={activeSegment.end}
          isTitle={activeSegment.isTitle}
          highlight={activeSegment.highlight}
          animation={activeSegment.animation}
        />
      )}
    </AbsoluteFill>
  );
};
