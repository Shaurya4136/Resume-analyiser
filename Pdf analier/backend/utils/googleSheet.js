import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  },
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth });

const HEADER = [
  "Full Name",
  "Email",
  "Mobile",
  "Location",
  "Last Company",
  "Skills",
];

// 🔥 GLOBAL LOCK (prevents race condition)
let isSaving = false;

// 🔥 MAIN FUNCTION
export const saveToGoogleSheet = async (data) => {
  if (isSaving) {
    console.log("⏳ Skipping (already saving)");
    return;
  }

  isSaving = true;

  try {
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:F",
    });

    const existingRows = existing.data.values || [];

    // ✅ Add header if empty
    if (existingRows.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: "Sheet1!A1:F1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [HEADER] },
      });
    }

    // 🔥 Normalize
    const normalize = (str) =>
      (str || "")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^0-9a-z@.]/gi, "");

    const dataRows = existingRows.slice(1);

    const existingSet = new Set(
      dataRows.map(
        (row) =>
          normalize(row[1]) + "_" + normalize(row[2])
      )
    );

    const newRows = [];

    for (const d of data) {
      const email = normalize(d.email);
      const mobile = normalize(d.mobile);

      const key = `${email}_${mobile}`;

      // ❌ Skip invalid
      if (!email && !mobile) continue;
      if (key === "_" || key === "na_na") continue;

      if (!existingSet.has(key)) {
        existingSet.add(key);

        newRows.push([
          d.fullName,
          d.email,
          d.mobile,
          d.location,
          d.lastCompany,
          d.skills?.join(", "),
        ]);
      }
    }

    if (newRows.length === 0) {
      console.log("⚠️ No new data");
      return;
    }

    // ✅ SAFE APPEND
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: newRows,
      },
    });

    console.log("✅ Sheet Updated (No duplicates)");

  } catch (err) {
    console.error("❌ Google Sheet Error:", err.message);
  } finally {
    isSaving = false;
  }
};