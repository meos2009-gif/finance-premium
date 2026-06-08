import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import PremiumForm from "../components/PremiumForm";
import PremiumInput from "../components/PremiumInput";

export default function Despesas() {
  const [categorias, setCategorias] = useState([]);
  const [empresas, setEmpresas] = useState([]);

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState("");
  const [categoria, setCategoria] = useState("");
  const [empresa, setEmpresa] = useState("");

  // 🎤 ESTADO PARA VOZ
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");

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

  // 🎤 INICIAR RECONHECIMENTO DE VOZ
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

  // 🎤 INTERPRETAR TEXTO FALADO
  function interpretarVoz(texto) {
    // VALOR
    const matchValor = texto.match(/(\d+[.,]?\d*)/);
    if (matchValor) {
      setValor(matchValor[0].replace(",", "."));
    }

    // DATA
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

    const regexData = /dia (\d{1,2}) (de )?([a-zç]+)/;
    const matchData = texto.match(regexData);

    if (matchData) {
      const dia = matchData[1].padStart(2, "0");
      const mes = meses[matchData[3]];
      if (mes) {
        const anoAtual = new Date().getFullYear();
        setData(`${anoAtual}-${mes}-${dia}`);
      }
    }

    // CATEGORIA
    categorias.forEach((c) => {
      if (texto.includes(c.name.toLowerCase())) {
        setCategoria(c.id);
      }
    });

    // EMPRESA
    empresas.forEach((e) => {
      if (texto.includes(e.name.toLowerCase())) {
        setEmpresa(e.name);
      }
    });

    // DESCRIÇÃO = tudo antes do valor
    if (matchValor) {
      const partes = texto.split(" ");
      const indexValor = partes.indexOf(matchValor[0]);
      const desc = partes.slice(0, indexValor).join(" ");
      setDescricao(desc.charAt(0).toUpperCase() + desc.slice(1));
    }
  }

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

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#facc15]">
          Adicionar Despesa
        </h1>

        {/* 🎤 BOTÃO DE VOZ */}
        <button
          onClick={iniciarVoz}
          className={`px-4 py-2 rounded-lg font-bold ${
            listening ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {listening ? "🎙️ A ouvir..." : "🎤 Inserir por Voz"}
        </button>
      </div>

      {/* MOSTRAR TEXTO CAPTADO */}
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
              <option key={c.id} value={c.id}>{c.name}</option>
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
    </div>
  );
}
