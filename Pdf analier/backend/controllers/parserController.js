import fs from "fs";
import mammoth from "mammoth";
import pkg from "pdfjs-dist/legacy/build/pdf.js";

import { extractData } from "../utils/extractData.js";
import Resume from "../models/Resume.js";
import { saveToExcel } from "../utils/excelService.js";



const pdfjsLib = pkg;

const normalizeText = (text) => {
  return text
    .replace(/\s+/g, " ")
    .replace(/\.com/g, ".com ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
};

export const handleUpload = async (req, res) => {
  try {
    const files = req.files;

    const results = await Promise.all(
      files.map(async (file) => {
        let text = "";

        if (file.mimetype === "application/pdf") {
          const data = new Uint8Array(fs.readFileSync(file.path));
          const pdf = await pdfjsLib.getDocument({ data }).promise;

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map(item => item.str).join(" ");
          }
        } else {
          const data = await mammoth.extractRawText({ path: file.path });
          text = data.value;
        }

        text = normalizeText(text);

        const extracted = extractData(text);

        fs.unlinkSync(file.path);

        return {
          fileName: file.originalname,
          ...extracted,
        };
      })
    );

    for (let r of results) {
      await Resume.updateOne(
        { email: r.email },
        r,
        { upsert: true }
      );
    }

    await saveToExcel(results);

    res.json(results);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};