import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ListaDespesas() {
  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [editando, setEditando] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

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

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Lista de Despesas
      </h1>

      <div className="bg-[#111] border border-[#222] p-6 rounded-xl overflow-x-auto">

        <table className="w-full table-auto border-separate border-spacing-y-2">
          <thead>
            <tr className="text-gray-400">
              <th className="w-[50%] py-2">Descrição</th>
              <th className="w-[15%] py-2 text-right">Valor (€)</th>
              <th className="w-[20%] py-2">Data</th>
              <th className="w-[15%] py-2 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
  {despesas.map((d, index) => (
    <tr
      key={d.id}
      className={`
        border border-[#333] rounded-lg
        ${index % 2 === 0 ? "bg-[#1a1a1a]" : "bg-[#151515]"}
        hover:bg-[#222] transition
        text-sm md:text-base
      `}
    >
      <td className="px-3 py-1.5 rounded-l-lg">{d.description}</td>

      <td className="px-3 py-1.5 text-right font-semibold text-green-400">
        {Number(d.amount).toFixed(2)}
      </td>

      <td className="px-3 py-1.5 text-sm md:text-base">
        {d.date}
      </td>

      <td className="px-3 py-1.5 rounded-r-lg text-center">
        <div className="inline-flex gap-2 md:gap-3">
          <button
            onClick={() => abrirEdicao(d)}
            className="px-2 py-1 md:px-3 md:py-1 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs md:text-sm"
          >
            Editar
          </button>

          <button
            onClick={() => apagarDespesa(d.id)}
            className="px-2 py-1 md:px-3 md:py-1 bg-red-600 hover:bg-red-700 rounded-lg text-white text-xs md:text-sm"
          >
            Apagar
          </button>
        </div>
      </td>
    </tr>
  ))}
</tbody>
        </table>

      </div>

      {editando && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
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
