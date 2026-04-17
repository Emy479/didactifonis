/**
 * Controlador de Offboarding
 *
 * Maneja el cuestionario de cese y la desactivación voluntaria de cuenta.
 */

const User = require("../models/User");
const OffboardingFeedback = require("../models/OffboardingFeedback");

// ============================================
// DESACTIVAR CUENTA CON FEEDBACK
// ============================================
/**
 * POST /api/offboarding/desactivar
 * El propio usuario desactiva su cuenta y deja feedback opcional
 * Body: { motivoCese, recomendaria, sugerencias? }
 */
const desactivarCuenta = async (req, res) => {
  try {
    const { motivoCese, recomendaria, sugerencias } = req.body;

    // Validaciones básicas
    if (!motivoCese || !recomendaria) {
      return res.status(400).json({
        success: false,
        error: "motivoCese y recomendaria son obligatorios",
      });
    }

    const usuario = await User.findById(req.user.userId);

    if (!usuario) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    if (!usuario.activo) {
      return res.status(400).json({
        success: false,
        error: "La cuenta ya está desactivada",
      });
    }

    // Guardar feedback antes de desactivar
    await OffboardingFeedback.create({
      usuario: usuario._id,
      usuarioSnapshot: {
        nombre: usuario.nombre,
        email: usuario.email,
        role: usuario.role,
        especialidad: usuario.especialidad || null,
      },
      motivoCese,
      recomendaria,
      sugerencias: sugerencias || "",
      fechaCese: new Date(),
    });

    // Desactivar cuenta — el pre-save registra automáticamente en historialEstados
    usuario.activo = false;
    usuario._motivoCambioEstado = "voluntario";
    usuario._cambiadoPor = req.user.userId; // el propio usuario
    await usuario.save();

    res.json({
      success: true,
      message: "Cuenta desactivada correctamente. Gracias por tu feedback.",
    });
  } catch (error) {
    console.error("Error al desactivar cuenta:", error);
    res.status(500).json({ success: false, error: "Error al desactivar la cuenta" });
  }
};

// ============================================
// LISTAR FEEDBACKS (Admin)
// ============================================
/**
 * GET /api/offboarding/feedbacks
 * Lista todos los feedbacks de offboarding para el admin
 * Query: ?motivoCese=precio&recomendaria=no
 */
const listarFeedbacks = async (req, res) => {
  try {
    const { motivoCese, recomendaria } = req.query;

    const filtro = {};
    if (motivoCese) filtro.motivoCese = motivoCese;
    if (recomendaria) filtro.recomendaria = recomendaria;

    const feedbacks = await OffboardingFeedback.find(filtro)
      .populate("usuario", "nombre email role especialidad activo")
      .sort({ fechaCese: -1 });

    res.json({
      success: true,
      count: feedbacks.length,
      data: feedbacks,
    });
  } catch (error) {
    console.error("Error al listar feedbacks:", error);
    res.status(500).json({ success: false, error: "Error al obtener feedbacks" });
  }
};

/**
 * GET /api/offboarding/feedbacks/stats
 * Resumen estadístico de los feedbacks para el admin
 */
const statsOffboarding = async (req, res) => {
  try {
    const [porMotivo, porRecomendaria, total] = await Promise.all([
      OffboardingFeedback.aggregate([
        { $group: { _id: "$motivoCese", cantidad: { $sum: 1 } } },
        { $sort: { cantidad: -1 } },
      ]),
      OffboardingFeedback.aggregate([
        { $group: { _id: "$recomendaria", cantidad: { $sum: 1 } } },
      ]),
      OffboardingFeedback.countDocuments(),
    ]);

    res.json({
      success: true,
      data: {
        total,
        porMotivo,
        porRecomendaria,
      },
    });
  } catch (error) {
    console.error("Error al obtener stats offboarding:", error);
    res.status(500).json({ success: false, error: "Error al obtener estadísticas" });
  }
};

module.exports = {
  desactivarCuenta,
  listarFeedbacks,
  statsOffboarding,
};
