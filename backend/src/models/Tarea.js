/**
 * Modelo de Tarea
 *
 * Por ahora usa un array en memoria.
 * Más adelante lo reemplazaremos con MongoDB.
 */

// ============================================
// BASE DE DATOS TEMPORAL
// ============================================
let tareas = [
  {
    id: 1,
    titulo: "Aprender Node.js",
    completada: false,
    createdAt: new Date(),
  },
  { id: 2, titulo: "Crear API REST", completada: false, createdAt: new Date() },
  {
    id: 3,
    titulo: "Estudiar async/await",
    completada: true,
    createdAt: new Date(),
  },
];

let siguienteId = 4;

// ============================================
// CLASE MODELO
// ============================================
class Tarea {
  /**
   * Obtener todas las tareas
   */
  static getAll() {
    return tareas;
  }

  /**
   * Obtener tareas completadas
   */
  static getCompletadas() {
    return tareas.filter((t) => t.completada === true);
  }

  /**
   * Obtener tareas pendientes
   */
  static getPendientes() {
    return tareas.filter((t) => t.completada === false);
  }

  /**
   * Buscar tarea por ID
   * @param {number} id
   * @returns {object|null}
   */
  static getById(id) {
    return tareas.find((t) => t.id === id) || null;
  }

  /**
   * Crear nueva tarea
   * @param {object} data - { titulo }
   * @returns {object} Nueva tarea creada
   */
  static create(data) {
    const nuevaTarea = {
      id: siguienteId++,
      titulo: data.titulo.trim(),
      completada: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    tareas.push(nuevaTarea);
    return nuevaTarea;
  }

  /**
   * Actualizar tarea
   * @param {number} id
   * @param {object} data - { titulo?, completada? }
   * @returns {object|null} Tarea actualizada o null
   */
  static update(id, data) {
    const index = tareas.findIndex((t) => t.id === id);

    if (index === -1) {
      return null;
    }

    // Actualizar solo los campos proporcionados
    tareas[index] = {
      ...tareas[index],
      ...data,
      id: id, // Mantener el ID original
      updatedAt: new Date(),
    };

    return tareas[index];
  }

  /**
   * Eliminar tarea
   * @param {number} id
   * @returns {object|null} Tarea eliminada o null
   */
  static delete(id) {
    const index = tareas.findIndex((t) => t.id === id);

    if (index === -1) {
      return null;
    }

    const tareaEliminada = tareas.splice(index, 1)[0];
    return tareaEliminada;
  }

  /**
   * Obtener estadísticas
   */
  static getEstadisticas() {
    const total = tareas.length;
    const completadas = tareas.filter((t) => t.completada).length;
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

module.exports = Tarea;
