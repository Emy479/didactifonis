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
    // find() sin parámetros obtiene todos los documentos
    const tareas = await Tarea.find();

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

    // findById() busca por _id
    const tarea = await Tarea.findById(id);

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
    // Si el ID no es válido, Mongoose lanza un error
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
    // Usar el método estático que definimos
    const tareas = await Tarea.obtenerCompletadas();

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

    // Crear instancia del modelo
    const nuevaTarea = new Tarea({
      titulo,
      prioridad,
      descripcion,
    });

    // Guardar en la base de datos
    const tareaGuardada = await nuevaTarea.save();

    res.status(201).json({
      success: true,
      message: "Tarea creada exitosamente",
      data: tareaGuardada,
    });
  } catch (error) {
    // Mongoose devuelve errores de validación detallados
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

    // findByIdAndUpdate actualiza y devuelve el documento actualizado
    const tareaActualizada = await Tarea.findByIdAndUpdate(
      id,
      { titulo, completada, prioridad, descripcion },
      {
        new: true, // Devolver el documento actualizado
        runValidators: true, // Ejecutar validaciones del schema
      },
    );

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

    // findByIdAndDelete elimina y devuelve el documento eliminado
    const tareaEliminada = await Tarea.findByIdAndDelete(id);

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
    // Usar el método estático que definimos
    const stats = await Tarea.obtenerEstadisticas();

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
