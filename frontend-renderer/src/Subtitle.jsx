import React from "react";
import { useCurrentFrame, useVideoConfig, spring } from "remotion";

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

  if (typeof start !== "number" || typeof end !== "number") return null;

  const startFrame = Math.floor(start * fps);
  const endFrame = Math.floor(end * fps);

  if (frame < startFrame || frame > endFrame) return null;

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


  let transform = "none";
  let opacity = 1;

  if (animation === "POP") {
    transform = `scale(${0.9 + 0.1 * progress})`;
  }

  if (animation === "SLIDE_UP") {
    transform = `translateY(${(1 - progress) * 30}px)`;
  }

  if (animation === "FADE") {
    opacity = progress;
  }

  return (
    <div
      style={{
        position: "absolute",
        bottom: isTitle ? "40%" : "10%",
        width: "100%",
        textAlign: "center",
        fontSize: isTitle ? 80 : 52,
        fontWeight: isTitle ? "bold" : 600,
        color: isTitle ? "#fbbf24" : "white",
        transform,
        opacity,
        textShadow: "0 4px 12px rgba(0,0,0,0.6)",
      }}
    >
      {text.split(" ").map((word, i) => {
        // robust matching: remove punctuation, lowercase
        const clean = word.toLowerCase().replace(/[^\w]/g, "");
        const shouldHighlight = highlight.some(h => 
          h.toLowerCase().replace(/[^\w]/g, "") === clean
        );

        return (
          <span
            key={i}
            style={{
              color: shouldHighlight ? "#fbbf24" : "white",
              marginRight: 8,
              display: "inline-block"
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
