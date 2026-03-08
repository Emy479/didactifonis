/**
 * Configuración de Base de Datos
 *
 * Maneja la conexión a MongoDB usando Mongoose.
 */

const mongoose = require("mongoose");
const config = require("./config");

/**
 * Conectar a MongoDB
 */
const connectDB = async () => {
  try {
    // Conectar (sin opciones - Mongoose 6+ ya no las necesita)
    const conn = await mongoose.connect(config.database.uri);

    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);
    console.log(`📦 Base de datos: ${conn.connection.name}`);

    // Eventos de conexión
    mongoose.connection.on("error", (err) => {
      console.error("❌ Error de MongoDB:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.log("⚠️  MongoDB desconectado");
    });

    // Manejar cierre graceful
    process.on("SIGINT", async () => {
      await mongoose.connection.close();
      console.log("👋 MongoDB desconectado (app cerrada)");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error al conectar MongoDB:", error.message);

    // Si falla la conexión, mostrar ayuda
    console.log("\n📌 Posibles soluciones:");
    console.log("   1. Verifica que MongoDB esté corriendo");
    console.log("   2. Revisa tu DB_URI en .env");
    console.log("   3. Si usas MongoDB local, asegúrate del servicio activo\n");

    process.exit(1);
  }
};

module.exports = connectDB;
