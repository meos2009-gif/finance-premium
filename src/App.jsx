import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layout/AppLayout";
import Login from "./pages/Login";
import Inicio from "./pages/Inicio";
import Dashboard from "./pages/Dashboard";
import Receitas from "./pages/Receitas";
import Despesas from "./pages/Despesas";
import ListaDespesas from "./pages/ListaDespesas";
import Categorias from "./pages/Categorias";
import RelatorioMensal from "./pages/RelatorioMensal";
import RelatorioCategorias from "./pages/RelatorioCategorias";
import Configuracoes from "./pages/Configuracoes";

export default function App() {
  return (
    <Routes>

      {/* LOGIN FORA DO LAYOUT */}
      <Route path="/login" element={<Login />} />

      {/* REDIRECIONAR /inicio → / */}
      <Route path="/inicio" element={<Navigate to="/" />} />

      {/* TODAS AS PÁGINAS PROTEGIDAS */}
      <Route element={<AppLayout />}>

        <Route index element={<Inicio />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/receitas" element={<Receitas />} />
        <Route path="/despesas" element={<Despesas />} />
        <Route path="/lista-despesas" element={<ListaDespesas />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/relatorio-mensal" element={<RelatorioMensal />} />
        <Route path="/relatorio-categorias" element={<RelatorioCategorias />} />
        <Route path="/configuracoes" element={<Configuracoes />} />

      </Route>

    </Routes>
  );
}
