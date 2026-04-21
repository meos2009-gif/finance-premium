import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useState } from "react";

export default function AppLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-gray-100">

      {/* SIDEBAR DESKTOP */}
      <div className="hidden md:block">
        <Sidebar desktop />
      </div>

      {/* SIDEBAR MOBILE */}
      <Sidebar isOpen={open} onClose={() => setOpen(false)} />

      {/* CONTEÚDO */}
      <div className="flex-1 flex flex-col">
        <Navbar onToggleSidebar={() => setOpen(true)} />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
