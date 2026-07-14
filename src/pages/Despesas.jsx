import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";
import Tesseract from "tesseract.js";

export default function Despesas() {
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  const [showCamera, setShowCamera] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // -----------------------------
  // OCR EXTRAÇÃO
  // -----------------------------

  function extrairValorTotal(texto) {
    const linhas = texto.split("\n").map(l => l.trim().toUpperCase());
    for (const linha of linhas) {
      if (linha.includes("TOTAL")) {
        const match = linha.match(/(\d+[.,]\d{2})/);
        if (match) return match[1].replace(",", ".");
      }
    }
    return null;
  }

  function extrairData(texto) {
    const regexData =
      /(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})|(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/;

    const d = texto.match(regexData);
    if (!d) return null;

    let dt = d[0].replace(/\./g, "-").replace(/\//g, "-");

    if (dt.includes("-")) {
      const partes = dt.split("-");
      if (partes[0].length === 2) {
        dt = `${partes[2]}-${partes[1]}-${partes[0]}`;
      }
    }

    return dt;
  }

  function extrairNomeLoja(texto) {
    const lojas = [
      "CONTINENTE",
      "PINGO DOCE",
      "LIDL",
      "REPSOL",
      "GALP",
      "AUCHAN",
      "MINIPREÇO",
      "INTERMARCHÉ",
      "PRIO",
      "MCDONALD",
      "BURGER KING",
      "WORTEN",
      "FNAC",
      "DECATHLON",
      "LEROY MERLIN",
      "IKEA",
      "BRICOMARCHÉ",
      "BP",
      "JUMBO",
      "MEO",
      "VODAFONE",
      "NOS"
    ];

    const linhas = texto.split("\n").map(l => l.trim().toUpperCase());

    for (const linha of linhas) {
      for (const loja of lojas) {
        if (linha.includes(loja)) return linha;
      }
    }

    return null;
  }

  async function lerFaturaCompleta(imageData) {
    const result = await Tesseract.recognize(imageData, "por");
    const texto = result.data.text;

    const valorExtraido = extrairValorTotal(texto);
    if (valorExtraido) setValor(valorExtraido);

    const dataExtraida = extrairData(texto);
    if (dataExtraida) setData(dataExtraida);

    const lojaExtraida = extrairNomeLoja(texto);
    if (lojaExtraida) setEmpresa(lojaExtraida);

    setDescricao("Fatura");
  }

  // -----------------------------
  // CARREGAR CATEGORIAS E EMPRESAS
  // -----------------------------

  useEffect(() => {
    async function load() {
      const { data: session } = await supabase.auth.getUser();
      if (!session?.user) return;

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

  // -----------------------------
  // CÂMARA + FOTO
  // -----------------------------

  async function abrirCameraParaFoto() {
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (err) {
      alert("Erro ao abrir a câmara.");
    }
  }

  async function tirarFotoFaturaCompleta() {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/png");

    streamRef.current.getTracks().forEach((t) => t.stop());
    setShowCamera(false);

    lerFaturaCompleta(imageData);
  }

  // -----------------------------
  // SUBMETER DESPESA
  // -----------------------------

  async function handleSubmit(e) {
    e.preventDefault();

    const { data: session } = await supabase.auth.getUser();
    if (!session?.user) return;

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

  // -----------------------------
  // UI COMPLETA
  // -----------------------------

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">
      
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-2xl font-bold text-[#facc15]">
          Adicionar Despesa
        </h1>

        <button
          onClick={() => abrirCameraParaFoto()}
          className="px-4 py-2 rounded-lg font-bold bg-purple-600"
        >
          📸 Ler Fatura Completa (OCR Total)
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
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

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

      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-md mx-4 p-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#facc15]">
              Aponte a câmara para a fatura completa
            </h2>

            <video
              ref={videoRef}
              className="w-full rounded-lg"
              style={{ maxHeight: "300px" }}
            />

            <button
              onClick={tirarFotoFaturaCompleta}
              className="px-4 py-3 rounded-lg font-bold bg-yellow-500 text-black text-lg"
            >
              📸 Tirar Foto da Fatura
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
