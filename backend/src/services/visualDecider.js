import OpenAI from "openai";
import { VIDEO_ANIMATIONS } from "../config/videoAnimations.js";


console.log("🚨 VISUAL DECIDER LOADED 🚨");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ------------------ CONSTANTS ------------------ */

const STOPWORDS = new Set([
  "the","and","is","in","to","of","we","i","it","a","at","on","for",
  "with","as","you","this","that","are","was","be"
]);

/* ------------------ PROMPT ------------------ */

const SYSTEM_PROMPT = `
You are a video editing assistant.

Your job is to annotate subtitle segments to make the video DYNAMIC and ENGAGING.

Rules:
- captionAnimation: FADE | POP | SLIDE_UP  (Avoid NONE unless absolutely necessary)
- videoAnimation: ZOOM_IN | ZOOM_OUT | SLIDE_UP | SLIDE_LEFT | FADE_IN
- USE VIDEO ANIMATIONS FREQUENTLY (at least every 2-3 segments)
- Highlight 1-2 KEYWORDS that carry the most meaning
- Do NOT change text or timestamps
- Output ONLY valid JSON

JSON format:
{
  "captionAnimation": "POP",
  "videoAnimation": "ZOOM_IN",
  "highlight": ["hackathon", "win"]
}
`;


/* ------------------ AI CALL ------------------ */

async function decideVisuals(segment, index) {
  const userPrompt = `
Text: "${segment.text}"
Position: ${index === 0 ? "start" : "middle"}
Duration: ${(segment.end - segment.start).toFixed(2)} seconds
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.4 // Increased for more variety
  });
  
  // Clean potential markdown
  let content = response.choices[0].message.content;
  if (content.startsWith("```json")) {
    content = content.replace(/^```json\n/, "").replace(/\n```$/, "");
  } else if (content.startsWith("```")) {
     content = content.replace(/^```\n/, "").replace(/\n```$/, "");
  }

  return JSON.parse(content);
}

/* ------------------ POST PROCESSING ------------------ */

function cleanHighlights(text, highlights = []) {
  const lowerText = text.toLowerCase();

  return highlights
    .filter(w =>
      typeof w === "string" &&
      w.length >= 3 &&
      !STOPWORDS.has(w.toLowerCase()) &&
      lowerText.includes(w.toLowerCase())
    )
    .slice(0, 2);
}

/* ------------------ PUBLIC API ------------------ */

export async function applyVisualDecisions(segments) {
  console.log("🔥 APPLY VISUAL DECISIONS RUNNING");

  const enriched = [];
  let sceneChangeCount = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const decision = await decideVisuals(segment, i);

    // Force title only for first strong segment
    const forcedTitle =
      i === 0 && (segment.end - segment.start) >= 2;

    const cleanedHighlights = cleanHighlights(
      segment.text,
      decision.highlight || []
    );

    let isSceneChange = Boolean(decision.isSceneChange);

    // 🔒 SAFETY: ensure at least 3 scene changes total
    if (
      !isSceneChange &&
      sceneChangeCount < 3 &&
      (forcedTitle || cleanedHighlights.length > 0)
    ) {
      isSceneChange = true;
    }

    if (isSceneChange) {
      sceneChangeCount++;
    }

    enriched.push({
      ...segment,
      highlight: cleanedHighlights,
      captionAnimation: decision.captionAnimation || "FADE",
      videoAnimation: decision.videoAnimation || "NONE",
    });

  }

  console.log(`🎬 Scene changes decided: ${sceneChangeCount}`);

  return enriched;
}
