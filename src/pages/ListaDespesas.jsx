import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ImportarExtratoModal from "../components/ImportarExtratoModal";

export default function ListaDespesas() {
  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");

  const [editando, setEditando] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  const [showImportModal, setShowImportModal] = useState(false);
  const [csvData, setCsvData] = useState([]);

  // -----------------------------
  // FILTRO POR MÊS E ANO
  // -----------------------------
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  const nomeMes = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ][mes - 1];

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

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session?.user) return;

      const { data: trans } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
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

  // -----------------------------
  // FILTRAR DESPESAS POR MÊS/ANO + CATEGORIA + EMPRESA
  // -----------------------------
  const despesasFiltradas = despesas.filter((d) => {
    const dataObj = new Date(d.date);
    const mesTrans = dataObj.getMonth() + 1;
    const anoTrans = dataObj.getFullYear();

    const matchMesAno = mesTrans === Number(mes) && anoTrans === Number(ano);
    const matchCat = filtroCategoria ? d.category_id === filtroCategoria : true;
    const matchEmp = filtroEmpresa ? d.empresa_id === filtroEmpresa : true;

    return matchMesAno && matchCat && matchEmp;
  });

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

  // IMPORTAÇÃO CSV/PDF
  const importarParaSupabase = async (linhasSelecionadas) => {
    const { data: session } = await supabase.auth.getUser();
    if (!session?.user) return;
    const userId = session.user.id;

    for (const linha of linhasSelecionadas) {
      let empresaObj = empresas.find((e) => e.name === linha.empresa);
      if (!empresaObj) {
        const { data: nova } = await supabase
          .from("empresas")
          .insert({ name: linha.empresa, user_id: userId })
          .select()
          .single();
        empresaObj = nova;
        setEmpresas((prev) => [...prev, nova]);
      }

      let categoriaObj = categorias.find((c) => c.name === linha.categoria);
      if (!categoriaObj) {
        const { data: nova } = await supabase
          .from("categories")
          .insert({ name: linha.categoria, user_id: userId })
          .select()
          .single();
        categoriaObj = nova;
        setCategorias((prev) => [...prev, nova]);
      }

      await supabase.from("transactions").insert({
        user_id: userId,
        date: linha.date,
        description: linha.description,
        amount: linha.amount,
        type: "expense",
        empresa_id: empresaObj.id,
        category_id: categoriaObj.id,
      });
    }

    setShowImportModal(false);
    setCsvData([]);
  };

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      {/* TÍTULO + BOTÃO IMPORTAR */}
      <div className="flex justify-between items-center w-full">
        <h1 className="text-2xl font-bold text-[#facc15]">
          Lista de Despesas — {nomeMes} {ano}
        </h1>

        <button
          onClick={() => setShowImportModal(true)}
          className="bg-[#facc15] text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition"
        >
          Importar Extrato
        </button>
      </div>

      {/* FILTROS DE MÊS E ANO */}
      <div className="flex gap-4 bg-[#111] p-4 rounded-xl border border-[#222] w-full max-w-md">

        {/* SELECT MÊS */}
        <select
          className="bg-[#222] p-3 rounded-lg w-full"
          value={mes}
          onChange={(e) => setMes(Number(e.target.value))}
        >
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

        {/* SELECT ANO */}
        <select
          className="bg-[#222] p-3 rounded-lg w-full"
          value={ano}
          onChange={(e) => setAno(Number(e.target.value))}
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const y = new Date().getFullYear() - i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>

      </div>

      {/* FILTROS DE CATEGORIA E EMPRESA */}
      <div className="flex gap-4 bg-[#111] p-4 rounded-xl border border-[#222]">

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

      </div>

      {/* TABELA DESKTOP */}
      <div className="hidden md:block bg-[#111] border border-[#222] p-4 rounded-xl overflow-x-auto">
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="px-2 py-1 text-left">Categoria</th>
              <th className="px-2 py-1 text-left">Empresa</th>
              <th className="px-2 py-1 text-left">Valor (€)</th>
              <th className="px-2 py-1 text-left">Data</th>
              <th className="px-2 py-1 text-left">Ações</th>
            </tr>
          </thead>

          <tbody>
            {despesasFiltradas.map((d) => (
              <tr key={d.id} className="border-b border-[#222] hover:bg-[#1a1a1a]">
                <td className="px-2 py-1">{getCategoriaNome(d.category_id)}</td>
                <td className="px-2 py-1">{getEmpresaNome(d.empresa_id)}</td>
                <td className="px-2 py-1">{Number(d.amount).toFixed(2)}</td>
                <td className="px-2 py-1">{formatarDataCurta(d.date)}</td>

                <td className="px-2 py-1 flex gap-2">
                  <button
                    onClick={() => abrirEdicao(d)}
                    className="px-2 py-1 text-xs bg-blue-500 text-black rounded"
                  >
                    Editar
                  </button>

                  <button
                    onClick={() => apagarDespesa(d.id)}
                    className="px-2 py-1 text-xs bg-red-500 text-black rounded"
                  >
                    Apagar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* LISTA MOBILE */}
      <div className="md:hidden flex flex-col gap-3">
        {despesasFiltradas.map((d) => (
          <div key={d.id} className="p-4 rounded-xl border border-[#333] bg-[#1a1a1a]">
            <div className="font-semibold text-[#facc15]">{getEmpresaNome(d.empresa_id)}</div>
            <div className="text-gray-400 text-sm">{d.description}</div>
            <div className="text-gray-300 text-sm">{getCategoriaNome(d.category_id)}</div>
            <div className="text-green-400 font-bold mt-1">{Number(d.amount).toFixed(2)} €</div>
            <div className="text-gray-300 text-sm">{formatarDataCurta(d.date)}</div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => abrirEdicao(d)}
                className="flex-1 py-1 bg-blue-600 rounded-lg text-white text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => apagarDespesa(d.id)}
                className="flex-1 py-1 bg-red-600 rounded-lg text-white text-sm"
              >
                Apagar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL DE IMPORTAÇÃO */}
      <ImportarExtratoModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        csvData={csvData}
        setCsvData={setCsvData}
        importarParaSupabase={importarParaSupabase}
        categorias={categorias}
        empresas={empresas}
      />

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
