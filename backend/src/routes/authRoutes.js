/**
 * Rutas de Autenticación
 * Con rate limiting para prevenir ataques de fuerza bruta
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verificarToken, verificarRol } = require("../middleware/auth");
const {
  validarRegistro,
  validarLogin,
  validarCampos,
} = require("../middleware/validators");
const { authLimiter, createLimiter } = require("../config/securityConfig");

// ============================================
// RUTAS PÚBLICAS (CON RATE LIMITING)
// ============================================

/**
 * @route   POST /api/auth/registro
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post(
  "/registro",
  createLimiter, // ← Rate limiting: 20 registros por hora
  validarRegistro,
  validarCampos,
  authController.registro,
);

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post(
  "/login",
  authLimiter, // ← Rate limiting: 5 intentos por 15 minutos
  validarLogin,
  validarCampos,
  authController.login,
);

/**
 * @route   GET /api/auth/profesionales
 * @desc    Listar profesionales verificados (público)
 * @access  Public
 */
router.get("/profesionales", authController.listarProfesionales);

// ============================================
// RUTAS PRIVADAS (REQUIEREN TOKEN)
// ============================================

router.use(verificarToken);

/**
 * @route   GET /api/auth/perfil
 * @desc    Obtener perfil del usuario autenticado
 * @access  Private
 */
router.get("/perfil", authController.obtenerPerfil);

/**
 * @route   PUT /api/auth/perfil
 * @desc    Actualizar perfil
 * @access  Private
 */
router.put("/perfil", authController.actualizarPerfil);

/**
 * @route   PUT /api/auth/cambiar-password
 * @desc    Cambiar contraseña
 * @access  Private
 */
router.put(
  "/cambiar-password",
  authLimiter, // ← Rate limiting en cambio de contraseña también
  authController.cambiarPassword,
);

module.exports = router;
