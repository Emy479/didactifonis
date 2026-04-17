/**
 * Modelo de Feedback de Offboarding
 *
 * Registra el cuestionario que completa un usuario
 * al desactivar su cuenta voluntariamente.
 */

const mongoose = require("mongoose");

const offboardingFeedbackSchema = new mongoose.Schema(
  {
    // Usuario que dejó la plataforma
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Snapshot del usuario al momento del cese (por si se elimina luego)
    usuarioSnapshot: {
      nombre: String,
      email: String,
      role: String,
      especialidad: String,
    },

    // ── Preguntas del cuestionario ────────────────────────────────────────

    // Pregunta 1: motivo principal
    motivoCese: {
      type: String,
      enum: [
        "precio",           // El precio no se ajusta a mi presupuesto
        "juegos",           // No encontré los juegos que necesitaba
        "tecnico",          // Dificultades técnicas
        "sin_necesidad",    // Ya no necesito el servicio
        "competencia",      // Me cambié a otra plataforma
        "otro",             // Otro
      ],
      required: true,
    },

    // Pregunta 2: ¿nos recomendarías?
    recomendaria: {
      type: String,
      enum: ["si", "tal_vez", "no"],
      required: true,
    },

    // Pregunta 3: texto libre — qué le haría volver o qué desearía ver
    sugerencias: {
      type: String,
      maxlength: [1000, "Las sugerencias no pueden exceder 1000 caracteres"],
      default: "",
    },

    // Fecha en que se registró el feedback (coincide aprox. con fechaDesactivacion)
    fechaCese: {
      type: Date,
      default: Date.now,
    },

    // Para uso futuro: si se le envió un cupón/recordatorio de retorno
    contactoRetorno: {
      enviado: { type: Boolean, default: false },
      fechaEnvio: { type: Date, default: null },
      tipo: {
        type: String,
        enum: ["cupon", "recordatorio", "email", null],
        default: null,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Índice para búsquedas por usuario y fecha
offboardingFeedbackSchema.index({ usuario: 1 });
offboardingFeedbackSchema.index({ fechaCese: -1 });
offboardingFeedbackSchema.index({ motivoCese: 1 });

module.exports = mongoose.model("OffboardingFeedback", offboardingFeedbackSchema);
