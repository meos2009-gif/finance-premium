import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Dashboard() {
  const [totalReceitas, setTotalReceitas] = useState(0);
  const [totalDespesas, setTotalDespesas] = useState(0);

  // Buscar receitas e despesas ao carregar a página
  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Buscar receitas
      const { data: receitas, error: err1 } = await supabase
        .from("transactions")
        .select("amount")
        .eq("type", "income")
        .eq("user_id", user.id);

      // Buscar despesas
      const { data: despesas, error: err2 } = await supabase
        .from("transactions")
        .select("amount")
        .eq("type", "expense")
        .eq("user_id", user.id);

      if (!err1 && receitas) {
        const total = receitas.reduce((sum, r) => sum + Number(r.amount), 0);
        setTotalReceitas(total);
      }

      if (!err2 && despesas) {
        const total = despesas.reduce((sum, d) => sum + Number(d.amount), 0);
        setTotalDespesas(total);
      }
    }

    fetchData();
  }, []);

  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="text-white">

      {/* TÍTULO PREMIUM */}
      <h1 className="text-3xl font-semibold mb-8 tracking-wide">
        Dashboard
      </h1>

      {/* GRID DE CARDS PREMIUM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* CARD RECEITAS */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#222] shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
          <p className="text-gray-400 text-sm">Total de Receitas</p>
          <h2 className="text-3xl font-bold mt-2">
            € {totalReceitas.toFixed(2)}
          </h2>
        </div>

        {/* CARD DESPESAS */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#222] shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
          <p className="text-gray-400 text-sm">Total de Despesas</p>
          <h2 className="text-3xl font-bold mt-2">
            € {totalDespesas.toFixed(2)}
          </h2>
        </div>

        {/* CARD SALDO */}
        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-[#222] shadow-lg hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
          <p className="text-gray-400 text-sm">Saldo Atual</p>
          <h2 className="text-3xl font-bold mt-2">
            € {saldo.toFixed(2)}
          </h2>
        </div>

      </div>
    </div>
  );
}
