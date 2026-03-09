/**
 * Rutas de Pacientes
 */

const express = require("express");
const router = express.Router();
const patientsController = require("../controllers/patientsController");
const { validarPaciente } = require("../middleware/validators");
const { verificarToken } = require("../middleware/auth");

// ============================================
// RUTA PÚBLICA (Sin autenticación)
// ============================================

/**
 * @route   GET /api/patients/token/:token
 * @desc    Obtener datos del paciente por token de acceso
 * @access  Public
 */
router.get("/token/:token", patientsController.obtenerPorToken);

// ============================================
// APLICAR AUTENTICACIÓN A TODAS LAS DEMÁS RUTAS
// ============================================
router.use(verificarToken);

// ============================================
// RUTAS ESPECÍFICAS (antes de /:id)
// ============================================

/**
 * @route   GET /api/patients/estadisticas
 * @desc    Obtener estadísticas de pacientes
 * @access  Private
 */
router.get("/estadisticas", patientsController.obtenerEstadisticas);

// ============================================
// RUTAS GENERALES
// ============================================

/**
 * @route   GET /api/patients
 * @desc    Obtener todos los pacientes del usuario
 * @access  Private
 */
router.get("/", patientsController.obtenerTodos);

/**
 * @route   POST /api/patients
 * @desc    Crear nuevo paciente
 * @access  Private (Tutor o Profesional)
 */
router.post("/", validarPaciente, patientsController.crear);

// ============================================
// RUTAS CON PARÁMETROS
// ============================================

/**
 * @route   GET /api/patients/:id
 * @desc    Obtener paciente por ID
 * @access  Private
 */
router.get("/:id", patientsController.obtenerPorId);

/**
 * @route   PUT /api/patients/:id
 * @desc    Actualizar paciente
 * @access  Private
 */
router.put("/:id", patientsController.actualizar);

/**
 * @route   DELETE /api/patients/:id
 * @desc    Desactivar paciente
 * @access  Private (Solo tutor)
 */
router.delete("/:id", patientsController.eliminar);

/**
 * @route   POST /api/patients/:id/asignar-profesional
 * @desc    Asignar profesional a paciente
 * @access  Private (Solo tutor)
 */
router.post("/:id/asignar-profesional", patientsController.asignarProfesional);

/**
 * @route   DELETE /api/patients/:id/profesional/:profesionalId
 * @desc    Remover profesional de paciente
 * @access  Private (Solo tutor)
 */
router.delete(
  "/:id/profesional/:profesionalId",
  patientsController.removerProfesional,
);

/**
 * @route   POST /api/patients/:id/renovar-token
 * @desc    Renovar token de acceso del paciente
 * @access  Private
 */
router.post("/:id/renovar-token", patientsController.renovarToken);

module.exports = router;
