/**
 * API de Autenticación
 * Funciones para llamar endpoints de auth
 */

import api from "./axios";

/**
 * Login de usuario
 */
export const login = async (email, password) => {
  const response = await api.post("/auth/login", { email, password });
  return response;
};

/**
 * Registro de usuario
 */
export const register = async (userData) => {
  const response = await api.post("/auth/registro", userData);
  return response;
};

/**
 * Obtener perfil del usuario autenticado
 */
export const getProfile = async () => {
  const response = await api.get("/auth/perfil");
  return response.data;
};

/**
 * Actualizar perfil
 */
export const updateProfile = async (userData) => {
  const response = await api.put("/auth/perfil", userData);
  return response.data;
};

/**
 * Cambiar contraseña
 */
export const changePassword = async (passwordData) => {
  const response = await api.put("/auth/cambiar-password", passwordData);
  return response.data;
};

/**
 * Listar profesionales verificados
 */
export const listarProfesionales = async () => {
  const response = await api.get("/auth/profesionales");
  return response.data;
};
