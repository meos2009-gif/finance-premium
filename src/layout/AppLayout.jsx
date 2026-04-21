import { Link, Outlet } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AppLayout() {
  const terminarSessao = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-black text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0d0d0d] border-r border-[#222] p-6 flex flex-col gap-6">

        <h1 className="text-xl font-bold text-[#facc15]">Finance Clean</h1>

        <nav className="flex flex-col gap-3 text-gray-300">

          <Link
            to="/dashboard"
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Dashboard
          </Link>

          <Link
            to="/receitas"
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Receitas
          </Link>

          <Link
            to="/despesas"
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Adicionar Despesa
          </Link>

          <Link
            to="/lista-despesas"
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Lista de Despesas
          </Link>

          <Link
            to="/categorias"
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Categorias
          </Link>

          <Link
            to="/relatorio-mensal"
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Relatório Mensal
          </Link>

          <Link
            to="/relatorio-categorias"
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Por Categoria
          </Link>

          <Link
            to="/configuracoes"
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Configurações
          </Link>
        </nav>

        <button
          onClick={terminarSessao}
          className="mt-auto bg-[#facc15] text-black font-bold p-3 rounded-lg hover:bg-yellow-400"
        >
          Terminar Sessão
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-10 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
