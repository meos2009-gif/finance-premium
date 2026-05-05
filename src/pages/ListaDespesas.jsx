import { useState, useEffect } from "react";
import { categoryIcons } from "../utils/categoryIcons";

export default function ListaDespesas({
  despesas,
  categorias,
  empresas,
  apagarDespesa,
  abrirEdicao,
}) {
  const [despesasFiltradas, setDespesasFiltradas] = useState([]);

  useEffect(() => {
    setDespesasFiltradas(despesas);
  }, [despesas]);

  const getCategoriaNome = (id) => {
    const cat = categorias.find((c) => c.id === id);
    return cat ? cat.nome : "Sem categoria";
  };

  const getEmpresaNome = (id) => {
    const emp = empresas.find((e) => e.id === id);
    return emp ? emp.nome : "Sem empresa";
  };

  const getIcon = (categoriaNome) => {
    return categoryIcons[categoriaNome] || "📌";
  };

  const formatarDataCurta = (data) => {
    const d = new Date(data);
    return d.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div className="w-full flex flex-col gap-4">

      {/* ================================
          📱 LISTA MOBILE PREMIUM COM SWIPE
      ================================= */}
      <div className="md:hidden flex flex-col gap-3">
        {despesasFiltradas.map((d) => {
          const categoriaNome = getCategoriaNome(d.category_id);
          const empresaNome = getEmpresaNome(d.empresa_id);
          const icon = getIcon(categoriaNome);

          return (
            <div
              key={d.id}
              className="swipe-container border border-[#222] bg-[#151515] rounded-xl"
            >
              {/* AÇÕES */}
              <div className="swipe-actions">
                <button
                  onClick={() => abrirEdicao(d)}
                  className="swipe-btn-edit"
                >
                  Editar
                </button>
                <button
                  onClick={() => apagarDespesa(d.id)}
                  className="swipe-btn-delete"
                >
                  Apagar
                </button>
              </div>

              {/* CONTEÚDO */}
              <div
                className="swipe-content p-3 flex justify-between items-center"
                onTouchStart={(e) => (d.touchStart = e.touches[0].clientX)}
                onTouchMove={(e) => {
                  const diff = d.touchStart - e.touches[0].clientX;
                  if (diff > 0 && diff < 120) {
                    e.currentTarget.style.transform = `translateX(-${diff}px)`;
                  }
                }}
                onTouchEnd={(e) => {
                  const diff = d.touchStart - e.changedTouches[0].clientX;
                  if (diff > 60) {
                    e.currentTarget.style.transform = "translateX(-120px)";
                  } else {
                    e.currentTarget.style.transform = "translateX(0px)";
                  }
                }}
              >
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{icon}</span>
                    <span className="font-semibold text-white">{empresaNome}</span>
                  </div>

                  <span className="text-gray-400 text-xs">
                    {categoriaNome} • {formatarDataCurta(d.date)}
                  </span>

                  <span className="text-gray-300 text-xs">{d.description}</span>
                </div>

                <div className="text-right">
                  <span
                    className={`font-bold text-sm ${
                      d.amount < 0 ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {Number(d.amount).toFixed(2)} €
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================
          💻 QUADRO PREMIUM INDUSTRIAL (DESKTOP)
      ================================= */}
      <div className="hidden md:block bg-[#111] border border-[#222] p-4 rounded-xl overflow-x-auto">
        <table className="w-full text-white text-sm">
          <thead className="bg-[#1a1a1a] border-b-2 border-[#333]">
            <tr>
              <th className="px-3 py-3 text-left"> </th>
              <th className="px-3 py-3 text-left">Categoria</th>
              <th className="px-3 py-3 text-left">Empresa</th>
              <th className="px-3 py-3 text-left">Descrição</th>
              <th className="px-3 py-3 text-right">Valor</th>
              <th className="px-3 py-3 text-left">Data</th>
              <th className="px-3 py-3 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {despesasFiltradas.map((d) => {
              const categoriaNome = getCategoriaNome(d.category_id);
              const empresaNome = getEmpresaNome(d.empresa_id);
              const icon = getIcon(categoriaNome);

              return (
                <tr
                  key={d.id}
                  className="border-b border-[#333] hover:bg-[#1a1a1a] transition"
                >
                  <td className="px-3 py-3 text-xl">{icon}</td>
                  <td className="px-3 py-3">{categoriaNome}</td>
                  <td className="px-3 py-3">{empresaNome}</td>
                  <td className="px-3 py-3 text-gray-300">{d.description}</td>

                  <td
                    className={`px-3 py-3 text-right font-bold ${
                      d.amount < 0 ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {Number(d.amount).toFixed(2)} €
                  </td>

                  <td className="px-3 py-3">{formatarDataCurta(d.date)}</td>

                  <td className="px-3 py-3 text-center flex gap-2 justify-center">
                    <button
                      onClick={() => abrirEdicao(d)}
                      className="px-3 py-1 bg-blue-600 rounded-lg text-white text-xs"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => apagarDespesa(d.id)}
                      className="px-3 py-1 bg-red-600 rounded-lg text-white text-xs"
                    >
                      Apagar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
