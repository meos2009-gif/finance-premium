import { Link, Outlet } from "react-router-dom";
import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  const terminarSessao = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex min-h-screen bg-black text-white">

      {/* BOTÃO HAMBÚRGUER (MOBILE) */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-[#111] p-3 rounded-lg border border-[#333]"
        onClick={() => setMenuOpen(true)}
      >
        ☰
      </button>

      {/* OVERLAY (MOBILE) */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full w-64 bg-[#0d0d0d] border-r border-[#222] p-6 flex flex-col gap-6
          transform transition-transform duration-300 z-50
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <h1 className="text-xl font-bold text-[#facc15]">Finance Clean</h1>

        <nav className="flex flex-col gap-3 text-gray-300">

          <Link
            to="/dashboard"
            onClick={() => setMenuOpen(false)}
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Dashboard
          </Link>

          <Link
            to="/receitas"
            onClick={() => setMenuOpen(false)}
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Receitas
          </Link>

          <Link
            to="/despesas"
            onClick={() => setMenuOpen(false)}
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Adicionar Despesa
          </Link>

          <Link
            to="/lista-despesas"
            onClick={() => setMenuOpen(false)}
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Lista de Despesas
          </Link>

          <Link
            to="/categorias"
            onClick={() => setMenuOpen(false)}
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Categorias
          </Link>

          <Link
            to="/relatorio-mensal"
            onClick={() => setMenuOpen(false)}
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Relatório Mensal
          </Link>

          <Link
            to="/relatorio-categorias"
            onClick={() => setMenuOpen(false)}
            className="hover:text-white hover:bg-[#1a1a1a] p-2 rounded-lg"
          >
            Por Categoria
          </Link>

          <Link
            to="/configuracoes"
            onClick={() => setMenuOpen(false)}
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
      <main className="flex-1 p-10 overflow-y-auto md:ml-0 ml-0">
        <Outlet />
      </main>
    </div>
  );
}
