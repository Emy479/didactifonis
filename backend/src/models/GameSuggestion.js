/**
 * Modelo de Sugerencias de Juegos
 * Permite a profesionales sugerir nuevos juegos
 */

const mongoose = require('mongoose');

const gameSuggestionSchema = new mongoose.Schema({
  // Información básica
  titulo: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    maxlength: [100, 'El título no puede exceder 100 caracteres']
  },

  descripcion: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    maxlength: [1000, 'La descripción no puede exceder 1000 caracteres']
  },

  areaTerapeutica: {
    type: String,
    required: [true, 'El área terapéutica es obligatoria'],
    enum: ['fonologia', 'semantica', 'sintaxis', 'pragmatica', 'habla', 'lenguaje', 'general']
  },

  rangoEdadSugerido: {
    min: {
      type: Number,
      min: [2, 'La edad mínima debe ser al menos 2 años'],
      max: [18, 'La edad mínima no puede exceder 18 años']
    },
    max: {
      type: Number,
      min: [2, 'La edad máxima debe ser al menos 2 años'],
      max: [18, 'La edad máxima no puede exceder 18 años']
    }
  },

  objetivos: [{
    type: String,
    trim: true
  }],

  // Quien sugiere
  profesional: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Estado de la sugerencia
  estado: {
    type: String,
    enum: ['pendiente', 'en_revision', 'aprobada', 'rechazada', 'implementada'],
    default: 'pendiente'
  },

  prioridad: {
    type: String,
    enum: ['baja', 'media', 'alta'],
    default: 'media'
  },

  // Sistema de votos
  votos: {
    type: Number,
    default: 0
  },

  votadoPor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Notas del admin
  notasAdmin: {
    type: String,
    trim: true,
    maxlength: [500, 'Las notas no pueden exceder 500 caracteres']
  },

  // Juego creado (cuando se implementa)
  juegoCreado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game'
  },

  fechaImplementacion: {
    type: Date
  }

}, {
  timestamps: true
});

// Índices
gameSuggestionSchema.index({ profesional: 1, createdAt: -1 });
gameSuggestionSchema.index({ estado: 1, votos: -1 });
gameSuggestionSchema.index({ areaTerapeutica: 1 });

// Métodos de instancia

/**
 * Agregar voto
 */
gameSuggestionSchema.methods.agregarVoto = function(profesionalId) {
  if (!this.votadoPor.includes(profesionalId)) {
    this.votadoPor.push(profesionalId);
    this.votos += 1;
    return this.save();
  }
  throw new Error('Ya votaste por esta sugerencia');
};

/**
 * Quitar voto
 */
gameSuggestionSchema.methods.quitarVoto = function(profesionalId) {
  const index = this.votadoPor.indexOf(profesionalId);
  if (index > -1) {
    this.votadoPor.splice(index, 1);
    this.votos -= 1;
    return this.save();
  }
  throw new Error('No has votado por esta sugerencia');
};

/**
 * Cambiar estado
 */
gameSuggestionSchema.methods.cambiarEstado = function(nuevoEstado, notasAdmin = null) {
  this.estado = nuevoEstado;
  if (notasAdmin) {
    this.notasAdmin = notasAdmin;
  }
  if (nuevoEstado === 'implementada') {
    this.fechaImplementacion = new Date();
  }
  return this.save();
};

/**
 * Verificar si un profesional ya votó
 */
gameSuggestionSchema.methods.yaVoto = function(profesionalId) {
  return this.votadoPor.includes(profesionalId);
};

// Métodos estáticos

/**
 * Obtener sugerencias más votadas
 */
gameSuggestionSchema.statics.obtenerMasVotadas = function(limite = 10) {
  return this.find({ estado: { $in: ['pendiente', 'en_revision'] } })
    .sort({ votos: -1, createdAt: -1 })
    .limit(limite)
    .populate('profesional', 'nombre especialidad')
    .lean();
};

/**
 * Obtener sugerencias por área
 */
gameSuggestionSchema.statics.obtenerPorArea = function(area) {
  return this.find({ areaTerapeutica: area })
    .sort({ votos: -1, createdAt: -1 })
    .populate('profesional', 'nombre especialidad')
    .lean();
};

/**
 * Obtener estadísticas
 */
gameSuggestionSchema.statics.obtenerEstadisticas = async function() {
  const total = await this.countDocuments();
  const pendientes = await this.countDocuments({ estado: 'pendiente' });
  const enRevision = await this.countDocuments({ estado: 'en_revision' });
  const aprobadas = await this.countDocuments({ estado: 'aprobada' });
  const implementadas = await this.countDocuments({ estado: 'implementada' });
  const rechazadas = await this.countDocuments({ estado: 'rechazada' });

  return {
    total,
    pendientes,
    enRevision,
    aprobadas,
    implementadas,
    rechazadas
  };
};

const GameSuggestion = mongoose.model('GameSuggestion', gameSuggestionSchema);

module.exports = GameSuggestion;
