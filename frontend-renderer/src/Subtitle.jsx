import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";

export const Caption = ({
  text,
  start,
  end,
  isTitle,
  highlight = [],
  animation,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Convert time → frames
  const startFrame = Math.floor(start * fps);
  const endFrame = Math.floor(end * fps);

  // Hard cut outside segment
  if (frame < startFrame || frame > endFrame) return null;

  // Animation runs RELATIVE to segment start
  const localFrame = frame - startFrame;

  const progress = spring({
    frame: localFrame,
    fps,
    config: { damping: 200 },
  });

  /* ---------------- ANIMATION LOGIC ---------------- */

  let transform = "none";
  let opacity = 1;

  if (animation === "POP") {
    transform = `scale(${0.85 + 0.15 * progress})`;
  }

  if (animation === "SLIDE_UP") {
    transform = `translateY(${(1 - progress) * 40}px)`;
  }

  if (animation === "FADE") {
    opacity = progress;
  }

  /* ---------------- STYLES ---------------- */

  const baseStyle = {
    position: "absolute",
    width: "100%",
    textAlign: "center",
    fontFamily: "sans-serif",
    textShadow: "0 4px 12px rgba(0,0,0,0.6)",
    transform,
    opacity,
  };

  const style = isTitle
    ? {
        ...baseStyle,
        top: "30%",
        fontSize: 80,
        fontWeight: "bold",
        color: "#fbbf24",
      }
    : {
        ...baseStyle,
        bottom: 120,
        fontSize: 52,
        fontWeight: 600,
        color: "white",
      };

  /* ---------------- RENDER ---------------- */

  return (
    <div style={style}>
      {text.split(" ").map((word, i) => {
        const clean = word.replace(/[^\w]/g, "");
        const isHighlighted = highlight.includes(clean);

        return (
          <span
            key={i}
            style={{
              color: isHighlighted ? "#fbbf24" : "inherit",
              marginRight: 8,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
