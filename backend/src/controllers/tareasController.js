/**
 * Controlador de Tareas - MongoDB
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
const obtenerTodas = async (req, res) => {
  try {
    // Obtener solo las tareas del usuario autenticado
    const tareas = await Tarea.find({ usuario: req.user.userId })
      .populate("usuario", "nombre email") // Incluir datos del usuario
      .sort({ createdAt: -1 }); // Más recientes primero

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
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar la tarea Y verificar que pertenezca al usuario
    const tarea = await Tarea.findOne({
      _id: id,
      usuario: req.user.userId,
    }).populate("usuario", "nombre email");

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
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "ID inválido",
      });
    }

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
const obtenerCompletadas = async (req, res) => {
  try {
    const tareas = await Tarea.find({
      usuario: req.user.userId,
      completada: true,
    }).populate("usuario", "nombre email");

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
 * Body: { titulo, prioridad?, descripcion? }
 */
const crear = async (req, res) => {
  try {
    const { titulo, prioridad, descripcion } = req.body;

    // Crear tarea asociada al usuario autenticado
    const nuevaTarea = new Tarea({
      titulo,
      prioridad,
      descripcion,
      usuario: req.user.userId, // ← IMPORTANTE
    });

    const tareaGuardada = await nuevaTarea.save();

    // Poblar datos del usuario
    await tareaGuardada.populate("usuario", "nombre email");

    res.status(201).json({
      success: true,
      message: "Tarea creada exitosamente",
      data: tareaGuardada,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

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
 * Body: { titulo?, completada?, prioridad?, descripcion? }
 */
const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, completada, prioridad, descripcion } = req.body;

    // Buscar Y verificar que pertenezca al usuario
    const tareaActualizada = await Tarea.findOneAndUpdate(
      {
        _id: id,
        usuario: req.user.userId, // ← IMPORTANTE
      },
      { titulo, completada, prioridad, descripcion },
      {
        new: true,
        runValidators: true,
      },
    ).populate("usuario", "nombre email");

    if (!tareaActualizada) {
      return res.status(404).json({
        success: false,
        error: "Tarea no encontrada o no tienes permiso",
      });
    }

    res.json({
      success: true,
      message: "Tarea actualizada exitosamente",
      data: tareaActualizada,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "ID inválido",
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

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
const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar Y verificar que pertenezca al usuario
    const tareaEliminada = await Tarea.findOneAndDelete({
      _id: id,
      usuario: req.user.userId, // ← IMPORTANTE
    });

    if (!tareaEliminada) {
      return res.status(404).json({
        success: false,
        error: "Tarea no encontrada o no tienes permiso",
      });
    }

    res.json({
      success: true,
      message: "Tarea eliminada exitosamente",
      data: tareaEliminada,
    });
  } catch (error) {
    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "ID inválido",
      });
    }

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
const obtenerEstadisticas = async (req, res) => {
  try {
    // Estadísticas solo de las tareas del usuario
    const total = await Tarea.countDocuments({ usuario: req.user.userId });
    const completadas = await Tarea.countDocuments({
      usuario: req.user.userId,
      completada: true,
    });
    const pendientes = total - completadas;
    const porcentaje = total > 0 ? ((completadas / total) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        total,
        completadas,
        pendientes,
        porcentajeCompletado: `${porcentaje}%`,
      },
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
