/**
 * API de Asignaciones
 * Funciones para gestionar asignaciones de juegos a pacientes
 */

import api from "./axios";

/**
 * Obtener asignaciones de un paciente
 */
export const obtenerAsignacionesPaciente = async (pacienteId) => {
  const response = await api.get(`/assignments/paciente/${pacienteId}`);
  return response.data;
};

/**
 * Crear nueva asignación
 */
export const crearAsignacion = async (pacienteId, juegoId) => {
  const response = await api.post("/assignments", { pacienteId, juegoId });
  return response.data;
};

/**
 * Desactivar asignación
 */
export const desactivarAsignacion = async (asignacionId) => {
  const response = await api.delete(`/assignments/${asignacionId}`);
  return response.data;
};

/**
 * Obtener asignaciones de un juego
 */
export const obtenerAsignacionesJuego = async (juegoId) => {
  const response = await api.get(`/assignments/juego/${juegoId}`);
  return response.data;
};
