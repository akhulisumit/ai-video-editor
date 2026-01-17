import OpenAI from "openai";
console.log("🚨 VISUAL DECIDER LOADED 🚨");


const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ------------------ CONSTANTS ------------------ */

const ANIMATIONS = ["NONE", "FADE", "POP", "SLIDE_UP"];

const STOPWORDS = new Set([
  "the","and","is","in","to","of","we","i","it","a","at","on","for",
  "with","as","you","this","that","are","was","be"
]);

/* ------------------ PROMPT ------------------ */

const SYSTEM_PROMPT = `
You are a video editing assistant.

Your task is to ANNOTATE caption segments.

Rules:
- Choose animation from: NONE, FADE, POP, SLIDE_UP
- Highlight at most 2 IMPORTANT words that already exist in the text
- NEVER highlight stopwords, filler words, or single letters
- NEVER highlight meaningless numbers unless they carry meaning
- Do NOT change text or timestamps
- Set isTitle true only if it sounds like an intro or section heading
- Output ONLY valid JSON (no markdown, no explanation)

JSON format:
{
  "animation": "FADE",
  "highlight": ["word1", "word2"],
  "isTitle": false
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
    temperature: 0.2
  });

  return JSON.parse(response.choices[0].message.content);
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

function resolveAnimation(isTitle, highlights) {
  if (isTitle) return "SLIDE_UP";
  if (highlights.length > 0) return "POP";
  return "FADE";
}

/* ------------------ PUBLIC API ------------------ */

export async function applyVisualDecisions(segments) {
    console.log("🔥 APPLY VISUAL DECISIONS RUNNING");

  const enriched = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const decision = await decideVisuals(segment, i);

    // Deterministic title rule (DO NOT let AI guess this)
    const forcedTitle =
      i === 0 && (segment.end - segment.start) >= 2;

    const cleanedHighlights = cleanHighlights(
      segment.text,
      decision.highlight || []
    );

    enriched.push({
      ...segment,
      isTitle: forcedTitle || decision.isTitle === true,
      highlight: cleanedHighlights,
      animation: resolveAnimation(
        forcedTitle || decision.isTitle === true,
        cleanedHighlights
      )
    });
  }

  return enriched;
}
