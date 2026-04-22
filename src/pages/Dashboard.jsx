import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumTable from "../components/PremiumTable";

export default function Dashboard() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [cards, setCards] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    categoriaDominante: null,
  });

  const [ranking, setRanking] = useState([]);

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

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

      const { data: trans } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id);

      setTransacoes(trans || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (transacoes.length === 0) return;

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

    const totaisPorCategoria = {};
    despesasMes.forEach((t) => {
      if (!totaisPorCategoria[t.category_id]) totaisPorCategoria[t.category_id] = 0;
      totaisPorCategoria[t.category_id] += Number(t.amount);
    });

    let categoriaDominante = null;
    if (Object.keys(totaisPorCategoria).length > 0) {
      const [catId, valor] = Object.entries(totaisPorCategoria).sort((a, b) => b[1] - a[1])[0];
      const catObj = categorias.find((c) => c.id === catId);
      categoriaDominante = {
        nome: catObj?.name || "Categoria",
        percent: totalDespesas > 0 ? ((valor / totalDespesas) * 100).toFixed(1) : 0,
      };
    }

    const totaisEmpresas = {};
    despesasMes.forEach((t) => {
      if (!totaisEmpresas[t.empresa_id]) totaisEmpresas[t.empresa_id] = 0;
      totaisEmpresas[t.empresa_id] += Number(t.amount);
    });

    const rankingCalc = Object.entries(totaisEmpresas)
      .map(([id, total]) => {
        const emp = empresas.find((e) => e.id === id);
        return {
          empresa: emp?.name || "—",
          total: Number(total).toFixed(2),
          percent: totalDespesas > 0 ? ((total / totalDespesas) * 100).toFixed(1) + "%" : "0%",
        };
      })
      .sort((a, b) => b.total - a.total);

    setRanking(rankingCalc);

    setCards({
      receitas: totalReceitas,
      despesas: totalDespesas,
      saldo,
      categoriaDominante,
    });
  }, [transacoes, categorias, empresas]);

  const colunas = [
    { key: "empresa", label: "Empresa" },
    { key: "total", label: "Total (€)" },
    { key: "percent", label: "% do Mês" },
  ];

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Dashboard
      </h1>

      {/* CARDS PRINCIPAIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Receitas</h2>
          <p className="text-3xl font-bold text-green-400">{cards.receitas.toFixed(2)} €</p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Despesas</h2>
          <p className="text-3xl font-bold text-red-400">{cards.despesas.toFixed(2)} €</p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Saldo</h2>
          <p className={`text-3xl font-bold ${cards.saldo >= 0 ? "text-green-400" : "text-red-400"}`}>
            {cards.saldo.toFixed(2)} €
          </p>
        </div>

        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Categoria Dominante</h2>
          {cards.categoriaDominante ? (
            <p className="text-xl font-bold text-[#facc15]">
              {cards.categoriaDominante.nome} — {cards.categoriaDominante.percent}%
            </p>
          ) : (
            <p className="text-gray-500">Sem dados</p>
          )}
        </div>
      </div>

      {/* DESKTOP: TABELA PREMIUM */}
      <div className="hidden md:block bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Gastos por Empresa</h2>
        <PremiumTable columns={colunas} data={ranking} />
      </div>

      {/* MOBILE: CARDS PREMIUM */}
      <div className="md:hidden flex flex-col gap-3">
        {ranking.map((r, index) => (
          <div
            key={index}
            className={`
              p-4 rounded-xl border border-[#333]
              ${index % 2 === 0 ? "bg-[#1a1a1a]" : "bg-[#151515]"}
            `}
          >
            <div className="font-semibold text-lg text-[#facc15]">
              {r.empresa}
            </div>

            <div className="text-green-400 font-bold text-base">
              {r.total} €
            </div>

            <div className="text-gray-300 text-sm">
              {r.percent} do mês
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
