/**
 * Modelo de Asignación (Patient-Game)
 *
 * Representa la asignación de un juego a un paciente específico.
 */

const mongoose = require("mongoose");

// ============================================
// DEFINIR ESQUEMA
// ============================================
const assignmentSchema = new mongoose.Schema(
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

    // Quién asignó el juego
    asignadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario que asigna es obligatorio"],
    },

    // Configuración personalizada para este paciente
    configuracion: {
      nivelDificultad: {
        type: String,
        enum: ["basico", "intermedio", "avanzado"],
      },
      numeroRondas: {
        type: Number,
        min: [1, "Debe tener al menos 1 ronda"],
      },
      puntuacionObjetivo: {
        type: Number,
        min: [0, "La puntuación objetivo no puede ser negativa"],
      },
      tiempoLimite: {
        type: Number, // En segundos, null = sin límite
        min: [0, "El tiempo límite no puede ser negativo"],
      },
    },

    // Objetivos específicos para este paciente
    objetivosPersonalizados: [
      {
        type: String,
        trim: true,
      },
    ],

    // Notas del profesional/tutor
    notas: {
      type: String,
      maxlength: [1000, "Las notas no pueden exceder 1000 caracteres"],
    },

    // Estado de la asignación
    activa: {
      type: Boolean,
      default: true,
    },

    // Fechas de validez
    fechaInicio: {
      type: Date,
      default: Date.now,
    },

    fechaFin: {
      type: Date,
      validate: {
        validator: function (fecha) {
          if (!fecha) return true; // null es válido
          return fecha > this.fechaInicio;
        },
        message: "La fecha de fin debe ser posterior a la fecha de inicio",
      },
    },

    // Estadísticas de esta asignación
    estadisticas: {
      vecesJugado: {
        type: Number,
        default: 0,
      },
      mejorPuntuacion: {
        type: Number,
        default: 0,
      },
      promedioPuntuacion: {
        type: Number,
        default: 0,
      },
      completado: {
        type: Boolean,
        default: false,
      },
      ultimaSesion: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ============================================
// ÍNDICE COMPUESTO ÚNICO
// ============================================
// Un paciente no puede tener el mismo juego asignado dos veces (activo)
assignmentSchema.index(
  { paciente: 1, juego: 1, activa: 1 },
  {
    unique: true,
    partialFilterExpression: { activa: true },
  },
);

// Índices para búsquedas frecuentes
assignmentSchema.index({ paciente: 1, activa: 1 });
assignmentSchema.index({ juego: 1, activa: 1 });

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Verificar si la asignación está vigente
 */
assignmentSchema.methods.estaVigente = function () {
  if (!this.activa) return false;

  const ahora = new Date();

  // Verificar fecha de inicio
  if (this.fechaInicio && this.fechaInicio > ahora) {
    return false;
  }

  // Verificar fecha de fin
  if (this.fechaFin && this.fechaFin < ahora) {
    return false;
  }

  return true;
};

/**
 * Actualizar estadísticas después de una sesión
 */
assignmentSchema.methods.actualizarEstadisticas = async function (puntuacion) {
  this.estadisticas.vecesJugado += 1;
  this.estadisticas.ultimaSesion = new Date();

  // Actualizar mejor puntuación
  if (puntuacion > this.estadisticas.mejorPuntuacion) {
    this.estadisticas.mejorPuntuacion = puntuacion;
  }

  // Calcular promedio
  if (this.estadisticas.vecesJugado === 1) {
    this.estadisticas.promedioPuntuacion = puntuacion;
  } else {
    this.estadisticas.promedioPuntuacion = Math.round(
      (this.estadisticas.promedioPuntuacion *
        (this.estadisticas.vecesJugado - 1) +
        puntuacion) /
        this.estadisticas.vecesJugado,
    );
  }

  await this.save();
};

/**
 * Marcar como completado
 */
assignmentSchema.methods.marcarCompletado = async function () {
  this.estadisticas.completado = true;
  await this.save();
};

/**
 * Desactivar asignación
 */
assignmentSchema.methods.desactivar = async function () {
  this.activa = false;
  await this.save();
};

/**
 * Obtener configuración efectiva (personalizada o del juego)
 */
assignmentSchema.methods.getConfiguracionEfectiva = async function () {
  await this.populate("juego");

  return {
    nivelDificultad:
      this.configuracion.nivelDificultad || this.juego.nivelDificultad,
    numeroRondas: this.configuracion.numeroRondas || this.juego.numeroRondas,
    puntuacionObjetivo:
      this.configuracion.puntuacionObjetivo || this.juego.puntuacionMaxima,
    tiempoLimite: this.configuracion.tiempoLimite || null,
  };
};

/**
 * Obtener datos públicos (para el paciente)
 */
assignmentSchema.methods.getDatosPublicos = function () {
  return {
    _id: this._id,
    juego: this.juego, // Será poblado
    configuracion: this.configuracion,
    estadisticas: {
      vecesJugado: this.estadisticas.vecesJugado,
      mejorPuntuacion: this.estadisticas.mejorPuntuacion,
      completado: this.estadisticas.completado,
    },
  };
};

/**
 * Obtener datos completos (para tutor/profesional)
 */
assignmentSchema.methods.getDatosCompletos = function () {
  return {
    _id: this._id,
    paciente: this.paciente,
    juego: this.juego,
    asignadoPor: this.asignadoPor,
    configuracion: this.configuracion,
    objetivosPersonalizados: this.objetivosPersonalizados,
    notas: this.notas,
    activa: this.activa,
    fechaInicio: this.fechaInicio,
    fechaFin: this.fechaFin,
    estadisticas: this.estadisticas,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Obtener juegos asignados a un paciente
 */
assignmentSchema.statics.obtenerJuegosPaciente = function (
  pacienteId,
  soloActivos = true,
) {
  const filtro = { paciente: pacienteId };
  if (soloActivos) {
    filtro.activa = true;
  }

  return this.find(filtro)
    .populate("juego")
    .populate("asignadoPor", "nombre email")
    .sort({ createdAt: -1 });
};

/**
 * Obtener pacientes que tienen un juego asignado
 */
assignmentSchema.statics.obtenerPacientesJuego = function (juegoId) {
  return this.find({
    juego: juegoId,
    activa: true,
  })
    .populate("paciente")
    .populate("asignadoPor", "nombre email")
    .sort({ createdAt: -1 });
};

/**
 * Verificar si un juego ya está asignado a un paciente
 */
assignmentSchema.statics.existeAsignacion = async function (
  pacienteId,
  juegoId,
) {
  const asignacion = await this.findOne({
    paciente: pacienteId,
    juego: juegoId,
    activa: true,
  });

  return !!asignacion;
};

/**
 * Obtener estadísticas generales de asignaciones
 */
assignmentSchema.statics.obtenerEstadisticas = async function (filtro = {}) {
  const total = await this.countDocuments({ ...filtro, activa: true });
  const completadas = await this.countDocuments({
    ...filtro,
    activa: true,
    "estadisticas.completado": true,
  });

  const conProgreso = await this.countDocuments({
    ...filtro,
    activa: true,
    "estadisticas.vecesJugado": { $gt: 0 },
  });

  return {
    total,
    completadas,
    conProgreso,
    sinProgreso: total - conProgreso,
    porcentajeCompletado:
      total > 0 ? ((completadas / total) * 100).toFixed(2) : 0,
  };
};

// ============================================
// MIDDLEWARE
// ============================================

/**
 * Validar que el paciente y el juego existan y sean compatibles
 */
assignmentSchema.pre("save", async function (next) {
  if (this.isNew) {
    // Verificar que el juego sea apropiado para la edad del paciente
    const Patient = mongoose.model("Patient");
    const Game = mongoose.model("Game");

    const paciente = await Patient.findById(this.paciente);
    const juego = await Game.findById(this.juego);

    if (!paciente) {
      return next(new Error("Paciente no encontrado"));
    }

    if (!juego) {
      return next(new Error("Juego no encontrado"));
    }

    // Advertir si la edad no está en el rango (no bloqueante)
    if (!juego.esApropiado(paciente.edad)) {
      console.warn(
        `Advertencia: El juego "${juego.nombre}" podría no ser apropiado para ${paciente.nombre} (edad: ${paciente.edad})`,
      );
    }
  }

  next();
});

// ============================================
// EXPORTAR MODELO
// ============================================
module.exports = mongoose.model("Assignment", assignmentSchema);
