import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);

  const [cards, setCards] = useState({
    receitas: 0,
    despesas: 0,
    saldo: 0,
    categoriaDominante: null,
  });

  const [ultimos, setUltimos] = useState([]);

  // Buscar categorias
  useEffect(() => {
    async function fetchCategorias() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id);

      setCategorias(data || []);
    }
    fetchCategorias();
  }, []);

  // Buscar transações
  useEffect(() => {
    async function fetchTransacoes() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id);

      setTransacoes(data || []);
    }
    fetchTransacoes();
  }, []);

  // Calcular cards + últimos movimentos
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

    // Categoria dominante
    const totaisPorCategoria = {};
    despesasMes.forEach((t) => {
      if (!totaisPorCategoria[t.category_id]) totaisPorCategoria[t.category_id] = 0;
      totaisPorCategoria[t.category_id] += Number(t.amount);
    });

    let categoriaDominante = null;
    if (Object.keys(totaisPorCategoria).length > 0) {
      const [catId, valor] = Object.entries(totaisPorCategoria).sort((a, b) => b[1] - a[1])[0];
      const catObj = categorias.find((c) => c.id === Number(catId));
      categoriaDominante = {
        nome: catObj?.name || "Categoria",
        valor,
        percent: totalDespesas > 0 ? ((valor / totalDespesas) * 100).toFixed(1) : 0,
      };
    }

    // Últimos movimentos
    const ultimosMov = [...transacoes]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 6);

    setUltimos(ultimosMov);

    setCards({
      receitas: totalReceitas,
      despesas: totalDespesas,
      saldo,
      categoriaDominante,
    });
  }, [transacoes, categorias]);

  return (
    <div className="text-white flex flex-col gap-10">

      <h1 className="text-2xl font-bold text-[#facc15]">Dashboard</h1>

      {/* CARDS PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* RECEITAS */}
        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Receitas (mês)</h2>
          <p className="text-3xl font-bold text-green-400">
            {cards.receitas.toFixed(2)} €
          </p>
        </div>

        {/* DESPESAS */}
        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Despesas (mês)</h2>
          <p className="text-3xl font-bold text-red-400">
            {cards.despesas.toFixed(2)} €
          </p>
        </div>

        {/* SALDO */}
        <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
          <h2 className="text-gray-400">Saldo</h2>
          <p
            className={`text-3xl font-bold ${
              cards.saldo >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {cards.saldo.toFixed(2)} €
          </p>
        </div>

        {/* CATEGORIA DOMINANTE */}
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

      {/* ÚLTIMOS MOVIMENTOS */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <h2 className="text-xl font-bold mb-4 text-[#facc15]">Últimos Movimentos</h2>

        <div className="flex flex-col gap-4">
          {ultimos.map((t) => {
            const cat = categorias.find((c) => c.id === t.category_id);
            const data = new Date(t.date).toLocaleDateString("pt-PT");

            return (
              <div
                key={t.id}
                className="flex justify-between items-center bg-[#1a1a1a] p-4 rounded-lg border border-[#222] hover:bg-[#222] transition"
              >
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {t.type === "income" ? "🟢" : "🔴"} {t.description}
                  </span>
                  <span className="text-gray-400 text-sm">{cat?.name || "Categoria"}</span>
                </div>

                <div className="text-right">
                  <span
                    className={`font-bold ${
                      t.type === "income" ? "text-green-400" : "text-red-400"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {Number(t.amount).toFixed(2)} €
                  </span>
                  <div className="text-gray-500 text-sm">{data}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
