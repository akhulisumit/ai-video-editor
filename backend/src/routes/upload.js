import express from "express";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "storage/uploads",
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const upload = multer({ storage });

router.post("/", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video uploaded" });
  }

  // 🔹 DUMMY PIPELINE RESPONSE
  res.json({
    message: "Video uploaded",
    video: req.file.path,
    editPlan: {
      segments: []
    }
  });
});

export default router;
