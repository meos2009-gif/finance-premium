import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Chart from "react-apexcharts";

export default function RelatorioMensal() {
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
  // CÁLCULOS DO MÊS ATUAL
  // -----------------------------
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const receitasMes = transacoes.filter((t) => {
    const d = new Date(t.date);
    return t.type === "income" && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  const despesasMes = transacoes.filter((t) => {
    const d = new Date(t.date);
    return t.type === "expense" && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  const totalReceitas = receitasMes.reduce((acc, r) => acc + Number(r.amount), 0);
  const totalDespesas = despesasMes.reduce((acc, d) => acc + Number(d.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  // -----------------------------
  // DISTRIBUIÇÃO POR CATEGORIA
  // -----------------------------
  const totaisPorCategoria = {};

  despesasMes.forEach((t) => {
    if (!totaisPorCategoria[t.category_id]) totaisPorCategoria[t.category_id] = 0;
    totaisPorCategoria[t.category_id] += Number(t.amount);
  });

  const categoriasLabels = Object.keys(totaisPorCategoria).map((id) => {
    const cat = categorias.find((c) => c.id === id);
    return cat ? cat.name : "Categoria";
  });

  const categoriasValores = Object.values(totaisPorCategoria);

  const tabelaCategorias = Object.entries(totaisPorCategoria).map(([id, valor]) => {
    const cat = categorias.find((c) => c.id === id);
    return {
      categoria: cat ? cat.name : "Categoria",
      valor: valor.toFixed(2),
      percent: totalDespesas > 0 ? ((valor / totalDespesas) * 100).toFixed(1) + "%" : "0%",
    };
  });

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Relatório Mensal
      </h1>

      {/* CARDS PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Receitas do Mês</h2>
          <p className="text-3xl font-bold text-green-400">{totalReceitas.toFixed(2)} €</p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Despesas do Mês</h2>
          <p className="text-3xl font-bold text-red-400">{totalDespesas.toFixed(2)} €</p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Saldo</h2>
          <p className={`text-3xl font-bold ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}>
            {saldo.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* GRÁFICO RECEITAS VS DESPESAS */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Receitas vs Despesas</h2>

        <Chart
          type="bar"
          height={350}
          series={[
            { name: "Receitas", data: [totalReceitas] },
            { name: "Despesas", data: [totalDespesas] },
          ]}
          options={{
            chart: { background: "transparent", foreColor: "#fff" },
            colors: ["#22c55e", "#ef4444"],
            xaxis: { categories: ["Mês Atual"] },
            grid: { borderColor: "#333" },
          }}
        />
      </div>

      {/* GRÁFICO DONUT POR CATEGORIA */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Distribuição por Categoria</h2>

        <Chart
          type="donut"
          height={350}
          series={categoriasValores}
          options={{
            labels: categoriasLabels,
            chart: { background: "transparent", foreColor: "#fff" },
            colors: ["#facc15", "#22c55e", "#3b82f6", "#ef4444", "#a855f7", "#14b8a6"],
            legend: { labels: { colors: "#fff" } },
          }}
        />
      </div>

      {/* TABELA PREMIUM POR CATEGORIA */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Tabela por Categoria</h2>

        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-[#333]">
              <th className="py-2">Categoria</th>
              <th className="py-2">Valor (€)</th>
              <th className="py-2">% do Mês</th>
            </tr>
          </thead>
          <tbody>
            {tabelaCategorias.map((c, i) => (
              <tr key={i} className="border-b border-[#222]">
                <td className="py-2">{c.categoria}</td>
                <td className="py-2">{c.valor}</td>
                <td className="py-2">{c.percent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
