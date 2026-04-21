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
        className="md:hidden fixed top-4 left-4 z-50 bg-[#111] p-2 rounded-lg border border-[#333] shadow-lg active:scale-95 transition"
        onClick={() => setMenuOpen(true)}
      >
        ☰
      </button>

      {/* OVERLAY (FADE) */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-0 animate-fadeIn z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full w-52 md:w-64 bg-[#0d0d0d] border-r border-[#222]
          p-4 md:p-6 flex flex-col gap-6 shadow-xl z-50
          transform transition-all duration-300 ease-out
          ${menuOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 md:opacity-100 md:translate-x-0"}
        `}
      >
        <h1 className="text-xl font-bold text-[#facc15] text-center md:text-left">Finance Clean</h1>

        <nav className="flex flex-col gap-2 md:gap-3 text-gray-300">

          <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="hover:text-white hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg transition">
            Dashboard
          </Link>

          <Link to="/receitas" onClick={() => setMenuOpen(false)} className="hover:text-white hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg transition">
            Receitas
          </Link>

          <Link to="/despesas" onClick={() => setMenuOpen(false)} className="hover:text-white hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg transition">
            Adicionar Despesa
          </Link>

          <Link to="/lista-despesas" onClick={() => setMenuOpen(false)} className="hover:text-white hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg transition">
            Lista de Despesas
          </Link>

          <Link to="/categorias" onClick={() => setMenuOpen(false)} className="hover:text-white hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg transition">
            Categorias
          </Link>

          <Link to="/relatorio-mensal" onClick={() => setMenuOpen(false)} className="hover:text-white hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg transition">
            Relatório Mensal
          </Link>

          <Link to="/relatorio-categorias" onClick={() => setMenuOpen(false)} className="hover:text-white hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg transition">
            Por Categoria
          </Link>

          <Link to="/configuracoes" onClick={() => setMenuOpen(false)} className="hover:text-white hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg transition">
            Configurações
          </Link>
        </nav>

        <button
          onClick={terminarSessao}
          className="mt-auto bg-[#facc15] text-black font-bold p-3 rounded-lg hover:bg-yellow-400 transition active:scale-95"
        >
          Terminar Sessão
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto md:ml-64 ml-0 transition-all duration-300">
        <Outlet />
      </main>
    </div>
  );
}
