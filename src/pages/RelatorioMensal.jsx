import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Chart from "react-apexcharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function RelatorioMensal() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [mesSelecionado, setMesSelecionado] = useState(new Date().getMonth());
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());

  // ⭐ NOVO — PERÍODO DE DATAS
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const meses = [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ];

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
    pdf.save(`Relatorio_${meses[mesSelecionado]}_${anoSelecionado}.pdf`);
  };

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

  // ⭐ FILTRO INTELIGENTE — PERÍODO OU MÊS/ANO
  const despesasMes = transacoes.filter((t) => {
    const d = new Date(t.date + "T00:00:00");

    // Se período estiver selecionado → ignora mês/ano
    if (startDate && endDate) {
      const inicio = new Date(startDate);
      const fim = new Date(endDate);
      return t.type === "expense" && d >= inicio && d <= fim;
    }

    // Caso contrário → usa mês/ano normal
    return (
      t.type === "expense" &&
      d.getMonth() === mesSelecionado &&
      d.getFullYear() === anoSelecionado
    );
  });

  const receitasMes = transacoes.filter((t) => {
    const d = new Date(t.date + "T00:00:00");

    if (startDate && endDate) {
      const inicio = new Date(startDate);
      const fim = new Date(endDate);
      return t.type === "income" && d >= inicio && d <= fim;
    }

    return (
      t.type === "income" &&
      d.getMonth() === mesSelecionado &&
      d.getFullYear() === anoSelecionado
    );
  });

  const totalReceitas = receitasMes.reduce((acc, r) => acc + Number(r.amount), 0);
  const totalDespesas = despesasMes.reduce((acc, d) => acc + Number(d.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  // ⭐ GRÁFICO DIÁRIO — se período estiver ativo, recalcula dinamicamente
  let dias = [];
  let valoresPorDia = [];

  if (startDate && endDate) {
    const inicio = new Date(startDate);
    const fim = new Date(endDate);

    const diasPeriodo = [];
    const cursor = new Date(inicio);

    while (cursor <= fim) {
      diasPeriodo.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    dias = diasPeriodo.map((d) => d.getDate());

    valoresPorDia = diasPeriodo.map((diaObj) => {
      const total = despesasMes
        .filter((t) => new Date(t.date + "T00:00:00").toDateString() === diaObj.toDateString())
        .reduce((acc, t) => acc + Number(t.amount), 0);

      return Number(total.toFixed(2));
    });
  } else {
    // MODO MENSAL NORMAL
    const diasNoMes = new Date(anoSelecionado, mesSelecionado + 1, 0).getDate();
    dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);

    valoresPorDia = dias.map((dia) => {
      const total = despesasMes
        .filter((t) => {
          const dataLocal = new Date(t.date + "T00:00:00");
          return dataLocal.getDate() === dia;
        })
        .reduce((acc, t) => acc + Number(t.amount), 0);

      return Number(total.toFixed(2));
    });
  }

  // TOP CATEGORIAS
  const gastosPorCategoria = {};
  despesasMes.forEach((t) => {
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

  const categoriaPredominante = topCategorias.length > 0 ? topCategorias[0] : null;

  // TOP EMPRESAS
  const gastosPorEmpresa = {};
  despesasMes.forEach((t) => {
    const empresaObj = empresas.find((e) => e.id === t.empresa_id);
    const nomeEmpresa = empresaObj ? empresaObj.name : "Sem empresa";

    if (!gastosPorEmpresa[nomeEmpresa]) gastosPorEmpresa[nomeEmpresa] = 0;
    gastosPorEmpresa[nomeEmpresa] += Number(t.amount);
  });

  const topEmpresas = Object.entries(gastosPorEmpresa)
    .map(([empresa, valor]) => ({ empresa, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      {/* TÍTULO + PDF */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#facc15]">
          Relatório Mensal
        </h1>

        <button
          onClick={exportarPDF}
          className="bg-[#facc15] text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition"
        >
          Exportar PDF
        </button>
      </div>

      {/* ⭐ FILTROS — MÊS/ANO + PERÍODO */}
      <div className="flex flex-wrap gap-4">

        {/* MÊS */}
        <select
          value={mesSelecionado}
          onChange={(e) => setMesSelecionado(Number(e.target.value))}
          className="bg-[#111] border border-[#333] text-white p-2 rounded"
        >
          {meses.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>

        {/* ANO */}
        <select
          value={anoSelecionado}
          onChange={(e) => setAnoSelecionado(Number(e.target.value))}
          className="bg-[#111] border border-[#333] text-white p-2 rounded"
        >
          {Array.from({ length: 5 }, (_, i) => anoSelecionado - i).map((ano) => (
            <option key={ano} value={ano}>{ano}</option>
          ))}
        </select>

        {/* ⭐ DATA INICIAL */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm">Data Inicial</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#111] border border-[#333] p-2 rounded"
          />
        </div>

        {/* ⭐ DATA FINAL */}
        <div className="flex flex-col">
          <label className="text-gray-400 text-sm">Data Final</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#111] border border-[#333] p-2 rounded"
          />
        </div>

      </div>

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

      {/* QUADRO PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Total de Despesas</h2>
          <p className="text-3xl font-bold text-red-400">
            {totalDespesas.toFixed(2)} €
          </p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Categoria Predominante</h2>

          {categoriaPredominante ? (
            <div>
              <p className="text-xl font-bold text-[#facc15]">
                {categoriaPredominante.nome}
              </p>

              <p className="text-lg font-bold mt-1">
                {categoriaPredominante.valor.toFixed(2)} €
              </p>

              <p className="text-gray-400 mt-1">
                {((categoriaPredominante.valor / totalDespesas) * 100).toFixed(1)}% do total
              </p>
            </div>
          ) : (
            <p className="text-gray-400">Sem dados</p>
          )}
        </div>

      </div>

      {/* GRÁFICO DIÁRIO */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Evolução Diária das Despesas</h2>

        <Chart
          type="line"
          height={350}
          series={[{ name: "Despesas", data: valoresPorDia }]}
          options={{
            chart: { background: "transparent", foreColor: "#fff" },
            stroke: { curve: "smooth", width: 3 },
            colors: ["#ef4444"],
            xaxis: { categories: dias },
            yaxis: {
              labels: {
                formatter: (value) => value.toFixed(2),
              },
            },
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

      {/* TEMPLATE PDF */}
      <div
        id="pdf-template"
        style={{
          background: "#fff",
          color: "#000",
          padding: "20px",
          width: "800px",
          position: "absolute",
          top: "0",
          left: "0",
          transform: "translateY(-200vh)"
        }}
      >
        <h1 style={{ fontSize: "26px", marginBottom: "20px" }}>
          Relatório de {meses[mesSelecionado]} {anoSelecionado}
        </h1>

        <p>Receitas: {totalReceitas.toFixed(2)} €</p>
        <p>Despesas: {totalDespesas.toFixed(2)} €</p>
        <p>Saldo: {saldo.toFixed(2)} €</p>

        <h2 style={{ marginTop: "20px" }}>Top Categorias</h2>
        <ul>
          {topCategorias.map((c, i) => (
            <li key={i}>{c.nome}: {c.valor.toFixed(2)} €</li>
          ))}
        </ul>

        <h2 style={{ marginTop: "20px" }}>Top Empresas</h2>
        <ul>
          {topEmpresas.map((e, i) => (
            <li key={i}>{e.empresa}: {e.valor.toFixed(2)} €</li>
          ))}
        </ul>
      </div>

    </div>
  );
}
