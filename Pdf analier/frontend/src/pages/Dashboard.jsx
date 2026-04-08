import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/dashboard/resumes"
        );
        console.log("📊 Dashboard Data:", res.data);
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔄 Loading state
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-500">
        ⏳ Loading dashboard...
      </div>
    );
  }

  // ❌ Error state
  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        ❌ {error}
      </div>
    );
  }

  // 📭 Empty state
  if (data.length === 0) {
    return (
      <div className="p-6 text-center text-gray-400">
        📭 No resumes found
      </div>
    );
  }

  return (
    <div className="p-6">

      <h2 className="text-3xl font-bold text-cyan-500 mb-6">
        📊 Resume Dashboard
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">

        {data.map((item) => (
          <div
            key={item._id}
            className="bg-white dark:bg-gray-800 
            shadow-md hover:shadow-xl 
            rounded-2xl p-5 transition duration-300"
          >

            {/* NAME */}
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
              {item.fullName || "N/A"}
            </h3>

            {/* EMAIL */}
            <p className="text-sm text-gray-500">
              📧 {item.email || "N/A"}
            </p>

            {/* PHONE */}
            <p className="text-sm text-gray-600 dark:text-gray-300">
              📱 {item.mobile?.trim() || "N/A"}
            </p>

            {/* LOCATION */}
            <p className="text-sm mt-2">
              📍 {item.location || "N/A"}
            </p>

            {/* COMPANY */}
            <p className="text-sm">
              🏢 {item.lastCompany || "N/A"}
            </p>

            {/* SKILLS */}
            <div className="mt-3 flex flex-wrap gap-2">
              {item.skills?.length > 0 ? (
                item.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="bg-cyan-100 dark:bg-cyan-900 
                    text-cyan-700 dark:text-cyan-300 
                    px-2 py-1 text-xs rounded"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="text-xs text-gray-400">
                  No skills detected
                </span>
              )}
            </div>

          </div>
        ))}

      </div>
    </div>
  );
}