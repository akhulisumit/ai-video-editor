import express from "express";
import multer from "multer";
import path from "path";

// STEP 2
import { extractAudio } from "../services/audio.js";
import { transcribeAudio } from "../services/transcript.js";
import fs from "fs"; // at top of file (only once)


// STEP 3
import {
  segmentTranscript,
  cleanSegments
} from "../services/segmenter.js";

// STEP 4
import { applyVisualDecisions } from "../services/visualDecider.js";

const router = express.Router();

/* ------------------ MULTER SETUP ------------------ */

const storage = multer.diskStorage({
  destination: "storage/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

/* ------------------ UPLOAD ROUTE ------------------ */

router.post("/", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    const videoPath = req.file.path;

    /* ---------- STEP 2: AUDIO + TRANSCRIPTION ---------- */

    const audioPath = await extractAudio(videoPath);
    const transcript = await transcribeAudio(audioPath);

    /* ---------- STEP 3: SEGMENTATION ---------- */

  let segments = segmentTranscript(transcript);
segments = cleanSegments(segments);
segments = await applyVisualDecisions(segments);


// ⬇️ ADD THIS LINE
fs.writeFileSync("sample.json", JSON.stringify({ segments }, null, 2));



    /* ---------- FINAL RESPONSE ---------- */

    res.json({
      message: "Video processed",
      video: videoPath,
      audio: audioPath,
      editPlan: {
        segments
      }
    });

  } catch (err) {
    console.error("UPLOAD PIPELINE FAILED:", err);
    res.status(500).json({
      error: "Processing failed",
      details: err.message
    });
  }
});

export default router;
