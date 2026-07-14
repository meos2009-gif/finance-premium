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

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  const [showQR, setShowQR] = useState(false);

  // ============================
  // CARREGAR CATEGORIAS + EMPRESAS
  // ============================
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

  // ============================
  // VOZ
  // ============================
  function iniciarVoz() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("O teu dispositivo não suporta reconhecimento de voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "pt-PT";
    recognition.continuous = false;
    recognition.interimResults = false;

    setListening(true);

    recognition.onresult = (event) => {
      const texto = event.results[0][0].transcript.toLowerCase();
      setTranscript(texto);
      interpretarVoz(texto);
    };

    recognition.onerror = () => {
      alert("Não consegui ouvir claramente. Tenta novamente.");
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.start();
  }

  function interpretarVoz(texto) {
    texto = texto.toLowerCase();

    let partes = texto.split(" ");
    let primeira = partes[0];

    if (primeira) {
      primeira = primeira.replace(/,/g, "").trim();
      primeira = primeira.charAt(0).toUpperCase() + primeira.slice(1);
      setDescricao(primeira);
    }

    let valorExtraido = null;

    const numero = texto.match(/(\d+[.,]?\d*)/);
    if (numero) valorExtraido = numero[0].replace(",", ".");

    if (texto.includes("cent")) {
      const partesValor = texto.split(" ");
      let euros = 0;
      let centimos = 0;

      partesValor.forEach((p, i) => {
        if (p === "euros" || p === "euro") {
          const n = parseFloat(partesValor[i - 1].replace(",", "."));
          if (!isNaN(n)) euros = n;
        }
        if (p.startsWith("cent")) {
          const n = parseFloat(partesValor[i - 1].replace(",", "."));
          if (!isNaN(n)) centimos = n;
        }
      });

      valorExtraido = euros + centimos / 100;
    }

    if (valorExtraido) setValor(valorExtraido);

    const meses = {
      janeiro: "01",
      fevereiro: "02",
      março: "03",
      abril: "04",
      maio: "05",
      junho: "06",
      julho: "07",
      agosto: "08",
      setembro: "09",
      outubro: "10",
      novembro: "11",
      dezembro: "12",
    };

    const regexData = /(\d{1,2}) (de )?([a-zç]+)/;
    const matchData = texto.match(regexData);

    if (matchData) {
      const dia = matchData[1].padStart(2, "0");
      const mes = meses[matchData[3]];
      if (mes) {
        const anoAtual = new Date().getFullYear();
        setData(`${anoAtual}-${mes}-${dia}`);
      }
    }

    let categoriaEncontrada = null;

    const idxCategoria = texto.indexOf("categoria ");
    if (idxCategoria !== -1) {
      const depois = texto.slice(idxCategoria + 10).trim();
      categorias.forEach((c) => {
        const nome = c.name.toLowerCase();
        const nomeSemAcento = nome
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const depoisSemAcento = depois
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        if (depoisSemAcento.startsWith(nomeSemAcento)) {
          categoriaEncontrada = c.id;
        }
      });
    }

    if (!categoriaEncontrada) {
      categorias.forEach((c) => {
        const nome = c.name.toLowerCase();
        const nomeSemAcento = nome
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
        const textoSemAcento = texto
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        if (textoSemAcento.includes(nomeSemAcento)) {
          categoriaEncontrada = c.id;
        }
      });
    }

    if (categoriaEncontrada) setCategoria(categoriaEncontrada);

    let empresaEncontrada = null;

    const idxEmpresa = texto.indexOf("empresa ");
    if (idxEmpresa !== -1) {
      const depois = texto.slice(idxEmpresa + 8).trim();
      empresas.forEach((e) => {
        const nome = e.name.toLowerCase();
        if (depois.startsWith(nome)) empresaEncontrada = e.name;
      });
    }

    if (empresaEncontrada) setEmpresa(empresaEncontrada);
  }

  // ============================
  // QR CODE — INTERPRETAÇÃO AT ROBUSTA
  // ============================
function interpretarQR(qrText) {
  qrText = qrText.trim();
  const partes = qrText.split("*").map(p => p.trim());

  let dados = {};

  partes.forEach((p) => {
    const [key, value] = p.split(":");
    if (!key || !value) return;

    const k = key.trim();
    const v = value.trim();

    dados[k] = v;
  });

  // NIF (A)
  if (dados["A"]) {
    const nifLimpo = dados["A"].replace(/[^0-9]/g, "");
    setEmpresa(`NIF ${nifLimpo}`);
  }

  // Descrição fixa
  setDescricao("Fatura");

  // VALOR TOTAL (O)
  if (dados["O"]) {
    const valorLimpo = dados["O"]
      .replace(",", ".")
      .replace(/[^0-9.]/g, "");
    setValor(valorLimpo);
  }

  // DATA (por agora: hoje)
  const hoje = new Date().toISOString().split("T")[0];
  setData(hoje);
}




  // ============================
  // QR CODE — SCANNER (CÂMARA TRASEIRA)
  // ============================
  useEffect(() => {
    if (!showQR) return;

    async function startScanner() {
      try {
        const devices = await Html5Qrcode.getCameras();

        if (!devices || devices.length === 0) {
          alert("Nenhuma câmara encontrada.");
          return;
        }

        let backCamera = devices.find((d) =>
          d.label.toLowerCase().includes("back")
        );

        if (!backCamera) backCamera = devices[devices.length - 1];

        const html5QrCode = new Html5Qrcode("qr-reader");

        await html5QrCode.start(
          backCamera.id,
          {
            fps: 10,
            qrbox: 350,
            aspectRatio: 1.0,
            disableFlip: true,
          },
          (qrText) => {
            interpretarQR(qrText);
            html5QrCode.stop();
            setShowQR(false);
          },
          (error) => {
            console.log("Erro QR:", error);
          }
        );
      } catch (err) {
        console.error("Erro ao iniciar scanner:", err);
      }
    }

    startScanner();

    return () => {
      try {
        const qr = new Html5Qrcode("qr-reader");
        qr.stop();
      } catch {}
    };
  }, [showQR]);

  // ============================
  // SUBMETER FORMULÁRIO
  // ============================
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
    setTranscript("");
  }

  // ============================
  // JSX
  // ============================
  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">
      <div className="flex justify-between items-center gap-3">
        <h1 className="text-2xl font-bold text-[#facc15]">
          Adicionar Despesa
        </h1>

        <div className="flex gap-2">
          <button
            onClick={iniciarVoz}
            className={`px-4 py-2 rounded-lg font-bold ${
              listening ? "bg-red-500" : "bg-green-500"
            }`}
          >
            {listening ? "🎙️ A ouvir..." : "🎤 Inserir por Voz"}
          </button>

          <button
            onClick={() => setShowQR(true)}
            className="px-4 py-2 rounded-lg font-bold bg-purple-600"
          >
            📷 Lançar por QR Code
          </button>
        </div>
      </div>

      {transcript && (
        <div className="bg-[#222] p-3 rounded-lg text-gray-300 text-sm border border-[#333]">
          <strong>Voz:</strong> {transcript}
        </div>
      )}

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
          onClick={() => setShowQR(false)}
          style={{
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
          }}
        >
          <div
            className="bg-[#111] border border-[#333] rounded-xl w-full max-w-md mx-4 p-4 flex flex-col gap-4 relative"
            style={{ pointerEvents: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#facc15]">
                Ler QR Code da Fatura
              </h2>
              <button
                onClick={() => setShowQR(false)}
                className="text-sm text-gray-300 hover:text-white"
              >
                Fechar ✕
              </button>
            </div>

            <div
              id="qr-reader"
              className="w-full overflow-hidden rounded-lg"
              style={{
                pointerEvents: "auto",
                height: "350px",
                maxHeight: "80vh",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
