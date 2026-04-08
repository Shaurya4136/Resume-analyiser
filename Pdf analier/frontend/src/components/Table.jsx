import * as XLSX from "xlsx";

export default function Table({ data }) {

  const exportExcel = () => {
    const cleanData = data.map(d => ({
      "Full Name": d.fullName,
      "Email": d.email,
      "Mobile": d.mobile?.trim(),
      "Location": d.location,
      "Last Company": d.lastCompany,
      "Skills": d.skills?.join(", "),
    }));

    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resumes");
    XLSX.writeFile(wb, "resumes.xlsx");
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="mt-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
          📄 Parsed Resumes
        </h2>

        <button
          onClick={exportExcel}
          className="px-5 py-2 rounded-lg bg-green-500 hover:bg-green-600 text-white font-medium shadow-md transition"
        >
          📥 Export Excel
        </button>
      </div>

      {/* TABLE CONTAINER */}
      <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">

        <table className="min-w-full text-sm text-left">

          {/* HEADER */}
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
            <tr className="text-gray-700 dark:text-gray-300">
              <th className="px-4 py-3 font-semibold">Full Name</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Mobile</th>
              <th className="px-4 py-3 font-semibold">Location</th>
              <th className="px-4 py-3 font-semibold">Company</th>
              <th className="px-4 py-3 font-semibold">Skills</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="bg-white dark:bg-gray-900">

            {data.map((d, i) => (
              <tr
                key={i}
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >

                {/* NAME */}
                <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">
                  {d.fullName || "N/A"}
                </td>

                {/* EMAIL */}
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {d.email || "N/A"}
                </td>

                {/* MOBILE */}
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {d.mobile?.trim() || "N/A"}
                </td>

                {/* LOCATION */}
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {d.location || "N/A"}
                </td>

                {/* COMPANY */}
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {d.lastCompany || "N/A"}
                </td>

                {/* SKILLS */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {d.skills?.length > 0 ? (
                      d.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs rounded-full bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </div>
                </td>

              </tr>
            ))}

          </tbody>
        </table>
      </div>
    </div>
  );
}