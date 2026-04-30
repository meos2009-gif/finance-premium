import { useState } from "react";
import { createPortal } from "react-dom";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";

GlobalWorkerOptions.workerSrc = workerSrc;

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

  const detectarEmpresa = (descricao) => {
    const d = descricao.toUpperCase();

    const empresasConhecidas = [
      "MERCADONA", "CONTINENTE", "PINGO DOCE", "LIDL", "ALDI",
      "INTERMARCHE", "VIAVERDE", "NOS", "MEO", "VODAFONE",
      "IBERDROLA", "EDP", "GALP", "REPSOL", "PAYPAL",
      "AMAZON", "UBER", "BOLT", "CP", "CTT"
    ];

    for (const emp of empresasConhecidas) {
      if (d.includes(emp)) return emp;
    }

    if (d.includes("MBWAY") || d.includes("MB WAY")) return "MBWAY";

    const palavras = d.split(" ").filter(p => isNaN(p) && p.length > 2);
    return palavras[palavras.length - 1] || "Desconhecido";
  };

  const detectarCategoria = (descricao) => {
    const d = descricao.toUpperCase();

    if (d.includes("MERCADONA") || d.includes("CONTINENTE") || d.includes("PINGO DOCE") || d.includes("LIDL") || d.includes("ALDI"))
      return "Alimentação";

    if (d.includes("VIAVERDE")) return "Portagens";

    if (d.includes("NOS") || d.includes("MEO") || d.includes("VODAFONE"))
      return "Telecomunicações";

    if (d.includes("IBERDROLA") || d.includes("EDP"))
      return "Energia";

    if (d.includes("GALP") || d.includes("REPSOL"))
      return "Combustível";

    if (d.includes("AMAZON") || d.includes("AMZN"))
      return "Compras Online";

    if (d.includes("PAYPAL"))
      return "Subscrições";

    if (d.includes("MBWAY"))
      return "Transferência";

    if (d.includes("DD "))
      return "Débito Direto";

    if (d.includes("SEGURO"))
      return "Seguros";

    if (d.includes("COMPRA"))
      return "Compras";

    return "Outros";
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    const linhas = text.split("\n").map((l) => l.trim()).filter((l) => l);

    const header = linhas[0].split(/[,;]+/).map((h) => h.toLowerCase());

    const data = linhas.slice(1).map((linha) => {
      const colunas = linha.split(/[,;]+/);

      const obj = {};
      header.forEach((h, i) => {
        obj[h] = colunas[i];
      });

      const desc = (obj["descrição"] || obj["description"] || "").toUpperCase();

      return {
        date: obj["data"] || obj["date"],
        description: desc,
        amount: Math.abs(Number(obj["valor"] || obj["amount"] || 0)),
        categoria: detectarCategoria(desc),
        empresa: detectarEmpresa(desc),
        selected: true,
      };
    });

    setCsvData(data);
  };

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
    setCsvData(linhas);
  };

  const processarExtratoPDF = (texto) => {
    const resultados = [];

    const regex =
      /(?<![\d,])(\d{1,2}\.\d{1,2})\s+(\d{1,2}\.\d{1,2})\s+([A-Z][A-Z0-9 .-]+?)\s+(\d+[.,]\d{2})\s+(\d+[.,]\d{2})/g;

    let match;
    while ((match = regex.exec(texto)) !== null) {
      const dataLanc = match[1];
      const descricao = match[3].trim().toUpperCase();

      const n1 = Number(match[4].replace(",", "."));
      const n2 = Number(match[5].replace(",", "."));
      const valor = Math.min(n1, n2);

      const [mes, dia] = dataLanc.split(".");
      const ano = new Date().getFullYear();
      const dataFormatada = `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;

      resultados.push({
        date: dataFormatada,
        description: descricao,
        amount: valor,
        categoria: detectarCategoria(descricao),
        empresa: detectarEmpresa(descricao),
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
      <div className="bg-[#111] p-6 rounded-xl border border-[#333] w-[90%] max-w-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-[#facc15] mb-4">Importar Extrato</h2>

        <input type="file" accept=".csv" onChange={handleCSVUpload} className="mb-4" />
        <input type="file" accept=".pdf" onChange={handlePDFUpload} className="mb-4" />

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
