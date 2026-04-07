import { useDropzone } from "react-dropzone";
import axios from "axios";
import { useState } from "react";

export default function Upload3D({ setData }) {
  const [loading, setLoading] = useState(false);

  const onDrop = async (files) => {
    setLoading(true);

    const formData = new FormData();
    files.forEach(file => formData.append("files", file));

    const res = await axios.post("http://localhost:5000/api/upload", formData);

    setData(res.data);
    setLoading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps()} className="border p-6 mb-4 cursor-pointer">
      <input {...getInputProps()} />
      <p>{loading ? "Processing..." : "Upload resumes"}</p>
    </div>
  );
}