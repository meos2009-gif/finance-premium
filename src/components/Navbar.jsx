export default function Navbar({ onToggleSidebar }) {
  return (
    <header className="h-16 bg-[#1a1a1a] border-b border-[#222] shadow-md flex items-center px-6">
      {/* BOTÃO MOBILE */}
      <button
        onClick={onToggleSidebar}
        className="md:hidden text-white text-2xl mr-4 hover:text-blue-400 transition"
      >
        ☰
      </button>

      {/* TÍTULO */}
      <h1 className="text-xl font-semibold text-white tracking-wide">
        Gestão Financeira
      </h1>

      {/* ESPAÇO FLEX */}
      <div className="flex-1" />

      {/* FUTURO: PERFIL / NOTIFICAÇÕES */}
      <div className="hidden md:flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
          M
        </div>
      </div>
    </header>
  );
}
