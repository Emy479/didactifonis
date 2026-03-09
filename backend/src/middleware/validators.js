/**
 * Validadores con express-validator
 */

const { body, validationResult } = require("express-validator");

// ============================================
// MIDDLEWARE PARA VERIFICAR ERRORES
// ============================================
const validarCampos = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((err) => ({
        campo: err.path,
        mensaje: err.msg,
      })),
    });
  }

  next();
};

// ============================================
// VALIDACIONES DE REGISTRO
// ============================================
const validarRegistro = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ max: 50 })
    .withMessage("El nombre no puede exceder 50 caracteres"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("La contraseña es obligatoria")
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
    .matches(/\d/)
    .withMessage("La contraseña debe contener al menos un número"),

  body("role")
    .optional()
    .isIn(["tutor", "profesional"])
    .withMessage("Rol inválido"),

  body("telefono")
    .optional()
    .matches(/^[0-9]{9,15}$/)
    .withMessage("Teléfono inválido"),

  // Validaciones condicionales para profesionales
  body("especialidad")
    .if(body("role").equals("profesional"))
    .notEmpty()
    .withMessage("La especialidad es obligatoria para profesionales")
    .isIn(["fonoaudiología", "psicopedagogía", "educación_diferencial", "otro"])
    .withMessage("Especialidad inválida"),

  body("numeroRegistro")
    .if(body("role").equals("profesional"))
    .notEmpty()
    .withMessage("El número de registro es obligatorio para profesionales"),

  validarCampos,
];

// ============================================
// VALIDACIONES DE LOGIN
// ============================================
const validarLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("El email es obligatorio")
    .isEmail()
    .withMessage("Email inválido")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("La contraseña es obligatoria"),

  validarCampos,
];

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  validarRegistro,
  validarLogin,
  validarCampos,
};
