import React from "react";
import { AbsoluteFill } from "remotion";

export const SectionTitle = ({ title }) => {
  if (!title) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        right: 60,
        backgroundColor: "rgba(0,0,0,0.6)",
        color: "white",
        padding: "15px 30px",
        borderRadius: "15px",
        fontFamily: "sans-serif",
        fontSize: 32,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "2px",
        backdropFilter: "blur(5px)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.2)"
      }}
    >
      {title}
    </div>
  );
};
