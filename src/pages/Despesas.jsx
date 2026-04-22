import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";

export default function Despesas() {
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [despesas, setDespesas] = useState([]);

  // FORMULÁRIO
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  // MODAL DE EDIÇÃO
  const [editando, setEditando] = useState(null);

  // -------------------------------------
  // CARREGAR CATEGORIAS, EMPRESAS E DESPESAS
  // -------------------------------------
  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

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

      const { data: trans } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("type", "expense")
        .order("date", { ascending: false });

      setDespesas(trans || []);
    }
    load();
  }, []);

  // -------------------------------------
  // CRIAR EMPRESA AUTOMATICAMENTE
  // -------------------------------------
  async function obterEmpresaId(nomeEmpresa, session) {
    if (!nomeEmpresa.trim()) return null;

    const existente = empresas.find(
      (e) => e.name.toLowerCase() === nomeEmpresa.toLowerCase()
    );

    if (existente) return existente.id;

    const { data: nova } = await supabase
      .from("empresas")
      .insert([{ name: nomeEmpresa, user_id: session.user.id }])
      .select();

    setEmpresas((prev) => [...prev, nova[0]]);
    return nova[0].id;
  }

  // -------------------------------------
  // ADICIONAR DESPESA
  // -------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;

    const empresaId = await obterEmpresaId(empresa, session);

    const { data: nova } = await supabase
      .from("transactions")
      .insert({
        description: descricao,
        amount: valor,
        date: data,
        type: "expense",
        category_id: categoria,
        empresa_id: empresaId,
        user_id: session.user.id,
      })
      .select();

    if (nova && nova.length > 0) {
      setDespesas((prev) => [nova[0], ...prev]);
    }

    setDescricao("");
    setValor("");
    setData("");
    setCategoria("");
    setEmpresa("");
  }

  // -------------------------------------
  // APAGAR DESPESA
  // -------------------------------------
  async function apagarDespesa(id) {
    await supabase.from("transactions").delete().eq("id", id);
    setDespesas((prev) => prev.filter((d) => d.id !== id));
  }

  // -------------------------------------
  // ABRIR MODAL DE EDIÇÃO
  // -------------------------------------
  function abrirEdicao(d) {
    setEditando(d);
    setDescricao(d.description);
    setValor(d.amount);
    setData(d.date);
    setCategoria(d.category_id);
    setEmpresa(
      empresas.find((e) => e.id === d.empresa_id)?.name || ""
    );
  }

  // -------------------------------------
  // GUARDAR EDIÇÃO
  // -------------------------------------
  async function guardarEdicao(e) {
    e.preventDefault();

    const { data: session } = await supabase.auth.getUser();
    const empresaId = await obterEmpresaId(empresa, session);

    await supabase
      .from("transactions")
      .update({
        description: descricao,
        amount: valor,
        date: data,
        category_id: categoria,
        empresa_id: empresaId,
      })
      .eq("id", editando.id);

    setDespesas((prev) =>
      prev.map((d) =>
        d.id === editando.id
          ? {
              ...d,
              description: descricao,
              amount: valor,
              date: data,
              category_id: categoria,
              empresa_id: empresaId,
            }
          : d
      )
    );

    setEditando(null);
  }

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Despesas
      </h1>

      {/* FORMULÁRIO PREMIUM */}
      <PremiumForm title="Adicionar Despesa" onSubmit={handleSubmit}>

        <PremiumInput
          label="Descrição"
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />

        <PremiumInput
          label="Valor (€)"
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />

        <PremiumInput
          label="Data"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
        />

        {/* CATEGORIA */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Categoria</label>
          <select
            className="bg-[#222] p-3 rounded-lg"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            required
          >
            <option value="">Selecione</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* EMPRESA — AUTOCOMPLETE + CRIAÇÃO AUTOMÁTICA */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Empresa</label>

          <input
            list="lista-empresas"
            className="bg-[#222] p-3 rounded-lg"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            placeholder="Escreve ou escolhe uma empresa"
          />

          <datalist id="lista-empresas">
            {empresas.map((e) => (
              <option key={e.id} value={e.name} />
            ))}
          </datalist>
        </div>

      </PremiumForm>

      {/* LISTA PREMIUM */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl overflow-x-auto">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Lista de Despesas</h2>

        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-[#333]">
              <th className="py-2">Descrição</th>
              <th className="py-2">Valor (€)</th>
              <th className="py-2">Data</th>
              <th className="py-2">Empresa</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {despesas.map((d) => (
              <tr key={d.id} className="border-b border-[#222]">
                <td className="py-2">{d.description}</td>
                <td className="py-2">{Number(d.amount).toFixed(2)}</td>
                <td className="py-2">{d.date}</td>
                <td className="py-2">
                  {empresas.find((e) => e.id === d.empresa_id)?.name || "—"}
                </td>
                <td className="py-2 flex gap-3">
                  <button
                    onClick={() => abrirEdicao(d)}
                    className="px-3 py-1 bg-blue-600 rounded-lg text-white"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => apagarDespesa(d.id)}
                    className="px-3 py-1 bg-red-600 rounded-lg text-white"
                  >
                    Apagar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editando && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#111] p-6 rounded-xl border border-[#222] w-full max-w-lg">

            <h2 className="text-xl font-bold text-[#facc15] mb-4">Editar Despesa</h2>

            <form onSubmit={guardarEdicao} className="flex flex-col gap-4">

              <PremiumInput
                label="Descrição"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />

              <PremiumInput
                label="Valor (€)"
                type="number"
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />

              <PremiumInput
                label="Data"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
              />

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-300">Categoria</label>
                <select
                  className="bg-[#222] p-3 rounded-lg"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                >
                  <option value="">Selecione</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm text-gray-300">Empresa</label>
                <input
                  list="lista-empresas"
                  className="bg-[#222] p-3 rounded-lg"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                />
              </div>

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
