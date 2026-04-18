/**
 * Configuración de Rutas
 * Define todas las rutas de la aplicación
 */

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

// Páginas de autenticación
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";

// Dashboards
import TutorDashboard from "../pages/tutor/TutorDashboard";
import ProfesionalDashboard from "../pages/profesional/ProfesionalDashboard";
import SuggestGame from "../pages/profesional/SuggestGame";
import SuggestionsList from "../pages/profesional/SuggestionsList";

// Imports
import PerfilUsuario from "../pages/shared/PerfilUsuario";
import CreatePatient from "../pages/shared/CreatePatient";
import PatientsList from "../pages/shared/PatientsList";
import BibliotecaPage from "../pages/shared/BibliotecaPage";
import PatientDetail from "../pages/shared/PatientDetail";
import EditPatient from "../pages/shared/EditPatient";
import EstadisticasLog from "../pages/shared/EstadisticasLog";
import JugarPage from "../pages/jugar/JugarPage";
import AdminDashboard from "../pages/admin/AdminDashboard";
import GestionJuegos from "../pages/admin/GestionJuegos";
import GestionSugerencias from "../pages/admin/GestionSugerencias";
import GestionUsuarios from "../pages/admin/GestionUsuarios";
import GameBuilder from "../pages/admin/GameBuilder";

// Componentes de protección
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Ruta raíz */}
      <Route path="/"
        element={
          isAuthenticated ? (
            user?.role === "tutor"        ? <Navigate to="/tutor/dashboard" replace /> :
            user?.role === "profesional"  ? <Navigate to="/profesional/dashboard" replace /> :
            user?.role === "admin"        ? <Navigate to="/admin/dashboard" replace /> :
                                            <Navigate to="/login" replace />
          ) : <Navigate to="/login" replace />
        }
      />

      {/* Rutas públicas */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Tutor */}
      <Route path="/tutor/dashboard"      element={<ProtectedRoute allowedRoles={["tutor"]}><TutorDashboard /></ProtectedRoute>} />
      <Route path="/tutor/pacientes"      element={<ProtectedRoute allowedRoles={["tutor"]}><PatientsList /></ProtectedRoute>} />
      <Route path="/tutor/crear-paciente" element={<ProtectedRoute allowedRoles={["tutor"]}><CreatePatient /></ProtectedRoute>} />
      <Route path="/tutor/biblioteca"     element={<ProtectedRoute allowedRoles={["tutor"]}><BibliotecaPage /></ProtectedRoute>} />
      <Route path="/tutor/estadisticas"   element={<ProtectedRoute allowedRoles={["tutor"]}><EstadisticasLog /></ProtectedRoute>} />

      {/* Profesional */}
      <Route path="/profesional/dashboard"      element={<ProtectedRoute allowedRoles={["profesional"]}><ProfesionalDashboard /></ProtectedRoute>} />
      <Route path="/profesional/pacientes"      element={<ProtectedRoute allowedRoles={["profesional"]}><PatientsList /></ProtectedRoute>} />
      <Route path="/profesional/crear-paciente" element={<ProtectedRoute allowedRoles={["profesional"]}><CreatePatient /></ProtectedRoute>} />
      <Route path="/profesional/biblioteca"     element={<ProtectedRoute allowedRoles={["profesional"]}><BibliotecaPage /></ProtectedRoute>} />
      <Route path="/profesional/estadisticas"   element={<ProtectedRoute allowedRoles={["profesional"]}><EstadisticasLog /></ProtectedRoute>} />
      <Route path="/profesional/sugerir-juego"  element={<ProtectedRoute allowedRoles={["profesional"]}><SuggestGame /></ProtectedRoute>} />
      <Route path="/profesional/sugerencias"    element={<ProtectedRoute allowedRoles={["profesional"]}><SuggestionsList /></ProtectedRoute>} />

      {/* Shared */}
      <Route path="/pacientes/:id"        element={<ProtectedRoute allowedRoles={["tutor","profesional"]}><PatientDetail /></ProtectedRoute>} />
      <Route path="/pacientes/:id/editar" element={<ProtectedRoute allowedRoles={["tutor","profesional"]}><EditPatient /></ProtectedRoute>} />
      <Route path="/perfil"               element={<ProtectedRoute allowedRoles={["tutor","profesional","admin"]}><PerfilUsuario /></ProtectedRoute>} />

      {/* Admin */}
      <Route path="/admin/dashboard"   element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/juegos"      element={<ProtectedRoute allowedRoles={["admin"]}><GestionJuegos /></ProtectedRoute>} />
      <Route path="/admin/sugerencias" element={<ProtectedRoute allowedRoles={["admin"]}><GestionSugerencias /></ProtectedRoute>} />
      <Route path="/admin/usuarios"    element={<ProtectedRoute allowedRoles={["admin"]}><GestionUsuarios /></ProtectedRoute>} />
      <Route path="/admin/game-builder" element={<ProtectedRoute allowedRoles={["admin"]}><GameBuilder /></ProtectedRoute>} />

      {/* Pública */}
      <Route path="/jugar" element={<JugarPage />} />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
