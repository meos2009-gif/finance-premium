import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Chart from "react-apexcharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Dashboard() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  // 🔥 CARREGAR TRANSAÇÕES + CATEGORIAS + EMPRESAS
  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const userId = session.user.id;

      const { data: trans } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId);
      setTransacoes(trans || []);

      const { data: cat } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId);
      setCategorias(cat || []);

      const { data: emp } = await supabase
        .from("empresas")
        .select("*")
        .eq("user_id", userId);
      setEmpresas(emp || []);
    }
    load();
  }, []);

  // 🔥 FILTRAR POR ANO
  const receitasAno = transacoes.filter(
    (t) => t.type === "income" && new Date(t.date).getFullYear() === anoSelecionado
  );

  const despesasAno = transacoes.filter(
    (t) => t.type === "expense" && new Date(t.date).getFullYear() === anoSelecionado
  );

  const totalReceitas = receitasAno.reduce((acc, r) => acc + Number(r.amount), 0);
  const totalDespesas = despesasAno.reduce((acc, d) => acc + Number(d.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  // 🔥 GRÁFICO ANUAL (BARRAS)
  const receitasPorMes = Array.from({ length: 12 }, (_, i) =>
    receitasAno
      .filter((t) => new Date(t.date).getMonth() === i)
      .reduce((acc, t) => acc + Number(t.amount), 0)
  );

  const despesasPorMes = Array.from({ length: 12 }, (_, i) =>
    despesasAno
      .filter((t) => new Date(t.date).getMonth() === i)
      .reduce((acc, t) => acc + Number(t.amount), 0)
  );

  // 🔥 TOP CATEGORIAS (NOMES REAIS)
  const gastosPorCategoria = {};
  despesasAno.forEach((t) => {
    if (!gastosPorCategoria[t.category_id]) gastosPorCategoria[t.category_id] = 0;
    gastosPorCategoria[t.category_id] += Number(t.amount);
  });

  const topCategorias = Object.entries(gastosPorCategoria)
    .map(([id, valor]) => ({
      nome: categorias.find((c) => c.id === id)?.name || "Categoria",
      valor,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  // 🔥 TOP EMPRESAS (NOMES REAIS)
  const gastosPorEmpresa = {};
  despesasAno.forEach((t) => {
    const empresaObj = empresas.find((e) => e.id === t.empresa_id);
    const nomeEmpresa = empresaObj ? empresaObj.name : "Sem empresa";

    if (!gastosPorEmpresa[nomeEmpresa]) gastosPorEmpresa[nomeEmpresa] = 0;
    gastosPorEmpresa[nomeEmpresa] += Number(t.amount);
  });

  const topEmpresas = Object.entries(gastosPorEmpresa)
    .map(([empresa, valor]) => ({ empresa, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  // 🔥 EXPORTAR PDF PREMIUM
  const exportarPDF = async () => {
    const elemento = document.getElementById("pdf-template");
    if (!elemento) return;

    await new Promise((resolve) => setTimeout(resolve, 200));

    const canvas = await html2canvas(elemento, {
      scale: 2,
      backgroundColor: "#fff",
      useCORS: true
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const larguraPDF = pdf.internal.pageSize.getWidth();
    const proporcao = canvas.height / canvas.width;
    const alturaImg = larguraPDF * proporcao;

    pdf.addImage(imgData, "PNG", 0, 0, larguraPDF, alturaImg);
    pdf.save(`Relatorio_Anual_${anoSelecionado}.pdf`);
  };

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      {/* TÍTULO */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#facc15]">
          Relatório Anual
        </h1>

        <button
          onClick={exportarPDF}
          className="bg-[#facc15] text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition"
        >
          Exportar PDF
        </button>
      </div>

      {/* SELECT ANO */}
      <select
        value={anoSelecionado}
        onChange={(e) => setAnoSelecionado(Number(e.target.value))}
        className="bg-[#111] border border-[#333] text-white p-2 rounded w-40"
      >
        {Array.from({ length: 5 }, (_, i) => anoSelecionado - i).map((ano) => (
          <option key={ano} value={ano}>{ano}</option>
        ))}
      </select>

      {/* CARDS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Receitas</h2>
          <p className="text-3xl font-bold text-green-400">{totalReceitas.toFixed(2)} €</p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Despesas</h2>
          <p className="text-3xl font-bold text-red-400">{totalDespesas.toFixed(2)} €</p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Saldo</h2>
          <p className={`text-3xl font-bold ${saldo >= 0 ? "text-green-400" : "text-red-400"}`}>
            {saldo.toFixed(2)} €
          </p>
        </div>
      </div>

      {/* GRÁFICO ANUAL */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Evolução Anual</h2>

        <Chart
          type="bar"
          height={350}
          series={[
            { name: "Receitas", data: receitasPorMes },
            { name: "Despesas", data: despesasPorMes }
          ]}
          options={{
            chart: { background: "transparent", foreColor: "#fff" },
            colors: ["#22c55e", "#ef4444"],
            xaxis: { categories: meses },
            grid: { borderColor: "#333" },
          }}
        />
      </div>

      {/* TOP CATEGORIAS */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Top Categorias</h2>
        <ul className="space-y-2">
          {topCategorias.map((c, i) => (
            <li key={i} className="flex justify-between border-b border-[#222] pb-2">
              <span>{c.nome}</span>
              <span className="font-bold">{c.valor.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
      </div>

      {/* TOP EMPRESAS */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Top Empresas</h2>
        <ul className="space-y-2">
          {topEmpresas.map((e, i) => (
            <li key={i} className="flex justify-between border-b border-[#222] pb-2">
              <span>{e.empresa}</span>
              <span className="font-bold">{e.valor.toFixed(2)} €</span>
            </li>
          ))}
        </ul>
      </div>

      {/* TEMPLATE PDF PREMIUM */}
      <div
        id="pdf-template"
        style={{
          background: "#fff",
          color: "#000",
          padding: "40px",
          width: "800px",
          position: "absolute",
          top: "0",
          left: "0",
          transform: "translateY(-200vh)",
          fontFamily: "Arial, sans-serif"
        }}
      >

        {/* CAPA */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", marginBottom: "10px" }}>
            Relatório Anual
          </h1>

          <h2 style={{ fontSize: "22px", color: "#444" }}>
            Ano {anoSelecionado}
          </h2>

          <div
            style={{
              marginTop: "20px",
              height: "4px",
              width: "100%",
              background: "#facc15"
            }}
          />
        </div>

        {/* RESUMO FINANCEIRO */}
        <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>Resumo Financeiro</h2>

        <p><strong>Total de Receitas:</strong> {totalReceitas.toFixed(2)} €</p>
        <p><strong>Total de Despesas:</strong> {totalDespesas.toFixed(2)} €</p>
        <p><strong>Saldo Final:</strong> {saldo.toFixed(2)} €</p>

        <div style={{ height: "2px", background: "#ddd", margin: "20px 0" }} />

        {/* TOP CATEGORIAS */}
        <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>Top Categorias</h2>
        <ul style={{ paddingLeft: "20px" }}>
          {topCategorias.map((c, i) => (
            <li key={i} style={{ marginBottom: "6px" }}>
              <strong>{c.nome}</strong>: {c.valor.toFixed(2)} €
            </li>
          ))}
        </ul>

        <div style={{ height: "2px", background: "#ddd", margin: "20px 0" }} />

        {/* TOP EMPRESAS */}
        <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>Top Empresas</h2>
        <ul style={{ paddingLeft: "20px" }}>
          {topEmpresas.map((e, i) => (
            <li key={i} style={{ marginBottom: "6px" }}>
              <strong>{e.empresa}</strong>: {e.valor.toFixed(2)} €
            </li>
          ))}
        </ul>

        <div style={{ height: "2px", background: "#ddd", margin: "20px 0" }} />

        {/* TABELA ANUAL */}
        <h2 style={{ fontSize: "20px", marginBottom: "10px" }}>Resumo Mensal</h2>

        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "14px"
          }}
        >
          <thead>
            <tr>
              <th style={{ borderBottom: "2px solid #ccc", padding: "8px" }}>Mês</th>
              <th style={{ borderBottom: "2px solid #ccc", padding: "8px" }}>Receitas</th>
              <th style={{ borderBottom: "2px solid #ccc", padding: "8px" }}>Despesas</th>
              <th style={{ borderBottom: "2px solid #ccc", padding: "8px" }}>Saldo</th>
            </tr>
          </thead>

          <tbody>
            {Array.from({ length: 12 }).map((_, i) => {
              const receitas = receitasPorMes[i];
              const despesas = despesasPorMes[i];

              return (
                <tr key={i}>
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                    {meses[i]}
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                    {receitas.toFixed(2)} €
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                    {despesas.toFixed(2)} €
                  </td>
                  <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>
                    {(receitas - despesas).toFixed(2)} €
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

      </div>
    </div>
  );
}
