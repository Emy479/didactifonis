/**
 * MODELO de Autor
 *
 * Por ahora usa un array en memoria.
 * Más adelante lo reemplazaremos con MongoDB.
 */

// ============================================
// BASE DE DATOS TEMPORAL
// ============================================
let autores = [
  {
    id: 1,
    titulo: "Marcelo",
    completada: false,
    createdAt: new Date(),
  },
  { id: 2, titulo: "Antonia", completada: false, createdAt: new Date() },
  {
    id: 3,
    titulo: "Ernesto",
    completada: true,
    createdAt: new Date(),
  },
];

let siguienteId = 4;

// ============================================
// CLASE MODELO AUTOR
// ============================================
class Autor {
  /**
   * Obtener todas los autores
   */
  static getAll() {
    return autores;
  }

  /**
   * Obtener autores completados
   */
  static getCompletadas() {
    return autores.filter((t) => t.completada === true);
  }

  /**
   * Obtener autores pendientes
   */
  static getPendientes() {
    return autores.filter((t) => t.completada === false);
  }

  /**
   * Buscar autor por ID
   * @param {number} id
   * @returns {object|null}
   */
  static getById(id) {
    return autores.find((t) => t.id === id) || null;
  }

  /**
   * Crear nuevo autor
   * @param {object} data - { titulo }
   * @returns {object} Nuevo autor creado
   */
  static create(data) {
    const nuevoAutor = {
      id: siguienteId++,
      titulo: data.titulo.trim(),
      completada: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    autores.push(nuevoAutor);
    return nuevoAutor;
  }

  /**
   * Actualizar autor
   * @param {number} id
   * @param {object} data - { titulo?, completada? }
   * @returns {object|null} Autor actualizado o null
   */
  static update(id, data) {
    const index = autores.findIndex((t) => t.id === id);

    if (index === -1) {
      return null;
    }

    // Actualizar solo los campos proporcionados
    autores[index] = {
      ...autores[index],
      ...data,
      id: id, // Mantener el ID original
      updatedAt: new Date(),
    };

    return autores[index];
  }

  /**
   * Eliminar autor
   * @param {number} id
   * @returns {object|null} Autor eliminado o null
   */
  static delete(id) {
    const index = autores.findIndex((t) => t.id === id);

    if (index === -1) {
      return null;
    }

    const autorEliminado = autores.splice(index, 1)[0];
    return autorEliminado;
  }

  /**
   * Obtener estadísticas
   */
  static getEstadisticas() {
    const total = autores.length;
    const completadas = autores.filter((t) => t.completada).length;
    const pendientes = total - completadas;
    const porcentaje = total > 0 ? ((completadas / total) * 100).toFixed(2) : 0;

    return {
      total,
      completadas,
      pendientes,
      porcentajeCompletado: `${porcentaje}%`,
    };
  }
}

module.exports = Autor;
