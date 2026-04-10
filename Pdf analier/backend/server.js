import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import uploadRoutes from "./routes/uploadRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();

// ---------------- CORS (CORRECT) ----------------
app.use(cors({
  origin: "*", // later replace with frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// ---------------- BODY PARSER ----------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ---------------- ROUTES ----------------
app.use("/api", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.send("🚀 Resume Analyzer API Running");
});

// ---------------- ERROR HANDLER ----------------
app.use((err, req, res, next) => {
  console.error("❌ Global Error:", err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// ---------------- DB + SERVER START ----------------
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });