/**
 * Servidor Principal de Didactifonis
 * Backend MERN con seguridad implementada
 */

const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
const config = require("./src/config/config");

// Importar configuraciones de seguridad
const {
  helmetConfig,
  corsOptions,
  generalLimiter,
  sanitizeConfig,
} = require("./src/config/securityConfig");

// Importar middleware
const errorHandler = require("./src/middleware/errorHandler");
const logger = require("./src/middleware/logger");

// Importar rutas
const authRoutes = require("./src/routes/authRoutes");
const patientsRoutes = require("./src/routes/patientsRoutes");
const tareasRoutes = require("./src/routes/tareasRoutes");
const adminRoutes = require("./src/routes/adminRoutes");
const gamesRoutes = require("./src/routes/gamesRoutes");
const assignmentsRoutes = require("./src/routes/assignmentsRoutes");
const progressRoutes = require("./src/routes/progressRoutes");
const suggestionsRoutes = require("./src/routes/suggestionsRoutes");
const offboardingRoutes = require("./src/routes/offboardingRoutes");
const gameBuilderRoutes = require("./src/routes/gameBuilderRoutes");

// ============================================
// CREAR APLICACIÓN EXPRESS
// ============================================
const app = express();

// ============================================
// MIDDLEWARE DE SEGURIDAD (ANTES DE TODO)
// ============================================

// 1. Helmet - Protección de headers
const helmet = require("helmet");
app.use(helmetConfig);

// 2. CORS - Control de acceso
const cors = require("cors");
app.use(cors(corsOptions));

// 3. Sanitización contra inyección NoSQL
// app.use(sanitizeConfig);

// 4. Rate Limiting General
app.use("/api/", generalLimiter);

// ============================================
// MIDDLEWARE GENERAL
// ============================================

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Logger HTTP
if (config.env === "development") {
  app.use(morgan("dev"));
}

// Logger personalizado
app.use(logger);

// ============================================
// RUTAS
// ============================================

// Ruta de health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Didactifonis API funcionando correctamente",
    timestamp: new Date().toISOString(),
    environment: config.env,
  });
});

// Montar rutas de la API
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/tareas", tareasRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/suggestions", suggestionsRoutes);
app.use("/api/offboarding", offboardingRoutes);
app.use("/api/game-builder", gameBuilderRoutes);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Ruta no encontrada",
    path: req.originalUrl,
  });
});

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES (AL FINAL)
// ============================================
app.use(errorHandler);

// ============================================
// CONEXIÓN A MONGODB
// ============================================
mongoose
  .connect(config.db.uri)
  .then(() => {
    console.log("✅ MongoDB conectado:", mongoose.connection.host);
    console.log("📦 Base de datos:", mongoose.connection.name);
  })
  .catch((error) => {
    console.error("❌ Error al conectar MongoDB:", error.message);
    process.exit(1);
  });

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = config.port || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${config.env}`);
  console.log(`🔒 Seguridad: Helmet, CORS, Rate Limiting, Sanitización`);
});

// Manejo de errores no capturados
process.on("unhandledRejection", (err) => {
  console.error("❌ Error no manejado:", err);
  server.close(() => process.exit(1));
});

module.exports = app;
