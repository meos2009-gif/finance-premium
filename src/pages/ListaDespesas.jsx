import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { categoryIcons } from "../utils/categoryIcons";

export default function ListaDespesas() {
  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");

  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  const [editando, setEditando] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  function formatarDataCurta(dataISO) {
    if (!dataISO) return "";
    const d = new Date(dataISO);
    return d.toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
    });
  }

  function getEmpresaNome(id) {
    const emp = empresas.find((e) => e.id === id);
    return emp ? emp.name : "—";
  }

  function getCategoriaNome(id) {
    const cat = categorias.find((c) => c.id === id);
    return cat ? cat.name : "—";
  }

  function getIcon(nome) {
    return categoryIcons[nome] || "📌";
  }

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session?.user) return;

      const { data: trans } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("type", "expense")
        .order("date", { ascending: false });

      setDespesas(trans || []);

      const { data: cat } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id);

      setCategorias(cat || []);

      const { data: emp } = await supabase
        .from("empresas")
        .select("*")
        .eq("user_id", session.user.id);

      setEmpresas(emp || []);
    }
    load();
  }, []);

  async function apagarDespesa(id) {
    await supabase.from("transactions").delete().eq("id", id);
    setDespesas((prev) => prev.filter((d) => d.id !== id));
  }

  function abrirEdicao(d) {
    setEditando(d.id);
    setDescricao(d.description);
    setValor(d.amount);
    setData(d.date);
    setCategoria(d.category_id);
    setEmpresa(d.empresa_id);
  }

  async function guardarEdicao(e) {
    e.preventDefault();

    await supabase
      .from("transactions")
      .update({
        description: descricao,
        amount: valor,
        date: data,
        category_id: categoria,
        empresa_id: empresa,
      })
      .eq("id", editando);

    setDespesas((prev) =>
      prev.map((d) =>
        d.id === editando
          ? {
              ...d,
              description: descricao,
              amount: valor,
              date: data,
              category_id: categoria,
              empresa_id: empresa,
            }
          : d
      )
    );

    setEditando(null);
  }

  const despesasFiltradas = despesas.filter((d) => {
    const dataObj = new Date(d.date);

    const matchCat = filtroCategoria ? d.category_id === filtroCategoria : true;
    const matchEmp = filtroEmpresa ? d.empresa_id === filtroEmpresa : true;

    const matchMonth = selectedMonth
      ? dataObj.getMonth() + 1 === Number(selectedMonth)
      : true;

    const matchYear = selectedYear
      ? dataObj.getFullYear() === Number(selectedYear)
      : true;

    return matchCat && matchEmp && matchMonth && matchYear;
  });

  const totaisPorCategoria = Object.entries(
    despesasFiltradas.reduce((acc, d) => {
      const nome = getCategoriaNome(d.category_id);
      acc[nome] = (acc[nome] || 0) + Number(d.amount);
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      {/* TÍTULO */}
      <div className="flex justify-between items-center w-full">
        <h1 className="text-2xl font-bold text-[#facc15]">
          Lista de Despesas
        </h1>
      </div>

      {/* FILTROS */}
      <div className="flex flex-wrap gap-4 bg-[#111] p-4 rounded-xl border border-[#222]">

        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="bg-[#222] p-3 rounded-lg"
        >
          <option value="">Todas as Categorias</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={filtroEmpresa}
          onChange={(e) => setFiltroEmpresa(e.target.value)}
          className="bg-[#222] p-3 rounded-lg"
        >
          <option value="">Todas as Empresas</option>
          {empresas.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="bg-[#222] p-3 rounded-lg"
        >
          <option value="">Mês</option>
          <option value="1">Janeiro</option>
          <option value="2">Fevereiro</option>
          <option value="3">Março</option>
          <option value="4">Abril</option>
          <option value="5">Maio</option>
          <option value="6">Junho</option>
          <option value="7">Julho</option>
          <option value="8">Agosto</option>
          <option value="9">Setembro</option>
          <option value="10">Outubro</option>
          <option value="11">Novembro</option>
          <option value="12">Dezembro</option>
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="bg-[#222] p-3 rounded-lg"
        >
          <option value="">Ano</option>
          <option value="2024">2024</option>
          <option value="2025">2025</option>
          <option value="2026">2026</option>
        </select>

      </div>

      {/* TOTAIS POR CATEGORIA */}
      <div className="bg-[#111] border border-[#222] p-4 rounded-xl">
        <h2 className="text-lg font-bold text-[#facc15] mb-3">Totais por Categoria</h2>
        {totaisPorCategoria.map(([nome, total]) => (
          <div key={nome} className="flex justify-between py-1 border-b border-[#222]">
            <span>{nome}</span>
            <span className="font-bold text-green-400">{total.toFixed(2)} €</span>
          </div>
        ))}
      </div>

      {/* TABELA (DESKTOP + MOBILE) */}
      <div className="bg-[#111] border border-[#222] p-4 rounded-xl overflow-x-auto">
        <table className="w-full text-white text-sm min-w-[650px]">
          <thead className="bg-[#1a1a1a] border-b-2 border-[#333]">
            <tr>
              <th className="px-2 py-3"></th>
              <th className="px-2 py-3 text-left">Categoria</th>
              <th className="px-2 py-3 text-left">Empresa</th>
              <th className="px-2 py-3 text-left">Descrição</th>
              <th className="px-2 py-3 text-right">Valor</th>
              <th className="px-2 py-3 text-left">Data</th>
              <th className="px-2 py-3 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {despesasFiltradas.map((d) => {
              const categoriaNome = getCategoriaNome(d.category_id);
              const empresaNome = getEmpresaNome(d.empresa_id);
              const icon = getIcon(categoriaNome);

              return (
                <tr key={d.id} className="border-b border-[#333] hover:bg-[#1a1a1a] transition">
                  <td className="px-2 py-3 text-xl">{icon}</td>
                  <td className="px-2 py-3">{categoriaNome}</td>
                  <td className="px-2 py-3">{empresaNome}</td>
                  <td className="px-2 py-3 text-gray-300">{d.description}</td>
                  <td className="px-2 py-3 text-right font-bold text-green-400">
                    {Number(d.amount || 0).toFixed(2)} €
                  </td>
                  <td className="px-2 py-3">{formatarDataCurta(d.date)}</td>

                  <td className="px-2 py-3 text-center flex gap-2 justify-center">
                    <button
                      onClick={() => abrirEdicao(d)}
                      className="px-2 py-1 bg-blue-600 rounded-lg text-white text-xs"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => apagarDespesa(d.id)}
                      className="px-2 py-1 bg-red-600 rounded-lg text-white text-xs"
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

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-[#111] p-6 rounded-xl border border-[#222] w-full max-w-lg">
            <h2 className="text-xl font-bold text-[#facc15] mb-4">Editar Despesa</h2>

            <form onSubmit={guardarEdicao} className="flex flex-col gap-4">
              <input
                className="bg-[#222] p-3 rounded-lg"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descrição"
              />

              <input
                className="bg-[#222] p-3 rounded-lg"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="Valor"
              />

              <input
                className="bg-[#222] p-3 rounded-lg"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />

              <select
                className="bg-[#222] p-3 rounded-lg"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
              >
                <option value="">Categoria</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                className="bg-[#222] p-3 rounded-lg"
                value={empresa}
                onChange={(e) => setEmpresa(e.target.value)}
              >
                <option value="">Empresa</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.name}</option>
                ))}
              </select>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setEditando(null)}
                  className="px-4 py-2 bg-gray-600 rounded-lg"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 rounded-lg"
                >
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
