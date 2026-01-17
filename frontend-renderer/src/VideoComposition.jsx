import React from "react";
import {
  AbsoluteFill,
  Audio,
  Video,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import { Caption } from "./Subtitle";

export const MyVideo = ({ videoSrc, audioSrc, segments }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTime = frame / fps;

  const activeSegment = segments.find(
    (seg) =>
      typeof seg.start === "number" &&
      typeof seg.end === "number" &&
      currentTime >= seg.start &&
      currentTime < seg.end
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {videoSrc && <Video src={staticFile(videoSrc)} />}
      {audioSrc && <Audio src={staticFile(audioSrc)} />}

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
