import { exec } from "child_process";
import path from "path";

export function extractAudio(videoPath) {
    return new Promise((resolve, reject) => {
        const parsed = path.parse(videoPath);
        // created .wav file in same directory
        const audioPath = path.join(parsed.dir, `${parsed.name}.wav`);

        console.log(`Extracting audio from ${videoPath} to ${audioPath}`);

        // ffmpeg: -y (overwrite), -vn (no video), -acodec pcm_s16le (wav standard)
        // Use FFMPEG_PATH from .env if available, otherwise default to 'ffmpeg'
        const ffmpegExe = process.env.FFMPEG_PATH || "ffmpeg";

        // Use double quotes for paths to handle spaces
        const cmd = `"${ffmpegExe}" -y -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`;

        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.error("FFmpeg extraction failed:", stderr);
                return reject(error);
            }
            resolve(audioPath);
        });
    });
}
