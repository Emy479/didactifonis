/**
 * API del Game Builder
 * Funciones para crear juegos desde el panel Admin
 */

import api from "./axios";

/**
 * Crear juego completo (genera archivos + registra en BD)
 */
export const crearJuegoBuilder = async (data) => {
  const response = await api.post("/game-builder/crear", data);
  return response.data;
};

/**
 * Actualizar data.json de un juego existente
 */
export const actualizarJuegoBuilder = async (id, data) => {
  const response = await api.put(`/game-builder/${id}`, data);
  return response.data;
};

/**
 * Previsualizar data.json sin guardar
 */
export const previsualizarJuego = async (data) => {
  const response = await api.post("/game-builder/preview", data);
  return response.data;
};
