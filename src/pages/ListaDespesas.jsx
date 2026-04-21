import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumTable from "../components/PremiumTable";

export default function ListaDespesas() {
  const [despesas, setDespesas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

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
        .eq("type", "expense");

      setDespesas(trans || []);
    }
    load();
  }, []);

  const despesasFiltradas = despesas.filter((d) => {
    const data = new Date(d.date);
    return data.getMonth() + 1 === Number(mes) && data.getFullYear() === Number(ano);
  });

  const apagarDespesa = async (id) => {
    await supabase.from("transactions").delete().eq("id", id);
    setDespesas((prev) => prev.filter((d) => d.id !== id));
  };

  const colunas = [
    { key: "descricao", label: "Descrição" },
    { key: "valor", label: "Valor (€)" },
    { key: "categoria", label: "Categoria" },
    { key: "empresa", label: "Empresa" },
    { key: "data", label: "Data" },
    { key: "acoes", label: "Ações" },
  ];

  const dadosTabela = despesasFiltradas.map((d) => {
    const cat = categorias.find((c) => c.id === d.category_id);
    const emp = empresas.find((e) => e.id === d.empresa_id);

    return {
      descricao: d.description,
      valor: Number(d.amount).toFixed(2),
      categoria: cat?.name || "—",
      empresa: emp?.name || "—",
      data: new Date(d.date).toLocaleDateString("pt-PT"),
      acoes: (
        <button
          onClick={() => apagarDespesa(d.id)}
          className="text-red-400 hover:text-red-300"
        >
          Apagar
        </button>
      ),
    };
  });

  return (
    <div className="text-white flex flex-col gap-10">
      <h1 className="text-2xl font-bold text-[#facc15]">Lista de Despesas</h1>

      {/* FILTROS */}
      <div className="flex gap-4">
        <select
          value={mes}
          onChange={(e) => setMes(e.target.value)}
          className="p-3 rounded-lg bg-[#111] border border-[#333] text-white"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {m.toString().padStart(2, "0")}
            </option>
          ))}
        </select>

        <select
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          className="p-3 rounded-lg bg-[#111] border border-[#333] text-white"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {/* TABELA */}
      <PremiumTable columns={colunas} data={dadosTabela} />
    </div>
  );
}
