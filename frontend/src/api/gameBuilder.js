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

/**
 * Listar todos los assets subidos, agrupados por tipo y categoría
 * @returns {{ imagenes: Record<string,{nombre,url}[]>, audios: Record<string,{nombre,url}[]> }}
 */
export const listarAssets = async () => {
  const response = await api.get("/game-builder/assets");
  return response.data;
};

/**
 * Subir un asset (imagen o audio) al servidor
 * @param {File} archivo - El archivo a subir
 * @param {"imagen"|"audio"} tipo
 * @param {string} categoria - ej: "animales", "palabras"
 * @returns {{ url: string, filename: string }}
 */
export const subirAsset = async (archivo, tipo, categoria) => {
  const formData = new FormData();
  formData.append("archivo", archivo);
  const response = await api.post(
    `/game-builder/upload-asset?tipo=${tipo}&categoria=${categoria}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return response.data;
};
