/**
 * Rutas de Sugerencias de Juegos
 */

const express = require("express");
const router = express.Router();
const suggestionsController = require("../controllers/suggestionsController");
const { verificarToken, verificarRole } = require("../middleware/auth");
const {
  validarSugerencia,
  validarCampos,
} = require("../middleware/validators");

// Todas las rutas requieren autenticación
router.use(verificarToken);

/**
 * @route   POST /api/suggestions
 * @desc    Crear nueva sugerencia
 * @access  Profesional, Admin
 */
router.post(
  "/",
  verificarRole(["profesional", "admin"]),
  validarSugerencia,
  validarCampos,
  suggestionsController.crear,
);

/**
 * @route   GET /api/suggestions
 * @desc    Obtener todas las sugerencias (con filtros)
 * @access  Profesional, Admin
 */
router.get(
  "/",
  verificarRole(["profesional", "admin"]),
  suggestionsController.obtenerTodas,
);

/**
 * @route   GET /api/suggestions/mis-sugerencias
 * @desc    Obtener mis sugerencias
 * @access  Profesional
 */
router.get(
  "/mis-sugerencias",
  verificarRole(["profesional", "admin"]),
  suggestionsController.obtenerMisSugerencias,
);

/**
 * @route   GET /api/suggestions/estadisticas
 * @desc    Obtener estadísticas de sugerencias
 * @access  Admin
 */
router.get(
  "/estadisticas",
  verificarRole(["admin"]),
  suggestionsController.obtenerEstadisticas,
);

/**
 * @route   GET /api/suggestions/:id
 * @desc    Obtener sugerencia por ID
 * @access  Profesional, Admin
 */
router.get(
  "/:id",
  verificarRole(["profesional", "admin"]),
  suggestionsController.obtenerPorId,
);

/**
 * @route   POST /api/suggestions/:id/votar
 * @desc    Votar por una sugerencia
 * @access  Profesional
 */
router.post(
  "/:id/votar",
  verificarRole(["profesional", "admin"]),
  suggestionsController.votar,
);

/**
 * @route   DELETE /api/suggestions/:id/votar
 * @desc    Quitar voto de una sugerencia
 * @access  Profesional
 */
router.delete(
  "/:id/votar",
  verificarRole(["profesional", "admin"]),
  suggestionsController.quitarVoto,
);

/**
 * @route   PUT /api/suggestions/:id/estado
 * @desc    Cambiar estado de sugerencia
 * @access  Admin
 */
router.put(
  "/:id/estado",
  verificarRole(["admin"]),
  suggestionsController.cambiarEstado,
);

/**
 * @route   DELETE /api/suggestions/:id
 * @desc    Eliminar sugerencia
 * @access  Creador, Admin
 */
router.delete("/:id", suggestionsController.eliminar);

module.exports = router;
