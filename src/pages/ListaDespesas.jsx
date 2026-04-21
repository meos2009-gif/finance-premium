import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumTable from "../components/PremiumTable";

export default function ListaDespesas() {
  const [despesas, setDespesas] = useState([]);

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("type", "expense");

      setDespesas(data || []);
    }
    load();
  }, []);

  const colunas = [
    { key: "description", label: "Descrição" },
    { key: "amount", label: "Valor (€)" },
    { key: "date", label: "Data" },
  ];

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Lista de Despesas
      </h1>

      <PremiumTable columns={colunas} data={despesas} />
    </div>
  );
}
