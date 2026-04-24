import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Chart from "react-apexcharts";

export default function RelatorioMensal() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // -----------------------------
  // LIMITES POR CATEGORIA (podes editar)
  // -----------------------------
  const limites = {
    "Supermercado": 300,
    "Restauração": 150,
    "Transportes": 80,
    "Saúde": 100,
    "Lazer": 120,
  };

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
  // CÁLCULOS DO MÊS ANTERIOR
  // -----------------------------
  const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
  const anoAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;

  const despesasMesAnterior = transacoes.filter((t) => {
    const d = new Date(t.date);
    return t.type === "expense" && d.getMonth() === mesAnterior && d.getFullYear() === anoAnterior;
  });

  // -----------------------------
  // TOTAL POR CATEGORIA (ATUAL E ANTERIOR)
  // -----------------------------
  const totaisAtual = {};
  const totaisAnterior = {};

  despesasMes.forEach((t) => {
    if (!totaisAtual[t.category_id]) totaisAtual[t.category_id] = 0;
    totaisAtual[t.category_id] += Number(t.amount);
  });

  despesasMesAnterior.forEach((t) => {
    if (!totaisAnterior[t.category_id]) totaisAnterior[t.category_id] = 0;
    totaisAnterior[t.category_id] += Number(t.amount);
  });

  // -----------------------------
  // TABELA FINAL PREMIUM
  // -----------------------------
  const tabelaFinal = Object.entries(totaisAtual).map(([id, valorAtual]) => {
    const cat = categorias.find((c) => c.id === id);
    const nome = cat ? cat.name : "Categoria";

    const valorAntigo = totaisAnterior[id] || 0;

    const variacao = valorAntigo === 0
      ? 100
      : ((valorAtual - valorAntigo) / valorAntigo) * 100;

    const limite = limites[nome] || null;
    const percentLimite = limite ? ((valorAtual / limite) * 100).toFixed(1) : null;

    return {
      categoria: nome,
      atual: valorAtual.toFixed(2),
      anterior: valorAntigo.toFixed(2),
      variacao: variacao.toFixed(1),
      limite,
      percentLimite,
      seta:
        variacao > 0
          ? "↓"
          : variacao < 0
          ? "↑"
          : "—",
      cor:
        variacao > 0
          ? "text-red-400"
          : variacao < 0
          ? "text-green-400"
          : "text-gray-400",
      ultrapassou: limite && valorAtual > limite,
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

      {/* TABELA PREMIUM NOVA */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Análise por Categoria</h2>

        <table className="w-full text-left">
          <thead>
            <tr className="text-gray-400 border-b border-[#333]">
              <th className="py-2">Categoria</th>
              <th className="py-2">Atual (€)</th>
              <th className="py-2">Anterior (€)</th>
              <th className="py-2">Variação</th>
              <th className="py-2">Limite</th>
              <th className="py-2">% Limite</th>
            </tr>
          </thead>

          <tbody>
            {tabelaFinal.map((c, i) => (
              <tr
                key={i}
                className={`
                  border-b border-[#222]
                  ${c.ultrapassou ? "bg-red-900/30" : ""}
                `}
              >
                <td className="py-2">{c.categoria}</td>
                <td className="py-2">{c.atual}</td>
                <td className="py-2">{c.anterior}</td>

                <td className={`py-2 font-bold ${c.cor}`}>
                  {c.seta} {c.variacao}%
                </td>

                <td className="py-2 font-semibold">
                  {c.limite ? (
                    c.ultrapassou ? (
                      <span className="text-red-400 flex items-center gap-1">
                        ⚠️ {c.limite}€
                      </span>
                    ) : (
                      <span className="text-green-400">{c.limite}€</span>
                    )
                  ) : (
                    "—"
                  )}
                </td>

                <td className="py-2 font-bold">
                  {c.percentLimite ? (
                    Number(c.percentLimite) > 100 ? (
                      <span className="text-red-400">{c.percentLimite}%</span>
                    ) : (
                      <span className="text-green-400">{c.percentLimite}%</span>
                    )
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
