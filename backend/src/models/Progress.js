/**
 * Modelo de Progreso
 *
 * Registra cada sesión de juego que un paciente completa.
 * Permite seguir la evolución del paciente a lo largo del tiempo.
 */

const mongoose = require("mongoose");

// ============================================
// DEFINIR ESQUEMA
// ============================================
const progressSchema = new mongoose.Schema(
  {
    // Relaciones principales
    paciente: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: [true, "El paciente es obligatorio"],
    },

    juego: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game",
      required: [true, "El juego es obligatorio"],
    },

    asignacion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: [true, "La asignación es obligatoria"],
    },

    // Resultados de la sesión
    puntuacion: {
      type: Number,
      required: [true, "La puntuación es obligatoria"],
      min: [0, "La puntuación no puede ser negativa"],
    },

    puntuacionMaxima: {
      type: Number,
      required: true,
    },

    porcentajeAcierto: {
      type: Number,
      min: 0,
      max: 100,
    },

    // Tiempo
    tiempoJugado: {
      type: Number, // En segundos
      required: true,
      min: [0, "El tiempo no puede ser negativo"],
    },

    tiempoPromedioPorRonda: {
      type: Number, // En segundos
    },

    // Detalles de rendimiento
    rondasCompletadas: {
      type: Number,
      default: 0,
    },

    rondasTotales: {
      type: Number,
      default: 0,
    },

    aciertos: {
      type: Number,
      default: 0,
    },

    errores: {
      type: Number,
      default: 0,
    },

    // Estado de completitud
    completado: {
      type: Boolean,
      default: false,
    },

    aprobado: {
      type: Boolean,
      default: false,
    },

    // Datos específicos del juego (flexible)
    datosJuego: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    // Notas y observaciones
    notas: {
      type: String,
      maxlength: [500, "Las notas no pueden exceder 500 caracteres"],
    },

    // Metadata
    dispositivo: {
      type: String,
      enum: ["web", "mobile", "tablet", "desktop"],
      default: "web",
    },

    navegador: String,

    sistemaOperativo: String,

    // Fecha de la sesión
    fechaSesion: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ============================================
// ÍNDICES
// ============================================
progressSchema.index({ paciente: 1, createdAt: -1 });
progressSchema.index({ asignacion: 1, createdAt: -1 });
progressSchema.index({ juego: 1 });
progressSchema.index({ paciente: 1, juego: 1, createdAt: -1 });

// ============================================
// MIDDLEWARE PRE-SAVE
// ============================================

/**
 * Calcular campos derivados antes de guardar
 */
progressSchema.pre("save", function () {
  // Calcular porcentaje de acierto
  if (this.puntuacionMaxima > 0) {
    this.porcentajeAcierto = Math.round(
      (this.puntuacion / this.puntuacionMaxima) * 100,
    );
  }

  // Calcular tiempo promedio por ronda
  if (this.rondasCompletadas > 0) {
    this.tiempoPromedioPorRonda = Math.round(
      this.tiempoJugado / this.rondasCompletadas,
    );
  }

  // Determinar si aprobó (si está completado)
  if (this.completado) {
    // Buscar Assignment para obtener porcentaje de aprobación
    // Esto se hará en el controlador
  }
});

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Obtener datos públicos del progreso
 */
progressSchema.methods.getDatosPublicos = function () {
  return {
    _id: this._id,
    puntuacion: this.puntuacion,
    puntuacionMaxima: this.puntuacionMaxima,
    porcentajeAcierto: this.porcentajeAcierto,
    tiempoJugado: this.tiempoJugado,
    completado: this.completado,
    aprobado: this.aprobado,
    fechaSesion: this.fechaSesion,
  };
};

/**
 * Obtener datos completos
 */
progressSchema.methods.getDatosCompletos = function () {
  return {
    _id: this._id,
    paciente: this.paciente,
    juego: this.juego,
    asignacion: this.asignacion,
    puntuacion: this.puntuacion,
    puntuacionMaxima: this.puntuacionMaxima,
    porcentajeAcierto: this.porcentajeAcierto,
    tiempoJugado: this.tiempoJugado,
    tiempoPromedioPorRonda: this.tiempoPromedioPorRonda,
    rondasCompletadas: this.rondasCompletadas,
    rondasTotales: this.rondasTotales,
    aciertos: this.aciertos,
    errores: this.errores,
    completado: this.completado,
    aprobado: this.aprobado,
    datosJuego: this.datosJuego,
    notas: this.notas,
    dispositivo: this.dispositivo,
    navegador: this.navegador,
    sistemaOperativo: this.sistemaOperativo,
    fechaSesion: this.fechaSesion,
    createdAt: this.createdAt,
  };
};

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Obtener progreso de un paciente
 */
progressSchema.statics.obtenerProgresoPaciente = function (
  pacienteId,
  limite = 50,
) {
  return this.find({ paciente: pacienteId })
    .populate("juego", "nombre codigo thumbnail")
    .populate("asignacion")
    .sort({ createdAt: -1 })
    .limit(limite);
};

/**
 * Obtener progreso de una asignación específica
 */
progressSchema.statics.obtenerProgresoAsignacion = function (asignacionId) {
  return this.find({ asignacion: asignacionId }).sort({ createdAt: -1 });
};

/**
 * Obtener estadísticas de un paciente
 */
progressSchema.statics.obtenerEstadisticasPaciente = async function (
  pacienteId,
) {
  const estadisticas = await this.aggregate([
    { $match: { paciente: new mongoose.Types.ObjectId(pacienteId) } }, // ← new
    {
      $group: {
        _id: null,
        totalSesiones: { $sum: 1 },
        sesionesCompletadas: {
          $sum: { $cond: ["$completado", 1, 0] },
        },
        sesionesAprobadas: {
          $sum: { $cond: ["$aprobado", 1, 0] },
        },
        puntuacionPromedio: { $avg: "$puntuacion" },
        porcentajePromedioAcierto: { $avg: "$porcentajeAcierto" },
        tiempoTotalJugado: { $sum: "$tiempoJugado" },
        mejorPuntuacion: { $max: "$puntuacion" },
      },
    },
  ]);

  if (estadisticas.length === 0) {
    return {
      totalSesiones: 0,
      sesionesCompletadas: 0,
      sesionesAprobadas: 0,
      puntuacionPromedio: 0,
      porcentajePromedioAcierto: 0,
      tiempoTotalJugado: 0,
      mejorPuntuacion: 0,
    };
  }

  const stats = estadisticas[0];
  delete stats._id;

  // Redondear valores
  stats.puntuacionPromedio = Math.round(stats.puntuacionPromedio * 100) / 100;
  stats.porcentajePromedioAcierto =
    Math.round(stats.porcentajePromedioAcierto * 100) / 100;

  return stats;
};

/**
 * Obtener estadísticas de una asignación
 */
progressSchema.statics.obtenerEstadisticasAsignacion = async function (
  asignacionId,
) {
  const estadisticas = await this.aggregate([
    { $match: { asignacion: new mongoose.Types.ObjectId(asignacionId) } }, // ← new
    {
      $group: {
        _id: null,
        totalSesiones: { $sum: 1 },
        sesionesCompletadas: {
          $sum: { $cond: ["$completado", 1, 0] },
        },
        puntuacionPromedio: { $avg: "$puntuacion" },
        mejorPuntuacion: { $max: "$puntuacion" },
        tiempoPromedio: { $avg: "$tiempoJugado" },
      },
    },
  ]);

  if (estadisticas.length === 0) {
    return {
      totalSesiones: 0,
      sesionesCompletadas: 0,
      puntuacionPromedio: 0,
      mejorPuntuacion: 0,
      tiempoPromedio: 0,
    };
  }

  const stats = estadisticas[0];
  delete stats._id;

  // Redondear
  stats.puntuacionPromedio = Math.round(stats.puntuacionPromedio * 100) / 100;
  stats.tiempoPromedio = Math.round(stats.tiempoPromedio);

  return stats;
};

/**
 * Obtener evolución temporal de un paciente en un juego
 */
progressSchema.statics.obtenerEvolucion = function (
  pacienteId,
  juegoId,
  dias = 30,
) {
  const fechaInicio = new Date();
  fechaInicio.setDate(fechaInicio.getDate() - dias);

  return this.find({
    paciente: pacienteId,
    juego: juegoId,
    createdAt: { $gte: fechaInicio },
  })
    .select(
      "puntuacion porcentajeAcierto tiempoJugado completado fechaSesion createdAt",
    )
    .sort({ createdAt: 1 });
};

/**
 * Obtener juegos más jugados por un paciente
 */
progressSchema.statics.obtenerJuegosMasJugados = async function (
  pacienteId,
  limite = 5,
) {
  return this.aggregate([
    { $match: { paciente: new mongoose.Types.ObjectId(pacienteId) } }, // ← new
    {
      $group: {
        _id: "$juego",
        totalSesiones: { $sum: 1 },
        puntuacionPromedio: { $avg: "$puntuacion" },
        tiempoTotal: { $sum: "$tiempoJugado" },
      },
    },
    { $sort: { totalSesiones: -1 } },
    { $limit: limite },
    {
      $lookup: {
        from: "games",
        localField: "_id",
        foreignField: "_id",
        as: "juego",
      },
    },
    { $unwind: "$juego" },
  ]);
};

// ============================================
// CONFIGURACIÓN DE VIRTUALS EN JSON
// ============================================
progressSchema.set("toJSON", { virtuals: true });
progressSchema.set("toObject", { virtuals: true });

// ============================================
// EXPORTAR MODELO
// ============================================
module.exports = mongoose.model("Progress", progressSchema);
