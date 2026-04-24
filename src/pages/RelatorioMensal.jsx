import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Chart from "react-apexcharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function RelatorioMensal() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  // -----------------------------------------
  // EXPORTAR PDF (TEMPLATE BRANCO)
  // -----------------------------------------
  const exportarPDF = async () => {
    const elemento = document.getElementById("pdf-template");

    if (!elemento) {
      console.error("Elemento PDF não encontrado");
      return;
    }

    // Esperar para garantir renderização
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
    pdf.save(`Relatorio_Mensal_${new Date().toLocaleDateString()}.pdf`);
  };

  // -----------------------------------------
  // CARREGAR DADOS
  // -----------------------------------------
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

  // -----------------------------------------
  // CÁLCULOS DO MÊS ATUAL
  // -----------------------------------------
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const despesasMes = transacoes.filter((t) => {
    const d = new Date(t.date);
    return t.type === "expense" && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  const receitasMes = transacoes.filter((t) => {
    const d = new Date(t.date);
    return t.type === "income" && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

  const totalReceitas = receitasMes.reduce((acc, r) => acc + Number(r.amount), 0);
  const totalDespesas = despesasMes.reduce((acc, d) => acc + Number(d.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  // -----------------------------------------
  // RESUMO DO MÊS
  // -----------------------------------------
  const totalTransacoes = despesasMes.length + receitasMes.length;

  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const mediaDiaria = totalDespesas / diasNoMes;

  const diaMaisCaro = despesasMes.reduce(
    (max, t) => (Number(t.amount) > max.amount ? { date: t.date, amount: Number(t.amount) } : max),
    { date: null, amount: 0 }
  );

  // Categoria dominante
  const gastosPorCategoria = {};
  despesasMes.forEach((t) => {
    if (!gastosPorCategoria[t.category_id]) gastosPorCategoria[t.category_id] = 0;
    gastosPorCategoria[t.category_id] += Number(t.amount);
  });

  const categoriaDominanteId = Object.entries(gastosPorCategoria).sort((a, b) => b[1] - a[1])[0]?.[0];
  const categoriaDominante = categorias.find((c) => c.id === categoriaDominanteId)?.name || "—";

  // Empresa dominante
  const gastosPorEmpresa = {};
  despesasMes.forEach((t) => {
    const empresaObj = empresas.find((e) => e.id === t.empresa_id);
    const nomeEmpresa = empresaObj ? empresaObj.name : "Sem empresa";

    if (!gastosPorEmpresa[nomeEmpresa]) gastosPorEmpresa[nomeEmpresa] = 0;
    gastosPorEmpresa[nomeEmpresa] += Number(t.amount);
  });

  const empresaDominante =
    Object.entries(gastosPorEmpresa).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  // -----------------------------------------
  // GRÁFICO EVOLUÇÃO DIÁRIA
  // -----------------------------------------
  const dias = Array.from({ length: diasNoMes }, (_, i) => i + 1);
  const valoresPorDia = dias.map((dia) => {
    return despesasMes
      .filter((t) => new Date(t.date).getDate() === dia)
      .reduce((acc, t) => acc + Number(t.amount), 0);
  });

  // -----------------------------------------
  // TOP 5 CATEGORIAS
  // -----------------------------------------
  const topCategorias = Object.entries(gastosPorCategoria)
    .map(([id, valor]) => ({
      nome: categorias.find((c) => c.id === id)?.name || "Categoria",
      valor,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  // -----------------------------------------
  // TOP 5 EMPRESAS
  // -----------------------------------------
  const topEmpresas = Object.entries(gastosPorEmpresa)
    .map(([empresa, valor]) => ({ empresa, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 5);

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      {/* TÍTULO + BOTÃO PDF */}
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

      {/* RELATÓRIO VISUAL (ESCUR0) */}
      <div className="flex flex-col gap-10">

        {/* CARDS */}
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

        {/* RESUMO DO MÊS */}
        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-[#facc15]">Resumo do Mês</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300">
            <p>📌 Total de transações: <span className="text-white font-bold">{totalTransacoes}</span></p>
            <p>📌 Média diária de despesas: <span className="text-white font-bold">{mediaDiaria.toFixed(2)} €</span></p>
            <p>📌 Dia mais caro: <span className="text-white font-bold">{diaMaisCaro.date ? new Date(diaMaisCaro.date).toLocaleDateString() : "—"} ({diaMaisCaro.amount.toFixed(2)} €)</span></p>
            <p>📌 Categoria dominante: <span className="text-white font-bold">{categoriaDominante}</span></p>
            <p>📌 Empresa dominante: <span className="text-white font-bold">{empresaDominante}</span></p>
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

        {/* GRÁFICO EVOLUÇÃO DIÁRIA */}
        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-xl font-bold mb-4 text-[#facc15]">Evolução Diária das Despesas</h2>

          <Chart
            type="line"
            height={350}
            series={[
              {
                name: "Despesas",
                data: valoresPorDia,
              },
            ]}
            options={{
              chart: { background: "transparent", foreColor: "#fff" },
              stroke: { curve: "smooth", width: 3 },
              colors: ["#ef4444"],
              xaxis: { categories: dias },
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

      </div>

      {/* ----------------------------------------- */}
      {/* TEMPLATE BRANCO PARA PDF (FUNCIONAL) */}
      {/* ----------------------------------------- */}
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
          transform: "translateY(-200vh)" // fora do ecrã mas renderizado
        }}
      >
        <h1 style={{ fontSize: "26px", marginBottom: "20px" }}>
          Relatório Mensal
        </h1>

        <h2 style={{ fontSize: "20px", marginTop: "20px" }}>Resumo</h2>
        <p>Receitas: {totalReceitas.toFixed(2)} €</p>
        <p>Despesas: {totalDespesas.toFixed(2)} €</p>
        <p>Saldo: {saldo.toFixed(2)} €</p>
        <p>Total de transações: {totalTransacoes}</p>
        <p>Categoria dominante: {categoriaDominante}</p>
        <p>Empresa dominante: {empresaDominante}</p>

        <h2 style={{ fontSize: "20px", marginTop: "20px" }}>Top Categorias</h2>
        <ul>
          {topCategorias.map((c, i) => (
            <li key={i}>
              {c.nome}: {c.valor.toFixed(2)} €
            </li>
          ))}
        </ul>

        <h2 style={{ fontSize: "20px", marginTop: "20px" }}>Top Empresas</h2>
        <ul>
          {topEmpresas.map((e, i) => (
            <li key={i}>
              {e.empresa}: {e.valor.toFixed(2)} €
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
