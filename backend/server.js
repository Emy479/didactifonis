/**
 * ============================================
 * DIDACTIFONIS - SERVIDOR PRINCIPAL
 * ============================================
 *
 * Backend de la plataforma educativa de terapia fonoaudiológica.
 *
 * Arquitectura:
 *   - Express.js para el servidor HTTP
 *   - Organización por capas (MVC sin V)
 *   - Middleware centralizado
 *   - Manejo de errores consistente
 */

// ============================================
// IMPORTAR DEPENDENCIAS
// ============================================
const express = require("express");
const connectDB = require("./src/config/database");
const config = require("./src/config/config");
const logger = require("./src/middleware/logger");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");

// ============================================
// CONECTAR A BASE DE DATOS
// ============================================
connectDB();

// ============================================
// IMPORTAR RUTAS
// ============================================
const tareasRoutes = require("./src/routes/tareasRoutes");
const authRoutes = require("./src/routes/authRoutes");
const patientsRoutes = require("./src/routes/patientsRoutes");
const assignmentsRoutes = require("./src/routes/assignmentsRoutes");
const gamesRoutes = require("./src/routes/gamesRoutes");

// ============================================
// CREAR APLICACIÓN EXPRESS
// ============================================
const app = express();

// ============================================
// MIDDLEWARE GLOBAL
// ============================================

// 1. Logger (debe ir primero para capturar todo)
app.use(logger);

// 2. Parse JSON en el body de las peticiones
app.use(express.json());

// 3. Parse URL-encoded data (formularios)
app.use(express.urlencoded({ extended: true }));

// ============================================
// RUTA RAÍZ (Información de la API)
// ============================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Bienvenido a la API de Didactifonis",
    version: "1.0.0",
    environment: config.server.env,
    documentation: {
      tareas: "/api/tareas",
      // Aquí agregaremos más recursos después
    },
  });
});

// ============================================
// HEALTH CHECK (verificar que el servidor funciona)
// ============================================
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(), // Segundos que lleva corriendo el servidor
  });
});

// ============================================
// MONTAR RUTAS DE RECURSOS
// ============================================
app.use("/api/tareas", tareasRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientsRoutes);
app.use("/api/assignments", assignmentsRoutes);
app.use("/api/games", gamesRoutes);

// Aquí montaremos más rutas después:
// app.use('/api/users', usersRoutes);

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ============================================

// 1. Capturar rutas no encontradas (404)
app.use(notFound);

// 2. Manejador de errores global (debe ir al final)
app.use(errorHandler);

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = config.server.port;

app.listen(PORT, () => {
  console.log("\n" + "=".repeat(50));
  console.log("🚀 DIDACTIFONIS API");
  console.log("=".repeat(50));
  console.log(`📡 Servidor corriendo en: http://localhost:${PORT}`);
  console.log(`🌍 Entorno: ${config.server.env}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log("=".repeat(50) + "\n");

  // Listar endpoints disponibles
  console.log("📋 Endpoints disponibles:");
  console.log(`   GET    http://localhost:${PORT}/`);
  console.log(`   GET    http://localhost:${PORT}/health`);
  console.log(`   POST   http://localhost:${PORT}/api/auth/registro`);
  console.log(`   POST   http://localhost:${PORT}/api/auth/login`);
  console.log(`   GET    http://localhost:${PORT}/api/auth/perfil`);
  console.log(`   GET    http://localhost:${PORT}/api/games`);
  console.log(`   POST   http://localhost:${PORT}/api/games`);
  console.log(`   GET    http://localhost:${PORT}/api/assignments`);
  console.log(`   GET    http://localhost:${PORT}/api/patients`);
  console.log(`   POST   http://localhost:${PORT}/api/patients`);
  console.log(`   GET    http://localhost:${PORT}/api/patients/:id`);
  console.log(`   GET    http://localhost:${PORT}/api/tareas`);
  console.log(`   GET    http://localhost:${PORT}/api/tareas/completadas`);
  console.log(`   GET    http://localhost:${PORT}/api/tareas/estadisticas`);
  console.log(`   GET    http://localhost:${PORT}/api/tareas/:id`);
  console.log(`   POST   http://localhost:${PORT}/api/tareas`);
  console.log(`   PUT    http://localhost:${PORT}/api/tareas/:id`);
  console.log(`   DELETE http://localhost:${PORT}/api/tareas/:id`);
  console.log("");
});

// ============================================
// MANEJO DE SEÑALES DE CIERRE
// ============================================
// Cerrar gracefully cuando se detiene el servidor
process.on("SIGTERM", () => {
  console.log("👋 SIGTERM recibido. Cerrando servidor...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("\n👋 SIGINT recibido. Cerrando servidor...");
  process.exit(0);
});
