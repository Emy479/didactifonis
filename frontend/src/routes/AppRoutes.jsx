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
import CreatePatient from "../pages/shared/CreatePatient";
import PatientsList from "../pages/shared/PatientsList";
import BibliotecaPage from "../pages/shared/BibliotecaPage";

// Componentes de protección
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      {/* Ruta raíz - redirige según autenticación */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            user?.role === "tutor" ? (
              <Navigate to="/tutor/dashboard" replace />
            ) : user?.role === "profesional" ? (
              <Navigate to="/profesional/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      {/* Rutas públicas (auth) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      {/* Rutas protegidas - Tutor */}
      <Route
        path="/tutor/dashboard"
        element={
          <ProtectedRoute allowedRoles={["tutor"]}>
            <TutorDashboard />
          </ProtectedRoute>
        }
      />
      {/* Rutas TUTOR Pacientes */}
      <Route
        path="/tutor/pacientes"
        element={
          <ProtectedRoute allowedRoles={["tutor"]}>
            <PatientsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tutor/crear-paciente"
        element={
          <ProtectedRoute allowedRoles={["tutor"]}>
            <CreatePatient />
          </ProtectedRoute>
        }
      />
      {/* Rutas protegidas - Profesional */}
      <Route
        path="/profesional/dashboard"
        element={
          <ProtectedRoute allowedRoles={["profesional"]}>
            <ProfesionalDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesional/sugerir-juego"
        element={
          <ProtectedRoute allowedRoles={["profesional"]}>
            <SuggestGame />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesional/sugerencias"
        element={
          <ProtectedRoute allowedRoles={["profesional"]}>
            <SuggestionsList />
          </ProtectedRoute>
        }
      />
      {/* Rutas PROFESIONAL Pacientes */}
      <Route
        path="/profesional/pacientes"
        element={
          <ProtectedRoute allowedRoles={["profesional"]}>
            <PatientsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesional/crear-paciente"
        element={
          <ProtectedRoute allowedRoles={["profesional"]}>
            <CreatePatient />
          </ProtectedRoute>
        }
      />

      {/* Biblioteca de Juegos - accesible para ambos roles */}
      <Route
        path="/tutor/biblioteca"
        element={
          <ProtectedRoute allowedRoles={["tutor"]}>
            <BibliotecaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profesional/biblioteca"
        element={
          <ProtectedRoute allowedRoles={["profesional"]}>
            <BibliotecaPage />
          </ProtectedRoute>
        }
      />

      {/* Ruta 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
