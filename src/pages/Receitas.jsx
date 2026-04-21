import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";

export default function Receitas() {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();

    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;

    await supabase.from("transactions").insert({
      description: descricao,
      amount: valor,
      date: data,
      type: "income",
      user_id: session.user.id,
    });

    setDescricao("");
    setValor("");
    setData("");
  }

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Adicionar Receita
      </h1>

      <PremiumForm title="Nova Receita" onSubmit={handleSubmit}>
        <PremiumInput
          label="Descrição"
          type="text"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          required
        />

        <PremiumInput
          label="Valor (€)"
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required
        />

        <PremiumInput
          label="Data"
          type="date"
          value={data}
          onChange={(e) => setData(e.target.value)}
          required
        />
      </PremiumForm>
    </div>
  );
}
