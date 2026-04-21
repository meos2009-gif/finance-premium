import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumTable from "../components/PremiumTable";
import Chart from "react-apexcharts";

export default function RelatorioCategorias() {
  const [categorias, setCategorias] = useState([]);
  const [transacoes, setTransacoes] = useState([]);

  const [ano, setAno] = useState(new Date().getFullYear());
  const [categoriaSelecionada, setCategoriaSelecionada] = useState(null);

  const [stats, setStats] = useState([]);
  const [linhaMensal, setLinhaMensal] = useState([]);

  const [cards, setCards] = useState({
    maisCara: null,
    maiorCrescimento: null,
    maisEstavel: null,
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
      if (data && data.length > 0) setCategoriaSelecionada(data[0].id);
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
        .eq("user_id", session.user.id)
        .eq("type", "expense");

      setTransacoes(data || []);
    }
    fetchTransacoes();
  }, []);

  // Calcular estatísticas
  useEffect(() => {
    if (categorias.length === 0 || transacoes.length === 0) return;

    const yearExpenses = transacoes.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === Number(ano);
    });

    const totalAnual = yearExpenses.reduce((acc, t) => acc + Number(t.amount), 0);

    const totalsByCategory = {};
    const monthlyByCategory = {};

    categorias.forEach((c) => {
      totalsByCategory[c.id] = 0;
      monthlyByCategory[c.id] = Array(12).fill(0);
    });

    yearExpenses.forEach((t) => {
      const d = new Date(t.date);
      const month = d.getMonth();
      totalsByCategory[t.category_id] += Number(t.amount);
      monthlyByCategory[t.category_id][month] += Number(t.amount);
    });

    const statsCalc = categorias.map((cat) => {
      const total = totalsByCategory[cat.id];
      const meses = monthlyByCategory[cat.id];

      const media = total / 12;
      const pico = Math.max(...meses);
      const minimo = Math.min(...meses.filter((v) => v > 0)) || 0;

      const variacao =
        meses[11] > 0 && meses[10] > 0
          ? ((meses[11] - meses[10]) / meses[10]) * 100
          : 0;

      return {
        category: cat.name,
        total,
        media: media.toFixed(2),
        pico,
        minimo,
        percentAno:
          totalAnual > 0 ? ((total / totalAnual) * 100).toFixed(1) + "%" : "0%",
        variacao: variacao.toFixed(1) + "%",
        id: cat.id,
      };
    });

    setStats(statsCalc);

    // Cards premium
    const maisCara = statsCalc.reduce((a, b) => (a.total > b.total ? a : b));
    const maiorCrescimento = statsCalc.reduce((a, b) =>
      parseFloat(a.variacao) > parseFloat(b.variacao) ? a : b
    );
    const maisEstavel = statsCalc.reduce((a, b) =>
      Math.abs(parseFloat(a.variacao)) < Math.abs(parseFloat(b.variacao))
        ? a
        : b
    );

    setCards({
      maisCara,
      maiorCrescimento,
      maisEstavel,
      totalAnual,
    });

    // Linha mensal da categoria selecionada
    if (categoriaSelecionada) {
      setLinhaMensal(monthlyByCategory[categoriaSelecionada]);
    }
  }, [categorias, transacoes, ano, categoriaSelecionada]);

  const colunas = [
    { key: "category", label: "Categoria" },
    { key: "total", label: "Total (€)" },
    { key: "media", label: "Média Mensal (€)" },
    { key: "pico", label: "Mês Mais Caro (€)" },
    { key: "minimo", label: "Mês Mais Barato (€)" },
    { key: "percentAno", label: "% do Ano" },
    { key: "variacao", label: "Variação (%)" },
  ];

  return (
    <div className="text-white flex flex-col gap-10">

      <h1 className="text-2xl font-bold text-[#facc15]">Relatório por Categorias</h1>

      {/* FILTRO DE ANO */}
      <select
        className="bg-[#1a1a1a] border border-[#333] p-3 rounded-lg w-40"
        value={ano}
        onChange={(e) => setAno(e.target.value)}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <option key={i} value={2022 + i}>
            {2022 + i}
          </option>
        ))}
      </select>

      {/* CARDS PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Categoria Mais Cara</h2>
          <p className="text-xl font-bold text-[#facc15]">
            {cards.maisCara?.category} — {cards.maisCara?.total.toFixed(2)} €
          </p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Maior Crescimento</h2>
          <p className="text-xl font-bold text-[#facc15]">
            {cards.maiorCrescimento?.category} — {cards.maiorCrescimento?.variacao}
          </p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Mais Estável</h2>
          <p className="text-xl font-bold text-[#facc15]">
            {cards.maisEstavel?.category}
          </p>
        </div>
      </div>

      {/* GRÁFICO DE BARRAS */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <Chart
          type="bar"
          series={[{ data: stats.map((s) => s.total) }]}
          options={{
            theme: { mode: "dark" },
            xaxis: { categories: stats.map((s) => s.category) },
            colors: ["#facc15"],
          }}
        />
      </div>

      {/* GRÁFICO DE LINHA */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-lg mb-4">Evolução Mensal</h2>

        <select
          className="bg-[#1a1a1a] border border-[#333] p-3 rounded-lg mb-4"
          value={categoriaSelecionada}
          onChange={(e) => setCategoriaSelecionada(e.target.value)}
        >
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <Chart
          type="line"
          series={[{ name: "Gastos", data: linhaMensal }]}
          options={{
            theme: { mode: "dark" },
            xaxis: {
              categories: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
            },
            colors: ["#38bdf8"],
          }}
        />
      </div>

      {/* TABELA PREMIUM */}
      <PremiumTable columns={colunas} data={stats} />

    </div>
  );
}
