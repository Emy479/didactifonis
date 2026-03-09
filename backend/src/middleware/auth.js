/**
 * Middleware de Autenticación
 *
 * Verifica que el usuario esté autenticado mediante JWT.
 */

const jwt = require("jsonwebtoken");
const config = require("../config/config");
const User = require("../models/User");

// ============================================
// VERIFICAR TOKEN JWT
// ============================================
/**
 * Middleware que verifica el token en el header Authorization
 */
const verificarToken = async (req, res, next) => {
  try {
    // Obtener token del header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No autorizado. Token no proporcionado",
      });
    }

    // Extraer el token (quitar "Bearer ")
    const token = authHeader.substring(7);

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Verificar que el usuario exista y esté activo
    const usuario = await User.findById(decoded.userId);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: "Token inválido. Usuario no encontrado",
      });
    }

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        error: "Cuenta desactivada",
      });
    }

    // Adjuntar información del usuario al request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Error en verificación de token:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Token inválido",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token expirado. Por favor inicia sesión nuevamente",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al verificar autenticación",
    });
  }
};

// ============================================
// VERIFICAR ROLES
// ============================================
/**
 * Middleware que verifica que el usuario tenga uno de los roles permitidos
 * @param  {...string} rolesPermitidos - Lista de roles permitidos
 */
const verificarRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    // Este middleware debe usarse DESPUÉS de verificarToken
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "No autorizado",
      });
    }

    if (!rolesPermitidos.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado. Se requiere rol: ${rolesPermitidos.join(" o ")}`,
      });
    }

    next();
  };
};

// ============================================
// VERIFICAR QUE SEA PROFESIONAL VERIFICADO
// ============================================
/**
 * Middleware que verifica que el usuario sea un profesional verificado
 */
const verificarProfesionalVerificado = async (req, res, next) => {
  try {
    if (req.user.role !== "profesional") {
      return res.status(403).json({
        success: false,
        error: "Solo profesionales pueden acceder a esta función",
      });
    }

    const usuario = await User.findById(req.user.userId);

    if (!usuario.verificado) {
      return res.status(403).json({
        success: false,
        error: "Tu cuenta de profesional aún no está verificada",
      });
    }

    next();
  } catch (error) {
    console.error("Error al verificar profesional:", error);
    res.status(500).json({
      success: false,
      error: "Error al verificar credenciales",
    });
  }
};

// ============================================
// MIDDLEWARE OPCIONAL (permite acceso con o sin token)
// ============================================
/**
 * Similar a verificarToken pero no falla si no hay token
 * Útil para rutas que cambian su comportamiento si el usuario está logueado
 */
const tokenOpcional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      // No hay token, pero continúa sin req.user
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret);

    const usuario = await User.findById(decoded.userId);

    if (usuario && usuario.activo) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }

    next();
  } catch (error) {
    // Si hay error en el token, simplemente continúa sin req.user
    next();
  }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  verificarToken,
  verificarRol,
  verificarProfesionalVerificado,
  tokenOpcional,
};
