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
      select: false, // No devolver la contraseña por defecto en consultas
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
        "fonoaudiología",
        "psicopedagogía",
        "educación_diferencial",
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
        // Tutores verificados automáticamente
        // Profesionales requieren verificación
        return this.role === "tutor";
      },
    },

    // Estado de la cuenta
    activo: {
      type: Boolean,
      default: true,
    },

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
// MIDDLEWARE PRE-SAVE (antes de guardar)
// ============================================

/**
 * Hashear contraseña antes de guardar
 */
userSchema.pre("save", async function () {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified("password")) {
    return;
  }

  // Generar salt (random string para hacer el hash único)
  const salt = await bcrypt.genSalt(10);

  // Hashear la contraseña
  this.password = await bcrypt.hash(this.password, salt);
});

// ============================================
// MÉTODOS DE INSTANCIA
// ============================================

/**
 * Comparar contraseña ingresada con la hasheada
 * @param {string} passwordIngresado
 * @returns {boolean}
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

// ============================================
// EXPORTAR MODELO
// ============================================
module.exports = mongoose.model("User", userSchema);
