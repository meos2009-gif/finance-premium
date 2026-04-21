import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Despesas() {
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  const [empresaInput, setEmpresaInput] = useState("");
  const [empresas, setEmpresas] = useState([]);
  const [empresasFiltradas, setEmpresasFiltradas] = useState([]);
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session.user) return;

      const { data: cat } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", session.user.id);

      setCategorias(cat || []);

      const { data: emp } = await supabase
        .from("empresas")
        .select("*")
        .eq("user_id", session.user.id);

      setEmpresas(emp || []);
    }
    load();
  }, []);

  // AUTOCOMPLETE
  const handleEmpresaChange = (e) => {
    const valor = e.target.value;
    setEmpresaInput(valor);

    if (valor.trim() === "") {
      setEmpresasFiltradas([]);
      setMostrarSugestoes(false);
      return;
    }

    const filtradas = empresas.filter((emp) =>
      emp.name.toLowerCase().includes(valor.toLowerCase())
    );

    setEmpresasFiltradas(filtradas);
    setMostrarSugestoes(true);
  };

  const selecionarEmpresa = (nome) => {
    setEmpresaInput(nome);
    setMostrarSugestoes(false);
  };

  // SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;

    // 1) Verificar se empresa existe
    let empresaId = null;

    const empresaExistente = empresas.find(
      (emp) => emp.name.toLowerCase() === empresaInput.toLowerCase()
    );

    if (empresaExistente) {
      empresaId = empresaExistente.id;
    } else {
      // Criar empresa nova
      const { data: novaEmpresa } = await supabase
        .from("empresas")
        .insert({
          name: empresaInput,
          user_id: session.user.id,
        })
        .select()
        .single();

      empresaId = novaEmpresa.id;

      // Atualizar lista local
      setEmpresas((prev) => [...prev, novaEmpresa]);
    }

    // 2) Inserir despesa
    await supabase.from("transactions").insert({
      description: descricao,
      amount: valor,
      date: data,
      type: "expense",
      category_id: categoriaId,
      empresa_id: empresaId,
      user_id: session.user.id,
    });

    // Reset
    setDescricao("");
    setValor("");
    setData("");
    setCategoriaId("");
    setEmpresaInput("");
  };

  return (
    <div className="text-white flex flex-col gap-10">
      <h1 className="text-2xl font-bold text-[#facc15]">Adicionar Despesa</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        <div>
          <label className="text-sm text-gray-300">Descrição</label>
          <input
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-[#333] text-white focus:border-[#facc15]"
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-300">Valor (€)</label>
          <input
            type="number"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-[#333] text-white focus:border-[#facc15]"
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-300">Data</label>
          <input
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-[#333] text-white focus:border-[#facc15]"
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-300">Categoria</label>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full p-3 rounded-lg bg-[#111] border border-[#333] text-white focus:border-[#facc15]"
            required
          >
            <option value="">Selecionar...</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* AUTOCOMPLETE DE EMPRESAS */}
        <div className="relative w-full">
          <label className="text-sm text-gray-300">Empresa</label>
          <input
            type="text"
            value={empresaInput}
            onChange={handleEmpresaChange}
            onFocus={() => setMostrarSugestoes(true)}
            className="w-full p-3 rounded-lg bg-[#111] border border-[#333] text-white focus:border-[#facc15]"
            placeholder="Ex: Mercadona"
            required
          />

          {mostrarSugestoes && empresasFiltradas.length > 0 && (
            <ul className="absolute z-20 w-full bg-[#1a1a1a] border border-[#333] rounded-lg mt-1 max-h-40 overflow-y-auto shadow-xl">
              {empresasFiltradas.map((emp) => (
                <li
                  key={emp.id}
                  onClick={() => selecionarEmpresa(emp.name)}
                  className="p-3 cursor-pointer hover:bg-[#222] text-white"
                >
                  {emp.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          className="w-full p-3 rounded-lg bg-[#facc15] text-black font-bold hover:bg-yellow-400"
        >
          Guardar Despesa
        </button>
      </form>
    </div>
  );
}
