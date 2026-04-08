import { useDropzone } from "react-dropzone";
import axios from "axios";
import { useState, useRef } from "react";

export default function Upload3D({ setData }) {
  const [loading, setLoading] = useState(false);

  // 🔥 LOCK (prevents multiple calls)
  const isUploading = useRef(false);

  const onDrop = async (files) => {
    // ❌ Prevent duplicate calls
    if (isUploading.current) {
      console.log("⏳ Already uploading...");
      return;
    }

    isUploading.current = true;
    setLoading(true);

    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      const res = await axios.post(
        "http://localhost:5000/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("📥 Upload Response:", res.data);

      setData(res.data);

    } catch (err) {
      console.error(err);
      alert("❌ Upload failed. Try again.");
    } finally {
      setLoading(false);
      isUploading.current = false;
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,

    // 🔥 Disable while uploading
    disabled: loading,
  });

  return (
    <div
      {...getRootProps()}
      className={`mb-6 p-10 rounded-2xl border-2 border-dashed 
      transition text-center cursor-pointer

      ${loading
        ? "opacity-50 cursor-not-allowed"
        : ""
      }

      ${isDragActive
        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900"
        : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
      }

      hover:scale-105`}
    >
      <input {...getInputProps()} />

      {loading ? (
        <p className="text-lg font-semibold text-blue-500">
          ⏳ Processing resumes...
        </p>
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