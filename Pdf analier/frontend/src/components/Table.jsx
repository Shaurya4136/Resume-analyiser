import * as XLSX from "xlsx";

export default function Table({ data }) {

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resumes");
    XLSX.writeFile(wb, "resumes.xlsx");
  };

  return (
    <div>
      <button onClick={exportExcel}>Download Excel</button>

      <table border="1">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Location</th>
            <th>Company</th>
          </tr>
        </thead>

        <tbody>
          {data.map((d, i) => (
            <tr key={i}>
              <td>{d.name}</td>
              <td>{d.email}</td>
              <td>{d.phone}</td>
              <td>{d.location}</td>
              <td>{d.company}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}