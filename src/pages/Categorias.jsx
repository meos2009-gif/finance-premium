import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [novaCategoria, setNovaCategoria] = useState("");

  // Estado para edição
  const [editando, setEditando] = useState(null);
  const [nomeEditado, setNomeEditado] = useState("");

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

  async function guardarEdicao() {
    if (!nomeEditado.trim()) return;

    await supabase
      .from("categories")
      .update({ name: nomeEditado })
      .eq("id", editando);

    setEditando(null);
    setNomeEditado("");
    window.location.reload();
  }

  async function apagarCategoria(id) {
    await supabase.from("categories").delete().eq("id", id);
    window.location.reload();
  }

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      <h1 className="text-2xl font-bold text-[#facc15] text-center md:text-left w-full">
        Categorias
      </h1>

      {/* Adicionar nova categoria */}
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

      {/* Lista de categorias */}
      <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
        <ul className="flex flex-col gap-2">
          {categorias.map((c) => (
            <li
              key={c.id}
              className="p-3 bg-[#222] rounded-lg flex justify-between items-center"
            >
              <span>{c.name}</span>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditando(c.id);
                    setNomeEditado(c.name);
                  }}
                  className="px-3 py-1 bg-blue-500 text-black rounded-lg font-bold"
                >
                  Editar
                </button>

                <button
                  onClick={() => apagarCategoria(c.id)}
                  className="px-3 py-1 bg-red-500 text-black rounded-lg font-bold"
                >
                  Apagar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Modal de edição */}
      {editando && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
          <div className="bg-[#111] p-6 rounded-xl border border-[#333] w-[90%] max-w-md">

            <h2 className="text-xl font-bold text-[#facc15] mb-4">
              Editar Categoria
            </h2>

            <input
              value={nomeEditado}
              onChange={(e) => setNomeEditado(e.target.value)}
              className="bg-[#222] p-3 rounded-lg text-white w-full mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditando(null)}
                className="px-4 py-2 bg-gray-600 rounded-lg"
              >
                Cancelar
              </button>

              <button
                onClick={guardarEdicao}
                className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg"
              >
                Guardar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
