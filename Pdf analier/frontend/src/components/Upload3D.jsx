import { useDropzone } from "react-dropzone";
import axios from "axios";
import { useState, useRef } from "react";

export default function Upload3D({ setData }) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const isUploading = useRef(false);
  const intervalRef = useRef(null);

  const onDrop = async (files) => {
    if (isUploading.current) {
      console.log("⏳ Already uploading...");
      return;
    }

    isUploading.current = true;
    setLoading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));

      // 🔥 FAKE PROCESSING PROGRESS (50 → 95)
      let fakeProgress = 50;
      intervalRef.current = setInterval(() => {
        fakeProgress += 3;
        if (fakeProgress >= 95) {
          clearInterval(intervalRef.current);
        }
        setProgress((prev) => (prev < fakeProgress ? fakeProgress : prev));
      }, 500);

      const res = await axios.post(
        // "https://resume-analyiser-backend.onrender.com/api/upload"
        "https://resume-analyizer-e26c.onrender.com/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },

          // 🔥 REAL UPLOAD PROGRESS (0 → 50)
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 50) / progressEvent.total
            );
            setProgress(percent);
          },
        }
      );

      console.log("📥 Upload Response:", res.data);

      setData(res.data);

      // ✅ COMPLETE
      setProgress(100);

    } catch (err) {
      console.error(err);
      alert("❌ Upload failed. Try again.");
    } finally {
      setLoading(false);
      isUploading.current = false;
      clearInterval(intervalRef.current);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    disabled: loading,
  });

  // 🔥 STATUS TEXT
  const getStatus = () => {
    if (progress === 0) return "";
    if (progress < 50) return "Uploading files...";
    if (progress < 100) return "Processing resumes...";
    return "Completed ✅";
  };

  return (
    <div
      {...getRootProps()}
      className={`mb-6 p-10 rounded-2xl border-2 border-dashed 
      transition text-center cursor-pointer

      ${loading ? "opacity-80 cursor-not-allowed" : ""}

      ${
        isDragActive
          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900"
          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
      }

      hover:scale-105`}
    >
      <input {...getInputProps()} />

      {loading ? (
        <>
          <p className="text-lg font-semibold text-cyan-500">
            {getStatus()}
          </p>

          {/* 🔥 PROGRESS BAR */}
          <div className="w-full bg-gray-700 rounded-full h-3 mt-4">
            <div
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="text-sm mt-2 text-gray-300">
            {progress}%
          </p>
        </>
      ) : (
        <>
          <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            📤 Upload Resumes
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Drag & Drop or Click to Upload
          </p>
        </>
      )}
    </div>
  );
}
