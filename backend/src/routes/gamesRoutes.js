/**
 * Rutas de Juegos
 */

const express = require("express");
const router = express.Router();
const gamesController = require("../controllers/gamesController");
const { validarJuego } = require("../middleware/validators");
const { verificarToken } = require("../middleware/auth");

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
router.use(verificarToken);

// ============================================
// RUTAS ESPECÍFICAS (antes de /:id)
// ============================================

/**
 * @route   GET /api/games/area/:area
 * @desc    Buscar juegos por área terapéutica
 * @access  Private
 */
router.get("/area/:area", gamesController.buscarPorArea);

/**
 * @route   GET /api/games/edad/:edad
 * @desc    Buscar juegos apropiados para una edad
 * @access  Private
 */
router.get("/edad/:edad", gamesController.buscarPorEdad);

/**
 * @route   GET /api/games/codigo/:codigo
 * @desc    Obtener juego por código
 * @access  Private
 */
router.get("/codigo/:codigo", gamesController.obtenerPorCodigo);

// ============================================
// RUTAS GENERALES
// ============================================

/**
 * @route   GET /api/games
 * @desc    Obtener todos los juegos
 * @access  Private
 */
router.get("/", gamesController.obtenerTodos);

/**
 * @route   POST /api/games
 * @desc    Crear nuevo juego
 * @access  Private (Profesional o Admin)
 */
router.post("/", validarJuego, gamesController.crear);

// ============================================
// RUTAS CON PARÁMETROS
// ============================================

/**
 * @route   GET /api/games/:id
 * @desc    Obtener juego por ID
 * @access  Private
 */
router.get("/:id", gamesController.obtenerPorId);

/**
 * @route   PUT /api/games/:id
 * @desc    Actualizar juego
 * @access  Private (Profesional creador o Admin)
 */
router.put("/:id", gamesController.actualizar);

/**
 * @route   DELETE /api/games/:id
 * @desc    Desactivar juego
 * @access  Private (Solo Admin)
 */
router.delete("/:id", gamesController.eliminar);

module.exports = router;
