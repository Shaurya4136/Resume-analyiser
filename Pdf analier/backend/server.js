import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";

import uploadRoutes from "./routes/uploadRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

app.use("/api", uploadRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(process.env.PORT, () => {
  console.log(`🚀 Server running on ${process.env.PORT}`);
});