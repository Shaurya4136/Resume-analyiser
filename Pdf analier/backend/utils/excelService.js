import XLSX from "xlsx";
import fs from "fs";

const FILE_PATH = process.env.EXCEL_FILE_PATH || "resumes.xlsx";

export const saveToExcel = (dataArray) => {
  let workbook;
  let worksheet;

  if (fs.existsSync(FILE_PATH)) {
    workbook = XLSX.readFile(FILE_PATH);
    worksheet = workbook.Sheets["Resumes"];
  } else {
    workbook = XLSX.utils.book_new();
    worksheet = XLSX.utils.json_to_sheet([]);
  }

  const existingData = XLSX.utils.sheet_to_json(worksheet);
  const newData = [...existingData, ...dataArray];

  const newSheet = XLSX.utils.json_to_sheet(newData);

  workbook.Sheets["Resumes"] = newSheet;

  if (!workbook.SheetNames.includes("Resumes")) {
    workbook.SheetNames.push("Resumes");
  }

  XLSX.writeFile(workbook, FILE_PATH);
};