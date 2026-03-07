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
const config = require("./src/config/config");
const logger = require("./src/middleware/logger");
const { notFound, errorHandler } = require("./src/middleware/errorHandler");

// ============================================
// IMPORTAR RUTAS
// ============================================
const tareasRoutes = require("./src/routes/tareasRoutes");
const autoresRoutes = require("./src/routes/autoresRoutes");

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
app.use("/api/autores", autoresRoutes);

// Aquí montaremos más rutas después:
// app.use('/api/users', usersRoutes);
// app.use('/api/patients', patientsRoutes);
// app.use('/api/games', gamesRoutes);

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
  console.log(`   GET    http://localhost:${PORT}/api/tareas`);
  console.log(`   GET    http://localhost:${PORT}/api/tareas/completadas`);
  console.log(`   GET    http://localhost:${PORT}/api/tareas/estadisticas`);
  console.log(`   GET    http://localhost:${PORT}/api/tareas/:id`);
  console.log(`   POST   http://localhost:${PORT}/api/tareas`);
  console.log(`   PUT    http://localhost:${PORT}/api/tareas/:id`);
  console.log(`   DELETE http://localhost:${PORT}/api/tareas/:id`);
  console.log(`   GET    http://localhost:${PORT}/api/autores`);
  console.log(`   GET    http://localhost:${PORT}/api/autores/completadas`);
  console.log(`   GET    http://localhost:${PORT}/api/autores/estadisticas`);
  console.log(`   GET    http://localhost:${PORT}/api/autores/:id`);
  console.log(`   POST   http://localhost:${PORT}/api/autores`);
  console.log(`   PUT    http://localhost:${PORT}/api/autores/:id`);
  console.log(`   DELETE http://localhost:${PORT}/api/autores/:id`);
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
