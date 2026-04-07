import express from "express";
import multer from "multer";
import { handleUpload } from "../controllers/parserController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype.includes("word")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF/DOCX allowed"), false);
    }
  },
});

router.post("/upload", upload.array("files", 20), handleUpload);

export default router;