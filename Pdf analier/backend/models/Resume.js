import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
  
  fullName: {
    type: String,
    default: "N/A",
    trim: true,
  },

  email: {
    type: String,
    unique: true,
    sparse: true, // ✅ allows multiple null/N/A
    default: undefined,
    trim: true,
  },

  mobile: {
    type: String,
    unique: true,
    sparse: true, // ✅ prevents duplicate phone entries
    default: undefined,
  },

  location: {
    type: String,
    default: "N/A",
    trim: true,
  },

  lastCompany: {
    type: String,
    default: "N/A",
    trim: true,
  },

  skills: {
    type: [String],
    default: [],
  },

  fileName: {
    type: String,
    default: "",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

});

export default mongoose.model("Resume", resumeSchema);