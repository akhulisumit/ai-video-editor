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
      console.log("--- [START] Processing Video ---");
      console.log(`[1/8] File received: ${videoPath}`);
      const metadata = await getVideoMetadata(videoPath);
      console.log("[1/8] Metadata extracted:", metadata);

      /* STEP 1 — AUDIO */
      console.log("[2/8] Extracting audio...");
      const audioPath = await extractAudio(videoPath);
      console.log(`[2/8] Audio extracted to: ${audioPath}`);

      /* STEP 2 — TRANSCRIPT */
      console.log("[3/8] Transcribing audio (this may take a moment)...");
      const transcript = await transcribeAudio(audioPath);
      console.log("[3/8] Transcription complete.");

      /* STEP 3 — SEGMENT */
      console.log("[4/8] Segmenting transcript...");
      let segments = segmentTranscript(transcript);
      segments = cleanSegments(segments);
      console.log(`[4/8] Created ${segments.length} segments.`);

      /* STEP 4 — AI VISUALS */
      console.log("[5/8] Applying AI visual decisions...");
      segments = await applyVisualDecisions(segments);
      console.log("[5/8] Visual decisions applied.");

      const editPlan = { segments };

      /* STEP 5 — COPY FILES FOR REMOTION */
      console.log("[6/8] Setting up Remotion environment...");

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
      console.log("[6/8] Files copied to public folder.");

      /* STEP 6 — WRITE sample.json */
      console.log("[7/8] Generating 'sample.json'...");

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
      console.log(`[7/8] written to ${REMOTION_SAMPLE}`);

      /* STEP 7 — SAVE HISTORY */
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const historyPath = path.resolve(`storage/outputs/edit-plan-${timestamp}.json`);
      
      fs.writeFileSync(
        historyPath, 
        JSON.stringify(remotionPayload, null, 2)
      );
      console.log(`[8/8] History saved to ${historyPath}`);

      /* RESPONSE TO POSTMAN */
      console.log("--- [DONE] Sending response to client ---");

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
import { processEditRequest } from "../services/editService.js";

/* ... existing imports ... */

/* ---------- EDIT ROUTE ---------- */

router.post("/edit-video", async (req, res) => {
  try {
    const { prompt } = req.body;
    
    // 1. Read current sample.json
    if (!fs.existsSync(REMOTION_SAMPLE)) {
      return res.status(404).json({ error: "No active project found." });
    }
    
    const currentData = JSON.parse(fs.readFileSync(REMOTION_SAMPLE, "utf-8"));
    
    console.log(`[EDIT REQUEST] "${prompt}"`);

    // 2. Call AI Service
    // We only send the editPlan part to save tokens/complexity, 
    // but if you want to edit metadata, send the whole thing.
    // For now, let's sending everything but focus on editPlan.
    
    const newEditPlan = await processEditRequest(currentData.editPlan, prompt);
    
    // 3. Update Data
    currentData.editPlan = newEditPlan;
    
    // 4. Write back
    fs.writeFileSync(REMOTION_SAMPLE, JSON.stringify(currentData, null, 2));
    
    console.log("[EDIT SUCCESS] updated sample.json");
    
    res.json({ status: "ok", message: "Edit applied", data: currentData });

  } catch (err) {
    console.error("EDIT ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


export default router;
