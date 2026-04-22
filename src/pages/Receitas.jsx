import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";

export default function Receitas() {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");

  const [receitas, setReceitas] = useState([]);

  // -----------------------------
  // CARREGAR RECEITAS
  // -----------------------------
  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("type", "income")
        .order("date", { ascending: false });

      setReceitas(data || []);
    }
    load();
  }, []);

  // -----------------------------
  // ADICIONAR RECEITA
  // -----------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;

    const { data: nova } = await supabase.from("transactions").insert({
      description: descricao,
      amount: valor,
      date: data,
      type: "income",
      user_id: session.user.id,
    }).select();

    // Atualizar lista local
    if (nova && nova.length > 0) {
      setReceitas((prev) => [nova[0], ...prev]);
    }

    setDescricao("");
    setValor("");
    setData("");
  }

  // -----------------------------
  // APAGAR RECEITA
  // -----------------------------
  async function apagarReceita(id) {
    await supabase.from("transactions").delete().eq("id", id);
    setReceitas((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Receitas
      </h1>

      {/* FORMULÁRIO PREMIUM */}
      <PremiumForm title="Adicionar Receita" onSubmit={handleSubmit}>
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
      </PremiumForm>

      {/* LISTA PREMIUM */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl overflow-x-auto">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Lista de Receitas</h2>

        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-[#333]">
              <th className="py-2">Descrição</th>
              <th className="py-2">Valor (€)</th>
              <th className="py-2">Data</th>
              <th className="py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {receitas.map((r) => (
              <tr key={r.id} className="border-b border-[#222]">
                <td className="py-2">{r.description}</td>
                <td className="py-2">{Number(r.amount).toFixed(2)}</td>
                <td className="py-2">{r.date}</td>
                <td className="py-2">
                  <button
                    onClick={() => apagarReceita(r.id)}
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

    </div>
  );
}
