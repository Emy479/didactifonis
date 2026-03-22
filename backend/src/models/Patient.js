/**
 * Modelo de Paciente - MODELO DUAL
 *
 * Representa a los niños/as que recibirán terapia fonoaudiológica.
 * Soporta Plan Familiar (tutor paga) y Plan Profesional (profesional paga)
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

    // ============================================
    // MODELO DE NEGOCIO DUAL
    // ============================================

    // Tipo de cuenta (quién paga)
    tipoCuenta: {
      type: String,
      enum: {
        values: ["familiar", "profesional", "clinica"],
        message: "{VALUE} no es un tipo de cuenta válido",
      },
      required: [true, "El tipo de cuenta es obligatorio"],
    },

    // Quién creó el paciente (quién paga la suscripción)
    creadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Debe especificar quién creó al paciente"],
    },

    // Tutor (opcional - solo si tiene cuenta)
    tutor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Información del tutor (si NO tiene cuenta)
    tutorInfo: {
      nombre: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        lowercase: true,
        trim: true,
      },
      telefono: {
        type: String,
        match: [/^[0-9]{9,15}$/, "Teléfono inválido"],
      },
      relacion: {
        type: String,
        enum: ["madre", "padre", "abuelo/a", "tutor_legal", "otro"],
      },
    },

    // Profesionales asignados
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
      sparse: true,
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

    // Avatar
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
// VALIDACIÓN CONDICIONAL
// ============================================

/**
 * Validar que si no hay tutor, al menos haya tutorInfo
 */
patientSchema.pre("validate", function () {
  if (!this.tutor && (!this.tutorInfo || !this.tutorInfo.nombre)) {
    this.invalidate("tutorInfo", "Debe proporcionar información del tutor");
  }
});

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
 */
patientSchema.methods.generarTokenAcceso = function (diasValidez = 30) {
  const token = crypto.randomBytes(32).toString("hex");

  const expiracion = new Date();
  expiracion.setDate(expiracion.getDate() + diasValidez);

  this.accessToken = token;
  this.tokenExpiracion = expiracion;

  return token;
};

/**
 * Verificar si el token de acceso es válido
 */
patientSchema.methods.tokenEsValido = function () {
  if (!this.accessToken || !this.tokenExpiracion) {
    return false;
  }

  return new Date() < this.tokenExpiracion;
};

/**
 * Renovar token de acceso
 */
patientSchema.methods.renovarToken = function (diasValidez = 30) {
  return this.generarTokenAcceso(diasValidez);
};

/**
 * Asignar profesional al paciente
 */
patientSchema.methods.asignarProfesional = function (profesionalId) {
  const yaAsignado = this.profesionalesAsignados.some(
    (id) => id.toString() === profesionalId.toString(),
  );

  if (!yaAsignado) {
    this.profesionalesAsignados.push(profesionalId);
  }
};

/**
 * Remover profesional del paciente
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
  const datos = {
    _id: this._id,
    nombre: this.nombre,
    apellido: this.apellido,
    nombreCompleto: this.nombreCompleto,
    fechaNacimiento: this.fechaNacimiento,
    edad: this.edad,
    genero: this.genero,
    tipoCuenta: this.tipoCuenta,
    creadoPor: this.creadoPor,
    diagnostico: this.diagnostico,
    observaciones: this.observaciones,
    areasTrabajar: this.areasTrabajar,
    avatar: this.avatar,
    activo: this.activo,
    profesionalesAsignados: this.profesionalesAsignados,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
    accessToken: this.accessToken,
    tokenExpiracion: this.tokenExpiracion,
  };

  // Incluir tutor o tutorInfo según corresponda
  if (this.tutor) {
    datos.tutor = this.tutor;
  } else if (this.tutorInfo) {
    datos.tutorInfo = this.tutorInfo;
  }

  return datos;
};

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Buscar pacientes de un tutor específico (Plan Familiar)
 */
patientSchema.statics.buscarPorTutor = function (tutorId) {
  return this.find({
    tutor: tutorId,
    activo: true,
  })
    .populate("tutor", "nombre email")
    .populate("profesionalesAsignados", "nombre email especialidad")
    .populate("creadoPor", "nombre email")
    .sort({ createdAt: -1 });
};

/**
 * Buscar pacientes creados por un profesional (Plan Profesional)
 */
patientSchema.statics.buscarCreadosPorProfesional = function (profesionalId) {
  return this.find({
    creadoPor: profesionalId,
    activo: true,
  })
    .populate("tutor", "nombre email")
    .populate("profesionalesAsignados", "nombre email especialidad")
    .populate("creadoPor", "nombre email")
    .sort({ createdAt: -1 });
};

/**
 * Buscar pacientes de un profesional (creados O asignados)
 */
patientSchema.statics.buscarPorProfesional = function (profesionalId) {
  return this.find({
    $or: [
      { profesionalesAsignados: profesionalId },
      { creadoPor: profesionalId },
    ],
    activo: true,
  })
    .populate("tutor", "nombre email telefono")
    .populate("profesionalesAsignados", "nombre email especialidad")
    .populate("creadoPor", "nombre email")
    .sort({ createdAt: -1 });
};

/**
 * Buscar paciente por token de acceso
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

/**
 * Obtener estadísticas de un profesional
 */
patientSchema.statics.obtenerEstadisticasProfesional = async function (
  profesionalId,
) {
  const total = await this.countDocuments({
    $or: [
      { profesionalesAsignados: profesionalId },
      { creadoPor: profesionalId },
    ],
    activo: true,
  });

  const creados = await this.countDocuments({
    creadoPor: profesionalId,
    activo: true,
  });

  const asignados = await this.countDocuments({
    profesionalesAsignados: profesionalId,
    creadoPor: { $ne: profesionalId },
    activo: true,
  });

  return {
    total,
    creados, // Pacientes del plan profesional
    asignados, // Pacientes del plan familiar invitados
  };
};

// ============================================
// ÍNDICES
// ============================================
patientSchema.index({ tutor: 1, activo: 1 });
patientSchema.index({ creadoPor: 1, activo: 1 });
patientSchema.index({ profesionalesAsignados: 1 });
patientSchema.index({ tipoCuenta: 1 });

// ============================================
// CONFIGURACIÓN DE VIRTUALS EN JSON
// ============================================
patientSchema.set("toJSON", { virtuals: true });
patientSchema.set("toObject", { virtuals: true });

// ============================================
// EXPORTAR MODELO
// ============================================
module.exports = mongoose.model("Patient", patientSchema);
