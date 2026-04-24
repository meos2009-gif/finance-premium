import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Chart from "react-apexcharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Dashboard() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const anoAtual = new Date().getFullYear();
  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [mesLimite, setMesLimite] = useState(new Date().getMonth());

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

  // CARREGAR DADOS
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

  // FILTRAR POR ANO E MÊS LIMITE
  const despesasAno = transacoes.filter((t) => {
    const d = new Date(t.date + "T00:00:00");
    return (
      t.type === "expense" &&
      d.getFullYear() === anoSelecionado &&
      d.getMonth() <= mesLimite
    );
  });

  const receitasAno = transacoes.filter((t) => {
    const d = new Date(t.date + "T00:00:00");
    return (
      t.type === "income" &&
      d.getFullYear() === anoSelecionado &&
      d.getMonth() <= mesLimite
    );
  });

  const totalReceitasAno = receitasAno.reduce((acc, t) => acc + Number(t.amount), 0);
  const totalDespesasAno = despesasAno.reduce((acc, t) => acc + Number(t.amount), 0);
  const saldoAno = totalReceitasAno - totalDespesasAno;

  // GRÁFICO ANUAL
  const valoresMensais = Array.from({ length: 12 }, (_, mes) => {
    return despesasAno
      .filter((t) => new Date(t.date + "T00:00:00").getMonth() === mes)
      .reduce((acc, t) => acc + Number(t.amount), 0);
  });

  // TABELA EMPRESAS
  const gastosPorEmpresa = {};
  despesasAno.forEach((t) => {
    const empresaObj = empresas.find((e) => e.id === t.empresa_id);
    const nomeEmpresa = empresaObj ? empresaObj.name : "Sem empresa";

    if (!gastosPorEmpresa[nomeEmpresa]) gastosPorEmpresa[nomeEmpresa] = 0;
    gastosPorEmpresa[nomeEmpresa] += Number(t.amount);
  });

  const tabelaEmpresas = Object.entries(gastosPorEmpresa)
    .map(([empresa, valor]) => ({
      empresa,
      valor,
      percent: totalDespesasAno > 0 ? (valor / totalDespesasAno) * 100 : 0
    }))
    .sort((a, b) => b.valor - a.valor);

  // TABELA CATEGORIAS
  const gastosPorCategoria = {};
  despesasAno.forEach((t) => {
    if (!gastosPorCategoria[t.category_id]) gastosPorCategoria[t.category_id] = 0;
    gastosPorCategoria[t.category_id] += Number(t.amount);
  });

  const tabelaCategorias = Object.entries(gastosPorCategoria)
    .map(([id, valor]) => ({
      categoria: categorias.find((c) => c.id === id)?.name || "Categoria",
      valor,
      percent: totalDespesasAno > 0 ? (valor / totalDespesasAno) * 100 : 0
    }))
    .sort((a, b) => b.valor - a.valor);

  // EXPORTAR PDF
  const exportarPDF = async () => {
    const elemento = document.getElementById("pdf-anual");

    if (!elemento) return;

    await new Promise((resolve) => setTimeout(resolve, 300));

    const canvas = await html2canvas(elemento, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
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
    <>
      {/* DASHBOARD VISÍVEL */}
      <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

        {/* TÍTULO + BOTÃO PDF */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-[#facc15]">
            Dashboard Anual
          </h1>

          <button
            onClick={exportarPDF}
            className="bg-[#facc15] text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition"
          >
            Exportar PDF Anual
          </button>
        </div>

        {/* FILTROS */}
        <div className="flex gap-4">
          <select
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(Number(e.target.value))}
            className="bg-[#111] border border-[#333] text-white p-2 rounded"
          >
            {Array.from({ length: 6 }, (_, i) => anoAtual - i).map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>

          <select
            value={mesLimite}
            onChange={(e) => setMesLimite(Number(e.target.value))}
            className="bg-[#111] border border-[#333] text-white p-2 rounded"
          >
            {meses.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>

        {/* CARDS ANUAIS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
            <h2 className="text-gray-400">Receitas Anuais</h2>
            <p className="text-3xl font-bold text-green-400">
              {totalReceitasAno.toFixed(2)} €
            </p>
          </div>

          <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
            <h2 className="text-gray-400">Despesas Anuais</h2>
            <p className="text-3xl font-bold text-red-400">
              {totalDespesasAno.toFixed(2)} €
            </p>
          </div>

          <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
            <h2 className="text-gray-400">Saldo Anual</h2>
            <p className={`text-3xl font-bold ${saldoAno >= 0 ? "text-green-400" : "text-red-400"}`}>
              {saldoAno.toFixed(2)} €
            </p>
          </div>
        </div>

        {/* GRÁFICO ANUAL */}
        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-[#facc15]">
            Despesas por Mês
          </h2>

          <Chart
            type="bar"
            height={350}
            series={[{ name: "Despesas", data: valoresMensais }]}
            options={{
              chart: { background: "transparent", foreColor: "#fff" },
              colors: ["#ef4444"],
              xaxis: { categories: meses },
              grid: { borderColor: "#333" },
            }}
          />
        </div>

        {/* TABELA EMPRESAS */}
        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-[#facc15]">
            Despesas por Empresa (Anual)
          </h2>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#333]">
                <th className="py-2">Empresa</th>
                <th>Total</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {tabelaEmpresas.map((e, i) => (
                <tr key={i} className="border-b border-[#222]">
                  <td className="py-2">{e.empresa}</td>
                  <td>{e.valor.toFixed(2)} €</td>
                  <td>{e.percent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TABELA CATEGORIAS */}
        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-[#facc15]">
            Despesas por Categoria (Anual)
          </h2>

          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#333]">
                <th className="py-2">Categoria</th>
                <th>Total</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {tabelaCategorias.map((c, i) => (
                <tr key={i} className="border-b border-[#222]">
                  <td className="py-2">{c.categoria}</td>
                  <td>{c.valor.toFixed(2)} €</td>
                  <td>{c.percent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TEMPLATE PDF PREMIUM */}
      <div
        id="pdf-anual"
        style={{
          background: "#ffffff",
          color: "#000000",
          padding: "30px",
          width: "900px",
          position: "absolute",
          top: "0",
          left: "0",
          transform: "translateY(-200vh)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "28px", marginBottom: "10px" }}>
          Relatório Anual {anoSelecionado}
        </h1>
        <p style={{ fontSize: "16px", marginBottom: "20px" }}>
          Acumulado até {meses[mesLimite]}
        </p>

        <h2 style={{ fontSize: "22px", marginTop: "20px" }}>Totais Anuais</h2>
        <p>Receitas: {totalReceitasAno.toFixed(2)} €</p>
        <p>Despesas: {totalDespesasAno.toFixed(2)} €</p>
        <p>Saldo: {saldoAno.toFixed(2)} €</p>

        <h2 style={{ fontSize: "22px", marginTop: "30px" }}>Despesas por Empresa</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: "6px" }}>Empresa</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "6px" }}>Total</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "6px" }}>%</th>
            </tr>
          </thead>
          <tbody>
            {tabelaEmpresas.map((e, i) => (
              <tr key={i}>
                <td style={{ padding: "6px" }}>{e.empresa}</td>
                <td style={{ padding: "6px" }}>{e.valor.toFixed(2)} €</td>
                <td style={{ padding: "6px" }}>{e.percent.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 style={{ fontSize: "22px", marginTop: "30px" }}>Despesas por Categoria</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: "6px" }}>Categoria</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "6px" }}>Total</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "6px" }}>%</th>
            </tr>
          </thead>
          <tbody>
            {tabelaCategorias.map((c, i) => (
              <tr key={i}>
                <td style={{ padding: "6px" }}>{c.categoria}</td>
                <td style={{ padding: "6px" }}>{c.valor.toFixed(2)} €</td>
                <td style={{ padding: "6px" }}>{c.percent.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
