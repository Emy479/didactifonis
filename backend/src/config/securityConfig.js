/**
 * Configuración de Seguridad
 *
 * Middleware para proteger la aplicación contra vulnerabilidades comunes
 */

const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");

// ============================================
// CONFIGURACIÓN DE HELMET
// ============================================
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// ============================================
// CONFIGURACIÓN DE CORS
// ============================================
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de orígenes permitidos
    const whitelist = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173", // Vite (React)
      "http://localhost:4200", // Angular
      // Agregar dominios de producción aquí
    ];

    // Permitir requests sin origin (como aplicaciones móviles o Postman)
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// ============================================
// RATE LIMITING
// ============================================

/**
 * Limitador general - Previene ataques de fuerza bruta
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "development" ? 1000 : 100,
  message: {
    success: false,
    error:
      "Demasiadas peticiones desde esta IP, intenta de nuevo en 15 minutos",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limitador para autenticación - Más estricto
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === "development" ? 100 : 5,
  message: {
    success: false,
    error:
      "Demasiados intentos de inicio de sesión, intenta de nuevo en 15 minutos",
  },
  skipSuccessfulRequests: true, // No contar si el login es exitoso
});

/**
 * Limitador para creación de recursos
 */
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 creaciones por hora
  message: {
    success: false,
    error: "Límite de creación alcanzado, intenta de nuevo en 1 hora",
  },
});

/**
 * Limitador para guardar progreso (más permisivo)
 */
const progressLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 30, // 30 sesiones por minuto (suficiente para juegos)
  message: {
    success: false,
    error: "Demasiadas sesiones de juego, espera un momento",
  },
});

// ============================================
// SANITIZACIÓN
// ============================================

/**
 * Previene inyección NoSQL
 * Elimina $ y . de los datos de entrada
 */
const sanitizeConfig = mongoSanitize({
  replaceWith: "_",
});

// ============================================
// EXPORTAR CONFIGURACIONES
// ============================================
module.exports = {
  helmetConfig,
  corsOptions,
  generalLimiter,
  authLimiter,
  createLimiter,
  progressLimiter,
  sanitizeConfig,
};
