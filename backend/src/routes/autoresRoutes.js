/**
 * Rutas de Autores
 *
 * Define todos los endpoints relacionados con autores.
 */

const express = require("express");
const router = express.Router();
const autoresController = require("../controllers/autoresController");

// ============================================
// RUTAS ESPECÍFICAS (van primero)
// ============================================

/**
 * @route   GET /api/autores/completadas
 * @desc    Obtener todas los autores completados
 * @access  Public (por ahora)
 */
router.get("/completadas", autoresController.obtenerCompletadas);

/**
 * @route   GET /api/autores/estadisticas
 * @desc    Obtener estadísticas de autores
 * @access  Public
 */
router.get("/estadisticas", autoresController.obtenerEstadisticas);

// ============================================
// RUTAS GENERALES
// ============================================

/**
 * @route   GET /api/autores
 * @desc    Obtener todos los autores
 * @access  Public
 */
router.get("/", autoresController.obtenerTodas);

/**
 * @route   POST /api/autores
 * @desc    Crear nuevo autor
 * @access  Public
 */
router.post("/", autoresController.crear);

// ============================================
// RUTAS CON PARÁMETROS (van al final)
// ============================================

/**
 * @route   GET /api/autores/:id
 * @desc    Obtener autor por ID
 * @access  Public
 */
router.get("/:id", autoresController.obtenerPorId);

/**
 * @route   PUT /api/autores/:id
 * @desc    Actualizar autor
 * @access  Public
 */
router.put("/:id", autoresController.actualizar);

/**
 * @route   DELETE /api/autores/:id
 * @desc    Eliminar autor
 * @access  Public
 */
router.delete("/:id", autoresController.eliminar);

// ============================================
// EXPORTAR ROUTER
// ============================================
module.exports = router;
