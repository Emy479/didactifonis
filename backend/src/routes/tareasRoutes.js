/**
 * Rutas de Tareas
 *
 * Ahora protegidas con autenticación.
 */

const express = require("express");
const router = express.Router();
const tareasController = require("../controllers/tareasController");
const { verificarToken } = require("../middleware/auth");

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
// Aplicar middleware a todas las rutas de este router
router.use(verificarToken);

// ============================================
// RUTAS ESPECÍFICAS (van primero)
// ============================================

/**
 * @route   GET /api/tareas/completadas
 * @desc    Obtener todas las tareas completadas
 * @access  Private
 */
router.get("/completadas", tareasController.obtenerCompletadas);

/**
 * @route   GET /api/tareas/estadisticas
 * @desc    Obtener estadísticas de tareas
 * @access  Private
 */
router.get("/estadisticas", tareasController.obtenerEstadisticas);

// ============================================
// RUTAS GENERALES
// ============================================

/**
 * @route   GET /api/tareas
 * @desc    Obtener todas las tareas
 * @access  Private
 */
router.get("/", tareasController.obtenerTodas);

/**
 * @route   POST /api/tareas
 * @desc    Crear nueva tarea
 * @access  Private
 */
router.post("/", tareasController.crear);

// ============================================
// RUTAS CON PARÁMETROS (van al final)
// ============================================

/**
 * @route   GET /api/tareas/:id
 * @desc    Obtener tarea por ID
 * @access  Private
 */
router.get("/:id", tareasController.obtenerPorId);

/**
 * @route   PUT /api/tareas/:id
 * @desc    Actualizar tarea
 * @access  Private
 */
router.put("/:id", tareasController.actualizar);

/**
 * @route   DELETE /api/tareas/:id
 * @desc    Eliminar tarea
 * @access  Private
 */
router.delete("/:id", tareasController.eliminar);

module.exports = router;
