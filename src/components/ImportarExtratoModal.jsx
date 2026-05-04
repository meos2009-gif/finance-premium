import { useState } from "react";
import { createPortal } from "react-dom";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

// Componente interno para mapear colunas do CSV
function UniversalColumnMapper({ headers, sampleRows, onConfirm }) {
  const [mapping, setMapping] = useState({
    date: "",
    description: "",
    amount: "",
    type: "",
    empresa: "",
    categoria: "",
  });

  const update = (field, value) => {
    setMapping((prev) => ({ ...prev, [field]: value }));
  };

  const campos = [
    { key: "date", label: "Data" },
    { key: "description", label: "Descrição" },
    { key: "amount", label: "Valor" },
    { key: "type", label: "Tipo (Débito/Crédito)" },
    { key: "empresa", label: "Empresa (opcional)" },
    { key: "categoria", label: "Categoria (opcional)" },
  ];

  return (
    <div className="bg-[#111] p-4 rounded-xl border border-[#333] text-white mb-4">
      <h2 className="text-lg font-bold text-[#facc15] mb-3">Mapear Colunas</h2>

      <p className="text-sm text-gray-400 mb-4">
        Escolhe que coluna corresponde a cada campo.
      </p>

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

export default function ImportarExtratoModal({
  show,
  onClose,
  csvData,
  setCsvData,
  importarParaSupabase,
  categorias = [],
  empresas = [],
}) {
  if (!show) return null;

  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("");

  const [headers, setHeaders] = useState([]);
  const [sampleRows, setSampleRows] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState(null);

  // CSV → modo universal
  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const linhas = text.split("\n").map((l) => l.trim()).filter((l) => l);

    if (linhas.length < 2) return;

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
    setCsvData([]);      // ainda não normalizado
    setMapping(null);    // força mapeamento
  };

  // Quando o utilizador confirma o mapeamento
  const handleMappingConfirm = (map) => {
    setMapping(map);

    const normalizado = rawRows.map((row) => {
      const get = (key) => (map[key] ? (row[map[key]] ?? "").trim() : "");

      const rawAmount = get("amount")
        .replace(/\./g, "")
        .replace(",", ".")
        .replace(/\s/g, "");

      let amount = parseFloat(rawAmount);
      if (isNaN(amount)) amount = 0;

      const tipo = get("type").toUpperCase();
      if (tipo.includes("CRÉDITO") || tipo.includes("CREDITO") || tipo.includes("CREDIT")) {
        // se quiseres receitas positivas, deixa assim
      } else if (tipo.includes("DÉBITO") || tipo.includes("DEBITO") || tipo.includes("DEBIT")) {
        // se quiseres despesas negativas, podes fazer: amount = -Math.abs(amount);
      }

      return {
        date: get("date"),
        description: get("description"),
        amount,
        type: tipo || null,
        empresa: get("empresa"),
        categoria: get("categoria"),
        selected: true,
      };
    });

    setCsvData(normalizado);
  };

  // PDF (mantemos simples, ainda não universal)
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
    setHeaders([]);
    setSampleRows([]);
    setRawRows([]);
    setMapping(null);
    setCsvData(linhas);
  };

  // Parser simples para PDF (podes afinar depois)
  const processarExtratoPDF = (texto) => {
    const resultados = [];

    const regex =
      /(?<![\d,])(\d{1,2}\.\d{1,2})\s+(\d{1,2}\.\d{1,2})\s+([A-Z][A-Z0-9 .-]+?)\s+(\d+[.,]\d{2})\s+(\d+[.,]\d{2})/g;

    let match;
    while ((match = regex.exec(texto)) !== null) {
      const dataLanc = match[1];
      const descricao = match[3].trim().toUpperCase();

      const n1 = Number(match[4].replace(".", "").replace(",", "."));
      const n2 = Number(match[5].replace(".", "").replace(",", "."));
      const valor = Math.min(n1, n2);

      const [mes, dia] = dataLanc.split(".");
      const ano = new Date().getFullYear();
      const dataFormatada = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;

      resultados.push({
        date: dataFormatada,
        description: descricao,
        amount: valor,
        type: null,
        empresa: "",
        categoria: "",
        selected: true,
      });
    }

    return resultados;
  };

  const aplicarFiltros = () => {
    setCsvData((prev) =>
      prev.map((item) =>
        item.selected
          ? {
              ...item,
              categoria: filtroCategoria || item.categoria,
              empresa: filtroEmpresa || item.empresa,
            }
          : item
      )
    );
  };

  const toggleSelecionado = (index) => {
    setCsvData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-[#111] p-6 rounded-xl border border-[#333] w-[90%] max-w-xl max-h-[90vh] overflow-y-auto text-white">
        <h2 className="text-xl font-bold text-[#facc15] mb-4">Importar Extrato</h2>

        <input type="file" accept=".csv" onChange={handleCSVUpload} className="mb-4" />
        <input type="file" accept=".pdf" onChange={handlePDFUpload} className="mb-4" />

        {/* Mapeamento universal (apenas para CSV) */}
        {rawRows.length > 0 && !mapping && (
          <UniversalColumnMapper
            headers={headers}
            sampleRows={sampleRows}
            onConfirm={handleMappingConfirm}
          />
        )}

        {/* Filtros rápidos (após normalização) */}
        {csvData.length > 0 && (
          <div className="mb-4 p-3 bg-[#222] rounded-lg text-white flex gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-sm mb-1">Categoria</label>
              <select
                className="bg-[#111] border border-[#444] p-2 rounded"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-sm mb-1">Empresa</label>
              <select
                className="bg-[#111] border border-[#444] p-2 rounded"
                value={filtroEmpresa}
                onChange={(e) => setFiltroEmpresa(e.target.value)}
              >
                <option value="">Todas</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.name}>{e.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={aplicarFiltros}
              className="px-4 py-2 bg-blue-500 text-black font-bold rounded-lg"
            >
              Aplicar aos selecionados
            </button>
          </div>
        )}

        {/* Lista de linhas normalizadas */}
        {csvData.length > 0 && (
          <div className="border border-[#333] p-3 rounded max-h-[50vh] overflow-y-auto text-white">
            {csvData.map((l, i) => (
              <div key={i} className="border-b border-[#222] py-3 text-sm">
                <div className="flex gap-3 items-start">
                  <input
                    type="checkbox"
                    checked={l.selected}
                    onChange={() => toggleSelecionado(i)}
                  />

                  <div className="flex-1">
                    <p><strong>Data:</strong> {l.date}</p>
                    <p><strong>Descrição:</strong> {l.description}</p>
                    <p><strong>Valor:</strong> {l.amount} €</p>

                    <div className="mt-2">
                      <label className="text-xs">Categoria</label>
                      <select
                        className="bg-[#111] border border-[#444] p-2 rounded w-full"
                        value={l.categoria}
                        onChange={(e) =>
                          setCsvData(prev =>
                            prev.map((item, idx) =>
                              idx === i ? { ...item, categoria: e.target.value } : item
                            )
                          )
                        }
                      >
                        <option value="">—</option>
                        {categorias.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-2">
                      <label className="text-xs">Empresa</label>
                      <select
                        className="bg-[#111] border border-[#444] p-2 rounded w-full"
                        value={l.empresa}
                        onChange={(e) =>
                          setCsvData(prev =>
                            prev.map((item, idx) =>
                              idx === i ? { ...item, empresa: e.target.value } : item
                            )
                          )
                        }
                      >
                        <option value="">—</option>
                        {empresas.map((e) => (
                          <option key={e.id} value={e.name}>{e.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
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
