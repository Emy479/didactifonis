/**
 * Modelo de Tarea - MongoDB
 *
 * Define el esquema y métodos para interactuar con la colección de tareas.
 */

const mongoose = require("mongoose");

// ============================================
// DEFINIR ESQUEMA
// ============================================
const tareaSchema = new mongoose.Schema(
  {
    titulo: {
      type: String,
      required: [true, "El título es obligatorio"],
      trim: true, // Elimina espacios al inicio/final
      maxlength: [100, "El título no puede exceder 100 caracteres"],
    },
    completada: {
      type: Boolean,
      default: false,
    },
    // Campos adicionales que podemos agregar:
    prioridad: {
      type: String,
      enum: ["baja", "media", "alta"], // Solo acepta estos valores
      default: "media",
    },
    descripcion: {
      type: String,
      maxlength: 500,
    },
  },
  {
    // Opciones del schema
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    versionKey: false, // Desactiva el campo __v
  },
);

// ============================================
// MÉTODOS PERSONALIZADOS (Opcional)
// ============================================

/**
 * Método de instancia: marcar como completada
 */
tareaSchema.methods.marcarCompletada = function () {
  this.completada = true;
  return this.save();
};

/**
 * Método estático: obtener tareas completadas
 */
tareaSchema.statics.obtenerCompletadas = function () {
  return this.find({ completada: true });
};

/**
 * Método estático: obtener estadísticas
 */
tareaSchema.statics.obtenerEstadisticas = async function () {
  const total = await this.countDocuments();
  const completadas = await this.countDocuments({ completada: true });
  const pendientes = total - completadas;
  const porcentaje = total > 0 ? ((completadas / total) * 100).toFixed(2) : 0;

  return {
    total,
    completadas,
    pendientes,
    porcentajeCompletado: `${porcentaje}%`,
  };
};

// ============================================
// CREAR Y EXPORTAR MODELO
// ============================================
// El modelo es la interfaz para interactuar con la colección
const Tarea = mongoose.model("Tarea", tareaSchema);

module.exports = Tarea;
