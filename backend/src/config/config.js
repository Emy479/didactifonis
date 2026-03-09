/**
 * Configuración Centralizada
 *
 * Todas las configuraciones del proyecto en un solo lugar.
 */

require("dotenv").config();

module.exports = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || "development",
  },

  // Configuración de base de datos
  database: {
    uri: process.env.DB_URI || "mongodb://localhost:27017/didactifonis",
  },

  // Configuración de JWT
  jwt: {
    secret:
      process.env.JWT_SECRET ||
      "tu-super-secreto-temporal-cambiar-en-produccion",
    expiresIn: "7d", // Token válido por 7 días
  },

  // CORS (para permitir peticiones desde el frontend)
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  },
};
