import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";
import { Html5Qrcode } from "html5-qrcode";

// -------------------------------------------
// BASE INTERNA NIF → Empresa
// -------------------------------------------
const empresasNIF = {
  "500853948": "Continente",
  "500081493": "Pingo Doce",
  "510082347": "Lidl",
  "500777600": "Repsol",
  "500379486": "Galp",
  "504141825": "Auchan",
  "501442798": "Intermarché",
  "501413197": "Worten",
  "502292800": "Fnac",
  "503467044": "Decathlon",
  "505075082": "Leroy Merlin",
  "501627778": "IKEA",
  "509560094": "Burger King",
  "500000000": "McDonald's",
  "500777600": "Prio",
  "509352825": "Mercadona",
  "509849564": "KFC",
  "509980082": "H&M",
  "509300130": "Zara",
  "509300131": "Pull&Bear",
  "509300132": "Bershka"
};

// -------------------------------------------
// Função para gerar data de hoje (local)
// -------------------------------------------
function gerarDataHoje() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// -------------------------------------------
// Interpretar QR AT
// -------------------------------------------
function interpretarQR_AT(
  texto,
  setValor,
  setEmpresa,
  setData,
  setDescricao
) {
  // Aceita QR separados por *, ; ou quebras de linha
  const partes = texto.split(/[\*\n;]/);

  const dados = {};

  partes.forEach((p) => {
    const idx = p.indexOf(":");
    if (idx === -1) return;

    const chave = p.substring(0, idx).trim();
    const valor = p.substring(idx + 1).trim();

    dados[chave] = valor;
  });

  // -----------------------------
  // DATA (F)
  // -----------------------------
  if (dados.F) {
    const d = dados.F;

    if (d.length === 8) {
      setData(
        `${d.substring(0, 4)}-${d.substring(4, 6)}-${d.substring(6, 8)}`
      );
    }
  } else {
    setData(gerarDataHoje());
  }

  // -----------------------------
  // VALOR TOTAL
  // -----------------------------
  const total = dados.O || dados.I2;

  if (total) {
    setValor(total.replace(",", "."));
  }

  // -----------------------------
  // EMPRESA (NIF)
  // -----------------------------
  if (dados.A) {
    const nif = dados.A.replace(/\D/g, "");

    if (empresasNIF[nif]) {
      setEmpresa(empresasNIF[nif]);
    } else {
      setEmpresa(`NIF ${nif}`);
    }
  }

  // -----------------------------
  // Nº DA FATURA
  // -----------------------------
  if (dados.G) {
    setDescricao(dados.G);
  } else {
    setDescricao("Fatura");
  }

  console.log("QR AT:", dados);
}
  }
}

export default function Despesas() {
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(gerarDataHoje()); // ← data inicial correta
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  const [showQR, setShowQR] = useState(false);

  // -------------------------------------------
  // Carregar categorias e empresas
  // -------------------------------------------
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

  // -------------------------------------------
  // QR AT em tempo real
  // -------------------------------------------
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
        console.log(qrText);

interpretarQR_AT(
  qrText,
  setValor,
  setEmpresa,
  setData,
  setDescricao
);

await html5QrCode.stop();
setShowQR(false);
      },
      (error) => console.log("Erro QR:", error)
    );
  }

  // -------------------------------------------
  // Submeter despesa
  // -------------------------------------------
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

    // RESET SEGURO (sem apagar a data)
    setDescricao("");
    setValor("");
    setData(gerarDataHoje()); // ← mantém sempre uma data válida
    setCategoria("");
    setEmpresa("");
  }

  // -------------------------------------------
  // UI
  // -------------------------------------------
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
          📷 Ler QR AT
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

      </PremiumForm>

      {showQR && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-[#111] border border-[#333] rounded-xl w-full max-w-md mx-4 p-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-[#facc15]">
              Aponte para o QR AT da fatura
            </h2>

            <div
              id="qr-reader"
              className="w-full overflow-hidden rounded-lg mb-4"
              style={{ height: "260px" }}
            />
          </div>
        </div>
      )}

    </div>
  );
}
