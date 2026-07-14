import { useEffect, useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";
import { Html5Qrcode } from "html5-qrcode";
import Tesseract from "tesseract.js";

const empresasInternas = {
  "500853948": "Continente",
  "500384620": "Pingo Doce",
  "504296244": "Lidl",
  "500697256": "Repsol",
  "500499059": "Galp",
  "504032798": "Auchan",
  "500081568": "Minipreço",
  "502593640": "Intermarché",
  "510388456": "Prio",
  "500745938": "McDonald's",
  "510839240": "Burger King",
  "502011378": "Worten",
  "501844810": "Fnac",
  "504295371": "Decathlon",
  "503467044": "Leroy Merlin",
  "501280353": "IKEA",
  "502593640": "Bricomarché",
  "500102640": "BP",
  "500381993": "Jumbo",
  "500777360": "MEO",
  "500051370": "Vodafone",
  "500077568": "NOS"
};

function simplificarNomeLegal(nome) {
  if (!nome) return null;

  const mapaSimplificado = {
    "Modelo Continente": "Continente",
    "Jerónimo Martins": "Pingo Doce",
    "Lidl": "Lidl",
    "Repsol": "Repsol",
    "Galp": "Galp",
    "Auchan": "Auchan",
    "Minipreço": "Minipreço",
    "Intermarché": "Intermarché",
    "Prio": "Prio",
    "McDonald's": "McDonald's",
    "Burger King": "Burger King",
    "Worten": "Worten",
    "Fnac": "Fnac",
    "Decathlon": "Decathlon",
    "Leroy Merlin": "Leroy Merlin",
    "IKEA": "IKEA",
    "Bricomarché": "Bricomarché",
    "BP": "BP",
    "Jumbo": "Jumbo",
    "MEO": "MEO",
    "Vodafone": "Vodafone",
    "NOS": "NOS"
  };

  for (const chave in mapaSimplificado) {
    if (nome.includes(chave)) {
      return mapaSimplificado[chave];
    }
  }

  return nome.split(",")[0];
}

async function buscarNomeLegalINCM(nif) {
  try {
    const resposta = await fetch(`https://transparencia.incm.pt/api/empresas?nif=${nif}`);
    const dados = await resposta.json();

    if (dados && dados.nome) {
      return simplificarNomeLegal(dados.nome);
    }

    return null;
  } catch (e) {
    return null;
  }
}

export default function Despesas() {
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  const [showQR, setShowQR] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
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
  function interpretarQR_AT(texto) {
    const partes = texto.split("*").map((p) => p.trim());
    let dados = {};

    partes.forEach((p) => {
      const [key, value] = p.split(":");
      if (!key || !value) return;
      dados[key.trim()] = value.trim();
    });

    // Valor total
    if (dados["O"]) {
      const v = dados["O"].replace(",", ".").replace(/[^0-9.]/g, "");
      setValor(v);
    }

    // Empresa (NIF → nome interno → INCM → fallback)
    if (dados["A"]) {
      const nif = dados["A"].replace(/[^0-9]/g, "");

      if (empresasInternas[nif]) {
        setEmpresa(empresasInternas[nif]); // nome simples interno
      } else {
        buscarNomeLegalINCM(nif).then((nome) => {
          if (nome) {
            setEmpresa(nome); // nome simplificado da INCM
          } else {
            setEmpresa(`NIF ${nif}`); // fallback
          }
        });
      }
    }

    setDescricao("Fatura");
  }

  async function iniciarLeitorQR() {
    const html5QrCode = new Html5Qrcode("qr-reader");

    const devices = await Html5Qrcode.getCameras();
    if (!devices || devices.length === 0) {
      alert("Nenhuma câmara encontrada.");
      return;
    }

    const backCamera = devices[devices.length - 1];

    html5QrCode.start(
      backCamera.id,
      {
        fps: 10,
        qrbox: 300,
        aspectRatio: 1.0,
        disableFlip: true,
      },
      async (qrText) => {
        interpretarQR_AT(qrText);

        await html5QrCode.stop();
        setShowQR(false);

        setTimeout(() => abrirCameraParaFotoManual(), 300);
      },
      (error) => console.log("Erro QR:", error)
    );
  }

  async function abrirCameraParaFotoManual() {
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

  async function tirarFotoManual() {
    const video = videoRef.current;
    const canvas = document.createElement("canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    const imageData = canvas.toDataURL("image/png");

    streamRef.current.getTracks().forEach((t) => t.stop());
    setShowCamera(false);

    lerDataViaOCR(imageData);
  }

  async function lerDataViaOCR(imageData) {
    const result = await Tesseract.recognize(imageData, "por");

    const texto = result.data.text;

    const regexData =
      /(\d{4}[\/\-\.]\d{2}[\/\-\.]\d{2})|(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/;

    const d = texto.match(regexData);

    if (d) {
      let dt = d[0].replace(/\./g, "-").replace(/\//g, "-");

      if (dt.includes("-")) {
        const partes = dt.split("-");
        if (partes[0].length === 2) {
          dt = `${partes[2]}-${partes[1]}-${partes[0]}`;
        }
      }

      setData(dt);
      alert("Data extraída com sucesso!");
    } else {
      alert("Não foi possível ler a data. Tente aproximar mais a linha da data.");
    }
  }
  async function handleSubmit(e) {
    e.preventDefault();

    const { data: session } = await supabase.auth.getUser();
    if (!session?.user) return;

    let empresaId = null;

    // Se a empresa já existir na base de dados → usar ID existente
    if (empresa.trim() !== "") {
      const existente = empresas.find(
        (x) => x.name.toLowerCase() === empresa.toLowerCase()
      );

      if (existente) {
        empresaId = existente.id;
      } else {
        // Criar nova empresa automaticamente
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

    // Inserir despesa
    await supabase.from("transactions").insert({
      description: descricao,
      amount: valor,
      date: data,
      type: "expense",
      category_id: categoria,
      empresa_id: empresaId,
      user_id: session.user.id,
    });

    // Reset dos campos
    setDescricao("");
    setValor("");
    setData("");
    setCategoria("");
    setEmpresa("");
  }
  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">
      
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-2xl font-bold text-[#facc15]">
          Adicionar Despesa
        </h1>

        <button
          onClick={() => {
            setShowQR(true);
            setTimeout(() => iniciarLeitorQR(), 300);
          }}
          className="px-4 py-2 rounded-lg font-bold bg-purple-600"
        >
          📷 Ler Fatura (QR AT + Data)
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

      {/* MODAL QR AT */}
      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-md mx-4 p-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#facc15]">
              Aponte para o QR AT (fatura)
            </h2>

            <div
              id="qr-reader"
              className="w-full overflow-hidden rounded-lg mb-4"
              style={{ height: "260px" }}
            />
          </div>
        </div>
      )}

      {/* MODAL CÂMARA */}
      {showCamera && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-md mx-4 p-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#facc15]">
              Aponte a câmara para a linha da data
            </h2>

            <video
              ref={videoRef}
              className="w-full rounded-lg"
              style={{ maxHeight: "300px" }}
            />

            <button
              onClick={tirarFotoManual}
              className="px-4 py-3 rounded-lg font-bold bg-yellow-500 text-black text-lg"
            >
              📸 Tirar Foto da Data
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
