import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumTable from "../components/PremiumTable";
import Chart from "react-apexcharts";

export default function RelatorioMensal() {
  const [categorias, setCategorias] = useState([]);
  const [transacoes, setTransacoes] = useState([]);

  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  const [stats, setStats] = useState([]);
  const [totais, setTotais] = useState({
    totalMensal: 0,
    totalAnual: 0,
  });

  // Buscar categorias
  useEffect(() => {
    async function fetchCategorias() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id);

      setCategorias(data || []);
    }
    fetchCategorias();
  }, []);

  // Buscar transações
  useEffect(() => {
    async function fetchTransacoes() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id);

      setTransacoes(data || []);
    }
    fetchTransacoes();
  }, []);

  // Calcular estatísticas
  useEffect(() => {
    if (categorias.length === 0 || transacoes.length === 0) return;

    const monthExpenses = transacoes.filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getMonth() + 1 === Number(mes) && d.getFullYear() === Number(ano);
    });

    const yearExpenses = transacoes.filter((t) => {
      const d = new Date(t.date);
      return t.type === "expense" && d.getFullYear() === Number(ano);
    });

    const totalMensal = monthExpenses.reduce((acc, t) => acc + Number(t.amount), 0);
    const totalAnual = yearExpenses.reduce((acc, t) => acc + Number(t.amount), 0);

    const monthTotals = {};
    const yearTotals = {};

    monthExpenses.forEach((t) => {
      if (!monthTotals[t.category_id]) monthTotals[t.category_id] = 0;
      monthTotals[t.category_id] += Number(t.amount);
    });

    yearExpenses.forEach((t) => {
      if (!yearTotals[t.category_id]) yearTotals[t.category_id] = 0;
      yearTotals[t.category_id] += Number(t.amount);
    });

    const statsCalc = categorias.map((cat) => ({
      category: cat.name,
      month: monthTotals[cat.id] || 0,
      percentMonth:
        totalMensal > 0
          ? ((monthTotals[cat.id] || 0) / totalMensal * 100).toFixed(1) + "%"
          : "0%",
      year: yearTotals[cat.id] || 0,
      percentYear:
        totalAnual > 0
          ? ((yearTotals[cat.id] || 0) / totalAnual * 100).toFixed(1) + "%"
          : "0%",
    }));

    setStats(statsCalc);
    setTotais({ totalMensal, totalAnual });
  }, [categorias, transacoes, mes, ano]);

  const chartData = {
    series: stats.map((s) => s.month),
    options: {
      labels: stats.map((s) => s.category),
      theme: { mode: "dark" },
      legend: { position: "bottom" },
      colors: ["#facc15", "#38bdf8", "#f87171", "#34d399", "#a78bfa", "#fb923c"],
    },
  };

  const colunas = [
    { key: "category", label: "Categoria" },
    { key: "month", label: "Mensal (€)" },
    { key: "percentMonth", label: "% Mensal" },
    { key: "year", label: "Acumulado (€)" },
    { key: "percentYear", label: "% Ano" },
  ];

  return (
    <div className="text-white flex flex-col gap-10">

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-[#facc15]">Relatório Mensal</h1>

      {/* FILTROS */}
      <div className="flex gap-4">
        <select
          className="bg-[#1a1a1a] border border-[#333] p-3 rounded-lg"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>

        <select
          className="bg-[#1a1a1a] border border-[#333] p-3 rounded-lg"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <option key={i} value={2022 + i}>
              {2022 + i}
            </option>
          ))}
        </select>
      </div>

      {/* CARDS PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Total Mensal</h2>
          <p className="text-3xl font-bold text-[#facc15]">
            {totais.totalMensal.toFixed(2)} €
          </p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Total Anual</h2>
          <p className="text-3xl font-bold text-[#facc15]">
            {totais.totalAnual.toFixed(2)} €
          </p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">% do Ano</h2>
          <p className="text-3xl font-bold text-[#facc15]">
            {totais.totalAnual > 0
              ? ((totais.totalMensal / totais.totalAnual) * 100).toFixed(1) + "%"
              : "0%"}
          </p>
        </div>
      </div>

      {/* GRÁFICO DONUT */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <Chart options={chartData.options} series={chartData.series} type="donut" />
      </div>

      {/* TABELA PREMIUM */}
      <PremiumTable columns={colunas} data={stats} />
    </div>
  );
}
