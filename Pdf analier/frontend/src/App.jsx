import { useState } from "react";
import Upload3D from "./components/Upload3D";
import Table from "./components/Table";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const [data, setData] = useState([]);

  return (
    <div className="min-h-screen p-6 max-w-7xl mx-auto">

      {/* Header */}
      <h1 className="text-4xl font-bold text-center text-cyan-400 mb-8">
        🚀 AI Resume Analyzer
      </h1>

      {/* Upload */}
      <Upload3D setData={setData} />

      {/* Table */}
      <Table data={data} />

      {/* Dashboard */}
      <Dashboard />
    </div>
  );
}