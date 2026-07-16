import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";
import { Html5Qrcode } from "html5-qrcode";

function gerarDataHoje() {
  const hoje = new Date();
  const yyyy = hoje.getFullYear();
  const mm = String(hoje.getMonth() + 1).padStart(2, "0");
  const dd = String(hoje.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function interpretarQR_AT(
  texto,
  setValor,
  setData,
  setDescricao,
  setNifLido,
  empresas,
  categorias,
  setEmpresa,
  setCategoria
) {
  const partes = texto.split(/[\*\n;]/);
  const dados = {};

  partes.forEach((p) => {
    const idx = p.indexOf(":");
    if (idx === -1) return;
    const chave = p.substring(0, idx).trim();
    const valor = p.substring(idx + 1).trim();
    dados[chave] = valor;
  });

  if (dados.F) {
    const d = dados.F;
    if (d.length === 8) {
      setData(`${d.substring(0,4)}-${d.substring(4,6)}-${d.substring(6,8)}`);
    } else {
      setData(gerarDataHoje());
    }
  } else {
    setData(gerarDataHoje());
  }

  const total = dados.O || dados.I2;
  if (total) setValor(total.replace(",", "."));

  if (dados.A) {
    const nif = dados.A.replace(/\D/g, "");
    setNifLido(nif);

    const existente = empresas.find((e) => e.nif === nif);

    if (existente) {
      setEmpresa(existente.name);

      if (existente.categoria_padrao) {
        const cat = categorias.find(c => c.id === existente.categoria_padrao);
        if (cat) setCategoria(cat.id);
      }
    } else {
      setEmpresa("");
      setCategoria("");
    }
  }

  setDescricao(dados.G || "Fatura");
}

export default function Despesas() {
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(gerarDataHoje());
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [nifLido, setNifLido] = useState(null);

  const [showQR, setShowQR] = useState(false);

  async function carregarEmpresasECategorias() {
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

  useEffect(() => {
    carregarEmpresasECategorias();
  }, []);

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
        interpretarQR_AT(
          qrText,
          setValor,
          setData,
          setDescricao,
          setNifLido,
          empresas,
          categorias,
          setEmpresa,
          setCategoria
        );

        await html5QrCode.stop();
        setShowQR(false);
      }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const { data: session } = await supabase.auth.getUser();
    if (!session?.user) return;

    let empresaId = null;

    if (empresa.trim() !== "") {
      let existente = null;

      if (nifLido) {
        existente = empresas.find((x) => x.nif === nifLido);
      }

      if (!existente) {
        existente = empresas.find(
          (x) => x.name.toLowerCase() === empresa.toLowerCase()
        );
      }

      if (existente) {
        empresaId = existente.id;

        if (categoria && categoria !== existente.categoria_padrao) {
          await supabase
            .from("empresas")
            .update({ categoria_padrao: categoria })
            .eq("id", existente.id);
        }

      } else {
        const { data: nova } = await supabase
          .from("empresas")
          .insert({
            name: empresa,
            nif: nifLido || null,
            categoria_padrao: categoria || null,
            user_id: session.user.id,
          })
          .select()
          .single();

        empresaId = nova.id;

        await carregarEmpresasECategorias();
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
    setData(gerarDataHoje());
    setCategoria("");
    setEmpresa("");
    setNifLido(null);
  }

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      {/* BOTÃO FIXO — SEMPRE VISÍVEL */}
      <button
        onClick={() => {
          setShowQR(true);
          setTimeout(() => iniciarLeitorQR(), 300);
        }}
        className="fixed top-4 right-4 z-[9999] px-4 py-2 rounded-lg font-bold bg-purple-600 text-white shadow-lg"
      >
        📷 QR
      </button>

      <h1 className="text-2xl font-bold text-[#facc15] mt-16">
        Adicionar Despesa
      </h1>

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
