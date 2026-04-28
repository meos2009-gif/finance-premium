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

  // FILTRAR POR ANO (com T00:00:00 para evitar bugs de fuso horário)
  const receitasAno = transacoes.filter((t) => {
    const d = new Date(t.date + "T00:00:00");
    return t.type === "income" && d.getFullYear() === anoSelecionado;
  });

  const despesasAno = transacoes.filter((t) => {
    const d = new Date(t.date + "T00:00:00");
    return t.type === "expense" && d.getFullYear() === anoSelecionado;
  });

  const totalReceitas = receitasAno.reduce((acc, r) => acc + Number(r.amount), 0);
  const totalDespesas = despesasAno.reduce((acc, d) => acc + Number(d.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  // GRÁFICO ANUAL (barras)
  const receitasPorMes = Array.from({ length: 12 }, (_, i) =>
    receitasAno
      .filter((t) => {
        const d = new Date(t.date + "T00:00:00");
        return d.getMonth() === i;
      })
      .reduce((acc, t) => acc + Number(t.amount), 0)
  );

  const despesasPorMes = Array.from({ length: 12 }, (_, i) =>
    despesasAno
      .filter((t) => {
        const d = new Date(t.date + "T00:00:00");
        return d.getMonth() === i;
      })
      .reduce((acc, t) => acc + Number(t.amount), 0)
  );

  // TOP CATEGORIAS (nomes reais)
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

  // TOP EMPRESAS (nomes reais)
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

  // EXPORTAR PDF a partir do que vês na página
  const exportarPDF = async () => {
    const original = document.getElementById("relatorio-anual");
    if (!original) return;

    const clone = original.cloneNode(true);

    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.background = "#fff";
    container.style.color = "#000";
    container.style.padding = "20px";
    container.style.width = "800px";

    container.appendChild(clone);
    document.body.appendChild(container);

    container.querySelectorAll("*").forEach((el) => {
      el.style.background = "transparent";
      el.style.color = "#000";
      if (el.style.borderColor) el.style.borderColor = "#000";
    });

    const canvas = await html2canvas(container, {
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

    document.body.removeChild(container);
  };

  return (
    <div
      className="text-white flex flex-col gap-10 px-4 md:px-0 w-full"
      id="relatorio-anual"
    >
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
            plotOptions: {
              bar: {
                borderRadius: 6,
                columnWidth: "45%",
              }
            }
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
    </div>
  );
}
