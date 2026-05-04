import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Chart from "react-apexcharts";

export default function RelatorioCategorias() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  // -----------------------------
  // ESTADO PARA MÊS E ANO
  // -----------------------------
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());

  const nomeMes = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ][mes - 1];

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

      const { data: emp } = await supabase
        .from("empresas")
        .select("*")
        .eq("user_id", session.user.id);

      setEmpresas(emp || []);
    }
    load();
  }, []);

  // -----------------------------
  // FILTRAR POR MÊS E ANO
  // -----------------------------
  const despesasFiltradas = transacoes.filter((t) => {
    if (t.type !== "expense") return false;

    const data = new Date(t.date);
    const mesTrans = data.getMonth() + 1;
    const anoTrans = data.getFullYear();

    return mesTrans === Number(mes) && anoTrans === Number(ano);
  });

  // -----------------------------
  // AGRUPAR POR CATEGORIA
  // -----------------------------
  const totaisPorCategoria = {};
  despesasFiltradas.forEach((t) => {
    if (!totaisPorCategoria[t.category_id]) totaisPorCategoria[t.category_id] = 0;
    totaisPorCategoria[t.category_id] += Number(t.amount);
  });

  const totalDespesas = Object.values(totaisPorCategoria).reduce((acc, v) => acc + v, 0);

  const tabelaCategorias = Object.entries(totaisPorCategoria)
    .map(([id, valor]) => {
      const cat = categorias.find((c) => c.id === id);
      return {
        categoria: cat ? cat.name : "Categoria",
        valor: Number(valor),
        percent: totalDespesas > 0 ? ((valor / totalDespesas) * 100).toFixed(1) + "%" : "0%",
      };
    })
    .sort((a, b) => b.valor - a.valor);

  const categoriasLabels = tabelaCategorias.map((c) => c.categoria);
  const categoriasValores = tabelaCategorias.map((c) => Number(c.valor.toFixed(2)));

  // -----------------------------
  // AGRUPAR POR EMPRESA (NOVO)
  // -----------------------------
  const totaisPorEmpresa = {};
  despesasFiltradas.forEach((t) => {
    if (!totaisPorEmpresa[t.empresa_id]) totaisPorEmpresa[t.empresa_id] = 0;
    totaisPorEmpresa[t.empresa_id] += Number(t.amount);
  });

  const tabelaEmpresas = Object.entries(totaisPorEmpresa)
    .map(([id, valor]) => {
      const emp = empresas.find((e) => e.id === id);
      return {
        empresa: emp ? emp.name : "Empresa",
        valor: Number(valor),
        percent: totalDespesas > 0 ? ((valor / totalDespesas) * 100).toFixed(1) + "%" : "0%",
      };
    })
    .sort((a, b) => b.valor - a.valor);

  const empresasLabels = tabelaEmpresas.map((e) => e.empresa);
  const empresasValores = tabelaEmpresas.map((e) => Number(e.valor.toFixed(2)));

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      {/* TÍTULO */}
      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Relatório — {nomeMes} {ano}
      </h1>

      {/* SELEÇÃO DE MÊS E ANO */}
      <div className="flex gap-4 bg-[#111] p-4 rounded-xl border border-[#222] w-full max-w-md">

        <select
          className="bg-[#222] p-3 rounded-lg w-full"
          value={mes}
          onChange={(e) => setMes(e.target.value)}
        >
          {nomeMes.map}
        </select>

        <select
          className="bg-[#222] p-3 rounded-lg w-full"
          value={ano}
          onChange={(e) => setAno(e.target.value)}
        >
          {Array.from({ length: 6 }).map((_, i) => {
            const y = new Date().getFullYear() - i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>

      </div>

      {/* ----------------------------- */}
      {/* SECÇÃO: CATEGORIAS */}
      {/* ----------------------------- */}

      <h2 className="text-xl font-bold text-[#facc15]">Totais por Categoria</h2>

      {/* GRÁFICO DE BARRAS */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <Chart
          type="bar"
          height={350}
          series={[{ name: "Despesas", data: categoriasValores }]}
          options={{
            chart: { background: "transparent", foreColor: "#fff" },
            colors: ["#facc15"],
            xaxis: { categories: categoriasLabels },
            grid: { borderColor: "#333" },
          }}
        />
      </div>

      {/* TABELA CATEGORIAS */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
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

      {/* ----------------------------- */}
      {/* SECÇÃO: EMPRESAS (NOVO) */}
      {/* ----------------------------- */}

      <h2 className="text-xl font-bold text-[#22c55e]">Totais por Empresa</h2>

      {/* GRÁFICO DE BARRAS EMPRESAS */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <Chart
          type="bar"
          height={350}
          series={[{ name: "Despesas", data: empresasValores }]}
          options={{
            chart: { background: "transparent", foreColor: "#fff" },
            colors: ["#22c55e"],
            xaxis: { categories: empresasLabels },
            grid: { borderColor: "#333" },
          }}
        />
      </div>

      {/* TABELA EMPRESAS */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-[#333]">
              <th className="py-2">Empresa</th>
              <th className="py-2">Valor (€)</th>
              <th className="py-2">% do Total</th>
            </tr>
          </thead>
          <tbody>
            {tabelaEmpresas.map((e, i) => (
              <tr key={i} className="border-b border-[#222]">
                <td className="py-2">{e.empresa}</td>
                <td className="py-2">{e.valor.toFixed(2)}</td>
                <td className="py-2">{e.percent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
