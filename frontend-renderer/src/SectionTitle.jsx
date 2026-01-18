import React from "react";
import { AbsoluteFill } from "remotion";

export const SectionTitle = ({ title }) => {
  if (!title) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        right: 80,
        backgroundColor: "rgba(0,0,0,0.6)",
        color: "white",
        padding: "20px 40px",
        borderRadius: "20px",
        fontFamily: "sans-serif",
        fontSize: 80,
        fontWeight: "bold",
        textTransform: "uppercase",
        letterSpacing: "4px",
        backdropFilter: "blur(10px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        border: "2px solid rgba(255,255,255,0.2)",
        zIndex: 1000
      }}
    >
      {title}
    </div>
  );
};
