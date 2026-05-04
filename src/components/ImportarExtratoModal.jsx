import { useState } from "react";
import { createPortal } from "react-dom";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

// ------------------------------------------------------
// COMPONENTE UNIVERSAL + MODO INTELIGENTE
// ------------------------------------------------------
function UniversalColumnMapper({ headers, sampleRows, onConfirm }) {
  const [mapping, setMapping] = useState({
    date: "",
    description: "",
    amount: "",
    type: "",
    empresa: "",
    categoria: "",
  });

  // MODO INTELIGENTE — tenta adivinhar colunas
  const sugerirMapeamento = () => {
    const sugestao = {
      date: "",
      description: "",
      amount: "",
      type: "",
      empresa: "",
      categoria: "",
    };

    headers.forEach((col) => {
      const valores = sampleRows.map((r) => r[col] || "");

      // DATA
      if (
        !sugestao.date &&
        valores.some((v) =>
          /^\d{1,2}[\/\-. ]\d{1,2}([\/\-. ]\d{2,4})?$/.test(v)
        )
      ) {
        sugestao.date = col;
      }

      // VALOR
      if (
        !sugestao.amount &&
        valores.some((v) =>
          /^-?\d{1,3}(\.\d{3})*,\d{2}$/.test(v) ||
          /^-?\d+(\.\d+)?$/.test(v)
        )
      ) {
        sugestao.amount = col;
      }

      // TIPO
      if (
        !sugestao.type &&
        valores.some((v) =>
          /(D|C|DEBITO|CREDITO|DR|CR)/i.test(v)
        )
      ) {
        sugestao.type = col;
      }

      // DESCRIÇÃO (coluna com texto mais longo)
      const mediaTamanho =
        valores.reduce((acc, v) => acc + v.length, 0) /
        (valores.length || 1);
      if (mediaTamanho > 10 && !sugestao.description) {
        sugestao.description = col;
      }

      // EMPRESA (texto em maiúsculas)
      if (
        !sugestao.empresa &&
        valores.some((v) => /^[A-Z0-9 .\-]{4,}$/.test(v))
      ) {
        sugestao.empresa = col;
      }
    });

    setMapping(sugestao);
  };

  const campos = [
    { key: "date", label: "Data" },
    { key: "description", label: "Descrição" },
    { key: "amount", label: "Valor" },
    { key: "type", label: "Tipo (Débito/Crédito)" },
    { key: "empresa", label: "Empresa (opcional)" },
    { key: "categoria", label: "Categoria (opcional)" },
  ];

  const update = (field, value) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-[#111] p-4 rounded-xl border border-[#333] text-white mb-4">
      <h2 className="text-lg font-bold text-[#facc15] mb-3">Mapear Colunas</h2>

      <button
        onClick={sugerirMapeamento}
        className="mb-4 w-full bg-blue-500 text-black font-bold p-2 rounded-lg"
      >
        Modo Inteligente — Sugerir Mapeamento
      </button>

      {campos.map((campo) => (
        <div key={campo.key} className="mb-3">
          <label className="block mb-1">{campo.label}</label>
          <select
            className="bg-[#222] p-2 rounded w-full"
            value={mapping[campo.key]}
            onChange={(e) => update(campo.key, e.target.value)}
          >
            <option value="">— Selecionar —</option>
            {headers.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      ))}

      <h3 className="text-md font-bold mt-4 mb-2">Pré-visualização</h3>
      <div className="bg-[#222] p-3 rounded text-sm max-h-40 overflow-y-auto">
        {sampleRows.map((row, i) => (
          <div key={i} className="border-b border-[#333] py-1">
            {headers.map((h) => (
              <div key={h}>
                <strong>{h}:</strong> {row[h]}
              </div>
            ))}
          </div>
        ))}
      </div>

      <button
        onClick={() => onConfirm(mapping)}
        className="mt-4 w-full bg-green-500 text-black font-bold p-3 rounded-lg"
      >
        Confirmar Mapeamento
      </button>
    </div>
  );
}

// ------------------------------------------------------
// MODAL PRINCIPAL
// ------------------------------------------------------
export default function ImportarExtratoModal({
  show,
  onClose,
  csvData,
  setCsvData,
  importarParaSupabase,
}) {
  if (!show) return null;

  const [headers, setHeaders] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState(null);

  // -----------------------------
  // CSV UNIVERSAL
  // -----------------------------
  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const linhas = text.split("\n").map((l) => l.trim()).filter((l) => l);

    const header = linhas[0].split(/[,;]+/);
    setHeaders(header);

    const rows = linhas.slice(1).map((linha) => {
      const colunas = linha.split(/[,;]+/);
      const obj = {};
      header.forEach((h, i) => {
        obj[h] = colunas[i] ?? "";
      });
      return obj;
    });

    setRawRows(rows);
    setSampleRows(rows.slice(0, 5));
    setCsvData([]);
    setMapping(null);
  };

  // -----------------------------
  // PDF UNIVERSAL + FILTRO PRO
  // -----------------------------
  const handlePDFUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocument({ data: arrayBuffer }).promise;

    let linhasPDF = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const linhas = {};
      content.items.forEach((item) => {
        const y = Math.round(item.transform[5]);
        if (!linhas[y]) linhas[y] = [];
        linhas[y].push({
          x: item.transform[4],
          text: item.str,
        });
      });

      const linhasOrdenadas = Object.keys(linhas)
        .sort((a, b) => Number(a) - Number(b))
        .map((y) => linhas[y]);

      linhasOrdenadas.forEach((linha) => {
        linha.sort((a, b) => a.x - b.x);
        linhasPDF.push(linha);
      });
    }

    // Reconstrução PRO de colunas
    const rows = linhasPDF.map((linha) => {
      const colunas = [];
      if (linha.length === 0) return {};

      let buffer = linha[0].text;

      for (let i = 1; i < linha.length; i++) {
        const prev = linha[i - 1];
        const curr = linha[i];

        if (curr.x - prev.x < 35) {
          buffer += " " + curr.text;
        } else {
          colunas.push(buffer.trim());
          buffer = curr.text;
        }
      }

      colunas.push(buffer.trim());

      const obj = {};
      colunas.forEach((c, i) => {
        obj[`col${i + 1}`] = c;
      });
      return obj;
    });

    // FILTRO PRO — remover lixo
    const linhasValidas = rows.filter((row) => {
      const texto = Object.values(row).join(" ");

      // 1) Tem de ter pelo menos 2 datas
      const datas = texto.match(/\b\d{1,2}[\/\-. ]\d{1,2}\b/g);
      if (!datas || datas.length < 2) return false;

      // 2) Tem de ter pelo menos 1 valor monetário
      const valores = texto.match(/\b\d{1,3}(\.\d{3})*,\d{2}\b|\b\d+\.\d{2}\b/g);
      if (!valores || valores.length === 0) return false;

      // 3) Remover cabeçalhos/rodapés
      if (/página|millennium|saldo anterior|documento|conta|iban|nib|titular/i.test(texto))
        return false;

      // 4) Remover linhas muito curtas
      if (texto.split(/\s+/).length < 4) return false;

      return true;
    });

    const headers = Object.keys(linhasValidas[0] || {});

    setHeaders(headers);
    setSampleRows(linhasValidas.slice(0, 5));
    setRawRows(linhasValidas);
    setCsvData([]);
    setMapping(null);
  };

  // -----------------------------
  // NORMALIZAÇÃO — EXTRAÇÃO DO VALOR CORRETO
  // -----------------------------
  const handleMappingConfirm = (map) => {
    setMapping(map);

    const normalizado = rawRows.map((row) => {
      const get = (key) => (map[key] ? (row[map[key]] ?? "").trim() : "");

      let fonteValor = get("amount");
      if (!fonteValor || !/[0-9]/.test(fonteValor)) {
        fonteValor = get("description");
      }

      const tokens = (fonteValor || "").split(/\s+/);

      const numerosBrutos = tokens
        .map((t) => t.replace(/\./g, "").replace(",", "."))
        .filter((t) => /^-?\d+(\.\d+)?$/.test(t));

      let rawAmount = "0";

      if (numerosBrutos.length >= 2) {
        rawAmount = numerosBrutos[numerosBrutos.length - 2];
      } else if (numerosBrutos.length === 1) {
        rawAmount = numerosBrutos[0];
      }

      let amount = parseFloat(rawAmount);
      if (isNaN(amount)) amount = 0;

      return {
        date: get("date"),
        description: get("description"),
        amount,
        type: get("type") || null,
        empresa: get("empresa"),
        categoria: get("categoria"),
        selected: true,
      };
    });

    setCsvData(normalizado);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-[#111] p-6 rounded-xl border border-[#333] w-[90%] max-w-xl max-h-[90vh] overflow-y-auto text-white">

        <h2 className="text-xl font-bold text-[#facc15] mb-4">Importar Extrato</h2>

        <input type="file" accept=".csv" onChange={handleCSVUpload} className="mb-4" />
        <input type="file" accept=".pdf" onChange={handlePDFUpload} className="mb-4" />

        {rawRows.length > 0 && !mapping && (
          <UniversalColumnMapper
            headers={headers}
            sampleRows={sampleRows}
            onConfirm={handleMappingConfirm}
          />
        )}

        {csvData.length > 0 && (
          <div className="border border-[#333] p-3 rounded max-h-[50vh] overflow-y-auto text-white">
            {csvData.map((l, i) => (
              <div key={i} className="border-b border-[#222] py-3 text-sm">
                <p><strong>Data:</strong> {l.date}</p>
                <p><strong>Descrição:</strong> {l.description}</p>
                <p><strong>Valor:</strong> {l.amount} €</p>
                <p><strong>Empresa:</strong> {l.empresa}</p>
                <p><strong>Categoria:</strong> {l.categoria}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg">
            Cancelar
          </button>

          {csvData.some((l) => l.selected) && (
            <button
              onClick={() =>
                importarParaSupabase(csvData.filter((l) => l.selected))
              }
              className="px-4 py-2 bg-green-500 text-black font-bold rounded-lg"
            >
              Importar Selecionados
            </button>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}
