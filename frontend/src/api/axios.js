/**
 * Configuración de Axios para llamadas al Backend
 * Didactifonis - Frontend React
 */

import axios from "axios";

// URL base del backend
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Crear instancia de Axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 segundos
});

// Interceptor de peticiones (agregar token JWT)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor de respuestas (manejo de errores)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si el token expiró, logout automático
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    // Manejar errores de red
    if (!error.response) {
      console.error("Error de red:", error.message);
    }

    return Promise.reject(error);
  },
);

export default api;
