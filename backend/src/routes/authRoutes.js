/**
 * Rutas de Autenticación
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { validarRegistro, validarLogin } = require("../middleware/validators");
const { verificarToken } = require("../middleware/auth");

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

/**
 * @route   POST /api/auth/registro
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post("/registro", validarRegistro, authController.registro);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post("/login", validarLogin, authController.login);

/**
 * @route   GET /api/auth/profesionales
 * @desc    Listar profesionales verificados
 * @access  Public
 */
router.get("/profesionales", authController.listarProfesionales);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

/**
 * @route   GET /api/auth/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get("/perfil", verificarToken, authController.obtenerPerfil);

/**
 * @route   PUT /api/auth/perfil
 * @desc    Actualizar perfil del usuario
 * @access  Private
 */
router.put("/perfil", verificarToken, authController.actualizarPerfil);

/**
 * @route   PUT /api/auth/cambiar-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.put("/cambiar-password", verificarToken, authController.cambiarPassword);

module.exports = router;
