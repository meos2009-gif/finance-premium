export default function PremiumTable({ columns, data, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#222] bg-[#111]">
      <table className="w-full text-left text-white">
        <thead className="bg-[#1a1a1a] text-gray-300">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="p-3">{col.label}</th>
            ))}
            <th className="p-3">Ações</th>
          </tr>
        </thead>

        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-t border-[#222] hover:bg-[#1a1a1a]">
              {columns.map((col) => (
                <td key={col.key} className="p-3">
                  {row[col.key]}
                </td>
              ))}

              {/* AÇÕES */}
              <td className="p-3 flex gap-4">
                <button
                  className="text-yellow-400 hover:text-yellow-300 text-xl"
                  onClick={() => onEdit(row)}
                >
                  ✏️
                </button>

                <button
                  className="text-red-500 hover:text-red-400 text-xl"
                  onClick={() => onDelete(row.id)}
                >
                  🗑️
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
