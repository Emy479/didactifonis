/**
 * Controlador de Tareas
 *
 * Maneja la lógica de negocio para operaciones CRUD de tareas.
 */

const Tarea = require("../models/Tarea");

// ============================================
// OBTENER TODAS LAS TAREAS
// ============================================
/**
 * GET /api/tareas
 */
const obtenerTodas = (req, res) => {
  try {
    const tareas = Tarea.getAll();

    res.json({
      success: true,
      count: tareas.length,
      data: tareas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener tareas",
    });
  }
};

// ============================================
// OBTENER TAREA POR ID
// ============================================
/**
 * GET /api/tareas/:id
 */
const obtenerPorId = (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Validar que el ID sea un número
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID inválido",
      });
    }

    const tarea = Tarea.getById(id);

    if (!tarea) {
      return res.status(404).json({
        success: false,
        error: "Tarea no encontrada",
      });
    }

    res.json({
      success: true,
      data: tarea,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener tarea",
    });
  }
};

// ============================================
// OBTENER TAREAS COMPLETADAS
// ============================================
/**
 * GET /api/tareas/completadas
 */
const obtenerCompletadas = (req, res) => {
  try {
    const tareas = Tarea.getCompletadas();

    res.json({
      success: true,
      count: tareas.length,
      data: tareas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener tareas completadas",
    });
  }
};

// ============================================
// CREAR NUEVA TAREA
// ============================================
/**
 * POST /api/tareas
 * Body: { titulo }
 */
const crear = (req, res) => {
  try {
    const { titulo } = req.body;

    // Validación
    if (!titulo || titulo.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "El título es obligatorio",
      });
    }

    if (titulo.length > 100) {
      return res.status(400).json({
        success: false,
        error: "El título no puede exceder 100 caracteres",
      });
    }

    const nuevaTarea = Tarea.create({ titulo });

    res.status(201).json({
      success: true,
      message: "Tarea creada exitosamente",
      data: nuevaTarea,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al crear tarea",
    });
  }
};

// ============================================
// ACTUALIZAR TAREA
// ============================================
/**
 * PUT /api/tareas/:id
 * Body: { titulo?, completada? }
 */
const actualizar = (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { titulo, completada } = req.body;

    // Validar ID
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID inválido",
      });
    }

    // Validar que al menos un campo venga
    if (titulo === undefined && completada === undefined) {
      return res.status(400).json({
        success: false,
        error: "Debe proporcionar al menos un campo para actualizar",
      });
    }

    // Validar título si viene
    if (titulo !== undefined && titulo.trim() === "") {
      return res.status(400).json({
        success: false,
        error: "El título no puede estar vacío",
      });
    }

    const tareaActualizada = Tarea.update(id, { titulo, completada });

    if (!tareaActualizada) {
      return res.status(404).json({
        success: false,
        error: "Tarea no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Tarea actualizada exitosamente",
      data: tareaActualizada,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al actualizar tarea",
    });
  }
};

// ============================================
// ELIMINAR TAREA
// ============================================
/**
 * DELETE /api/tareas/:id
 */
const eliminar = (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        error: "ID inválido",
      });
    }

    const tareaEliminada = Tarea.delete(id);

    if (!tareaEliminada) {
      return res.status(404).json({
        success: false,
        error: "Tarea no encontrada",
      });
    }

    res.json({
      success: true,
      message: "Tarea eliminada exitosamente",
      data: tareaEliminada,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al eliminar tarea",
    });
  }
};

// ============================================
// OBTENER ESTADÍSTICAS
// ============================================
/**
 * GET /api/tareas/estadisticas
 */
const obtenerEstadisticas = (req, res) => {
  try {
    const stats = Tarea.getEstadisticas();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas",
    });
  }
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================
module.exports = {
  obtenerTodas,
  obtenerPorId,
  obtenerCompletadas,
  crear,
  actualizar,
  eliminar,
  obtenerEstadisticas,
};
