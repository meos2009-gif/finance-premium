import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Chart from "react-apexcharts";

export default function RelatorioCategorias() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data: trans } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id);

      setTransacoes(trans || []);

      const { data: cat } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id);

      setCategorias(cat || []);
    }
    load();
  }, []);

  // -----------------------------
  // AGRUPAR DESPESAS POR CATEGORIA
  // -----------------------------
  const despesas = transacoes.filter((t) => t.type === "expense");

  const totaisPorCategoria = {};

  despesas.forEach((t) => {
    if (!totaisPorCategoria[t.category_id]) totaisPorCategoria[t.category_id] = 0;
    totaisPorCategoria[t.category_id] += Number(t.amount);
  });

  const totalDespesas = Object.values(totaisPorCategoria).reduce((acc, v) => acc + v, 0);

  // -----------------------------
  // TABELA ORDENADA (MAIOR → MENOR)
  // -----------------------------
  const tabelaCategorias = Object.entries(totaisPorCategoria)
    .map(([id, valor]) => {
      const cat = categorias.find((c) => c.id === id);
      return {
        categoria: cat ? cat.name : "Categoria",
        valor: Number(valor), // <-- valor limpo
        percent: totalDespesas > 0 ? ((valor / totalDespesas) * 100).toFixed(1) + "%" : "0%",
      };
    })
    .sort((a, b) => b.valor - a.valor); // <-- ORDENAR DO MAIOR PARA O MENOR

  // Labels e valores já ordenados
  const categoriasLabels = tabelaCategorias.map((c) => c.categoria);
  const categoriasValores = tabelaCategorias.map((c) => Number(c.valor.toFixed(2)));

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Relatório por Categoria
      </h1>

      {/* CARDS PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Total de Despesas</h2>
          <p className="text-3xl font-bold text-red-400">{totalDespesas.toFixed(2)} €</p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Categorias Usadas</h2>
          <p className="text-3xl font-bold text-[#facc15]">{categoriasLabels.length}</p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Categoria Principal</h2>
          <p className="text-xl font-bold text-[#facc15]">
            {tabelaCategorias.length > 0 ? tabelaCategorias[0].categoria : "—"}
          </p>
        </div>
      </div>

      {/* GRÁFICO DE BARRAS — CORRIGIDO */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Gastos por Categoria</h2>

        <Chart
          type="bar"
          height={350}
          series={[
            {
              name: "Despesas",
              data: categoriasValores, // <-- valores limpos e arredondados
            },
          ]}
          options={{
            chart: { background: "transparent", foreColor: "#fff" },
            colors: ["#facc15"],
            xaxis: { categories: categoriasLabels },
            yaxis: {
              labels: {
                formatter: (value) => value.toFixed(2), // <-- SEM ZEROS INFINITOS
              },
            },
            dataLabels: {
              formatter: (value) => value.toFixed(2), // <-- valores em cima das barras limpos
              style: { colors: ["#fff"] },
            },
            grid: { borderColor: "#333" },
          }}
        />
      </div>

      {/* GRÁFICO DONUT — CORRIGIDO */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Distribuição Percentual</h2>

        <Chart
          type="donut"
          height={350}
          series={categoriasValores}
          options={{
            labels: categoriasLabels,
            chart: { background: "transparent", foreColor: "#fff" },
            colors: ["#facc15", "#22c55e", "#3b82f6", "#ef4444", "#a855f7", "#14b8a6"],
            legend: { labels: { colors: "#fff" } },
            dataLabels: {
              formatter: (value) => value.toFixed(1) + "%", // <-- percentagens limpas
            },
          }}
        />
      </div>

      {/* TABELA PREMIUM — ORDENADA */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Tabela por Categoria</h2>

        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-[#333]">
              <th className="py-2">Categoria</th>
              <th className="py-2">Valor (€)</th>
              <th className="py-2">% do Total</th>
            </tr>
          </thead>
          <tbody>
            {tabelaCategorias.map((c, i) => (
              <tr key={i} className="border-b border-[#222]">
                <td className="py-2">{c.categoria}</td>
                <td className="py-2">{c.valor.toFixed(2)}</td>
                <td className="py-2">{c.percent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
