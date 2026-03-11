/**
 * Controlador de Asignaciones
 *
 * Maneja la asignación de juegos a pacientes.
 */

const Assignment = require("../models/Assignment");
const Patient = require("../models/Patient");
const Game = require("../models/Game");

// ============================================
// CREAR ASIGNACIÓN
// ============================================
/**
 * POST /api/assignments
 * Body: { pacienteId, juegoId, configuracion?, objetivosPersonalizados?, notas?, fechaInicio?, fechaFin? }
 */
const crear = async (req, res) => {
  try {
    const {
      pacienteId,
      juegoId,
      configuracion,
      objetivosPersonalizados,
      notas,
      fechaInicio,
      fechaFin,
    } = req.body;

    // Verificar que el paciente existe
    const paciente = await Patient.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: "Paciente no encontrado",
      });
    }

    // Verificar que el juego existe
    const juego = await Game.findById(juegoId);
    if (!juego) {
      return res.status(404).json({
        success: false,
        error: "Juego no encontrado",
      });
    }

    // Verificar permisos: tutor del paciente o profesional asignado
    const esTutor = paciente.tutor.toString() === req.user.userId;
    const esProfesionalAsignado = paciente.profesionalesAsignados.some(
      (prof) => prof.toString() === req.user.userId,
    );

    if (!esTutor && !esProfesionalAsignado && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para asignar juegos a este paciente",
      });
    }

    // Verificar si ya existe una asignación activa
    const existeAsignacion = await Assignment.existeAsignacion(
      pacienteId,
      juegoId,
    );
    if (existeAsignacion) {
      return res.status(400).json({
        success: false,
        error: "Este juego ya está asignado al paciente",
      });
    }

    // Crear asignación
    const nuevaAsignacion = new Assignment({
      paciente: pacienteId,
      juego: juegoId,
      asignadoPor: req.user.userId,
      configuracion: configuracion || {},
      objetivosPersonalizados,
      notas,
      fechaInicio,
      fechaFin,
    });

    await nuevaAsignacion.save();

    // Poblar datos
    await nuevaAsignacion.populate("paciente", "nombre apellido edad");
    await nuevaAsignacion.populate("juego");
    await nuevaAsignacion.populate("asignadoPor", "nombre email");

    res.status(201).json({
      success: true,
      message: "Juego asignado exitosamente",
      data: nuevaAsignacion.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al crear asignación:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al crear asignación",
    });
  }
};

// ============================================
// OBTENER ASIGNACIONES DE UN PACIENTE
// ============================================
/**
 * GET /api/assignments/paciente/:pacienteId
 */
const obtenerPorPaciente = async (req, res) => {
  try {
    const { pacienteId } = req.params;

    // Verificar que el paciente existe
    const paciente = await Patient.findById(pacienteId);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: "Paciente no encontrado",
      });
    }

    // Verificar permisos
    const esTutor = paciente.tutor.toString() === req.user.userId;
    const esProfesionalAsignado = paciente.profesionalesAsignados.some(
      (prof) => prof.toString() === req.user.userId,
    );

    if (!esTutor && !esProfesionalAsignado && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para ver las asignaciones de este paciente",
      });
    }

    // Obtener asignaciones
    const asignaciones = await Assignment.obtenerJuegosPaciente(pacienteId);

    res.json({
      success: true,
      count: asignaciones.length,
      data: asignaciones.map((a) => a.getDatosCompletos()),
    });
  } catch (error) {
    console.error("Error al obtener asignaciones:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener asignaciones",
    });
  }
};

// ============================================
// OBTENER PACIENTES CON UN JUEGO ASIGNADO
// ============================================
/**
 * GET /api/assignments/juego/:juegoId
 */
const obtenerPorJuego = async (req, res) => {
  try {
    const { juegoId } = req.params;

    // Verificar que el juego existe
    const juego = await Game.findById(juegoId);
    if (!juego) {
      return res.status(404).json({
        success: false,
        error: "Juego no encontrado",
      });
    }

    // Obtener asignaciones
    let asignaciones = await Assignment.obtenerPacientesJuego(juegoId);

    // Filtrar según el rol del usuario
    if (req.user.role === "tutor") {
      // Tutores solo ven sus pacientes
      asignaciones = asignaciones.filter(
        (a) => a.paciente.tutor.toString() === req.user.userId,
      );
    } else if (req.user.role === "profesional") {
      // Profesionales solo ven pacientes asignados a ellos
      asignaciones = asignaciones.filter((a) =>
        a.paciente.profesionalesAsignados.some(
          (prof) => prof.toString() === req.user.userId,
        ),
      );
    }

    res.json({
      success: true,
      count: asignaciones.length,
      data: asignaciones.map((a) => a.getDatosCompletos()),
    });
  } catch (error) {
    console.error("Error al obtener asignaciones por juego:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener asignaciones",
    });
  }
};

// ============================================
// OBTENER ASIGNACIÓN POR ID
// ============================================
/**
 * GET /api/assignments/:id
 */
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const asignacion = await Assignment.findById(id)
      .populate("paciente")
      .populate("juego")
      .populate("asignadoPor", "nombre email");

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        error: "Asignación no encontrada",
      });
    }

    // Verificar permisos
    const esTutor = asignacion.paciente.tutor.toString() === req.user.userId;
    const esProfesionalAsignado =
      asignacion.paciente.profesionalesAsignados.some(
        (prof) => prof.toString() === req.user.userId,
      );

    if (!esTutor && !esProfesionalAsignado && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para ver esta asignación",
      });
    }

    res.json({
      success: true,
      data: asignacion.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al obtener asignación:", error);

    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "ID inválido",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al obtener asignación",
    });
  }
};

// ============================================
// ACTUALIZAR ASIGNACIÓN
// ============================================
/**
 * PUT /api/assignments/:id
 * Body: { configuracion?, objetivosPersonalizados?, notas?, fechaFin?, activa? }
 */
const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const { configuracion, objetivosPersonalizados, notas, fechaFin, activa } =
      req.body;

    const asignacion = await Assignment.findById(id).populate("paciente");

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        error: "Asignación no encontrada",
      });
    }

    // Verificar permisos
    const esTutor = asignacion.paciente.tutor.toString() === req.user.userId;
    const esProfesionalAsignado =
      asignacion.paciente.profesionalesAsignados.some(
        (prof) => prof.toString() === req.user.userId,
      );

    if (!esTutor && !esProfesionalAsignado && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para actualizar esta asignación",
      });
    }

    // Actualizar campos
    if (configuracion) {
      asignacion.configuracion = {
        ...asignacion.configuracion,
        ...configuracion,
      };
    }

    if (objetivosPersonalizados !== undefined) {
      asignacion.objetivosPersonalizados = objetivosPersonalizados;
    }

    if (notas !== undefined) {
      asignacion.notas = notas;
    }

    if (fechaFin !== undefined) {
      asignacion.fechaFin = fechaFin;
    }

    if (activa !== undefined) {
      asignacion.activa = activa;
    }

    await asignacion.save();

    // Poblar datos
    await asignacion.populate("juego");
    await asignacion.populate("asignadoPor", "nombre email");

    res.json({
      success: true,
      message: "Asignación actualizada exitosamente",
      data: asignacion.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al actualizar asignación:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al actualizar asignación",
    });
  }
};

// ============================================
// DESACTIVAR ASIGNACIÓN
// ============================================
/**
 * DELETE /api/assignments/:id
 * No elimina, solo marca como inactiva
 */
const desactivar = async (req, res) => {
  try {
    const { id } = req.params;

    const asignacion = await Assignment.findById(id).populate("paciente");

    if (!asignacion) {
      return res.status(404).json({
        success: false,
        error: "Asignación no encontrada",
      });
    }

    // Verificar permisos
    const esTutor = asignacion.paciente.tutor.toString() === req.user.userId;
    const esProfesionalAsignado =
      asignacion.paciente.profesionalesAsignados.some(
        (prof) => prof.toString() === req.user.userId,
      );

    if (!esTutor && !esProfesionalAsignado && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para desactivar esta asignación",
      });
    }

    await asignacion.desactivar();

    res.json({
      success: true,
      message: "Asignación desactivada exitosamente",
    });
  } catch (error) {
    console.error("Error al desactivar asignación:", error);
    res.status(500).json({
      success: false,
      error: "Error al desactivar asignación",
    });
  }
};

// ============================================
// OBTENER JUEGOS ASIGNADOS (POR TOKEN - PACIENTE)
// ============================================
/**
 * GET /api/assignments/token/:token/games
 * Endpoint PÚBLICO - para que el paciente vea sus juegos con su token
 */
const obtenerJuegosPorToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Buscar paciente por token
    const paciente = await Patient.buscarPorToken(token);

    if (!paciente) {
      return res.status(404).json({
        success: false,
        error: "Token inválido o expirado",
      });
    }

    // Obtener asignaciones activas y vigentes
    const asignaciones = await Assignment.obtenerJuegosPaciente(
      paciente._id,
      true,
    );

    // Filtrar solo vigentes
    const asignacionesVigentes = asignaciones.filter((a) => a.estaVigente());

    // Retornar solo datos públicos
    const juegosPublicos = asignacionesVigentes.map((a) => ({
      asignacionId: a._id,
      juego: a.juego.getDatosPublicos(),
      configuracion: a.configuracion,
      estadisticas: {
        vecesJugado: a.estadisticas.vecesJugado,
        mejorPuntuacion: a.estadisticas.mejorPuntuacion,
        completado: a.estadisticas.completado,
      },
    }));

    res.json({
      success: true,
      paciente: paciente.getDatosPublicos(),
      count: juegosPublicos.length,
      juegos: juegosPublicos,
    });
  } catch (error) {
    console.error("Error al obtener juegos por token:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener juegos",
    });
  }
};

// ============================================
// OBTENER ESTADÍSTICAS DE ASIGNACIONES
// ============================================
/**
 * GET /api/assignments/estadisticas
 */
const obtenerEstadisticas = async (req, res) => {
  try {
    let filtro = {};

    if (req.user.role === "tutor") {
      // Obtener pacientes del tutor
      const pacientes = await Patient.find({
        tutor: req.user.userId,
        activo: true,
      }).select("_id");

      const pacienteIds = pacientes.map((p) => p._id);
      filtro.paciente = { $in: pacienteIds };
    } else if (req.user.role === "profesional") {
      // Obtener pacientes del profesional
      const pacientes = await Patient.find({
        profesionalesAsignados: req.user.userId,
        activo: true,
      }).select("_id");

      const pacienteIds = pacientes.map((p) => p._id);
      filtro.paciente = { $in: pacienteIds };
    }

    const estadisticas = await Assignment.obtenerEstadisticas(filtro);

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
  obtenerPorPaciente,
  obtenerPorJuego,
  obtenerPorId,
  actualizar,
  desactivar,
  obtenerJuegosPorToken,
  obtenerEstadisticas,
};
