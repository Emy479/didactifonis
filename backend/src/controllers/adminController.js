/**
 * Controlador de Administración
 *
 * Gestión de usuarios (verificar profesionales, desactivar cuentas)
 * y reactivación de pacientes eliminados (soft delete).
 */

const User = require("../models/User");
const Patient = require("../models/Patient");

// ============================================
// STATS GENERALES
// ============================================
/**
 * GET /api/admin/stats
 * Resumen general de la plataforma
 */
const obtenerStats = async (req, res) => {
  try {
    const [
      totalUsuarios,
      profesionalesVerificados,
      profesionalesPendientes,
      totalPacientes,
      pacientesInactivos,
    ] = await Promise.all([
      User.countDocuments({ activo: true }),
      User.countDocuments({ role: "profesional", verificado: true, activo: true }),
      User.countDocuments({ role: "profesional", verificado: false, activo: true }),
      Patient.countDocuments({ activo: true }),
      Patient.countDocuments({ activo: false }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsuarios,
        profesionalesVerificados,
        profesionalesPendientes,
        totalPacientes,
        pacientesInactivos,
      },
    });
  } catch (error) {
    console.error("Error al obtener stats admin:", error);
    res.status(500).json({ success: false, error: "Error al obtener estadísticas" });
  }
};

// ============================================
// GESTIÓN DE USUARIOS
// ============================================

/**
 * GET /api/admin/usuarios
 * Listar todos los usuarios con filtros opcionales
 * Query: ?role=profesional&verificado=false&activo=true
 */
const listarUsuarios = async (req, res) => {
  try {
    const { role, verificado, activo = "true" } = req.query;

    const filtro = {};
    if (role) filtro.role = role;
    if (verificado !== undefined) filtro.verificado = verificado === "true";
    if (activo !== undefined) filtro.activo = activo === "true";

    const usuarios = await User.find(filtro)
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: usuarios.length,
      data: usuarios,
    });
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    res.status(500).json({ success: false, error: "Error al obtener usuarios" });
  }
};

/**
 * PUT /api/admin/usuarios/:id/verificar
 * Verificar (o desverificar) un profesional
 * Body: { verificado: true | false }
 */
const verificarProfesional = async (req, res) => {
  try {
    const { id } = req.params;
    const { verificado } = req.body;

    if (typeof verificado !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "El campo 'verificado' debe ser true o false",
      });
    }

    const usuario = await User.findById(id);

    if (!usuario) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    if (usuario.role !== "profesional") {
      return res.status(400).json({
        success: false,
        error: "Solo se pueden verificar profesionales",
      });
    }

    usuario.verificado = verificado;
    await usuario.save();

    res.json({
      success: true,
      message: verificado
        ? "Profesional verificado correctamente"
        : "Verificación removida correctamente",
      data: usuario.getDatosPublicos(),
    });
  } catch (error) {
    console.error("Error al verificar profesional:", error);
    res.status(500).json({ success: false, error: "Error al actualizar verificación" });
  }
};

/**
 * PUT /api/admin/usuarios/:id/estado
 * Activar o desactivar cuenta de usuario
 * Body: { activo: true | false }
 */
const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== "boolean") {
      return res.status(400).json({
        success: false,
        error: "El campo 'activo' debe ser true o false",
      });
    }

    // No permitir que el admin se desactive a sí mismo
    if (id === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        error: "No puedes desactivar tu propia cuenta",
      });
    }

    const usuario = await User.findByIdAndUpdate(
      id,
      { activo },
      { new: true }
    ).select("-password");

    if (!usuario) {
      return res.status(404).json({ success: false, error: "Usuario no encontrado" });
    }

    res.json({
      success: true,
      message: activo ? "Cuenta activada correctamente" : "Cuenta desactivada correctamente",
      data: usuario,
    });
  } catch (error) {
    console.error("Error al cambiar estado de usuario:", error);
    res.status(500).json({ success: false, error: "Error al actualizar estado" });
  }
};

// ============================================
// GESTIÓN DE PACIENTES ELIMINADOS
// ============================================

/**
 * GET /api/admin/pacientes/inactivos
 * Listar pacientes con soft delete (activo: false)
 */
const listarPacientesInactivos = async (req, res) => {
  try {
    const pacientes = await Patient.find({ activo: false })
      .populate("tutor", "nombre email")
      .populate("creadoPor", "nombre email role")
      .populate("profesionalesAsignados", "nombre email especialidad")
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: pacientes.length,
      data: pacientes,
    });
  } catch (error) {
    console.error("Error al listar pacientes inactivos:", error);
    res.status(500).json({ success: false, error: "Error al obtener pacientes" });
  }
};

/**
 * PUT /api/admin/pacientes/:id/reactivar
 * Reactivar un paciente eliminado (activo: false → true)
 */
const reactivarPaciente = async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Patient.findById(id);

    if (!paciente) {
      return res.status(404).json({ success: false, error: "Paciente no encontrado" });
    }

    if (paciente.activo) {
      return res.status(400).json({
        success: false,
        error: "El paciente ya está activo",
      });
    }

    paciente.activo = true;
    await paciente.save();

    res.json({
      success: true,
      message: `Paciente ${paciente.nombre} ${paciente.apellido} reactivado correctamente`,
      data: paciente.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al reactivar paciente:", error);
    res.status(500).json({ success: false, error: "Error al reactivar paciente" });
  }
};

// ============================================
// EXPORTAR
// ============================================
module.exports = {
  obtenerStats,
  listarUsuarios,
  verificarProfesional,
  cambiarEstadoUsuario,
  listarPacientesInactivos,
  reactivarPaciente,
};
