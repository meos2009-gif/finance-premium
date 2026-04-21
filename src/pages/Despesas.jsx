import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";
import PremiumSelect from "../components/PremiumSelect";
import PremiumTable from "../components/PremiumTable";

export default function Despesas() {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");

  const [categorias, setCategorias] = useState([]);
  const [despesas, setDespesas] = useState([]);

  // Buscar categorias ao carregar a página
  useEffect(() => {
    async function fetchCategorias() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id);

      if (!error) setCategorias(data);
    }

    fetchCategorias();
  }, []);

  // Buscar despesas ao carregar a página
  useEffect(() => {
    async function fetchDespesas() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "expense")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (!error) setDespesas(data);
    }

    fetchDespesas();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: inserted, error } = await supabase
      .from("transactions")
      .insert([
        {
          description: descricao,
          amount: Number(valor),
          date: data,
          type: "expense",
          category_id: categoria,
          user_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.log("ERRO SUPABASE:", error);
      return;
    }

    // Atualizar tabela local
    setDespesas((prev) => [...prev, inserted[0]]);

    // Reset do formulário
    setDescricao("");
    setValor("");
    setData("");
    setCategoria("");
  }

  const colunas = [
    { key: "description", label: "Descrição" },
    { key: "amount", label: "Valor (€)" },
    { key: "date", label: "Data" },
  ];

  return (
    <div className="text-white flex flex-col gap-10">

      {/* FORMULÁRIO PREMIUM */}
      <PremiumForm title="Adicionar Despesa" onSubmit={handleSubmit}>
        <PremiumInput
          label="Descrição"
          type="text"
          required
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <PremiumInput
          label="Valor (€)"
          type="number"
          step="0.01"
          required
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <PremiumInput
          label="Data"
          type="date"
          required
          value={data}
          onChange={(e) => setData(e.target.value)}
        />

        <PremiumSelect
          label="Categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Selecionar categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </PremiumSelect>
      </PremiumForm>

      {/* TABELA PREMIUM */}
      <PremiumTable columns={colunas} data={despesas} />
    </div>
  );
}
