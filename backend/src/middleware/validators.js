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

  // Especialidad opcional (sin validación estricta)
  body("especialidad")
    .if(body("role").equals("profesional"))
    .notEmpty()
    .withMessage("La especialidad es obligatoria para profesionales")
    .isIn([
      "fonoaudiologia",
      "psicopedagogia",
      "educacion_especial",
      "terapia_lenguaje",
      "audiologia",
      "neuropsicologia",
      "psicologia",
      "otro",
    ])
    .withMessage("Especialidad inválida"),

  // Número de registro opcional
  body("numeroRegistro").optional().trim().isString(),

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
// VALIDACIONES DE PACIENTE
// ============================================
const validarPaciente = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ max: 50 })
    .withMessage("El nombre no puede exceder 50 caracteres"),

  body("apellido")
    .trim()
    .notEmpty()
    .withMessage("El apellido es obligatorio")
    .isLength({ max: 50 })
    .withMessage("El apellido no puede exceder 50 caracteres"),

  body("fechaNacimiento")
    .notEmpty()
    .withMessage("La fecha de nacimiento es obligatoria")
    .isISO8601()
    .withMessage("Formato de fecha inválido")
    .custom((fecha) => {
      const fechaNac = new Date(fecha);
      const hoy = new Date();
      if (fechaNac > hoy) {
        throw new Error("La fecha de nacimiento no puede ser futura");
      }
      return true;
    }),

  body("genero")
    .optional()
    .isIn(["masculino", "femenino", "otro", "prefiero_no_decir"])
    .withMessage("Género inválido"),

  body("diagnostico")
    .optional()
    .isLength({ max: 500 })
    .withMessage("El diagnóstico no puede exceder 500 caracteres"),

  body("observaciones")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Las observaciones no pueden exceder 1000 caracteres"),

  body("areasTrabajar")
    .optional()
    .isArray()
    .withMessage("areasTrabajar debe ser un array"),

  body("areasTrabajar.*")
    .optional()
    .isIn([
      "fonologia",
      "semantica",
      "morfosintaxis",
      "pragmatica",
      "habla",
      "lenguaje",
    ])
    .withMessage("Área de trabajo inválida"),

  body("tutorId")
    .if(body("role").equals("profesional"))
    .notEmpty()
    .withMessage("El ID del tutor es obligatorio para profesionales")
    .isMongoId()
    .withMessage("ID de tutor inválido"),

  validarCampos,
];

// ============================================
// VALIDACIONES DE ASIGNACIÓN
// ============================================
const validarAsignacion = [
  body("pacienteId")
    .notEmpty()
    .withMessage("El ID del paciente es obligatorio")
    .isMongoId()
    .withMessage("ID de paciente inválido"),

  body("juegoId")
    .notEmpty()
    .withMessage("El ID del juego es obligatorio")
    .isMongoId()
    .withMessage("ID de juego inválido"),

  body("configuracion")
    .optional()
    .isObject()
    .withMessage("La configuración debe ser un objeto"),

  body("configuracion.nivelDificultad")
    .optional()
    .isIn(["basico", "intermedio", "avanzado"])
    .withMessage("Nivel de dificultad inválido"),

  body("configuracion.numeroRondas")
    .optional()
    .isInt({ min: 1 })
    .withMessage("El número de rondas debe ser al menos 1"),

  body("configuracion.puntuacionObjetivo")
    .optional()
    .isInt({ min: 0 })
    .withMessage("La puntuación objetivo no puede ser negativa"),

  body("configuracion.tiempoLimite")
    .optional()
    .isInt({ min: 0 })
    .withMessage("El tiempo límite no puede ser negativo"),

  body("objetivosPersonalizados")
    .optional()
    .isArray()
    .withMessage("Los objetivos deben ser un array"),

  body("notas")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Las notas no pueden exceder 1000 caracteres"),

  body("fechaInicio")
    .optional()
    .isISO8601()
    .withMessage("Formato de fecha de inicio inválido"),

  body("fechaFin")
    .optional()
    .isISO8601()
    .withMessage("Formato de fecha de fin inválido"),

  validarCampos,
];

// ============================================
// VALIDACIONES DE JUEGO
// ============================================
const validarJuego = [
  body("nombre")
    .trim()
    .notEmpty()
    .withMessage("El nombre es obligatorio")
    .isLength({ max: 100 })
    .withMessage("El nombre no puede exceder 100 caracteres"),

  body("descripcion")
    .trim()
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    .isLength({ max: 500 })
    .withMessage("La descripción no puede exceder 500 caracteres"),

  body("instrucciones")
    .optional()
    .isLength({ max: 1000 })
    .withMessage("Las instrucciones no pueden exceder 1000 caracteres"),

  body("codigo")
    .trim()
    .notEmpty()
    .withMessage("El código es obligatorio")
    .matches(/^[A-Z0-9_]+$/)
    .withMessage(
      "El código solo puede contener letras mayúsculas, números y guiones bajos",
    ),

  body("areaTerapeutica")
    .notEmpty()
    .withMessage("El área terapéutica es obligatoria")
    .isIn([
      "fonologia",
      "semantica",
      "morfosintaxis",
      "pragmatica",
      "habla",
      "lenguaje",
    ])
    .withMessage("Área terapéutica inválida"),

  body("nivelDificultad")
    .optional()
    .isIn(["basico", "intermedio", "avanzado"])
    .withMessage("Nivel de dificultad inválido"),

  body("rangoEdad")
    .notEmpty()
    .withMessage("El rango de edad es obligatorio")
    .isObject()
    .withMessage("El rango de edad debe ser un objeto"),

  body("rangoEdad.min")
    .isInt({ min: 2, max: 18 })
    .withMessage("La edad mínima debe estar entre 2 y 18"),

  body("rangoEdad.max")
    .isInt({ min: 2, max: 18 })
    .withMessage("La edad máxima debe estar entre 2 y 18")
    .custom((value, { req }) => {
      if (value < req.body.rangoEdad.min) {
        throw new Error("La edad máxima debe ser mayor que la mínima");
      }
      return true;
    }),

  body("objetivos")
    .optional()
    .isArray()
    .withMessage("Los objetivos deben ser un array"),

  body("palabrasClave")
    .optional()
    .isArray()
    .withMessage("Las palabras clave deben ser un array"),

  body("duracionEstimada")
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage("La duración debe estar entre 1 y 60 minutos"),

  body("numeroRondas")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Debe tener al menos 1 ronda"),

  body("puntuacionMaxima")
    .optional()
    .isInt({ min: 1 })
    .withMessage("La puntuación máxima debe ser al menos 1"),

  body("porcentajeAprobacion")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("El porcentaje debe estar entre 0 y 100"),

  body("urlJuego")
    .trim()
    .notEmpty()
    .withMessage("La URL del juego es obligatoria"),

  validarCampos,
];

/**
 * Validar datos de progreso
 */
const validarProgreso = [
  body("token")
    .trim()
    .notEmpty()
    .withMessage("El token del paciente es obligatorio"),

  body("asignacionId")
    .trim()
    .notEmpty()
    .withMessage("El ID de la asignación es obligatorio")
    .isMongoId()
    .withMessage("ID de asignación inválido"),

  body("puntuacion")
    .notEmpty()
    .withMessage("La puntuación es obligatoria")
    .isNumeric()
    .withMessage("La puntuación debe ser un número")
    .isFloat({ min: 0 })
    .withMessage("La puntuación no puede ser negativa"),

  body("tiempoJugado")
    .notEmpty()
    .withMessage("El tiempo jugado es obligatorio")
    .isNumeric()
    .withMessage("El tiempo debe ser un número")
    .isFloat({ min: 0 })
    .withMessage("El tiempo no puede ser negativo"),

  body("rondasCompletadas")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Las rondas completadas deben ser un número entero positivo"),

  body("rondasTotales")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Las rondas totales deben ser al menos 1"),

  body("aciertos")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Los aciertos deben ser un número entero positivo"),

  body("errores")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Los errores deben ser un número entero positivo"),

  body("completado")
    .optional()
    .isBoolean()
    .withMessage("Completado debe ser true o false"),

  body("datosJuego")
    .optional()
    .isObject()
    .withMessage("Los datos del juego deben ser un objeto"),

  body("dispositivo")
    .optional()
    .isIn(["web", "mobile", "tablet", "desktop"])
    .withMessage("Dispositivo debe ser: web, mobile, tablet o desktop"),
];

// ============================================
// Validación para crear sugerencia de juego
// ============================================
const validarSugerencia = [
  body("titulo")
    .trim()
    .notEmpty()
    .withMessage("El título es obligatorio")
    .isLength({ max: 100 })
    .withMessage("El título no puede exceder 100 caracteres"),

  body("descripcion")
    .trim()
    .notEmpty()
    .withMessage("La descripción es obligatoria")
    .isLength({ max: 1000 })
    .withMessage("La descripción no puede exceder 1000 caracteres"),

  body("areaTerapeutica")
    .notEmpty()
    .withMessage("El área terapéutica es obligatoria")
    .isIn([
      "fonologia",
      "semantica",
      "sintaxis",
      "pragmatica",
      "habla",
      "lenguaje",
      "general",
    ])
    .withMessage("Área terapéutica inválida"),

  body("rangoEdadSugerido.min")
    .optional()
    .isInt({ min: 2, max: 18 })
    .withMessage("La edad mínima debe estar entre 2 y 18 años"),

  body("rangoEdadSugerido.max")
    .optional()
    .isInt({ min: 2, max: 18 })
    .withMessage("La edad máxima debe estar entre 2 y 18 años"),

  body("objetivos")
    .optional()
    .isArray()
    .withMessage("Los objetivos deben ser un array"),

  validarCampos,
];

// ============================================
// EXPORTAR (ACTUALIZAR)
// ============================================
module.exports = {
  validarRegistro,
  validarLogin,
  validarPaciente,
  validarJuego,
  validarAsignacion,
  validarProgreso,
  validarCampos,
  validarSugerencia,
};
