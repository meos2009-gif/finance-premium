import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d0d0d] text-white">

      {/* NAVBAR SUPERIOR */}
      <nav className="bg-[#111] text-white px-6 py-4 shadow-md border-b border-[#222] flex justify-between items-center">
        
        {/* TÍTULO SEM LOGO */}
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-[#facc15]">Gestão Financeira</h1>
        </div>

        {/* BOTÕES À DIREITA */}
        <div className="flex items-center gap-4">

          {/* LOGOUT DESKTOP */}
          <button
            onClick={handleLogout}
            className="hidden md:block bg-[#facc15] hover:bg-[#eab308] px-4 py-2 rounded-md text-black font-semibold"
          >
            Terminar Sessão
          </button>

          {/* BOTÃO MENU MOBILE */}
          <button
            className="text-3xl text-[#facc15] md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>
        </div>
      </nav>

      {/* OVERLAY MOBILE */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[9998]"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* SIDEBAR MÓVEL */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-[#111] text-white shadow-xl z-[9999] transform transition-transform duration-300 md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex flex-col gap-6">

          {/* TÍTULO DO MENU SEM LOGO */}
          <h2 className="text-lg font-bold text-[#facc15]">Menu</h2>

          {/* LINKS */}
          <NavLink to="/dashboard" className="hover:text-[#facc15]" onClick={() => setSidebarOpen(false)}>Dashboard</NavLink>
          <NavLink to="/receitas" className="hover:text-[#facc15]" onClick={() => setSidebarOpen(false)}>Receitas</NavLink>
          <NavLink to="/despesas" className="hover:text-[#facc15]" onClick={() => setSidebarOpen(false)}>Despesas</NavLink>
          <NavLink to="/categorias" className="hover:text-[#facc15]" onClick={() => setSidebarOpen(false)}>Categorias</NavLink>

          {/* RELATÓRIOS */}
          <div>
            <button
              onClick={() => setReportsOpen(!reportsOpen)}
              className="w-full text-left hover:text-[#facc15]"
            >
              Relatórios ▾
            </button>

            {reportsOpen && (
              <div className="ml-4 mt-2 flex flex-col gap-2">
                <NavLink to="/relatorio-mensal" className="hover:text-[#facc15]" onClick={() => setSidebarOpen(false)}>Relatório Mensal</NavLink>
                <NavLink to="/relatorio-categorias" className="hover:text-[#facc15]" onClick={() => setSidebarOpen(false)}>Por Categoria</NavLink>
              </div>
            )}
          </div>

          <NavLink to="/config" className="hover:text-[#facc15]" onClick={() => setSidebarOpen(false)}>Configurações</NavLink>

          {/* LOGOUT */}
          <button
            onClick={handleLogout}
            className="bg-[#facc15] hover:bg-[#eab308] px-4 py-2 rounded-md text-black font-semibold mt-6"
          >
            Terminar Sessão
          </button>
        </div>
      </aside>

      {/* LAYOUT DESKTOP */}
      <div className="hidden md:flex flex-1">

        {/* SIDEBAR DESKTOP FIXA */}
        <aside className="bg-[#111] border-r border-[#222] w-64 min-h-screen flex-col p-6 gap-4 text-white hidden md:flex">

          <NavLink to="/dashboard" className="hover:text-[#facc15]">Dashboard</NavLink>
          <NavLink to="/receitas" className="hover:text-[#facc15]">Receitas</NavLink>
          <NavLink to="/despesas" className="hover:text-[#facc15]">Despesas</NavLink>
          <NavLink to="/categorias" className="hover:text-[#facc15]">Categorias</NavLink>

          <NavLink to="/relatorio-mensal" className="hover:text-[#facc15]">Relatório Mensal</NavLink>
          <NavLink to="/relatorio-categorias" className="hover:text-[#facc15]">Por Categoria</NavLink>

          <NavLink to="/config" className="hover:text-[#facc15]">Configurações</NavLink>

          <button
            onClick={handleLogout}
            className="bg-[#facc15] hover:bg-[#eab308] px-4 py-2 rounded-md text-black font-semibold mt-6"
          >
            Terminar Sessão
          </button>
        </aside>

        {/* CONTEÚDO */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* CONTEÚDO MOBILE */}
      <main className="md:hidden flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
