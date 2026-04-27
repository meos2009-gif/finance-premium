import { Routes, Route, Navigate } from "react-router-dom";

import AppLayout from "./layout/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Menu from "./pages/Menu"; // <- MENU MINIMALISTA
import Dashboard from "./pages/Dashboard";
import Receitas from "./pages/Receitas";
import Despesas from "./pages/Despesas";
import ListaDespesas from "./pages/ListaDespesas";
import Categorias from "./pages/Categorias";
import RelatorioMensal from "./pages/RelatorioMensal";
import RelatorioCategorias from "./pages/RelatorioCategorias";
import Configuracoes from "./pages/Configuracoes";
import VariacaoDespesas from "./pages/VariacaoDespesas";

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
        {/* MENU = PÁGINA INICIAL */}
        <Route path="/" element={<Menu />} />

        {/* OUTRAS PÁGINAS */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/receitas" element={<Receitas />} />
        <Route path="/despesas" element={<Despesas />} />
        <Route path="/lista-despesas" element={<ListaDespesas />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/relatorio-mensal" element={<RelatorioMensal />} />
        <Route path="/relatorio-categorias" element={<RelatorioCategorias />} />
        <Route path="/configuracoes" element={<Configuracoes />} />
        <Route path="/variacao-despesas" element={<VariacaoDespesas />} />

        {/* QUALQUER ROTA INVÁLIDA → MENU */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

    </Routes>
  );
}
