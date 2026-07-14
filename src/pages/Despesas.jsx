import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";
import { Html5Qrcode } from "html5-qrcode";

export default function Despesas() {
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  const [showQR, setShowQR] = useState(false);
  const [fase, setFase] = useState("AT"); // AT → DATA

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

    if (dados["O"]) {
      const v = dados["O"].replace(",", ".").replace(/[^0-9.]/g, "");
      setValor(v);
    }

    if (dados["A"]) {
      const nif = dados["A"].replace(/[^0-9]/g, "");
      setEmpresa(`NIF ${nif}`);
    }

    setDescricao("Fatura");
  }

  function interpretarQR_Data(texto) {
    const regexData = /(\d{4}-\d{2}-\d{2})/;
    const d = texto.match(regexData);

    if (d) setData(d[0]);
  }

  async function iniciarLeitorSequencial() {
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
        if (fase === "AT") {
          interpretarQR_AT(qrText);
          setFase("DATA");
          alert("QR AT lido! Agora aponte para o QR da data.");
          return;
        }

        if (fase === "DATA") {
          interpretarQR_Data(qrText);

          await html5QrCode.stop();
          setShowQR(false);
          setFase("AT");

          alert("Fatura lida com sucesso!");
        }
      },
      (error) => console.log("Erro QR:", error)
    );
  }

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

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-2xl font-bold text-[#facc15]">
          Adicionar Despesa
        </h1>

        <button
          onClick={() => {
            setShowQR(true);
            setTimeout(() => iniciarLeitorSequencial(), 300);
          }}
          className="px-4 py-2 rounded-lg font-bold bg-purple-600"
        >
          📷 Ler Fatura (AT + Data)
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

      {showQR && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center"
          style={{
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div
            className="bg-[#111] border border-[#333] rounded-xl w-full max-w-md mx-4 p-4 flex flex-col gap-4 relative"
          >
            <h2 className="text-lg font-bold text-[#facc15]">
              {fase === "AT"
                ? "Aponte para o QR AT (fatura)"
                : "Aponte para o QR da data"}
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
