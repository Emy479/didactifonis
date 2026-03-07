/**
 * Controlador de Autores
 *
 * Maneja la lógica de negocio para operaciones CRUD de autores.
 */

const Autor = require("../models/Autor");

// ============================================
// OBTENER TODOS LOS AUTORES
// ============================================
/**
 * GET /api/autor
 */
const obtenerTodas = (req, res) => {
  try {
    const autores = Autor.getAll();

    res.json({
      success: true,
      count: autores.length,
      data: autores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener autores",
    });
  }
};

// ============================================
// OBTENER AUTOR POR ID
// ============================================
/**
 * GET /api/autores/:id
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

    const autor = Autor.getById(id);

    if (!autor) {
      return res.status(404).json({
        success: false,
        error: "Autor no encontrado",
      });
    }

    res.json({
      success: true,
      data: autor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener autor",
    });
  }
};

// ============================================
// OBTENER AUTORES COMPLETADAS
// ============================================
/**
 * GET /api/autores/completadas
 */
const obtenerCompletadas = (req, res) => {
  try {
    const autores = Autor.getCompletadas();

    res.json({
      success: true,
      count: autores.length,
      data: autores,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al obtener autores completados",
    });
  }
};

// ============================================
// CREAR NUEVO AUTOR
// ============================================
/**
 * POST /api/autores
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

    const nuevoAutor = Autor.create({ titulo });

    res.status(201).json({
      success: true,
      message: "Autor creado exitosamente",
      data: nuevoAutor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al crear autor",
    });
  }
};

// ============================================
// ACTUALIZAR AUTOR
// ============================================
/**
 * PUT /api/autores/:id
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

    const autorActualizado = Autor.update(id, { titulo, completada });

    if (!autorActualizado) {
      return res.status(404).json({
        success: false,
        error: "Autor no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Autor actualizada exitosamente",
      data: autorActualizado,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al actualizar autor",
    });
  }
};

// ============================================
// ELIMINAR AUTOR
// ============================================
/**
 * DELETE /api/autores/:id
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

    const autorEliminado = Autor.delete(id);

    if (!autorEliminado) {
      return res.status(404).json({
        success: false,
        error: "Autor no encontrado",
      });
    }

    res.json({
      success: true,
      message: "Autor eliminado exitosamente",
      data: autorEliminado,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Error al eliminar autor",
    });
  }
};

// ============================================
// OBTENER ESTADÍSTICAS
// ============================================
/**
 * GET /api/autores/estadisticas
 */
const obtenerEstadisticas = (req, res) => {
  try {
    const stats = Autor.getEstadisticas();

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
