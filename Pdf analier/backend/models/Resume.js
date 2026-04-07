import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  location: String,
  company: String,
  fileName: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Resume", resumeSchema);