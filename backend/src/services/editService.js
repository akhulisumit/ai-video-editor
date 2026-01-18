import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are an expert video configuration assistant.
Your goal is to modify the provided JSON video edit plan based on the user's Natural Language request.

The JSON structure represents a video with multiple "segments".
Each segment has:
- text: The spoken words
- start/end: Timing (DO NOT TOUCH THESE unless explicitly asked, as they sync with audio)
- highlight: Array of words to highlight
- captionAnimation: "FADE", "POP", "SLIDE_UP", "NONE"
- videoAnimation: "ZOOM_IN", "ZOOM_OUT", "SLIDE_UP", "SLIDE_LEFT", "NONE"
- sectionTitle: A short string displayed in the corner
- sectionTitleSize: (Optional) Font size in px (e.g., 60, 80, 100)
- captionColor: (Optional) Hex code or color name for text
- captionSize: (Optional) Font size in px (e.g., 40, 60)
- highlightColor: (Optional) Hex code for active word

INSTRUCTIONS:
1. Parse the USER REQUEST.
2. Modify the CURRENT JSON to reflect the request.
3. If the user asks for a global change (e.g., "Make all captions yellow"), update ALL segments.
4. If the user asks for a specific change (e.g., "Change the title of the first clip"), update only that segment.
5. Return ONLY the valid, parseable JSON. No markdown, no conversation.
`;

export async function processEditRequest(currentJson, userPrompt) {
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { 
          role: "user", 
          content: `
USER REQUEST: "${userPrompt}"

CURRENT JSON:
${JSON.stringify(currentJson, null, 2)}
` 
        }
      ],
      temperature: 0.2 // Low temp for precision
    });

    let content = response.choices[0].message.content;
    
    // Clean markdown
    if (content.startsWith("```json")) {
      content = content.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (content.startsWith("```")) {
       content = content.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    const newJson = JSON.parse(content);
    return newJson;

  } catch (error) {
    console.error("AI EDIT FAILED:", error);
    throw new Error("Failed to process edit request");
  }
}
