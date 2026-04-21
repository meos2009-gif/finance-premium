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

  const [editingId, setEditingId] = useState(null);

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

  // Buscar despesas
  useEffect(() => {
    async function fetchDespesas() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("type", "expense")
        .eq("user_id", session.user.id)
        .order("date", { ascending: false });

      setDespesas(data || []);
    }
    fetchDespesas();
  }, []);

  // SUBMETER (CRIAR OU EDITAR)
  async function handleSubmit(e) {
    e.preventDefault();

    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;

    if (editingId) {
      // UPDATE
      const { error } = await supabase
        .from("transactions")
        .update({
          description: descricao,
          amount: Number(valor),
          date: data,
          category_id: categoria,
        })
        .eq("id", editingId);

      if (!error) {
        setDespesas((prev) =>
          prev.map((d) =>
            d.id === editingId
              ? { ...d, description: descricao, amount: valor, date: data, category_id: categoria }
              : d
          )
        );
      }

      setEditingId(null);
    } else {
      // INSERT
      const { data: inserted } = await supabase
        .from("transactions")
        .insert([
          {
            description: descricao,
            amount: Number(valor),
            date: data,
            type: "expense",
            category_id: categoria,
            user_id: session.user.id,
          },
        ])
        .select();

      setDespesas((prev) => [...prev, inserted[0]]);
    }

    // RESET
    setDescricao("");
    setValor("");
    setData("");
    setCategoria("");
  }

  // APAGAR
  async function handleDelete(id) {
    await supabase.from("transactions").delete().eq("id", id);
    setDespesas((prev) => prev.filter((d) => d.id !== id));
  }

  // EDITAR
  function handleEdit(item) {
    setEditingId(item.id);
    setDescricao(item.description);
    setValor(item.amount);
    setData(item.date);
    setCategoria(item.category_id);
  }

  const colunas = [
    { key: "description", label: "Descrição" },
    { key: "amount", label: "Valor (€)" },
    { key: "date", label: "Data" },
  ];

  return (
    <div className="text-white flex flex-col gap-10">

      <PremiumForm
        title={editingId ? "Editar Despesa" : "Adicionar Despesa"}
        onSubmit={handleSubmit}
      >
        <PremiumInput
          label="Descrição"
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

        <PremiumSelect
          label="Categoria"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Selecionar categoria</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </PremiumSelect>

        <button className="bg-[#facc15] hover:bg-[#eab308] text-black font-semibold p-3 rounded-lg">
          {editingId ? "Guardar Alterações" : "Adicionar"}
        </button>
      </PremiumForm>

      <PremiumTable
        columns={colunas}
        data={despesas}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
}
