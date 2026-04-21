import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function RelatorioMensal() {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id);

      setDados(data || []);
    }
    load();
  }, []);

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Relatório Mensal
      </h1>

      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <p className="text-gray-400">Gráficos e análises aqui…</p>
      </div>

    </div>
  );
}
