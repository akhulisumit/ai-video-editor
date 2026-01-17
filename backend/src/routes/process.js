import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

// services
import { extractAudio } from "../services/audio.js";
import { transcribeAudio } from "../services/transcript.js";
import { segmentTranscript, cleanSegments } from "../services/segmenter.js";
import { applyVisualDecisions } from "../services/visualDecider.js";
import { getVideoMetadata } from "../services/metadata.js";

const router = express.Router();

/* ---------- MULTER ---------- */

const upload = multer({
  storage: multer.diskStorage({
    destination: "storage/uploads",
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    }
  })
});

/* ---------- PATHS ---------- */

const REMOTION_PUBLIC = path.resolve(
  "../frontend-renderer/public"
);

const REMOTION_SAMPLE = path.resolve(
  "../frontend-renderer/src/sample.json"
);

/* ---------- ROUTE ---------- */

router.post(
  "/process-video",
  upload.single("video"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video uploaded" });
      }

      const videoPath = req.file.path;

      /* STEP 0 — METADATA */
      const metadata = await getVideoMetadata(videoPath);
      console.log("Video Metadata:", metadata);

      /* STEP 1 — AUDIO */
      const audioPath = await extractAudio(videoPath);

      /* STEP 2 — TRANSCRIPT */
      const transcript = await transcribeAudio(audioPath);

      /* STEP 3 — SEGMENT */
      let segments = segmentTranscript(transcript);
      segments = cleanSegments(segments);

      /* STEP 4 — AI VISUALS */
      segments = await applyVisualDecisions(segments);

      const editPlan = { segments };

      /* STEP 5 — COPY FILES FOR REMOTION */

      if (!fs.existsSync(REMOTION_PUBLIC)) {
        fs.mkdirSync(REMOTION_PUBLIC, { recursive: true });
      }

      // We need just the filename for sample.json, but full copy path
      const videoFileName = "video" + path.extname(videoPath);
      const audioFileName = "audio.wav";
      
      fs.copyFileSync(
        videoPath,
        path.join(REMOTION_PUBLIC, videoFileName)
      );

      fs.copyFileSync(
        audioPath,
        path.join(REMOTION_PUBLIC, audioFileName)
      );

      /* STEP 6 — WRITE sample.json */

      const remotionPayload = {
        video: videoFileName,
        audio: audioFileName,
        metadata, // Saved here
        editPlan
      };

      fs.writeFileSync(
        REMOTION_SAMPLE,
        JSON.stringify(remotionPayload, null, 2)
      );

      /* STEP 7 — SAVE HISTORY */
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const historyPath = path.resolve(`storage/outputs/edit-plan-${timestamp}.json`);
      
      fs.writeFileSync(
        historyPath, 
        JSON.stringify(remotionPayload, null, 2)
      );

      /* RESPONSE TO POSTMAN */

      res.json({
        status: "ok",
        message: "Video processed and ready for render",
        segments: segments.length,
        outputFile: historyPath
      });

    } catch (err) {
      console.error("PROCESS FAILED:", err);
      res.status(500).json({
        error: "Processing failed",
        details: err.message
      });
    }
  }
);

export default router;
