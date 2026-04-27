import { Link } from "react-router-dom";

export default function Inicio() {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full text-center px-6">

      <h1 className="text-3xl font-bold text-[#facc15] mb-6">
        Finance Clean
      </h1>

      <div className="flex flex-col gap-3 w-full max-w-xs">

        <Link
          to="/dashboard"
          className="bg-[#111] border border-[#333] p-3 rounded-lg hover:bg-[#1a1a1a] transition"
        >
          Dashboard
        </Link>

        <Link
          to="/receitas"
          className="bg-[#111] border border-[#333] p-3 rounded-lg hover:bg-[#1a1a1a] transition"
        >
          Receitas
        </Link>

        <Link
          to="/despesas"
          className="bg-[#111] border border-[#333] p-3 rounded-lg hover:bg-[#1a1a1a] transition"
        >
          Despesas
        </Link>

        <Link
          to="/lista-despesas"
          className="bg-[#111] border border-[#333] p-3 rounded-lg hover:bg-[#1a1a1a] transition"
        >
          Lista de Despesas
        </Link>

        <Link
          to="/categorias"
          className="bg-[#111] border border-[#333] p-3 rounded-lg hover:bg-[#1a1a1a] transition"
        >
          Categorias
        </Link>

        <Link
          to="/relatorio-mensal"
          className="bg-[#111] border border-[#333] p-3 rounded-lg hover:bg-[#1a1a1a] transition"
        >
          Relatório Mensal
        </Link>

        <Link
          to="/relatorio-categorias"
          className="bg-[#111] border border-[#333] p-3 rounded-lg hover:bg-[#1a1a1a] transition"
        >
          Relatório por Categoria
        </Link>

        <Link
          to="/variacao-despesas"
          className="bg-[#111] border border-[#333] p-3 rounded-lg hover:bg-[#1a1a1a] transition"
        >
          Variação de Despesas
        </Link>

        <Link
          to="/configuracoes"
          className="bg-[#111] border border-[#333] p-3 rounded-lg hover:bg-[#1a1a1a] transition"
        >
          Configurações
        </Link>

      </div>
    </div>
  );
}
