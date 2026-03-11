/**
 * Rutas de Asignaciones
 */

const express = require("express");
const router = express.Router();
const assignmentsController = require("../controllers/assignmentsController");
const { validarAsignacion } = require("../middleware/validators");
const { verificarToken } = require("../middleware/auth");

// ============================================
// RUTA PÚBLICA (Sin autenticación)
// ============================================

/**
 * @route   GET /api/assignments/token/:token/games
 * @desc    Obtener juegos asignados a un paciente por token
 * @access  Public
 */
router.get("/token/:token/games", assignmentsController.obtenerJuegosPorToken);

// ============================================
// APLICAR AUTENTICACIÓN A TODAS LAS DEMÁS RUTAS
// ============================================
router.use(verificarToken);

// ============================================
// RUTAS ESPECÍFICAS (antes de /:id)
// ============================================

/**
 * @route   GET /api/assignments/estadisticas
 * @desc    Obtener estadísticas de asignaciones
 * @access  Private
 */
router.get("/estadisticas", assignmentsController.obtenerEstadisticas);

/**
 * @route   GET /api/assignments/paciente/:pacienteId
 * @desc    Obtener asignaciones de un paciente
 * @access  Private
 */
router.get("/paciente/:pacienteId", assignmentsController.obtenerPorPaciente);

/**
 * @route   GET /api/assignments/juego/:juegoId
 * @desc    Obtener pacientes con un juego asignado
 * @access  Private
 */
router.get("/juego/:juegoId", assignmentsController.obtenerPorJuego);

// ============================================
// RUTAS GENERALES
// ============================================

/**
 * @route   POST /api/assignments
 * @desc    Crear nueva asignación
 * @access  Private
 */
router.post("/", validarAsignacion, assignmentsController.crear);

// ============================================
// RUTAS CON PARÁMETROS
// ============================================

/**
 * @route   GET /api/assignments/:id
 * @desc    Obtener asignación por ID
 * @access  Private
 */
router.get("/:id", assignmentsController.obtenerPorId);

/**
 * @route   PUT /api/assignments/:id
 * @desc    Actualizar asignación
 * @access  Private
 */
router.put("/:id", assignmentsController.actualizar);

/**
 * @route   DELETE /api/assignments/:id
 * @desc    Desactivar asignación
 * @access  Private
 */
router.delete("/:id", assignmentsController.desactivar);

module.exports = router;
