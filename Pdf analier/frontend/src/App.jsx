import { useState } from "react";
import Upload3D from "./components/Upload3D";
import Table from "./components/Table";
import ThemeToggle from "./components/ThemeToggle";

export default function Home() {
  const [data, setData] = useState([]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition">

      <div className="max-w-6xl mx-auto p-6">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            📄 Resume Analyzer
          </h1>
          <ThemeToggle />
        </div>

        {/* UPLOAD */}
        <Upload3D setData={setData} />

        {/* TABLE */}
        <Table data={data} />

      </div>
    </div>
  );
}