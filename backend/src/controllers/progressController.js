/**
 * Controlador de Progreso
 * 
 * Maneja el registro de sesiones de juego y estadísticas de evolución.
 */

const Progress = require('../models/Progress');
const Assignment = require('../models/Assignment');
const Patient = require('../models/Patient');
const Game = require('../models/Game');

// ============================================
// GUARDAR PROGRESO (ENVÍO DESDE JUEGO)
// ============================================
/**
 * POST /api/progress
 * Body: {
 *   token,              // Token del paciente
 *   asignacionId,
 *   puntuacion,
 *   tiempoJugado,
 *   rondasCompletadas?,
 *   rondasTotales?,
 *   aciertos?,
 *   errores?,
 *   completado?,
 *   datosJuego?,
 *   dispositivo?,
 *   navegador?,
 *   sistemaOperativo?
 * }
 */
const guardar = async (req, res) => {
    try {
        const {
            token,
            asignacionId,
            puntuacion,
            tiempoJugado,
            rondasCompletadas,
            rondasTotales,
            aciertos,
            errores,
            completado,
            datosJuego,
            dispositivo,
            navegador,
            sistemaOperativo
        } = req.body;

        // Verificar token del paciente
        const paciente = await Patient.buscarPorToken(token);
        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: 'Token inválido o expirado'
            });
        }

        // Verificar que la asignación existe y pertenece al paciente
        const asignacion = await Assignment.findOne({
            _id: asignacionId,
            paciente: paciente._id,
            activa: true
        }).populate('juego');

        if (!asignacion) {
            return res.status(404).json({
                success: false,
                error: 'Asignación no encontrada o inactiva'
            });
        }

        // Obtener configuración efectiva
        const config = asignacion.getConfiguracionEfectiva();
        const puntuacionMaxima = config.puntuacionMaxima || asignacion.juego.puntuacionMaxima;
        const porcentajeAprobacion = config.porcentajeAprobacion || asignacion.juego.porcentajeAprobacion;

        // Calcular si aprobó
        const porcentajeAcierto = Math.round((puntuacion / puntuacionMaxima) * 100);
        const aprobado = completado && porcentajeAcierto >= porcentajeAprobacion;

        // Crear registro de progreso
        const nuevoProgreso = new Progress({
            paciente: paciente._id,
            juego: asignacion.juego._id,
            asignacion: asignacionId,
            puntuacion,
            puntuacionMaxima,
            tiempoJugado,
            rondasCompletadas: rondasCompletadas || 0,
            rondasTotales: rondasTotales || config.numeroRondas,
            aciertos: aciertos || 0,
            errores: errores || 0,
            completado: completado || false,
            aprobado,
            datosJuego: datosJuego || {},
            dispositivo,
            navegador,
            sistemaOperativo,
            fechaSesion: new Date()
        });

        await nuevoProgreso.save();

        // ============================================
        // ACTUALIZAR ESTADÍSTICAS DE ASSIGNMENT
        // ============================================
        await asignacion.actualizarEstadisticas(puntuacion);

        // Si completó y aprobó, marcar assignment como completado
        if (aprobado) {
            await asignacion.marcarCompletado();
        }

        // ============================================
        // ACTUALIZAR ESTADÍSTICAS DEL GAME
        // ============================================
        await asignacion.juego.incrementarJugado();
        await asignacion.juego.actualizarPromedioTiempo(tiempoJugado);

        res.status(201).json({
            success: true,
            message: 'Progreso guardado exitosamente',
            data: {
                progreso: nuevoProgreso.getDatosCompletos(),
                aprobado,
                porcentajeAcierto,
                mensaje: aprobado 
                    ? '¡Felicitaciones! Has aprobado este juego.' 
                    : completado 
                        ? `Buen intento. Necesitas ${porcentajeAprobacion}% para aprobar.`
                        : 'Sesión guardada.'
            }
        });

    } catch (error) {
        console.error('Error al guardar progreso:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            error: 'Error al guardar progreso'
        });
    }
};

// ============================================
// OBTENER PROGRESO DE UN PACIENTE
// ============================================
/**
 * GET /api/progress/patient/:pacienteId
 * Query: ?limite=50
 */
const obtenerPorPaciente = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const limite = parseInt(req.query.limite) || 50;

        // Verificar que el paciente existe
        const paciente = await Patient.findById(pacienteId);
        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        // Verificar permisos
        const esTutor = paciente.tutor && 
                        paciente.tutor.toString() === req.user.userId;

        const esCreador = paciente.creadoPor && 
                          paciente.creadoPor.toString() === req.user.userId;

        const esProfesionalAsignado = paciente.profesionalesAsignados && 
                                      paciente.profesionalesAsignados.some(
                                          prof => prof.toString() === req.user.userId
                                      );

        if (!esTutor && !esCreador && !esProfesionalAsignado && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para ver el progreso de este paciente'
            });
        }

        // Obtener progreso
        const progreso = await Progress.obtenerProgresoPaciente(pacienteId, limite);

        // Obtener estadísticas
        const estadisticas = await Progress.obtenerEstadisticasPaciente(pacienteId);

        res.json({
            success: true,
            count: progreso.length,
            estadisticas,
            data: progreso.map(p => p.getDatosCompletos())
        });

    } catch (error) {
        console.error('Error al obtener progreso:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener progreso'
        });
    }
};

// ============================================
// OBTENER PROGRESO DE UNA ASIGNACIÓN
// ============================================
/**
 * GET /api/progress/assignment/:asignacionId
 */
const obtenerPorAsignacion = async (req, res) => {
    try {
        const { asignacionId } = req.params;

        // Verificar que la asignación existe
        const asignacion = await Assignment.findById(asignacionId)
            .populate('paciente');

        if (!asignacion) {
            return res.status(404).json({
                success: false,
                error: 'Asignación no encontrada'
            });
        }

        // Verificar permisos
        const esTutor = asignacion.paciente.tutor && 
                        asignacion.paciente.tutor.toString() === req.user.userId;

        const esCreador = asignacion.paciente.creadoPor && 
                          asignacion.paciente.creadoPor.toString() === req.user.userId;

        const esProfesionalAsignado = asignacion.paciente.profesionalesAsignados && 
                                      asignacion.paciente.profesionalesAsignados.some(
                                          prof => prof.toString() === req.user.userId
                                      );

        if (!esTutor && !esCreador && !esProfesionalAsignado && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso para ver este progreso'
            });
        }

        // Obtener progreso
        const progreso = await Progress.obtenerProgresoAsignacion(asignacionId);

        // Obtener estadísticas
        const estadisticas = await Progress.obtenerEstadisticasAsignacion(asignacionId);

        res.json({
            success: true,
            count: progreso.length,
            estadisticas,
            data: progreso.map(p => p.getDatosCompletos())
        });

    } catch (error) {
        console.error('Error al obtener progreso:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener progreso'
        });
    }
};

// ============================================
// OBTENER EVOLUCIÓN TEMPORAL
// ============================================
/**
 * GET /api/progress/evolucion/:pacienteId/:juegoId
 * Query: ?dias=30
 */
const obtenerEvolucion = async (req, res) => {
    try {
        const { pacienteId, juegoId } = req.params;
        const dias = parseInt(req.query.dias) || 30;

        // Verificar paciente
        const paciente = await Patient.findById(pacienteId);
        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        // Verificar permisos
        const esTutor = paciente.tutor && 
                        paciente.tutor.toString() === req.user.userId;

        const esCreador = paciente.creadoPor && 
                          paciente.creadoPor.toString() === req.user.userId;

        const esProfesionalAsignado = paciente.profesionalesAsignados && 
                                      paciente.profesionalesAsignados.some(
                                          prof => prof.toString() === req.user.userId
                                      );

        if (!esTutor && !esCreador && !esProfesionalAsignado && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso'
            });
        }

        // Obtener evolución
        const evolucion = await Progress.obtenerEvolucion(pacienteId, juegoId, dias);

        res.json({
            success: true,
            dias,
            count: evolucion.length,
            data: evolucion
        });

    } catch (error) {
        console.error('Error al obtener evolución:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener evolución'
        });
    }
};

// ============================================
// OBTENER JUEGOS MÁS JUGADOS
// ============================================
/**
 * GET /api/progress/juegos-mas-jugados/:pacienteId
 * Query: ?limite=5
 */
const obtenerJuegosMasJugados = async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const limite = parseInt(req.query.limite) || 5;

        // Verificar paciente
        const paciente = await Patient.findById(pacienteId);
        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        // Verificar permisos
        const esTutor = paciente.tutor && 
                        paciente.tutor.toString() === req.user.userId;

        const esCreador = paciente.creadoPor && 
                          paciente.creadoPor.toString() === req.user.userId;

        const esProfesionalAsignado = paciente.profesionalesAsignados && 
                                      paciente.profesionalesAsignados.some(
                                          prof => prof.toString() === req.user.userId
                                      );

        if (!esTutor && !esCreador && !esProfesionalAsignado && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso'
            });
        }

        // Obtener juegos
        const juegos = await Progress.obtenerJuegosMasJugados(pacienteId, limite);

        res.json({
            success: true,
            count: juegos.length,
            data: juegos
        });

    } catch (error) {
        console.error('Error al obtener juegos más jugados:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener juegos'
        });
    }
};

// ============================================
// OBTENER ESTADÍSTICAS GENERALES
// ============================================
/**
 * GET /api/progress/estadisticas/:pacienteId
 */
const obtenerEstadisticas = async (req, res) => {
    try {
        const { pacienteId } = req.params;

        // Verificar paciente
        const paciente = await Patient.findById(pacienteId);
        if (!paciente) {
            return res.status(404).json({
                success: false,
                error: 'Paciente no encontrado'
            });
        }

        // Verificar permisos
        const esTutor = paciente.tutor && 
                        paciente.tutor.toString() === req.user.userId;

        const esCreador = paciente.creadoPor && 
                          paciente.creadoPor.toString() === req.user.userId;

        const esProfesionalAsignado = paciente.profesionalesAsignados && 
                                      paciente.profesionalesAsignados.some(
                                          prof => prof.toString() === req.user.userId
                                      );

        if (!esTutor && !esCreador && !esProfesionalAsignado && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                error: 'No tienes permiso'
            });
        }

        // Obtener estadísticas
        const estadisticas = await Progress.obtenerEstadisticasPaciente(pacienteId);
        const juegosMasJugados = await Progress.obtenerJuegosMasJugados(pacienteId, 3);

        res.json({
            success: true,
            data: {
                generales: estadisticas,
                juegosMasJugados
            }
        });

    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas'
        });
    }
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================
module.exports = {
    guardar,
    obtenerPorPaciente,
    obtenerPorAsignacion,
    obtenerEvolucion,
    obtenerJuegosMasJugados,
    obtenerEstadisticas
};
