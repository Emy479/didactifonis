/**
 * API de Progreso
 * Funciones para obtener estadísticas y progreso de pacientes
 */

import api from "./axios";

/**
 * Obtener estadísticas generales de un paciente
 */
export const obtenerEstadisticasPaciente = async (pacienteId) => {
  const response = await api.get(`/progress/estadisticas/${pacienteId}`);
  return response.data;
};

/**
 * Obtener historial de sesiones de un paciente
 */
export const obtenerProgresoPaciente = async (pacienteId, limite = 20) => {
  const response = await api.get(
    `/progress/patient/${pacienteId}?limite=${limite}`,
  );
  return response.data;
};

/**
 * Obtener evolución de un paciente en un juego específico
 */
export const obtenerEvolucion = async (pacienteId, juegoId, dias = 30) => {
  const response = await api.get(
    `/progress/evolucion/${pacienteId}/${juegoId}?dias=${dias}`,
  );
  return response.data;
};
