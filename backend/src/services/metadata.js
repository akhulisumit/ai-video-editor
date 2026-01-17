import { exec } from "child_process";

export function getVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    // Attempt to locate ffprobe relative to ffmpeg if FFMPEG_PATH is set
    // This assumes ffprobe is in the same folder as ffmpeg
    let ffprobeExe = "ffprobe";
    
    if (process.env.FFMPEG_PATH) {
       ffprobeExe = process.env.FFMPEG_PATH.replace("ffmpeg.exe", "ffprobe.exe");
    }

    const cmd = `"${ffprobeExe}" -v error -select_streams v:0 -show_entries stream=width,height,duration -of json "${filePath}"`;

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error("FFprobe failed:", stderr);
        return reject(error);
      }
      
      try {
        const json = JSON.parse(stdout);
        const { width, height, duration } = json.streams[0];
        resolve({
          width: parseInt(width, 10),
          height: parseInt(height, 10),
          duration: parseFloat(duration)
        });
      } catch (parseErr) {
        reject(parseErr);
      }
    });
  });
}
