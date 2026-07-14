import { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";
import { Html5Qrcode } from "html5-qrcode";
import Tesseract from "tesseract.js";

export default function Despesas() {
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  const [showQRFlow, setShowQRFlow] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // carregar categorias + empresas
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

  // interpretar QR AT
  function interpretarQR(qrText) {
    qrText = qrText.trim();
    const partes = qrText.split("*").map((p) => p.trim());

    let dados = {};
    partes.forEach((p) => {
      const [key, value] = p.split(":");
      if (!key || !value) return;
      dados[key.trim()] = value.trim();
    });

    // NIF (A)
    if (dados["A"]) {
      const nifLimpo = dados["A"].replace(/[^0-9]/g, "");
      setEmpresa(`NIF ${nifLimpo}`);
    }

    // Descrição
    setDescricao("Fatura");

    // Valor total (O)
    if (dados["O"]) {
      const valorLimpo = dados["O"]
        .replace(",", ".")
        .replace(/[^0-9.]/g, "");
      setValor(valorLimpo);
    }

    // data via foto/OCR → deixa vazio por agora
    setData("");
  }

  // OCR da foto do talão (talão inteiro)
  async function ocrDaFotoTalão(imageSource) {
    const resultado = await Tesseract.recognize(imageSource, "por", {
      logger: (m) => console.log(m),
    });

    const texto = resultado.data.text;

    // data (vários formatos possíveis)
    const regexData =
      /(\d{4}-\d{2}-\d{2})|(\d{2}[./-]\d{2}[./-]\d{2,4})/;
    const matchData = texto.match(regexData);
    if (matchData) {
      let dataStr = matchData[0].replace(/[.\/]/g, "-");
      const partes = dataStr.split("-");
      if (partes[0].length === 2) {
        const ano = "20" + partes[2];
        const mes = partes[1];
        const dia = partes[0];
        setData(`${ano}-${mes}-${dia}`);
      } else {
        setData(dataStr);
      }
    }

    // número da fatura (ex: 02680826/010216)
    const matchNum = texto.match(/\d{6,}\/\d{6}/);
    if (matchNum) {
      setDescricao(`Fatura ${matchNum[0]}`);
    }

    // loja (ex: FAFE, E.N 206)
    const matchLoja = texto.match(/FAFE|E\.N 206|Terminal Pagamento Automático/);
    if (matchLoja && !empresa.startsWith("NIF")) {
      setEmpresa(matchLoja[0]);
    }
  }

  // capturar frame do vídeo e enviar para OCR
  async function capturarFotoETalão() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;
    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/png");
    await ocrDaFotoTalão(dataUrl);
  }

  // fluxo único: abrir câmara, ler QR, esperar 1s, tirar foto, OCR
  useEffect(() => {
    if (!showQRFlow) return;

    let html5QrCode;

    async function startFlow() {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          alert("Nenhuma câmara encontrada.");
          setShowQRFlow(false);
          return;
        }

        const backCamera = devices[devices.length - 1];

        html5QrCode = new Html5Qrcode("qr-reader");

        await html5QrCode.start(
          backCamera.id,
          {
            fps: 10,
            qrbox: 300,
            aspectRatio: 1.0,
            disableFlip: true,
          },
          async (qrText) => {
            // QR lido → preencher campos
            interpretarQR(qrText);

            // parar QR
            await html5QrCode.stop();

            // agora abrir stream manual para capturar foto do talão
            try {
              const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" },
              });
              streamRef.current = stream;
              if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
              }

              // delay de 1 segundo para posicionar talão
              setTimeout(async () => {
                await capturarFotoETalão();

                // parar stream
                if (videoRef.current) {
                  videoRef.current.pause();
                }
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach((t) => t.stop());
                  streamRef.current = null;
                }

                setShowQRFlow(false);
              }, 1000);
            } catch (err) {
              console.error("Erro ao capturar foto do talão:", err);
              setShowQRFlow(false);
            }
          },
          (error) => {
            console.log("Erro QR:", error);
          }
        );
      } catch (err) {
        console.error("Erro ao iniciar fluxo QR+foto:", err);
        setShowQRFlow(false);
      }
    }

    startFlow();

    return () => {
      try {
        if (html5QrCode) html5QrCode.stop();
      } catch {}
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [showQRFlow]);

  // submit
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
          onClick={() => setShowQRFlow(true)}
          className="px-4 py-2 rounded-lg font-bold bg-purple-600"
        >
          📷 Lançar Fatura (QR + Foto)
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

      {showQRFlow && (
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
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-[#facc15]">
                Ler QR e capturar talão
              </h2>
            </div>

            <div
              id="qr-reader"
              className="w-full overflow-hidden rounded-lg mb-4"
              style={{ height: "260px" }}
            />

            {/* vídeo oculto para captura da foto do talão */}
            <video
              ref={videoRef}
              style={{ display: "none" }}
              playsInline
              muted
            />

            <canvas ref={canvasRef} style={{ display: "none" }} />
          </div>
        </div>
      )}
    </div>
  );
}
