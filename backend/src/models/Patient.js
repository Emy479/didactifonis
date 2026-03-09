/**
 * Modelo de Paciente
 *
 * Representa a los niños/as que recibirán terapia fonoaudiológica.
 */

const mongoose = require("mongoose");
const crypto = require("crypto");

// ============================================
// DEFINIR ESQUEMA
// ============================================
const patientSchema = new mongoose.Schema(
  {
    // Información básica
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      maxlength: [50, "El nombre no puede exceder 50 caracteres"],
    },

    apellido: {
      type: String,
      required: [true, "El apellido es obligatorio"],
      trim: true,
      maxlength: [50, "El apellido no puede exceder 50 caracteres"],
    },

    fechaNacimiento: {
      type: Date,
      required: [true, "La fecha de nacimiento es obligatoria"],
      validate: {
        validator: function (fecha) {
          // No puede ser fecha futura
          return fecha <= new Date();
        },
        message: "La fecha de nacimiento no puede ser en el futuro",
      },
    },

    edad: {
      type: Number,
      min: [0, "La edad no puede ser negativa"],
      max: [18, "La edad no puede superar 18 años"],
    },

    genero: {
      type: String,
      enum: {
        values: ["masculino", "femenino", "otro", "prefiero_no_decir"],
        message: "{VALUE} no es un género válido",
      },
      default: "prefiero_no_decir",
    },

    // Relaciones
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El paciente debe tener un tutor asignado"],
      validate: {
        validator: async function (tutorId) {
          const User = mongoose.model("User");
          const user = await User.findById(tutorId);
          return user && user.role === "tutor";
        },
        message: 'El tutor debe ser un usuario con rol "tutor"',
      },
    },

    profesionalesAsignados: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        validate: {
          validator: async function (profesionalId) {
            const User = mongoose.model("User");
            const user = await User.findById(profesionalId);
            return user && user.role === "profesional";
          },
          message: 'Los profesionales asignados deben tener rol "profesional"',
        },
      },
    ],

    // Token de acceso (para que el niño/a juegue sin login)
    accessToken: {
      type: String,
      unique: true,
      sparse: true, // Permite múltiples null
    },

    tokenExpiracion: {
      type: Date,
    },

    // Información clínica
    diagnostico: {
      type: String,
      maxlength: [500, "El diagnóstico no puede exceder 500 caracteres"],
    },

    observaciones: {
      type: String,
      maxlength: [1000, "Las observaciones no pueden exceder 1000 caracteres"],
    },

    areasTrabajar: [
      {
        type: String,
        enum: [
          "fonologia",
          "semantica",
          "morfosintaxis",
          "pragmatica",
          "habla",
          "lenguaje",
        ],
      },
    ],

    // Avatar (opcional - para personalizar)
    avatar: {
      type: String,
      default: "default-avatar.png",
    },

    // Estado
    activo: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ============================================
// VIRTUAL: Nombre completo
// ============================================
patientSchema.virtual("nombreCompleto").get(function () {
  return `${this.nombre} ${this.apellido}`;
});

// ============================================
// VIRTUAL: Calcular edad automáticamente
// ============================================
patientSchema.virtual("edadCalculada").get(function () {
  if (!this.fechaNacimiento) return null;

  const hoy = new Date();
  const nacimiento = new Date(this.fechaNacimiento);
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad;
});

// ============================================
// MIDDLEWARE PRE-SAVE
// ============================================

/**
 * Actualizar edad antes de guardar
 */
patientSchema.pre("save", function () {
  if (this.fechaNacimiento) {
    this.edad = this.edadCalculada;
  }
});

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Generar token de acceso para el paciente
 * @param {number} diasValidez - Días que el token será válido (default: 30)
 * @returns {string} Token generado
 */
patientSchema.methods.generarTokenAcceso = function (diasValidez = 30) {
  // Generar token único y seguro
  const token = crypto.randomBytes(32).toString("hex");

  // Establecer fecha de expiración
  const expiracion = new Date();
  expiracion.setDate(expiracion.getDate() + diasValidez);

  this.accessToken = token;
  this.tokenExpiracion = expiracion;

  return token;
};

/**
 * Verificar si el token de acceso es válido
 * @returns {boolean}
 */
patientSchema.methods.tokenEsValido = function () {
  if (!this.accessToken || !this.tokenExpiracion) {
    return false;
  }

  return new Date() < this.tokenExpiracion;
};

/**
 * Renovar token de acceso
 * @param {number} diasValidez
 * @returns {string} Nuevo token
 */
patientSchema.methods.renovarToken = function (diasValidez = 30) {
  return this.generarTokenAcceso(diasValidez);
};

/**
 * Asignar profesional al paciente
 * @param {string} profesionalId - ID del profesional
 */
patientSchema.methods.asignarProfesional = function (profesionalId) {
  // Verificar que no esté ya asignado
  const yaAsignado = this.profesionalesAsignados.some(
    (id) => id.toString() === profesionalId.toString(),
  );

  if (!yaAsignado) {
    this.profesionalesAsignados.push(profesionalId);
  }
};

/**
 * Remover profesional del paciente
 * @param {string} profesionalId
 */
patientSchema.methods.removerProfesional = function (profesionalId) {
  this.profesionalesAsignados = this.profesionalesAsignados.filter(
    (id) => id.toString() !== profesionalId.toString(),
  );
};

/**
 * Obtener datos públicos del paciente (sin info sensible)
 */
patientSchema.methods.getDatosPublicos = function () {
  return {
    _id: this._id,
    nombre: this.nombre,
    apellido: this.apellido,
    nombreCompleto: this.nombreCompleto,
    edad: this.edad,
    genero: this.genero,
    avatar: this.avatar,
    activo: this.activo,
  };
};

/**
 * Obtener datos completos (para tutor/profesional)
 */
patientSchema.methods.getDatosCompletos = function () {
  return {
    _id: this._id,
    nombre: this.nombre,
    apellido: this.apellido,
    nombreCompleto: this.nombreCompleto,
    fechaNacimiento: this.fechaNacimiento,
    edad: this.edad,
    genero: this.genero,
    diagnostico: this.diagnostico,
    observaciones: this.observaciones,
    areasTrabajar: this.areasTrabajar,
    avatar: this.avatar,
    activo: this.activo,
    tutor: this.tutor,
    profesionalesAsignados: this.profesionalesAsignados,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Buscar pacientes de un tutor específico
 * @param {string} tutorId
 */
patientSchema.statics.buscarPorTutor = function (tutorId) {
  return this.find({ tutor: tutorId, activo: true })
    .populate("tutor", "nombre email")
    .populate("profesionalesAsignados", "nombre email especialidad")
    .sort({ createdAt: -1 });
};

/**
 * Buscar pacientes de un profesional específico
 * @param {string} profesionalId
 */
patientSchema.statics.buscarPorProfesional = function (profesionalId) {
  return this.find({
    profesionalesAsignados: profesionalId,
    activo: true,
  })
    .populate("tutor", "nombre email telefono")
    .populate("profesionalesAsignados", "nombre email especialidad")
    .sort({ createdAt: -1 });
};

/**
 * Buscar paciente por token de acceso
 * @param {string} token
 */
patientSchema.statics.buscarPorToken = function (token) {
  return this.findOne({
    accessToken: token,
    tokenExpiracion: { $gt: new Date() },
    activo: true,
  });
};

/**
 * Obtener estadísticas de un tutor
 * @param {string} tutorId
 */
patientSchema.statics.obtenerEstadisticasTutor = async function (tutorId) {
  const total = await this.countDocuments({ tutor: tutorId, activo: true });

  const porEdad = await this.aggregate([
    { $match: { tutor: mongoose.Types.ObjectId(tutorId), activo: true } },
    {
      $group: {
        _id: {
          $cond: [
            { $lte: ["$edad", 3] },
            "0-3",
            {
              $cond: [
                { $lte: ["$edad", 6] },
                "4-6",
                { $cond: [{ $lte: ["$edad", 12] }, "7-12", "13+"] },
              ],
            },
          ],
        },
        cantidad: { $sum: 1 },
      },
    },
  ]);

  return {
    total,
    porRangoEdad: porEdad,
  };
};

// ============================================
// ÍNDICES
// ============================================
// Índice compuesto para búsquedas por tutor
patientSchema.index({ tutor: 1, activo: 1 });

// Índice para búsquedas por profesional
patientSchema.index({ profesionalesAsignados: 1 });

// ============================================
// CONFIGURACIÓN DE VIRTUALS EN JSON
// ============================================
patientSchema.set("toJSON", { virtuals: true });
patientSchema.set("toObject", { virtuals: true });

// ============================================
// EXPORTAR MODELO
// ============================================
module.exports = mongoose.model("Patient", patientSchema);
