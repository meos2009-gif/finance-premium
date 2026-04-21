import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumTable from "../components/PremiumTable";

export default function Despesas() {
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [transacoes, setTransacoes] = useState([]);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");

  // Buscar categorias
  useEffect(() => {
    async function loadCategorias() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id);

      setCategorias(data || []);
    }
    loadCategorias();
  }, []);

  // Buscar empresas
  useEffect(() => {
    async function loadEmpresas() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("empresas")
        .select("*")
        .eq("user_id", session.user.id);

      setEmpresas(data || []);
    }
    loadEmpresas();
  }, []);

  // Buscar despesas
  useEffect(() => {
    async function loadTransacoes() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("type", "expense");

      setTransacoes(data || []);
    }
    loadTransacoes();
  }, []);

  // Criar empresa se não existir
  async function saveEmpresaIfNeeded(nome, userId) {
    const { data: existing } = await supabase
      .from("empresas")
      .select("*")
      .eq("name", nome)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) return existing.id;

    const { data: inserted } = await supabase
      .from("empresas")
      .insert([{ name: nome, user_id: userId }])
      .select()
      .single();

    return inserted.id;
  }

  // Submeter despesa
  async function handleSubmit(e) {
    e.preventDefault();

    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;

    // Extrair nome da empresa da descrição
    const empresaNome = descricao.split(" ")[0];

    const empresaId = await saveEmpresaIfNeeded(empresaNome, session.user.id);

    await supabase.from("transactions").insert([
      {
        description: descricao,
        amount: Number(valor),
        date: data,
        type: "expense",
        category_id: categoria,
        empresa_id: empresaId,
        user_id: session.user.id,
      },
    ]);

    setDescricao("");
    setValor("");
    setData("");
    setCategoria("");

    // Recarregar lista
    const { data: novas } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("type", "expense");

    setTransacoes(novas || []);
  }

  const colunas = [
    { key: "description", label: "Descrição" },
    { key: "empresa", label: "Empresa" },
    { key: "amount", label: "Valor (€)" },
    { key: "date", label: "Data" },
  ];

  const tabela = transacoes.map((t) => {
    const emp = empresas.find((e) => e.id === t.empresa_id);
    return {
      description: t.description,
      empresa: emp?.name || "—",
      amount: Number(t.amount).toFixed(2),
      date: new Date(t.date).toLocaleDateString("pt-PT"),
    };
  });

  return (
    <div className="text-white flex flex-col gap-10">

      <h1 className="text-2xl font-bold text-[#facc15]">Despesas</h1>

      {/* FORMULÁRIO PREMIUM */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-[#111] p-6 rounded-xl border border-[#222]">

        <input
          type="text"
          placeholder="Descrição"
          className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333]"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Valor"
          className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333]"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />

        <input
          type="date"
          className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333]"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
        />

        <select
          className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333]"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          required
        >
          <option value="">Selecione a categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <button className="bg-[#facc15] text-black font-bold p-3 rounded-lg hover:bg-[#eab308]">
          Guardar Despesa
        </button>
      </form>

      {/* TABELA PREMIUM */}
      <PremiumTable columns={colunas} data={tabela} />
    </div>
  );
}
