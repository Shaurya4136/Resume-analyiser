import fs from "fs";
import mammoth from "mammoth";
import axios from "axios";
import FormData from "form-data";

import Resume from "../models/Resume.js";
import { saveToGoogleSheet } from "../utils/googleSheet.js";

const PYTHON_API = process.env.PYTHON_API_URL;

// ---------------- NORMALIZE ----------------
const normalize = (str) =>
  (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^0-9a-z@.]/gi, "");

// ---------------- CLEAN TEXT ----------------
const cleanText = (text) =>
  text.replace(/\s+/g, " ").replace(/[^\x00-\x7F]/g, "").trim();

// ---------------- FALLBACK ----------------
const extractBasic = (text) => {
  const email =
    text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "N/A";

  const phone =
    text.match(/(\+91[\-\s]?)?[6-9]\d{9}/)?.[0] || "N/A";

  return { email, phone };
};

// ---------------- SAFE ----------------
const safe = (val) =>
  !val || val === "null" || val === "undefined" ? "N/A" : String(val).trim();

// ---------------- CALL PYTHON (RETRY + TIMEOUT) ----------------
const callPythonAPI = async (formData) => {
  try {
    return await axios.post(`${PYTHON_API}/parse-resume`, formData, {
      headers: formData.getHeaders(),
      timeout: 60000,
    });
  } catch (err) {
    console.log("⚠️ First attempt failed:", err.message);

    try {
      return await axios.post(`${PYTHON_API}/parse-resume`, formData, {
        headers: formData.getHeaders(),
        timeout: 60000,
      });
    } catch (retryErr) {
      console.log("❌ Retry failed:", retryErr.message);
      return null;
    }
  }
};

// ---------------- WARMUP ----------------
const warmUpPython = async () => {
  try {
    await axios.get(PYTHON_API, { timeout: 10000 });
    console.log("🔥 Python warmed up");
  } catch {
    console.log("⚠️ Warmup skipped");
  }
};

// ---------------- PROCESS SINGLE FILE ----------------
const processFile = async (file) => {
  let text = "";

  try {
    if (file.mimetype !== "application/pdf") {
      const data = await mammoth.extractRawText({ path: file.path });
      text = data.value;
    }

    text = cleanText(text);

    const formData = new FormData();
    formData.append("file", fs.createReadStream(file.path));

    let aiData = {};

    const response = await callPythonAPI(formData);

    if (response && response.data) {
      aiData = response.data;
    }

    const regexData = extractBasic(text);

    return {
      fileName: file.originalname,
      fullName: safe(aiData.fullName),
      email: safe(aiData.email !== "N/A" ? aiData.email : regexData.email),
      mobile: safe(aiData.mobile !== "N/A" ? aiData.mobile : regexData.phone),
      location: safe(aiData.location),
      lastCompany: safe(aiData.lastCompany),
      skills: Array.isArray(aiData.skills) ? aiData.skills : [],
    };

  } catch (err) {
    console.error("❌ File error:", err.message);

    return {
      fileName: file.originalname,
      fullName: "N/A",
      email: "N/A",
      mobile: "N/A",
      location: "N/A",
      lastCompany: "N/A",
      skills: [],
    };
  } finally {
    try {
      fs.unlinkSync(file.path);
    } catch {}
  }
};

// ---------------- 🔥 LIMITED CONCURRENCY (2 AT A TIME) ----------------
const processWithConcurrency = async (files, limit = 2) => {
  const results = [];
  let index = 0;

  const workers = Array(limit).fill(null).map(async () => {
    while (index < files.length) {
      const currentIndex = index++;
      const result = await processFile(files[currentIndex]);
      results[currentIndex] = result;
    }
  });

  await Promise.all(workers);
  return results;
};

// ---------------- MAIN CONTROLLER ----------------
export const handleUpload = async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    await warmUpPython();

    // 🔥 CONCURRENT (SAFE)
    const results = await processWithConcurrency(files, 2);

    // ---------------- SAVE TO DB ----------------
    for (const r of results) {
      const email = normalize(r.email);
      const mobile = normalize(r.mobile);

      let query = {};

      if (email && email !== "na") {
        query.email = email;
      } else if (mobile && mobile !== "na") {
        query.mobile = mobile;
      } else {
        query.fullName = normalize(r.fullName);
        query.lastCompany = normalize(r.lastCompany);
      }

      try {
        await Resume.updateOne(
          query,
          {
            $set: { ...r, email, mobile },
          },
          { upsert: true }
        );
      } catch (err) {
        if (err.code === 11000) {
          console.log("⚠️ Duplicate skipped:", mobile || email);
          continue;
        }
        throw err;
      }
    }

    await saveToGoogleSheet(results);

    res.json(results);

  } catch (err) {
    console.error("❌ CONTROLLER ERROR:", err);
    res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  }
};