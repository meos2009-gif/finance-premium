import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumTable from "../components/PremiumTable";

export default function Dashboard() {
  const [transacoes, setTransacoes] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

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

      setTransacoes(trans || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (transacoes.length === 0 || empresas.length === 0) return;

    const totais = {};

    transacoes.forEach((t) => {
      if (!totais[t.empresa_id]) totais[t.empresa_id] = 0;
      totais[t.empresa_id] += Number(t.amount);
    });

    const totalMes = Object.values(totais).reduce((a, b) => a + b, 0);

    const rankingCalc = Object.entries(totais)
      .map(([id, total]) => {
        const emp = empresas.find((e) => e.id === Number(id));
        return {
          empresa: emp?.name || "—",
          total: total.toFixed(2),
          percent: totalMes > 0 ? ((total / totalMes) * 100).toFixed(1) + "%" : "0%",
        };
      })
      .sort((a, b) => b.total - a.total);

    setRanking(rankingCalc);
  }, [transacoes, empresas]);

  const colunas = [
    { key: "empresa", label: "Empresa" },
    { key: "total", label: "Total (€)" },
    { key: "percent", label: "% do Mês" },
  ];

  return (
    <div className="text-white flex flex-col gap-10">

      <h1 className="text-2xl font-bold text-[#facc15]">Dashboard</h1>

      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Gastos por Empresa</h2>
        <PremiumTable columns={colunas} data={ranking} />
      </div>

    </div>
  );
}
