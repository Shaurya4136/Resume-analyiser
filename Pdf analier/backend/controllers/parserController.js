import fs from "fs";
import mammoth from "mammoth";
import axios from "axios";
import FormData from "form-data";

import Resume from "../models/Resume.js";
import { saveToGoogleSheet } from "../utils/googleSheet.js";

// ---------------- CONFIG ----------------
const PYTHON_API = process.env.PYTHON_API_URL; // base URL only

// ---------------- NORMALIZE ----------------
const normalize = (str) =>
  (str || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^0-9a-z@.]/gi, "");

// ---------------- CLEAN TEXT ----------------
const cleanText = (text) => {
  return text
    .replace(/\s+/g, " ")
    .replace(/[^\x00-\x7F]/g, "")
    .trim();
};

// ---------------- FALLBACK ----------------
const extractBasic = (text) => {
  const email =
    text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || "N/A";

  const phone =
    text.match(/(\+91[\-\s]?)?[6-9]\d{9}/)?.[0] || "N/A";

  return { email, phone };
};

// ---------------- SAFE ----------------
const safe = (val) => {
  if (!val || val === "" || val === "null" || val === "undefined") {
    return "N/A";
  }
  return String(val).trim();
};

// ---------------- MAIN CONTROLLER ----------------
export const handleUpload = async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const results = await Promise.all(
      files.map(async (file) => {
        let text = "";

        try {
          // 📄 Read DOCX
          if (file.mimetype !== "application/pdf") {
            const data = await mammoth.extractRawText({ path: file.path });
            text = data.value;
          }

          text = cleanText(text);

          // 🤖 Prepare Python API request
          const formData = new FormData();
          formData.append("file", fs.createReadStream(file.path));

          let aiData = {};

          try {
            const response = await axios.post(
              `${PYTHON_API}/parse-resume`, // ✅ FIXED HERE
              formData,
              {
                headers: formData.getHeaders(),
                timeout: 20000,
              }
            );

            aiData = response.data;

          } catch (err) {
            console.log("⚠️ Python API failed:", err.message);
          }

          // 🔁 Fallback regex
          const regexData = extractBasic(text);

          const merged = {
            fullName: safe(aiData.fullName),
            email: safe(
              aiData.email !== "N/A" ? aiData.email : regexData.email
            ),
            mobile: safe(
              aiData.mobile !== "N/A" ? aiData.mobile : regexData.phone
            ),
            location: safe(aiData.location),
            lastCompany: safe(aiData.lastCompany),
            skills: Array.isArray(aiData.skills) ? aiData.skills : [],
          };

          return {
            fileName: file.originalname,
            ...merged,
          };

        } catch (fileErr) {
          console.error("❌ File error:", fileErr.message);

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
      })
    );

    // ================================
    // ✅ SAVE TO MONGODB (NO DUPLICATES)
    // ================================
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
            $set: {
              ...r,
              email,
              mobile,
            },
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

    // ================================
    // ✅ SAVE TO GOOGLE SHEETS
    // ================================
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