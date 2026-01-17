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

  /* ---------- VIDEO STYLE (DEFAULT: STABLE) ---------- */

  let videoStyle = {
    width: "100%",
    height: "100%",
    transform: "none",
    opacity: 1,
  };

  /* ---------- VIDEO ANIMATION (AI DRIVEN) ---------- */

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
        damping: 200,    // Higher damping = less rubbery/bouncy
        stiffness: 80,   // Lower stiffness = slower movement (looser spring)
        mass: 3,         // Higher mass = more inertia (takes longer to settle)
      },
    });

    switch (activeSegment.videoAnimation) {
      case "ZOOM_IN":
        // Increased range: 1.0 -> 1.15 (15% zoom)
        videoStyle.transform = `scale(${1 + 0.15 * progress})`;
        break;

      case "ZOOM_OUT":
        // Increased range: 1.15 -> 1.0
        videoStyle.transform = `scale(${1.15 - 0.15 * progress})`;
        break;

      case "SLIDE_UP":
        // Increased range: 100px
        videoStyle.transform = `translateY(${(1 - progress) * 100}px)`;
        break;

      case "SLIDE_LEFT":
        // Increased range: 100px
        videoStyle.transform = `translateX(${(1 - progress) * 100}px)`;
        break;

      case "FADE_IN":
        videoStyle.opacity = progress;
        break;

      default:
        break;
    }
  }

  /* ---------- RENDER ---------- */

  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <AbsoluteFill style={videoStyle}>
        {videoSrc && <Video src={staticFile(videoSrc)} />}
      </AbsoluteFill>

      {audioSrc && <Audio src={staticFile(audioSrc)} />}

      {activeSegment && (
        <Caption
          text={activeSegment.text}
          start={activeSegment.start}
          end={activeSegment.end}
          isTitle={activeSegment.isTitle}
          highlight={activeSegment.highlight}
          animation={activeSegment.captionAnimation}
        />
      )}
    </AbsoluteFill>
  );
};
