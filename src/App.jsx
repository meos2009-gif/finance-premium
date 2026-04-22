import { Routes, Route } from "react-router-dom";

import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Dashboard from "./pages/Dashboard";
import Receitas from "./pages/Receitas";
import Despesas from "./pages/Despesas";
import Categorias from "./pages/Categorias";
import RelatorioMensal from "./pages/RelatorioMensal";
import RelatorioCategorias from "./pages/RelatorioCategorias";
import ListaDespesas from "./pages/ListaDespesas";
import Inicio from "./pages/Inicio";

export default function App() {
  return (
    <Routes>

      {/* ROTAS PÚBLICAS */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ROTAS PROTEGIDAS */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/receitas" element={<Receitas />} />
        <Route path="/despesas" element={<Despesas />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/relatorio-mensal" element={<RelatorioMensal />} />
        <Route path="/relatorio-categorias" element={<RelatorioCategorias />} />
        <Route path="/lista-despesas" element={<ListaDespesas />} />
        <Route path="/" element={<Inicio />} />
        <Route path="/inicio" element={<Inicio />} />
     
</Route>

    </Routes>
  );
}
