/**
 * Context de Autenticación
 * Maneja el estado global de autenticación del usuario
 */

import { createContext, useState, useEffect } from "react";
import * as authApi from "../api/auth";

// Crear contexto (SIN export)
const AuthContext = createContext(null);

// Exportar SOLO el provider
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuario del localStorage al iniciar
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
          setUser(JSON.parse(userData));
        }
      } catch (err) {
        console.error("Error al cargar usuario:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authApi.login(email, password);
      const { token, user: userData } = response.data;

      // Guardar en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      // Actualizar estado
      setUser(userData);

      return { success: true };
    } catch (err) {
      const errorMessage =
        err.response?.data?.error || "Error al iniciar sesión";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Registro
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authApi.register(userData);
      const { token, user: newUser } = response.data;

      // Guardar en localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(newUser));

      // Actualizar estado
      setUser(newUser);

      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.error || "Error al registrarse";
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setError(null);
  };

  // Actualizar perfil
  const updateUser = (updatedUser) => {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  // Verificar si está autenticado
  const isAuthenticated = !!user;

  // Verificar rol
  const hasRole = (role) => {
    return user?.role === role;
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Exportar context para el hook
export default AuthContext;
