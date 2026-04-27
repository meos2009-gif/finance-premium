import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [openReports, setOpenReports] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const isInicio = location.pathname === "/";

  // 🔐 PROTEÇÃO DE SESSÃO
  useEffect(() => {
    async function check() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        window.location.href = "/login";
        return;
      }
      setCheckingAuth(false);
    }
    check();
  }, []);

  // 🔙 FORÇAR BOTÃO VOLTAR DO ANDROID → MENU
  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault();
      navigate("/dashboard", { replace: true });
    };

    window.addEventListener("popstate", handleBackButton);

    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [navigate]);

  const terminarSessao = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (checkingAuth) return null;

  return (
    <div className="flex min-h-screen bg-black text-white">

      {/* BOTÃO HAMBÚRGUER */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-[#111] p-2 rounded-lg border border-[#333] shadow-lg active:scale-95 transition"
        onClick={() => setMenuOpen(true)}
      >
        ☰
      </button>

      {/* OVERLAY */}
      {menuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`
          fixed md:static top-0 left-0 h-full w-60 md:w-64 bg-[#0d0d0d] border-r border-[#222]
          p-4 md:p-6 flex flex-col gap-6 z-50
          transform transition-all duration-300 ease-out
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >

        <button
          className="md:hidden self-end text-gray-400 hover:text-white text-2xl mb-2"
          onClick={() => setMenuOpen(false)}
        >
          ✕
        </button>

        <h1 className="text-xl font-bold text-[#facc15] text-center md:text-left">
          Finance Clean
        </h1>

        {/* MENU */}
        <nav className="flex flex-col gap-2 md:gap-3 text-gray-300">

          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            className="hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg"
          >
            Início
          </Link>

          <Link to="/receitas" onClick={() => setMenuOpen(false)} className="hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg">
            Receitas
          </Link>

          <Link to="/despesas" onClick={() => setMenuOpen(false)} className="hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg">
            Despesas
          </Link>

          <Link to="/lista-despesas" onClick={() => setMenuOpen(false)} className="hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg">
            Lista de Despesas
          </Link>

          <Link to="/categorias" onClick={() => setMenuOpen(false)} className="hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg">
            Categorias
          </Link>

          {/* RELATÓRIOS */}
          <div
            className="mt-4 mb-1 text-gray-500 uppercase text-xs tracking-wider flex items-center justify-between cursor-pointer select-none"
            onClick={() => setOpenReports(!openReports)}
          >
            <span>Relatórios Avançados</span>
            <span className="text-gray-400 text-sm">
              {openReports ? "▲" : "▼"}
            </span>
          </div>

          <div
            className={`
              flex flex-col gap-2 overflow-hidden transition-all duration-300
              ${openReports ? "max-h-96" : "max-h-0"}
            `}
          >
            <Link
              to="/dashboard"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg flex items-center gap-2"
            >
              📊 <span>Dashboard</span>
            </Link>

            <Link
              to="/relatorio-mensal"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg flex items-center gap-2"
            >
              📅 <span>Relatório Mensal</span>
            </Link>

            <Link
              to="/relatorio-categorias"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg flex items-center gap-2"
            >
              📂 <span>Relatório por Categoria</span>
            </Link>

            <Link
              to="/variacao-despesas"
              onClick={() => setMenuOpen(false)}
              className="hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg flex items-center gap-2"
            >
              📉 <span>Variação de Despesas</span>
            </Link>
          </div>

          <Link
            to="/configuracoes"
            onClick={() => setMenuOpen(false)}
            className="hover:bg-[#1a1a1a] p-2 md:p-3 rounded-lg mt-4"
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

      {/* CONTEÚDO */}
      <main
        className={`
          flex-1 w-full overflow-y-auto transition-all duration-300
          ${isInicio ? "p-0 md:ml-64" : "p-4 md:p-8 md:ml-64"}
        `}
      >
        {!isInicio && (
          <button
            onClick={() => navigate("/")}
            className="mb-4 bg-[#111] border border-[#333] px-4 py-2 rounded-lg hover:bg-[#1a1a1a] transition flex items-center gap-2"
          >
            ← Voltar
          </button>
        )}

        <Outlet />
      </main>
    </div>
  );
}
