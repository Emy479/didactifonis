/**
 * Rutas de Tareas
 *
 * Define todos los endpoints relacionados con tareas.
 */

const express = require("express");
const router = express.Router();
const tareasController = require("../controllers/tareasController");

// ============================================
// RUTAS ESPECÍFICAS (van primero)
// ============================================

/**
 * @route   GET /api/tareas/completadas
 * @desc    Obtener todas las tareas completadas
 * @access  Public (por ahora)
 */
router.get("/completadas", tareasController.obtenerCompletadas);

/**
 * @route   GET /api/tareas/estadisticas
 * @desc    Obtener estadísticas de tareas
 * @access  Public
 */
router.get("/estadisticas", tareasController.obtenerEstadisticas);

// ============================================
// RUTAS GENERALES
// ============================================

/**
 * @route   GET /api/tareas
 * @desc    Obtener todas las tareas
 * @access  Public
 */
router.get("/", tareasController.obtenerTodas);

/**
 * @route   POST /api/tareas
 * @desc    Crear nueva tarea
 * @access  Public
 */
router.post("/", tareasController.crear);

// ============================================
// RUTAS CON PARÁMETROS (van al final)
// ============================================

/**
 * @route   GET /api/tareas/:id
 * @desc    Obtener tarea por ID
 * @access  Public
 */
router.get("/:id", tareasController.obtenerPorId);

/**
 * @route   PUT /api/tareas/:id
 * @desc    Actualizar tarea
 * @access  Public
 */
router.put("/:id", tareasController.actualizar);

/**
 * @route   DELETE /api/tareas/:id
 * @desc    Eliminar tarea
 * @access  Public
 */
router.delete("/:id", tareasController.eliminar);

// ============================================
// EXPORTAR ROUTER
// ============================================
module.exports = router;
