/**
 * API de Juegos
 * Funciones para gestionar juegos oficiales
 */

import api from "./axios";

/**
 * Obtener todos los juegos
 */
export const obtenerJuegos = async () => {
  const response = await api.get("/games");
  return response.data;
};

/**
 * Obtener juego por ID
 */
export const obtenerJuego = async (id) => {
  const response = await api.get(`/games/${id}`);
  return response.data;
};

/**
 * Crear juego oficial (solo admin)
 */
export const crearJuego = async (data) => {
  const response = await api.post("/games", data);
  return response.data;
};

/**
 * Actualizar juego (solo admin)
 */
export const actualizarJuego = async (id, data) => {
  const response = await api.put(`/games/${id}`, data);
  return response.data;
};

/**
 * Eliminar juego (solo admin)
 */
export const eliminarJuego = async (id) => {
  const response = await api.delete(`/games/${id}`);
  return response.data;
};

/**
 * Obtener todas las sugerencias (solo admin)
 */
export const obtenerSugerencias = async () => {
  const response = await api.get("/suggestions");
  return response.data;
};

/**
 * Cambiar estado de sugerencia (aprobar/rechazar)
 * estado: 'aprobada' | 'rechazada' | 'en_revision' | 'implementada'
 */
export const cambiarEstadoSugerencia = async (id, estado, notasAdmin = "") => {
  const response = await api.put(`/suggestions/${id}/estado`, {
    estado,
    notasAdmin,
  });
  return response.data;
};
