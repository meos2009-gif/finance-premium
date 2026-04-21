import { NavLink } from "react-router-dom";

export default function Sidebar({ isOpen, onClose, desktop }) {
  const base =
    "bg-[#1a1a1a] border-r border-[#222] w-64 h-full p-6 flex flex-col gap-6 text-white";

  // DESKTOP
  if (desktop) {
    return (
      <aside className={`${base}`}>
        <MenuLinks />
      </aside>
    );
  }

  // MOBILE
  return (
    <aside
      className={`fixed top-0 left-0 h-full w-64 bg-[#1a1a1a] shadow-xl z-50 transform transition-transform duration-300 md:hidden ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-6 flex flex-col gap-6">
        <h2 className="text-lg font-semibold text-white">Menu</h2>
        <MenuLinks onClick={onClose} />
      </div>
    </aside>
  );
}

function MenuLinks({ onClick }) {
  const link =
    "block px-4 py-2 rounded-lg text-gray-300 font-medium transition-all duration-200 hover:bg-[#222] hover:text-white hover:translate-x-1";

  const active =
    "bg-blue-600 text-white font-semibold shadow-lg translate-x-1";

  return (
    <nav className="flex flex-col gap-2">
      <NavLink
        to="/dashboard"
        className={({ isActive }) => `${link} ${isActive ? active : ""}`}
        onClick={onClick}
      >
        Dashboard
      </NavLink>

      <NavLink
        to="/receitas"
        className={({ isActive }) => `${link} ${isActive ? active : ""}`}
        onClick={onClick}
      >
        Receitas
      </NavLink>

      <NavLink
        to="/despesas"
        className={({ isActive }) => `${link} ${isActive ? active : ""}`}
        onClick={onClick}
      >
        Despesas
      </NavLink>

      <NavLink
        to="/categorias"
        className={({ isActive }) => `${link} ${isActive ? active : ""}`}
        onClick={onClick}
      >
        Categorias
      </NavLink>
    </nav>
  );
}
