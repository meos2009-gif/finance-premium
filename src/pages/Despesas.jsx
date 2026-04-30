import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";

// PDF.js — configuração correta para Vite
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

export default function Despesas() {
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  // IMPORTAÇÃO
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvData, setCsvData] = useState([]);

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

  // -----------------------------------------
  // SUBMETER DESPESA MANUAL
  // -----------------------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;

    let empresaId = null;

    if (empresa.trim() !== "") {
      const existente = empresas.find(
        (x) => x.name.toLowerCase() === empresa.toLowerCase()
      );

      if (existente) {
        empresaId = existente.id;
      } else {
        const { data: nova } = await supabase
          .from("empresas")
          .insert({
            name: empresa,
            user_id: session.user.id,
          })
          .select()
          .single();

        empresaId = nova.id;
        setEmpresas((prev) => [...prev, nova]);
      }
    }

    await supabase.from("transactions").insert({
      description: descricao,
      amount: valor,
      date: data,
      type: "expense",
      category_id: categoria,
      empresa_id: empresaId,
      user_id: session.user.id,
    });

    setDescricao("");
    setValor("");
    setData("");
    setCategoria("");
    setEmpresa("");
  }

  // -----------------------------------------
  // IMPORTAÇÃO CSV
  // -----------------------------------------
  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const linhas = text.split("\n").map(l => l.trim()).filter(l => l);

    const header = linhas[0].split(/[,;]+/).map(h => h.toLowerCase());

    const data = linhas.slice(1).map((linha) => {
      const colunas = linha.split(/[,;]+/);

      const obj = {};
      header.forEach((h, i) => {
        obj[h] = colunas[i];
      });

      const descricao = (obj["descrição"] || obj["description"] || "").toUpperCase();
      const valor = Number(obj["valor"] || obj["amount"] || 0);
      const data = obj["data"] || obj["date"];

      return {
        date: data,
        description: descricao,
        amount: Math.abs(valor),
        type: valor < 0 ? "expense" : "income",
        categoria: sugerirCategoria(descricao),
        empresa: sugerirEmpresa(descricao)
      };
    });

    setCsvData(data);
  };

  // -----------------------------------------
  // IMPORTAÇÃO PDF
  // -----------------------------------------
  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;

    let textoCompleto = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const strings = content.items.map((item) => item.str);
      textoCompleto += strings.join(" ") + "\n";
    }

    const linhas = processarExtratoPDF(textoCompleto);
    setCsvData(linhas);
  };

  const processarExtratoPDF = (texto) => {
    const linhas = texto.split("\n").map(l => l.trim()).filter(l => l);

    const resultados = [];

    for (const linha of linhas) {
      const match = linha.match(
        /^(\d{2}[-/]\d{2}[-/]\d{4})\s+(.+?)\s+(-?\d+[.,]\d{2})$/
      );

      if (match) {
        const data = match[1];
        const descricao = match[2].toUpperCase();
        const valor = match[3].replace(",", ".");

        resultados.push({
          date: formatarData(data),
          description: descricao,
          amount: Math.abs(Number(valor)),
          type: Number(valor) < 0 ? "expense" : "income",
          categoria: sugerirCategoria(descricao),
          empresa: sugerirEmpresa(descricao)
        });
      }
    }

    return resultados;
  };

  const formatarData = (d) => {
    const [dia, mes, ano] = d.split(/[-/]/);
    return `${ano}-${mes}-${dia}`;
  };

  // -----------------------------------------
  // CATEGORIZAÇÃO AUTOMÁTICA
  // -----------------------------------------
  const sugerirCategoria = (descricao) => {
    if (descricao.includes("PINGO DOCE")) return "Alimentação";
    if (descricao.includes("CONTINENTE")) return "Alimentação";
    if (descricao.includes("GALP")) return "Combustível";
    if (descricao.includes("REPSOL")) return "Combustível";
    if (descricao.includes("EDP")) return "Energia";
    if (descricao.includes("VODAFONE")) return "Telecomunicações";
    if (descricao.includes("CTT")) return "Serviços";
    if (descricao.includes("SALÁRIO")) return "Receitas";
    return "Outros";
  };

  const sugerirEmpresa = (descricao) => {
    return descricao.split(" ")[0];
  };

  // -----------------------------------------
  // IMPORTAR PARA SUPABASE
  // -----------------------------------------
  const importarParaSupabase = async () => {
    const { data: session } = await supabase.auth.getUser();
    const userId = session.user.id;

    for (const linha of csvData) {
      // EMPRESA
      let empresaId = null;
      let empresaObj = empresas.find(e => e.name === linha.empresa);

      if (!empresaObj) {
        const { data: nova } = await supabase
          .from("empresas")
          .insert({ name: linha.empresa, user_id: userId })
          .select()
          .single();

        empresaObj = nova;
        setEmpresas(prev => [...prev, nova]);
      }

      empresaId = empresaObj.id;

      // CATEGORIA
      let categoriaId = null;
      let categoriaObj = categorias.find(c => c.name === linha.categoria);

      if (!categoriaObj) {
        const { data: nova } = await supabase
          .from("categories")
          .insert({ name: linha.categoria, user_id: userId })
          .select()
          .single();

        categoriaObj = nova;
        setCategorias(prev => [...prev, nova]);
      }

      categoriaId = categoriaObj.id;

      // INSERIR TRANSAÇÃO
      await supabase.from("transactions").insert({
        user_id: userId,
        date: linha.date,
        description: linha.description,
        amount: linha.amount,
        type: linha.type,
        empresa_id: empresaId,
        category_id: categoriaId
      });
    }

    setShowImportModal(false);
    setCsvData([]);
    alert("Importação concluída com sucesso!");
  };

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#facc15]">
          Adicionar Despesa
        </h1>

        <button
          onClick={() => setShowImportModal(true)}
          className="bg-[#facc15] text-black font-bold px-4 py-2 rounded-lg hover:bg-yellow-400 transition"
        >
          Importar Extrato
        </button>
      </div>

      <PremiumForm title="Nova Despesa" onSubmit={handleSubmit}>

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

        {/* CATEGORIA */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Categoria</label>
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="bg-[#111] border border-[#333] text-white rounded-lg px-4 py-3"
            required
          >
            <option value="">Selecione</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* EMPRESA */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-gray-300">Empresa</label>

          <input
            list="lista-empresas"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            placeholder="Escreva ou selecione"
            className="bg-[#111] border border-[#333] text-white rounded-lg px-4 py-3"
            required
          />

          <datalist id="lista-empresas">
            {empresas.map((e) => (
              <option key={e.id} value={e.name} />
            ))}
          </datalist>
        </div>

      </PremiumForm>

      {/* MODAL IMPORTAÇÃO */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-[#111] border border-[#333] p-6 rounded-xl w-[90%] max-w-xl text-white max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-[#facc15]">Importar Extrato</h2>

            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="mb-4"
            />

            <input
              type="file"
              accept=".pdf"
              onChange={handlePDFUpload}
              className="mb-4"
            />

            {csvData.length > 0 && (
              <div className="max-h-[50vh] overflow-y-auto border border-[#333] p-3 rounded">
                {csvData.map((linha, i) => (
                  <div key={i} className="border-b border-[#222] py-2 text-sm">
                    <p><strong>Data:</strong> {linha.date}</p>
                    <p><strong>Descrição:</strong> {linha.description}</p>
                    <p><strong>Valor:</strong> {linha.amount} €</p>
                    <p><strong>Categoria sugerida:</strong> {linha.categoria}</p>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 bg-gray-600 rounded-lg"
              >
                Cancelar
              </button>

              {csvData.length > 0 && (
                <button
                  onClick={importarParaSupabase}
                  className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg"
                >
                  Importar Tudo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
