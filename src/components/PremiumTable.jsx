export default function PremiumTable({ columns = [], data = [] }) {
  return (
    <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#222] shadow-lg overflow-x-auto">
      <table className="w-full text-left text-white">
        
        {/* CABEÇALHO */}
        <thead>
          <tr className="border-b border-[#333]">
            {columns.map((col) => (
              <th
                key={col.key}
                className="py-3 px-4 text-sm font-semibold text-gray-300"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* LINHAS */}
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className="border-b border-[#222] hover:bg-[#222] transition"
            >
              {columns.map((col) => (
                <td key={col.key} className="py-3 px-4 text-gray-200">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}
