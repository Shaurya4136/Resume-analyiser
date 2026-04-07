import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/dashboard/resumes")
      .then((res) => setData(res.data))
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="bg-white/5 p-6 rounded-2xl shadow-lg">

      <h2 className="text-xl text-cyan-400 mb-4 font-semibold">
        📊 Dashboard
      </h2>

      <div className="grid md:grid-cols-3 gap-4">
        {data.map((item) => (
          <div
            key={item._id}
            className="bg-black/40 p-4 rounded-xl border border-gray-700"
          >
            <h3 className="font-semibold">{item.name}</h3>
            <p className="text-sm text-gray-400">{item.email}</p>
            <p className="text-sm">{item.phone}</p>

            <div className="mt-2 flex flex-wrap gap-1">
              {item.skills?.map((skill, i) => (
                <span
                  key={i}
                  className="text-xs bg-cyan-400/20 px-2 py-1 rounded"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}