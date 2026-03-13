import api from "./axios";

export const crearSugerencia = async (data) => {
  const response = await api.post("/suggestions", data);
  return response.data;
};

export const obtenerSugerencias = async (filtros = {}) => {
  const response = await api.get("/suggestions", { params: filtros });
  return response.data;
};

export const obtenerMisSugerencias = async () => {
  const response = await api.get("/suggestions/mis-sugerencias");
  return response.data;
};

export const votar = async (id) => {
  const response = await api.post(`/suggestions/${id}/votar`);
  return response.data;
};

export const quitarVoto = async (id) => {
  const response = await api.delete(`/suggestions/${id}/votar`);
  return response.data;
};
