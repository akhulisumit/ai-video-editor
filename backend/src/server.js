import "dotenv/config";
import express from "express";
import cors from "cors";
import uploadRouter from "./routes/upload.js";
import processRouter from "./routes/process.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/upload", uploadRouter);
app.use("/api", processRouter);

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
