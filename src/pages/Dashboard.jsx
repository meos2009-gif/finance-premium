import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const MESES = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

export default function Dashboard() {
  const [ano, setAno] = useState(new Date().getFullYear());
  const [categorias, setCategorias] = useState([]);
  const [dados, setDados] = useState([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");

  useEffect(() => {
    carregarDados();
  }, [ano]);

  async function carregarDados() {
    const { data: session } = await supabase.auth.getUser();
    if (!session?.user) return;

    const { data: cat } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", session.user.id);

    setCategorias(cat || []);

    const { data: trans } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("type", "expense");

    const filtradas = trans.filter(t => t.date.startsWith(ano.toString()));

    const mapa = {};

    filtradas.forEach(t => {
      const catId = t.category_id;
      const mes = new Date(t.date).getMonth(); // 0-11

      if (!mapa[catId]) {
        mapa[catId] = Array(12).fill(0);
      }

      mapa[catId][mes] += Number(t.amount);
    });

    const tabela = Object.keys(mapa).map(catId => {
      const catObj = cat.find(c => String(c.id) === String(catId));
      return {
        categoria: catObj ? catObj.name : "Sem categoria",
        meses: mapa[catId],
        total: mapa[catId].reduce((a,b) => a+b, 0)
      };
    });

    setDados(tabela);

    // Seleciona automaticamente a primeira categoria
    if (tabela.length > 0) {
      setCategoriaSelecionada(tabela[0].categoria);
    }
  }

  const dadosGrafico = categoriaSelecionada && dados.length > 0
    ? (() => {
        const linha = dados.find(d => d.categoria === categoriaSelecionada);
        if (!linha) return null;

        return {
          labels: MESES,
          datasets: [
            {
              label: categoriaSelecionada,
              data: linha.meses,
              backgroundColor: "#facc15",
              borderRadius: 6,
            },
          ],
        };
      })()
    : null;

  return (
    <div className="text-white flex flex-col gap-10 px-4 md:px-0 w-full">

      <h1 className="text-2xl font-bold text-[#facc15]">
        Resumo Anual de Despesas
      </h1>

      {/* Seleção do ano */}
      <div className="flex gap-4 items-center">
        <label className="text-gray-300">Ano:</label>
        <select
          value={ano}
          onChange={(e) => setAno(e.target.value)}
          className="bg-[#111] border border-[#333] text-white rounded-lg px-4 py-2"
        >
          <option value={ano}>{ano}</option>
          <option value={ano - 1}>{ano - 1}</option>
          <option value={ano - 2}>{ano - 2}</option>
        </select>
      </div>

      {/* Tabela estilo Excel */}
      <div className="overflow-x-auto border border-[#333] rounded-xl">
        <table className="min-w-max w-full text-sm">
          <thead className="bg-[#1a1a1a]">
            <tr>
              <th className="p-3 text-left text-[#facc15]">Categoria</th>
              {MESES.map((m, i) => (
                <th key={i} className="p-3 text-right text-[#ccc]">{m}</th>
              ))}
              <th className="p-3 text-right text-[#facc15]">Total</th>
            </tr>
          </thead>

          <tbody>
            {dados.map((linha, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? "bg-[#111]" : "bg-[#151515]"}>
                <td className="p-3 font-semibold">{linha.categoria}</td>
                {linha.meses.map((v, i) => (
                  <td key={i} className="p-3 text-right">{v.toFixed(2)} €</td>
                ))}
                <td className="p-3 text-right font-bold text-green-400">
                  {linha.total.toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Gráfico por categoria */}
      <div className="flex flex-col gap-4">
        <label className="text-gray-300">Categoria:</label>
        <select
          value={categoriaSelecionada}
          onChange={(e) => setCategoriaSelecionada(e.target.value)}
          className="bg-[#111] border border-[#333] text-white rounded-lg px-4 py-2"
        >
          {dados.map((d, i) => (
            <option key={i} value={d.categoria}>{d.categoria}</option>
          ))}
        </select>

        {dadosGrafico && (
          <div className="bg-[#111] border border-[#222] p-6 rounded-xl">
            <Bar data={dadosGrafico} options={{ responsive: true }} />
          </div>
        )}
      </div>

    </div>
  );
}
