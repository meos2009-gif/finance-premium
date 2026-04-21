import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState("");

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id)
        .order("name");

      setCategorias(data || []);
    }
    load();
  }, []);

  async function adicionarCategoria() {
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;

    if (!novaCategoria.trim()) return;

    await supabase.from("categories").insert({
      name: novaCategoria,
      user_id: session.user.id,
    });

    setNovaCategoria("");
    window.location.reload();
  }

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Categorias
      </h1>

      <div className="bg-[#111] border border-[#222] p-6 rounded-xl flex flex-col gap-4">
        <input
          value={novaCategoria}
          onChange={(e) => setNovaCategoria(e.target.value)}
          className="bg-[#222] p-3 rounded-lg text-white"
          placeholder="Nova categoria"
        />
        <button
          onClick={adicionarCategoria}
          className="bg-[#facc15] text-black font-bold p-3 rounded-lg"
        >
          Adicionar
        </button>
      </div>

      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <ul className="flex flex-col gap-2">
          {categorias.map((c) => (
            <li key={c.id} className="p-3 bg-[#222] rounded-lg">
              {c.name}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
