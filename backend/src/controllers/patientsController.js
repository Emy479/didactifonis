/**
 * Controlador de Pacientes
 *
 * Maneja operaciones CRUD de pacientes.
 */

const Patient = require("../models/Patient");
const User = require("../models/User");

// ============================================
// CREAR PACIENTE
// ============================================
// ============================================
// CREAR PACIENTE - MODELO DUAL
// ============================================
/**
 * POST /api/patients
 * Body: {
 *   nombre, apellido, fechaNacimiento, genero?,
 *   tutorId?, tutorInfo?,
 *   diagnostico?, observaciones?, areasTrabajar?
 * }
 */
const crear = async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      fechaNacimiento,
      genero,
      tutorId,
      tutorInfo,
      diagnostico,
      observaciones,
      areasTrabajar,
    } = req.body;

    // Verificar que el usuario tenga permiso
    if (
      req.user.role !== "tutor" &&
      req.user.role !== "profesional" &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para crear pacientes",
      });
    }

    let tipoCuenta;
    let tutor = null;
    let profesionalesAsignados = [];

    // ============================================
    // CASO 1: TUTOR CREA A SU HIJO/A (Plan Familiar)
    // ============================================
    if (req.user.role === "tutor") {
      tipoCuenta = "familiar";
      tutor = req.user.userId; // El tutor se asigna a sí mismo

      // No se permite tutorInfo cuando el tutor crea el paciente
      if (tutorInfo) {
        return res.status(400).json({
          success: false,
          error:
            "No debes proporcionar tutorInfo cuando creas tu propio paciente",
        });
      }
    }

    // ============================================
    // CASO 2: PROFESIONAL CREA PACIENTE (Plan Profesional)
    // ============================================
    else if (req.user.role === "profesional") {
      tipoCuenta = "profesional";

      // Opción A: El tutor tiene cuenta en Didactifonis
      if (tutorId) {
        const tutorUsuario = await User.findOne({
          _id: tutorId,
          role: "tutor",
          activo: true,
        });

        if (!tutorUsuario) {
          return res.status(404).json({
            success: false,
            error: "Tutor no encontrado o inactivo",
          });
        }

        tutor = tutorId;
      }
      // Opción B: El tutor NO tiene cuenta (datos de contacto)
      else if (tutorInfo) {
        // Validar que tutorInfo tenga los datos mínimos
        if (!tutorInfo.nombre || !tutorInfo.telefono) {
          return res.status(400).json({
            success: false,
            error: "tutorInfo debe incluir al menos nombre y teléfono",
          });
        }
        // tutor queda null, guardamos tutorInfo
      } else {
        return res.status(400).json({
          success: false,
          error:
            "Debes proporcionar tutorId (si tiene cuenta) o tutorInfo (si no tiene cuenta)",
        });
      }

      // El profesional se asigna automáticamente
      profesionalesAsignados = [req.user.userId];
    }

    // ============================================
    // CASO 3: ADMIN
    // ============================================
    else if (req.user.role === "admin") {
      tipoCuenta = req.body.tipoCuenta || "profesional";

      if (tutorId) {
        tutor = tutorId;
      }

      if (req.body.profesionalesAsignados) {
        profesionalesAsignados = req.body.profesionalesAsignados;
      }
    }

    // ============================================
    // CREAR PACIENTE
    // ============================================
    const nuevoPaciente = new Patient({
      nombre,
      apellido,
      fechaNacimiento,
      genero,
      tipoCuenta,
      creadoPor: req.user.userId,
      tutor,
      tutorInfo,
      profesionalesAsignados,
      diagnostico,
      observaciones,
      areasTrabajar,
    });

    // Generar token de acceso
    nuevoPaciente.generarTokenAcceso(30);

    // Guardar
    await nuevoPaciente.save();

    // Poblar datos
    if (nuevoPaciente.tutor) {
      await nuevoPaciente.populate("tutor", "nombre email");
    }
    await nuevoPaciente.populate(
      "profesionalesAsignados",
      "nombre email especialidad",
    );
    await nuevoPaciente.populate("creadoPor", "nombre email");

    res.status(201).json({
      success: true,
      message: "Paciente creado exitosamente",
      data: nuevoPaciente.getDatosCompletos(),
      accessToken: nuevoPaciente.accessToken,
      tokenExpiracion: nuevoPaciente.tokenExpiracion,
    });
  } catch (error) {
    console.error("Error al crear paciente:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al crear paciente",
    });
  }
};

// ============================================
// OBTENER PACIENTES DEL USUARIO
// ============================================
const obtenerTodos = async (req, res) => {
  try {
    let pacientes;

    if (req.user.role === "tutor") {
      // Tutores ven pacientes donde son tutor
      pacientes = await Patient.buscarPorTutor(req.user.userId);
    } else if (req.user.role === "profesional") {
      // Profesionales ven pacientes creados O asignados
      pacientes = await Patient.buscarPorProfesional(req.user.userId);
    } else if (req.user.role === "admin") {
      // Admin ve todos
      pacientes = await Patient.find({ activo: true })
        .populate("tutor", "nombre email")
        .populate("profesionalesAsignados", "nombre email especialidad")
        .populate("creadoPor", "nombre email")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para ver pacientes",
      });
    }

    res.json({
      success: true,
      count: pacientes.length,
      data: pacientes.map((p) => p.getDatosCompletos()),
    });
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener pacientes",
    });
  }
};

const obtenerMisPacientes = async (req, res) => {
  try {
    const { userId, role } = req.user;

    let query = { activo: true }; // Solo pacientes activos

    if (role === "tutor") {
      query.tutor = userId;
    } else if (role === "profesional") {
      query.profesionalesAsignados = userId; // ← IMPORTANTE: usar profesionalesAsignados
    } else {
      return res.status(403).json({
        success: false,
        error: "Rol no autorizado",
      });
    }

    const pacientes = await Patient.find(query)
      .populate("tutor", "nombre email")
      .populate("profesionalesAsignados", "nombre email especialidad")
      .populate("creadoPor", "nombre email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: pacientes.length,
      data: pacientes.map((p) => p.getDatosCompletos()),
    });
  } catch (error) {
    console.error("Error al obtener mis pacientes:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener pacientes",
    });
  }
};

// ============================================
// OBTENER PACIENTE POR ID
// ============================================
/**
 * GET /api/patients/:id
 */
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Patient.findById(id)
      .populate("tutor", "nombre email telefono")
      .populate("profesionalesAsignados", "nombre email especialidad")
      .populate("creadoPor", "nombre email");

    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: "Paciente no encontrado",
      });
    }

    // Verificar permisos
    const esTutor =
      paciente.tutor && paciente.tutor._id.toString() === req.user.userId;
    const esCreador = paciente.creadoPor._id.toString() === req.user.userId;
    const esProfesionalAsignado = paciente.profesionalesAsignados.some(
      (prof) => prof._id.toString() === req.user.userId,
    );

    if (
      !esTutor &&
      !esCreador &&
      !esProfesionalAsignado &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para ver este paciente",
      });
    }

    res.json({
      success: true,
      data: paciente.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al obtener paciente:", error);

    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "ID inválido",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al obtener paciente",
    });
  }
};

// ============================================
// ACTUALIZAR PACIENTE
// ============================================
/**
 * PUT /api/patients/:id
 * Body: { nombre?, apellido?, fechaNacimiento?, genero?, diagnostico?, observaciones?, areasTrabajar?, avatar? }
 */
const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      fechaNacimiento,
      genero,
      diagnostico,
      observaciones,
      areasTrabajar,
      avatar,
    } = req.body;

    // Buscar paciente
    const paciente = await Patient.findById(id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: "Paciente no encontrado",
      });
    }

    // Verificar permisos (modelo dual)
    const esTutor =
      paciente.tutor && paciente.tutor.toString() === req.user.userId;
    const esCreador =
      paciente.creadoPor && paciente.creadoPor.toString() === req.user.userId;
    const esProfesionalAsignado = paciente.profesionalesAsignados.some(
      (prof) => prof.toString() === req.user.userId,
    );

    if (
      !esTutor &&
      !esCreador &&
      !esProfesionalAsignado &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para actualizar este paciente",
      });
    }

    // Solo el tutor puede cambiar datos básicos
    if (esTutor || esCreador) {
      if (nombre) paciente.nombre = nombre;
      if (apellido) paciente.apellido = apellido;
      if (fechaNacimiento) paciente.fechaNacimiento = fechaNacimiento;
      if (genero) paciente.genero = genero;
      if (avatar) paciente.avatar = avatar;
    }

    // Tutor y profesionales pueden actualizar info clínica
    if (diagnostico !== undefined) paciente.diagnostico = diagnostico;
    if (observaciones !== undefined) paciente.observaciones = observaciones;
    if (areasTrabajar !== undefined) paciente.areasTrabajar = areasTrabajar;

    await paciente.save();

    // Poblar datos
    await paciente.populate("tutor", "nombre email");
    await paciente.populate(
      "profesionalesAsignados",
      "nombre email especialidad",
    );

    res.json({
      success: true,
      message: "Paciente actualizado exitosamente",
      data: paciente.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al actualizar paciente:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al actualizar paciente",
    });
  }
};

// ============================================
// ELIMINAR PACIENTE (Desactivar)
// ============================================
/**
 * DELETE /api/patients/:id
 * No elimina realmente, solo marca como inactivo
 */
const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Patient.findById(id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: "Paciente no encontrado",
      });
    }

    // Solo el tutor puede eliminar
    if (paciente.tutor.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: "Solo el tutor puede eliminar este paciente",
      });
    }

    // Marcar como inactivo (soft delete)
    paciente.activo = false;
    await paciente.save();

    res.json({
      success: true,
      message: "Paciente desactivado exitosamente",
      data: paciente.getDatosPublicos(),
    });
  } catch (error) {
    console.error("Error al eliminar paciente:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar paciente",
    });
  }
};

// ============================================
// ASIGNAR PROFESIONAL A PACIENTE
// ============================================
/**
 * POST /api/patients/:id/asignar-profesional
 * Body: { profesionalId }
 */
const asignarProfesional = async (req, res) => {
  try {
    const { id } = req.params;
    const { profesionalId } = req.body;

    if (!profesionalId) {
      return res.status(400).json({
        success: false,
        error: "El ID del profesional es obligatorio",
      });
    }

    const paciente = await Patient.findById(id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: "Paciente no encontrado",
      });
    }

    // Solo el tutor puede asignar profesionales
    if (paciente.tutor.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: "Solo el tutor puede asignar profesionales",
      });
    }

    // Verificar que el profesional existe y está verificado
    const profesional = await User.findOne({
      _id: profesionalId,
      role: "profesional",
      verificado: true,
      activo: true,
    });

    if (!profesional) {
      return res.status(404).json({
        success: false,
        error: "Profesional no encontrado o no verificado",
      });
    }

    // Asignar profesional
    paciente.asignarProfesional(profesionalId);
    await paciente.save();

    await paciente.populate("tutor", "nombre email");
    await paciente.populate(
      "profesionalesAsignados",
      "nombre email especialidad",
    );

    res.json({
      success: true,
      message: "Profesional asignado exitosamente",
      data: paciente.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al asignar profesional:", error);
    res.status(500).json({
      success: false,
      error: "Error al asignar profesional",
    });
  }
};

// ============================================
// REMOVER PROFESIONAL DE PACIENTE
// ============================================
/**
 * DELETE /api/patients/:id/profesional/:profesionalId
 */
const removerProfesional = async (req, res) => {
  try {
    const { id, profesionalId } = req.params;

    const paciente = await Patient.findById(id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: "Paciente no encontrado",
      });
    }

    // Solo el tutor puede remover profesionales
    if (paciente.tutor.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        error: "Solo el tutor puede remover profesionales",
      });
    }

    // Remover profesional
    paciente.removerProfesional(profesionalId);
    await paciente.save();

    await paciente.populate("tutor", "nombre email");
    await paciente.populate(
      "profesionalesAsignados",
      "nombre email especialidad",
    );

    res.json({
      success: true,
      message: "Profesional removido exitosamente",
      data: paciente.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al remover profesional:", error);
    res.status(500).json({
      success: false,
      error: "Error al remover profesional",
    });
  }
};

// ============================================
// RENOVAR TOKEN DE ACCESO
// ============================================
/**
 * POST /api/patients/:id/renovar-token
 */
const renovarToken = async (req, res) => {
  try {
    const { id } = req.params;

    const paciente = await Patient.findById(id);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: "Paciente no encontrado",
      });
    }

    // Verificar permisos
    const esTutor =
      paciente.tutor && paciente.tutor.toString() === req.user.userId;
    const esCreador = paciente.creadoPor.toString() === req.user.userId;
    const esProfesionalAsignado = paciente.profesionalesAsignados.some(
      (prof) => prof.toString() === req.user.userId,
    );

    if (
      !esTutor &&
      !esCreador &&
      !esProfesionalAsignado &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso",
      });
    }

    // Renovar token
    const nuevoToken = paciente.renovarToken(30); // 30 días
    await paciente.save();

    res.json({
      success: true,
      message: "Token renovado exitosamente",
      accessToken: nuevoToken,
      tokenExpiracion: paciente.tokenExpiracion,
      urlAcceso: `${process.env.FRONTEND_URL || "http://localhost:5173"}/jugar?token=${nuevoToken}`,
    });
  } catch (error) {
    console.error("Error al renovar token:", error);
    res.status(500).json({
      success: false,
      error: "Error al renovar token",
    });
  }
};

// ============================================
// OBTENER PACIENTE POR TOKEN (Sin autenticación)
// ============================================
/**
 * GET /api/patients/token/:token
 * Endpoint público - permite a un niño/a acceder con su token
 */
const obtenerPorToken = async (req, res) => {
  try {
    const { token } = req.params;

    const paciente = await Patient.buscarPorToken(token);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: "Token inválido o expirado",
      });
    }

    // Retornar solo datos públicos (sin info sensible)
    res.json({
      success: true,
      data: paciente.getDatosPublicos(),
    });
  } catch (error) {
    console.error("Error al obtener paciente por token:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener paciente",
    });
  }
};

// ============================================
// OBTENER ESTADÍSTICAS
// ============================================
/**
 * GET /api/patients/estadisticas
 */
const obtenerEstadisticas = async (req, res) => {
  try {
    let estadisticas;

    if (req.user.role === "tutor") {
      estadisticas = await Patient.obtenerEstadisticasTutor(req.user.userId);
    } else if (req.user.role === "profesional") {
      const total = await Patient.countDocuments({
        profesionalesAsignados: req.user.userId,
        activo: true,
      });

      estadisticas = { total };
    } else {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para ver estadísticas",
      });
    }

    res.json({
      success: true,
      data: estadisticas,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener estadísticas",
    });
  }
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================
module.exports = {
  crear,
  obtenerMisPacientes,
  obtenerTodos,
  obtenerPorId,
  actualizar,
  eliminar,
  asignarProfesional,
  removerProfesional,
  renovarToken,
  obtenerPorToken,
  obtenerEstadisticas,
};
