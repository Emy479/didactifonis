/**
 * Componente ProtectedRoute
 * Protege rutas que requieren autenticación
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Spinner from "../components/common/Spinner";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // Mientras carga, mostrar spinner
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  // Si no está autenticado, redirigir a login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si hay roles permitidos, verificar
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirigir a su dashboard correspondiente
    if (user.role === "tutor") {
      return <Navigate to="/tutor/dashboard" replace />;
    } else if (user.role === "profesional") {
      return <Navigate to="/profesional/dashboard" replace />;
    } else if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/login" replace />;
  }

  // Si todo está bien, renderizar children
  return children;
};

export default ProtectedRoute;
