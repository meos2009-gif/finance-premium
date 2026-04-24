import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import Chart from "react-apexcharts";

export default function VariacaoDespesas() {
  const [transacoes, setTransacoes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [limites, setLimites] = useState([]);

  const [loading, setLoading] = useState(true);

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

      const { data: lim } = await supabase
        .from("limites_categorias")
        .select("*")
        .eq("user_id", userId);

      setLimites(lim || []);

      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="text-white p-6">A carregar...</div>;

  // -----------------------------
  // CÁLCULOS DO MÊS ATUAL
  // -----------------------------
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  const despesasMes = transacoes.filter((t) => {
    const d = new Date(t.date);
    return t.type === "expense" && d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
  });

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
  // TOTAL POR CATEGORIA
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
  // TABELA FINAL
  // -----------------------------
  const tabelaFinal = categorias.map((cat) => {
    const atual = totaisAtual[cat.id] || 0;
    const anterior = totaisAnterior[cat.id] || 0;

    const variacao =
      anterior === 0 ? 100 : ((atual - anterior) / anterior) * 100;

    const limiteObj = limites.find((l) => l.categoria_id === cat.id);
    const limite = limiteObj ? Number(limiteObj.limite) : null;

    const percentLimite = limite ? ((atual / limite) * 100).toFixed(1) : null;

    return {
      categoria: cat.name,
      categoria_id: cat.id,
      atual: atual.toFixed(2),
      anterior: anterior.toFixed(2),
      variacao: variacao.toFixed(1),
      limite,
      percentLimite,
      ultrapassou: limite && atual > limite,
      seta:
        variacao > 0 ? "↓" : variacao < 0 ? "↑" : "—",
      cor:
        variacao > 0
          ? "text-red-400"
          : variacao < 0
          ? "text-green-400"
          : "text-gray-400",
    };
  });

  // -----------------------------
  // ATUALIZAR LIMITE
  // -----------------------------
  async function atualizarLimite(catId, valor) {
    const { data: session } = await supabase.auth.getUser();
    const userId = session.user.id;

    const existente = limites.find((l) => l.categoria_id === catId);

    if (existente) {
      await supabase
        .from("limites_categorias")
        .update({ limite: valor })
        .eq("id", existente.id);
    } else {
      await supabase.from("limites_categorias").insert({
        user_id: userId,
        categoria_id: catId,
        limite: valor,
      });
    }

    const { data: lim } = await supabase
      .from("limites_categorias")
      .select("*")
      .eq("user_id", userId);

    setLimites(lim || []);
  }

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left">
        Variação de Despesas
      </h1>

      {/* TABELA PREMIUM */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">

        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-gray-400">
              <th className="py-3 px-2">Categoria</th>
              <th className="py-3 px-2">Atual (€)</th>
              <th className="py-3 px-2">Anterior (€)</th>
              <th className="py-3 px-2">Variação</th>
              <th className="py-3 px-2">Limite</th>
              <th className="py-3 px-2">% Limite</th>
            </tr>
          </thead>

          <tbody>
            {tabelaFinal.map((c, i) => (
              <tr
                key={i}
                className={`
                  rounded-lg
                  ${i % 2 === 0 ? "bg-[#1a1a1a]" : "bg-[#151515]"}
                  ${c.ultrapassou ? "bg-red-900/40" : ""}
                `}
              >
                <td className="py-3 px-2 font-semibold">{c.categoria}</td>
                <td className="py-3 px-2">{c.atual}</td>
                <td className="py-3 px-2">{c.anterior}</td>

                <td className={`py-3 px-2 font-bold ${c.cor}`}>
                  {c.seta} {c.variacao}%
                </td>

                <td className="py-3 px-2">
                  <input
                    type="number"
                    className="bg-[#222] p-2 rounded-lg w-24"
                    defaultValue={c.limite || ""}
                    onBlur={(e) =>
                      atualizarLimite(c.categoria_id, Number(e.target.value))
                    }
                  />
                </td>

                <td className="py-3 px-2 font-bold">
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
