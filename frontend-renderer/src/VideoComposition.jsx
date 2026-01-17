import React from "react";
import { AbsoluteFill, Audio, Video, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import { Caption } from "./Subtitle";

export const MyVideo = ({ videoSrc, audioSrc, segments }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Find the active segment for the current frame
  const currentTime = frame / fps;
  const activeSegment = segments.find(
    (seg) => currentTime >= seg.start && currentTime < seg.end
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {videoSrc && <Video src={staticFile(videoSrc)} />}
      {audioSrc && <Audio src={staticFile(audioSrc)} />}

      {activeSegment && (
        <Caption
            text={activeSegment.text}
            isTitle={activeSegment.isTitle}
            highlight={activeSegment.highlight}
            animation={activeSegment.animation}
        />
      )}
    </AbsoluteFill>
  );
};
