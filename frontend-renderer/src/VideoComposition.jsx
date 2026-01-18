import React from "react";
import {
  AbsoluteFill,
  Audio,
  Video,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
  spring,
} from "remotion";
import { SectionTitle } from "./SectionTitle";

import { Caption } from "./Subtitle";

export const MyVideo = ({ videoSrc, audioSrc, segments }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;

  // Active Segment for captions/video
  const activeSegment = segments.find(
    (seg) =>
      typeof seg.start === "number" &&
      typeof seg.end === "number" &&
      currentTime >= seg.start &&
      currentTime < seg.end
  );

  // Active Section Title (Persistent until next title)
  // We find the last segment before current time that had a title
  const activeTitleSegment = [...segments]
    .reverse()
    .find(seg => 
      seg.start <= currentTime && 
      seg.sectionTitle
    );
    
  const currentSectionTitle = activeTitleSegment ? activeTitleSegment.sectionTitle : null;

  /* ---------- VIDEO STYLE ---------- */

  let videoStyle = {
    width: "100%",
    height: "100%",
    transform: "none",
    opacity: 1,
  };

  /* ---------- VIDEO ANIMATION ---------- */

  if (
    activeSegment &&
    typeof activeSegment.videoAnimation === "string" &&
    activeSegment.videoAnimation !== "NONE"
  ) {
    const startFrame = Math.floor(activeSegment.start * fps);
    const localFrame = frame - startFrame;

    const progress = spring({
      frame: localFrame,
      fps,
      config: {
        damping: 200,
        stiffness: 80,
        mass: 3,
      },
    });

    switch (activeSegment.videoAnimation) {
      case "ZOOM_IN":
        videoStyle.transform = `scale(${1 + 0.15 * progress})`;
        break;

      case "ZOOM_OUT":
        videoStyle.transform = `scale(${1.15 - 0.15 * progress})`;
        break;

      case "SLIDE_UP":
        videoStyle.transform = `translateY(${(1 - progress) * 100}px)`;
        break;

      case "SLIDE_LEFT":
        videoStyle.transform = `translateX(${(1 - progress) * 100}px)`;
        break;

      case "FADE_IN":
        videoStyle.opacity = progress;
        break;

      default:
        break;
    }
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill style={videoStyle}>
        {videoSrc && <Video src={staticFile(videoSrc)} />}
      </AbsoluteFill>

      {audioSrc && <Audio src={staticFile(audioSrc)} />}
      
      {/* Section Title Overlay */}
      <SectionTitle title={currentSectionTitle} />

      {activeSegment && (
        <Caption
           text={activeSegment.text}
           start={activeSegment.start}
           end={activeSegment.end}
           isTitle={activeSegment.isTitle}
           highlight={activeSegment.highlight}
           animation={activeSegment.captionAnimation}
           captionColor={activeSegment.captionColor}
           captionSize={activeSegment.captionSize}
           highlightColor={activeSegment.highlightColor}
        />
      )}
    </AbsoluteFill>
  );
};
