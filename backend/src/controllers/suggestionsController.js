/**
 * Controlador de Sugerencias de Juegos
 */

const GameSuggestion = require('../models/GameSuggestion');

/**
 * Crear nueva sugerencia
 */
const crear = async (req, res) => {
  try {
    const { titulo, descripcion, areaTerapeutica, rangoEdadSugerido, objetivos } = req.body;

    const nuevaSugerencia = new GameSuggestion({
      titulo,
      descripcion,
      areaTerapeutica,
      rangoEdadSugerido,
      objetivos,
      profesional: req.user.userId
    });

    await nuevaSugerencia.save();

    res.status(201).json({
      success: true,
      message: 'Sugerencia enviada exitosamente',
      data: nuevaSugerencia
    });

  } catch (error) {
    console.error('Error al crear sugerencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error al enviar la sugerencia'
    });
  }
};

/**
 * Obtener todas las sugerencias (con filtros)
 */
const obtenerTodas = async (req, res) => {
  try {
    const { estado, area, ordenar = 'votos' } = req.query;

    // Construir filtro
    const filtro = {};
    if (estado) filtro.estado = estado;
    if (area) filtro.areaTerapeutica = area;

    // Si no es admin, solo ver pendientes y en_revision
    if (req.user.role !== 'admin') {
      filtro.estado = { $in: ['pendiente', 'en_revision', 'aprobada', 'implementada'] };
    }

    // Ordenamiento
    let sort = {};
    if (ordenar === 'votos') {
      sort = { votos: -1, createdAt: -1 };
    } else if (ordenar === 'recientes') {
      sort = { createdAt: -1 };
    } else if (ordenar === 'antiguos') {
      sort = { createdAt: 1 };
    }

    const sugerencias = await GameSuggestion.find(filtro)
      .sort(sort)
      .populate('profesional', 'nombre especialidad')
      .populate('juegoCreado', 'nombre codigo');

    res.json({
      success: true,
      count: sugerencias.length,
      data: sugerencias
    });

  } catch (error) {
    console.error('Error al obtener sugerencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener sugerencias'
    });
  }
};

/**
 * Obtener sugerencia por ID
 */
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const sugerencia = await GameSuggestion.findById(id)
      .populate('profesional', 'nombre especialidad email')
      .populate('juegoCreado', 'nombre codigo urlJuego');

    if (!sugerencia) {
      return res.status(404).json({
        success: false,
        error: 'Sugerencia no encontrada'
      });
    }

    res.json({
      success: true,
      data: sugerencia
    });

  } catch (error) {
    console.error('Error al obtener sugerencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener sugerencia'
    });
  }
};

/**
 * Obtener mis sugerencias
 */
const obtenerMisSugerencias = async (req, res) => {
  try {
    const sugerencias = await GameSuggestion.find({ profesional: req.user.userId })
      .sort({ createdAt: -1 })
      .populate('juegoCreado', 'nombre codigo');

    res.json({
      success: true,
      count: sugerencias.length,
      data: sugerencias
    });

  } catch (error) {
    console.error('Error al obtener mis sugerencias:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener tus sugerencias'
    });
  }
};

/**
 * Votar por una sugerencia
 */
const votar = async (req, res) => {
  try {
    const { id } = req.params;

    const sugerencia = await GameSuggestion.findById(id);

    if (!sugerencia) {
      return res.status(404).json({
        success: false,
        error: 'Sugerencia no encontrada'
      });
    }

    // Verificar si ya votó
    if (sugerencia.yaVoto(req.user.userId)) {
      return res.status(400).json({
        success: false,
        error: 'Ya votaste por esta sugerencia'
      });
    }

    await sugerencia.agregarVoto(req.user.userId);

    res.json({
      success: true,
      message: 'Voto agregado exitosamente',
      data: {
        votos: sugerencia.votos
      }
    });

  } catch (error) {
    console.error('Error al votar:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al votar'
    });
  }
};

/**
 * Quitar voto
 */
const quitarVoto = async (req, res) => {
  try {
    const { id } = req.params;

    const sugerencia = await GameSuggestion.findById(id);

    if (!sugerencia) {
      return res.status(404).json({
        success: false,
        error: 'Sugerencia no encontrada'
      });
    }

    await sugerencia.quitarVoto(req.user.userId);

    res.json({
      success: true,
      message: 'Voto removido exitosamente',
      data: {
        votos: sugerencia.votos
      }
    });

  } catch (error) {
    console.error('Error al quitar voto:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error al quitar voto'
    });
  }
};

/**
 * Cambiar estado (solo admin)
 */
const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notasAdmin, prioridad } = req.body;

    const sugerencia = await GameSuggestion.findById(id);

    if (!sugerencia) {
      return res.status(404).json({
        success: false,
        error: 'Sugerencia no encontrada'
      });
    }

    await sugerencia.cambiarEstado(estado, notasAdmin);

    if (prioridad) {
      sugerencia.prioridad = prioridad;
      await sugerencia.save();
    }

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: sugerencia
    });

  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cambiar estado'
    });
  }
};

/**
 * Obtener estadísticas (solo admin)
 */
const obtenerEstadisticas = async (req, res) => {
  try {
    const stats = await GameSuggestion.obtenerEstadisticas();

    const masVotadas = await GameSuggestion.obtenerMasVotadas(5);

    res.json({
      success: true,
      data: {
        estadisticas: stats,
        masVotadas
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

/**
 * Eliminar sugerencia (solo el creador o admin)
 */
const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    const sugerencia = await GameSuggestion.findById(id);

    if (!sugerencia) {
      return res.status(404).json({
        success: false,
        error: 'Sugerencia no encontrada'
      });
    }

    // Verificar permisos
    const esCreador = sugerencia.profesional.toString() === req.user.userId;
    const esAdmin = req.user.role === 'admin';

    if (!esCreador && !esAdmin) {
      return res.status(403).json({
        success: false,
        error: 'No tienes permiso para eliminar esta sugerencia'
      });
    }

    await sugerencia.deleteOne();

    res.json({
      success: true,
      message: 'Sugerencia eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar sugerencia:', error);
    res.status(500).json({
      success: false,
      error: 'Error al eliminar sugerencia'
    });
  }
};

module.exports = {
  crear,
  obtenerTodas,
  obtenerPorId,
  obtenerMisSugerencias,
  votar,
  quitarVoto,
  cambiarEstado,
  obtenerEstadisticas,
  eliminar
};
