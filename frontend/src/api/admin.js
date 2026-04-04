/**
 * API de Administración
 * Funciones para llamar endpoints de /api/admin
 */

import api from "./axios";

// ── Stats ─────────────────────────────────────────────────────────────────────
export const obtenerStatsAdmin = async () => {
  const response = await api.get("/admin/stats");
  return response.data;
};

// ── Usuarios ──────────────────────────────────────────────────────────────────
export const listarUsuarios = async (filtros = {}) => {
  const response = await api.get("/admin/usuarios", { params: filtros });
  return response.data;
};

export const verificarProfesional = async (id, verificado) => {
  const response = await api.put(`/admin/usuarios/${id}/verificar`, { verificado });
  return response.data;
};

export const cambiarEstadoUsuario = async (id, activo) => {
  const response = await api.put(`/admin/usuarios/${id}/estado`, { activo });
  return response.data;
};

// ── Pacientes inactivos ───────────────────────────────────────────────────────
export const listarPacientesInactivos = async () => {
  const response = await api.get("/admin/pacientes/inactivos");
  return response.data;
};

export const reactivarPaciente = async (id) => {
  const response = await api.put(`/admin/pacientes/${id}/reactivar`);
  return response.data;
};
