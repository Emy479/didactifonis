/**
 * Rutas de Progreso
 * Con rate limiting específico para sesiones de juego
 */

const express = require("express");
const router = express.Router();
const progressController = require("../controllers/progressController");
const { verificarToken } = require("../middleware/auth");
const { validarProgreso, validarCampos } = require("../middleware/validators");
const { progressLimiter } = require("../config/securityConfig");

// ============================================
// RUTA PÚBLICA (CON TOKEN DE PACIENTE)
// ============================================

/**
 * @route   POST /api/progress
 * @desc    Guardar progreso de una sesión de juego
 * @access  Public (requiere token de paciente en body)
 */
router.post(
  "/",
  progressLimiter, // ← Rate limiting: 30 sesiones por minuto
  validarProgreso,
  validarCampos,
  progressController.guardar,
);

// ============================================
// RUTAS PRIVADAS (REQUIEREN JWT)
// ============================================

router.use(verificarToken);

/**
 * @route   GET /api/progress/patient/:pacienteId
 * @desc    Obtener progreso de un paciente
 * @access  Private (tutor, profesional asignado, admin)
 */
router.get("/patient/:pacienteId", progressController.obtenerPorPaciente);

/**
 * @route   GET /api/progress/assignment/:asignacionId
 * @desc    Obtener progreso de una asignación específica
 * @access  Private
 */
router.get(
  "/assignment/:asignacionId",
  progressController.obtenerPorAsignacion,
);

/**
 * @route   GET /api/progress/evolucion/:pacienteId/:juegoId
 * @desc    Obtener evolución temporal de un paciente en un juego
 * @access  Private
 */
router.get(
  "/evolucion/:pacienteId/:juegoId",
  progressController.obtenerEvolucion,
);

/**
 * @route   GET /api/progress/juegos-mas-jugados/:pacienteId
 * @desc    Obtener juegos más jugados por un paciente
 * @access  Private
 */
router.get(
  "/juegos-mas-jugados/:pacienteId",
  progressController.obtenerJuegosMasJugados,
);

/**
 * @route   GET /api/progress/estadisticas/:pacienteId
 * @desc    Obtener estadísticas generales de un paciente
 * @access  Private
 */
router.get("/estadisticas/:pacienteId", progressController.obtenerEstadisticas);

module.exports = router;
