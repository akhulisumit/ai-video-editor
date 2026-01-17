import express from "express";
import multer from "multer";
import path from "path";

import { extractAudio } from "../services/audio.js";
import { transcribeAudio } from "../services/transcript.js";
import { segmentTranscript } from "../services/segmenter.js";


const router = express.Router();

const storage = multer.diskStorage({
  destination: "storage/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post("/", upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No video uploaded" });
    }

    const videoPath = req.file.path;

    // STEP 2 pipeline
    const audioPath = await extractAudio(videoPath);
    const transcript = await transcribeAudio(audioPath);
    const segmentedTranscript = segmentTranscript(transcript);


    res.json({
          message: "Video processed",
          video: videoPath,
          audio: audioPath,
          transcript: segmentedTranscript,
          editPlan: {
            segments: segmentedTranscript
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Processing failed" });
  }
});

export default router;
