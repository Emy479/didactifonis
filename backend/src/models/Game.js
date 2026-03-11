/**
 * Modelo de Juego
 *
 * Representa los juegos educativos disponibles en la plataforma.
 */

const mongoose = require("mongoose");

// ============================================
// DEFINIR ESQUEMA
// ============================================
const gameSchema = new mongoose.Schema(
  {
    // Información básica
    nombre: {
      type: String,
      required: [true, "El nombre del juego es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },

    descripcion: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },

    instrucciones: {
      type: String,
      maxlength: [1000, "Las instrucciones no pueden exceder 1000 caracteres"],
    },

    // Identificador único del juego (para Unity)
    codigo: {
      type: String,
      required: [true, "El código del juego es obligatorio"],
      unique: true,
      uppercase: true,
      match: [
        /^[A-Z0-9_]+$/,
        "El código solo puede contener letras mayúsculas, números y guiones bajos",
      ],
    },

    // Metadatos educativos
    areaTerapeutica: {
      type: String,
      enum: {
        values: [
          "fonologia",
          "semantica",
          "morfosintaxis",
          "pragmatica",
          "habla",
          "lenguaje",
        ],
        message: "{VALUE} no es un área válida",
      },
      required: [true, "El área terapéutica es obligatoria"],
    },

    nivelDificultad: {
      type: String,
      enum: {
        values: ["basico", "intermedio", "avanzado"],
        message: "{VALUE} no es un nivel válido",
      },
      default: "basico",
    },

    rangoEdad: {
      min: {
        type: Number,
        required: true,
        min: [2, "La edad mínima no puede ser menor a 2"],
        max: 18,
      },
      max: {
        type: Number,
        required: true,
        min: 2,
        max: [18, "La edad máxima no puede ser mayor a 18"],
      },
    },

    // Objetivos terapéuticos
    objetivos: [
      {
        type: String,
        trim: true,
      },
    ],

    // Palabras/conceptos que trabaja
    palabrasClave: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    // Configuración del juego
    duracionEstimada: {
      type: Number, // En minutos
      min: [1, "La duración mínima es 1 minuto"],
      max: [60, "La duración máxima es 60 minutos"],
    },

    numeroRondas: {
      type: Number,
      default: 10,
      min: [1, "Debe tener al menos 1 ronda"],
    },

    puntuacionMaxima: {
      type: Number,
      default: 100,
      min: [1, "La puntuación máxima debe ser al menos 1"],
    },

    porcentajeAprobacion: {
      type: Number,
      default: 70,
      min: [0, "El porcentaje mínimo es 0"],
      max: [100, "El porcentaje máximo es 100"],
    },

    // Recursos
    thumbnail: {
      type: String,
      default: "default-game.png",
    },

    urlJuego: {
      type: String,
      required: [true, "La URL del juego es obligatoria"],
    },

    // Estado
    activo: {
      type: Boolean,
      default: true,
    },

    publicado: {
      type: Boolean,
      default: false,
    },

    // Quién creó el juego
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Estadísticas generales
    vecesJugado: {
      type: Number,
      default: 0,
    },

    promedioTiempo: {
      type: Number, // En segundos
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ============================================
// VALIDACIÓN PERSONALIZADA
// ============================================

/**
 * Validar que edad máxima sea mayor que mínima
 */
gameSchema.pre("validate", function (next) {
  if (this.rangoEdad.max < this.rangoEdad.min) {
    this.invalidate(
      "rangoEdad.max",
      "La edad máxima debe ser mayor que la mínima",
    );
  }
});

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Verificar si el juego es apropiado para una edad
 */
gameSchema.methods.esApropiado = function (edad) {
  return edad >= this.rangoEdad.min && edad <= this.rangoEdad.max;
};

/**
 * Obtener datos públicos del juego (para el paciente)
 */
gameSchema.methods.getDatosPublicos = function () {
  return {
    _id: this._id,
    nombre: this.nombre,
    descripcion: this.descripcion,
    instrucciones: this.instrucciones,
    thumbnail: this.thumbnail,
    urlJuego: this.urlJuego,
    nivelDificultad: this.nivelDificultad,
    duracionEstimada: this.duracionEstimada,
  };
};

/**
 * Obtener datos completos (para profesionales/tutores)
 */
gameSchema.methods.getDatosCompletos = function () {
  return {
    _id: this._id,
    nombre: this.nombre,
    codigo: this.codigo,
    descripcion: this.descripcion,
    instrucciones: this.instrucciones,
    areaTerapeutica: this.areaTerapeutica,
    nivelDificultad: this.nivelDificultad,
    rangoEdad: this.rangoEdad,
    objetivos: this.objetivos,
    palabrasClave: this.palabrasClave,
    duracionEstimada: this.duracionEstimada,
    numeroRondas: this.numeroRondas,
    puntuacionMaxima: this.puntuacionMaxima,
    porcentajeAprobacion: this.porcentajeAprobacion,
    thumbnail: this.thumbnail,
    urlJuego: this.urlJuego,
    activo: this.activo,
    publicado: this.publicado,
    vecesJugado: this.vecesJugado,
    promedioTiempo: this.promedioTiempo,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

/**
 * Incrementar contador de veces jugado
 */
gameSchema.methods.incrementarJugado = async function () {
  this.vecesJugado += 1;
  await this.save();
};

/**
 * Actualizar promedio de tiempo
 */
gameSchema.methods.actualizarPromedioTiempo = async function (nuevoTiempo) {
  if (this.vecesJugado === 0) {
    this.promedioTiempo = nuevoTiempo;
  } else {
    // Promedio ponderado
    this.promedioTiempo = Math.round(
      (this.promedioTiempo * (this.vecesJugado - 1) + nuevoTiempo) /
        this.vecesJugado,
    );
  }
  await this.save();
};

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Buscar juegos por área terapéutica
 */
gameSchema.statics.buscarPorArea = function (area) {
  return this.find({
    areaTerapeutica: area,
    activo: true,
    publicado: true,
  }).sort({ nombre: 1 });
};

/**
 * Buscar juegos apropiados para una edad
 */
gameSchema.statics.buscarPorEdad = function (edad) {
  return this.find({
    "rangoEdad.min": { $lte: edad },
    "rangoEdad.max": { $gte: edad },
    activo: true,
    publicado: true,
  }).sort({ nivelDificultad: 1, nombre: 1 });
};

/**
 * Buscar juegos por nivel
 */
gameSchema.statics.buscarPorNivel = function (nivel) {
  return this.find({
    nivelDificultad: nivel,
    activo: true,
    publicado: true,
  }).sort({ nombre: 1 });
};

/**
 * Buscar juego por código
 */
gameSchema.statics.buscarPorCodigo = function (codigo) {
  return this.findOne({
    codigo: codigo.toUpperCase(),
    activo: true,
  });
};

// ============================================
// ÍNDICES
// ============================================
gameSchema.index({ areaTerapeutica: 1, publicado: 1 });
gameSchema.index({ nivelDificultad: 1 });

// ============================================
// EXPORTAR MODELO
// ============================================
module.exports = mongoose.model("Game", gameSchema);
