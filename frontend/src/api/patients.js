/**
 * API de Pacientes
 * Funciones para gestionar pacientes
 */

import api from "./axios";

/**
 * Crear nuevo paciente
 */
export const crearPaciente = async (data) => {
  const response = await api.post("/patients", data);
  return response.data;
};

/**
 * Obtener mis pacientes
 */
export const obtenerMisPacientes = async () => {
  const response = await api.get("/patients/mis-pacientes");
  return response.data;
};

/**
 * Obtener paciente por ID
 */
export const obtenerPaciente = async (id) => {
  const response = await api.get(`/patients/${id}`);
  return response.data;
};

/**
 * Actualizar paciente
 */
export const actualizarPaciente = async (id, data) => {
  const response = await api.put(`/patients/${id}`, data);
  return response.data;
};

/**
 * Eliminar paciente
 */
export const eliminarPaciente = async (id) => {
  const response = await api.delete(`/patients/${id}`);
  return response.data;
};

/**
 * Asignar profesional a paciente (solo tutor)
 */
export const asignarProfesional = async (pacienteId, profesionalId) => {
  const response = await api.post(
    `/patients/${pacienteId}/asignar-profesional`,
    {
      profesionalId,
    },
  );
  return response.data;
};

/**
 * Obtener pacientes por tutor
 */
export const obtenerPacientesPorTutor = async (tutorId) => {
  const response = await api.get(`/patients/tutor/${tutorId}`);
  return response.data;
};

/**
 * Remover profesional de paciente (solo tutor)
 */
export const removerProfesional = async (pacienteId, profesionalId) => {
  const response = await api.delete(
    `/patients/${pacienteId}/profesional/${profesionalId}`,
  );
  return response.data;
};
