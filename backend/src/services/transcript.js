import fs from "fs";
import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function transcribeAudio(audioPath) {
    const response = await client.audio.transcriptions.create({
        file: fs.createReadStream(audioPath),
        model: "whisper-1",
        response_format: "verbose_json"
    });

    // Extract timestamped segments
    return response.segments.map(seg => ({
        text: seg.text.trim(),
        start: seg.start,
        end: seg.end
    }));
}
