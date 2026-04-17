/**
 * Modelo de Usuario
 *
 * Define tutores y profesionales de la plataforma.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ============================================
// DEFINIR ESQUEMA
// ============================================
const userSchema = new mongoose.Schema(
  {
    // Información básica
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      maxlength: [50, "El nombre no puede exceder 50 caracteres"],
    },

    email: {
      type: String,
      required: [true, "El email es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Email inválido"],
    },

    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
      minlength: [6, "La contraseña debe tener al menos 6 caracteres"],
      select: false,
    },

    // Rol del usuario
    role: {
      type: String,
      enum: {
        values: ["tutor", "profesional", "admin"],
        message: "{VALUE} no es un rol válido",
      },
      default: "tutor",
    },

    // Información adicional
    telefono: {
      type: String,
      match: [/^[0-9]{9,15}$/, "Teléfono inválido"],
    },

    // Solo para profesionales
    especialidad: {
      type: String,
      enum: [
        "fonoaudiologia",
        "psicopedagogia",
        "educacion_especial",
        "terapia_lenguaje",
        "audiologia",
        "neuropsicologia",
        "psicologia",
        "otro",
      ],
      required: function () {
        return this.role === "profesional";
      },
    },

    numeroRegistro: {
      type: String,
      required: function () {
        return this.role === "profesional";
      },
    },

    verificado: {
      type: Boolean,
      default: function () {
        return this.role === "tutor";
      },
    },

    // Estado de la cuenta
    activo: {
      type: Boolean,
      default: true,
    },

    // ============================================
    // HISTORIAL DE ESTADOS — para CRM interno
    // ============================================

    // Fecha en que la cuenta fue desactivada por última vez
    fechaDesactivacion: {
      type: Date,
      default: null,
    },

    // Fecha en que la cuenta fue reactivada por última vez
    fechaReactivacion: {
      type: Date,
      default: null,
    },

    // Log completo de cambios de estado
    historialEstados: [
      {
        estado: {
          type: String,
          enum: ["activo", "inactivo"],
          required: true,
        },
        fecha: {
          type: Date,
          default: Date.now,
        },
        motivo: {
          type: String,
          enum: ["registro", "voluntario", "pago_pendiente", "admin", "reactivacion"],
          default: "admin",
        },
        cambiadoPor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null, // null si fue automático (ej: pago vencido)
        },
      },
    ],

    // Último login
    ultimoLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// ============================================
// MIDDLEWARE PRE-SAVE
// ============================================

/**
 * Hashear contraseña si fue modificada
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Registrar automáticamente cambios de estado en historialEstados
 * y setear fechaDesactivacion / fechaReactivacion
 */
userSchema.pre("save", function () {
  // Solo actuar si el campo 'activo' fue modificado
  if (!this.isModified("activo")) return;

  const ahora = new Date();

  if (this.activo === false) {
    // Cuenta se desactiva
    this.fechaDesactivacion = ahora;
    this.historialEstados.push({
      estado: "inactivo",
      fecha: ahora,
      motivo: this._motivoCambioEstado || "admin",
      cambiadoPor: this._cambiadoPor || null,
    });
  } else if (this.activo === true) {
    // Cuenta se reactiva
    this.fechaReactivacion = ahora;
    this.historialEstados.push({
      estado: "activo",
      fecha: ahora,
      motivo: "reactivacion",
      cambiadoPor: this._cambiadoPor || null,
    });
  }

  // Limpiar propiedades temporales
  delete this._motivoCambioEstado;
  delete this._cambiadoPor;
});

/**
 * Al crear un usuario nuevo, registrar el estado inicial en el historial
 */
userSchema.post("save", async function (doc) {
  // Solo en la primera creación (historial vacío antes del save)
  if (doc.historialEstados.length === 1 && doc.historialEstados[0].motivo === "admin") {
    // Corregir el motivo del primer registro a "registro"
    await doc.constructor.findByIdAndUpdate(doc._id, {
      $set: { "historialEstados.0.motivo": "registro" },
    });
  }
});

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Comparar contraseña ingresada con la hasheada
 */
userSchema.methods.compararPassword = async function (passwordIngresado) {
  return await bcrypt.compare(passwordIngresado, this.password);
};

/**
 * Generar JWT para este usuario
 */
userSchema.methods.generarJWT = function () {
  const jwt = require("jsonwebtoken");
  const config = require("../config/config");

  const payload = {
    userId: this._id,
    email: this.email,
    role: this.role,
  };

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Obtener datos públicos del usuario (sin password)
 */
userSchema.methods.getDatosPublicos = function () {
  return {
    _id: this._id,
    nombre: this.nombre,
    email: this.email,
    role: this.role,
    telefono: this.telefono,
    especialidad: this.especialidad,
    verificado: this.verificado,
    activo: this.activo,
    fechaDesactivacion: this.fechaDesactivacion,
    fechaReactivacion: this.fechaReactivacion,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

/**
 * Obtener datos completos incluyendo historial (para admin)
 */
userSchema.methods.getDatosAdmin = function () {
  return {
    _id: this._id,
    nombre: this.nombre,
    email: this.email,
    role: this.role,
    telefono: this.telefono,
    especialidad: this.especialidad,
    numeroRegistro: this.numeroRegistro,
    verificado: this.verificado,
    activo: this.activo,
    fechaDesactivacion: this.fechaDesactivacion,
    fechaReactivacion: this.fechaReactivacion,
    historialEstados: this.historialEstados,
    ultimoLogin: this.ultimoLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// ============================================
// MÉTODOS ESTÁTICOS
// ============================================

/**
 * Buscar usuario por email (incluye password)
 */
userSchema.statics.buscarPorEmail = function (email) {
  return this.findOne({ email }).select("+password");
};

/**
 * Obtener todos los profesionales verificados
 */
userSchema.statics.obtenerProfesionales = function () {
  return this.find({
    role: "profesional",
    verificado: true,
    activo: true,
  });
};

/**
 * Obtener usuarios inactivos ordenados por fecha de desactivación
 */
userSchema.statics.obtenerInactivos = function () {
  return this.find({ activo: false })
    .select("-password")
    .sort({ fechaDesactivacion: -1 });
};

// ============================================
// EXPORTAR MODELO
// ============================================
module.exports = mongoose.model("User", userSchema);
