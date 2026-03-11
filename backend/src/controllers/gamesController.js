/**
 * Controlador de Juegos
 *
 * Maneja operaciones CRUD de juegos educativos.
 */

const Game = require("../models/Game");

// ============================================
// CREAR JUEGO
// ============================================
/**
 * POST /api/games
 * Body: { nombre, descripcion, codigo, areaTerapeutica, nivelDificultad, rangoEdad, ... }
 */
const crear = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      instrucciones,
      codigo,
      areaTerapeutica,
      nivelDificultad,
      rangoEdad,
      objetivos,
      palabrasClave,
      duracionEstimada,
      numeroRondas,
      puntuacionMaxima,
      porcentajeAprobacion,
      thumbnail,
      urlJuego,
      publicado,
    } = req.body;

    // Solo profesionales y admin pueden crear juegos
    if (req.user.role !== "profesional" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Solo profesionales y administradores pueden crear juegos",
      });
    }

    // Verificar si el código ya existe
    const juegoExiste = await Game.findOne({ codigo: codigo.toUpperCase() });
    if (juegoExiste) {
      return res.status(400).json({
        success: false,
        error: "Ya existe un juego con ese código",
      });
    }

    // Crear juego
    const nuevoJuego = new Game({
      nombre,
      descripcion,
      instrucciones,
      codigo: codigo.toUpperCase(),
      areaTerapeutica,
      nivelDificultad,
      rangoEdad,
      objetivos,
      palabrasClave,
      duracionEstimada,
      numeroRondas,
      puntuacionMaxima,
      porcentajeAprobacion,
      thumbnail,
      urlJuego,
      publicado: publicado || false,
      creadoPor: req.user.userId,
    });

    await nuevoJuego.save();

    res.status(201).json({
      success: true,
      message: "Juego creado exitosamente",
      data: nuevoJuego.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al crear juego:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "El código del juego ya existe",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al crear juego",
    });
  }
};

// ============================================
// OBTENER TODOS LOS JUEGOS
// ============================================
/**
 * GET /api/games
 * Query params: ?area=fonologia&nivel=basico&publicado=true
 */
const obtenerTodos = async (req, res) => {
  try {
    const { area, nivel, publicado } = req.query;

    // Construir filtro
    let filtro = { activo: true };

    if (area) {
      filtro.areaTerapeutica = area;
    }

    if (nivel) {
      filtro.nivelDificultad = nivel;
    }

    // Solo mostrar publicados a tutores
    if (req.user.role === "tutor" || publicado === "true") {
      filtro.publicado = true;
    }

    const juegos = await Game.find(filtro)
      .populate("creadoPor", "nombre email")
      .sort({ nombre: 1 });

    res.json({
      success: true,
      count: juegos.length,
      data: juegos.map((j) => j.getDatosCompletos()),
    });
  } catch (error) {
    console.error("Error al obtener juegos:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener juegos",
    });
  }
};

// ============================================
// OBTENER JUEGO POR ID
// ============================================
/**
 * GET /api/games/:id
 */
const obtenerPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const juego = await Game.findById(id).populate("creadoPor", "nombre email");

    if (!juego) {
      return res.status(404).json({
        success: false,
        error: "Juego no encontrado",
      });
    }

    // Tutores solo pueden ver juegos publicados
    if (req.user.role === "tutor" && !juego.publicado) {
      return res.status(403).json({
        success: false,
        error: "Este juego no está disponible",
      });
    }

    res.json({
      success: true,
      data: juego.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al obtener juego:", error);

    if (error.kind === "ObjectId") {
      return res.status(400).json({
        success: false,
        error: "ID inválido",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al obtener juego",
    });
  }
};

// ============================================
// OBTENER JUEGO POR CÓDIGO
// ============================================
/**
 * GET /api/games/codigo/:codigo
 */
const obtenerPorCodigo = async (req, res) => {
  try {
    const { codigo } = req.params;

    const juego = await Game.buscarPorCodigo(codigo);

    if (!juego) {
      return res.status(404).json({
        success: false,
        error: "Juego no encontrado",
      });
    }

    res.json({
      success: true,
      data: juego.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al obtener juego por código:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener juego",
    });
  }
};

// ============================================
// ACTUALIZAR JUEGO
// ============================================
/**
 * PUT /api/games/:id
 */
const actualizar = async (req, res) => {
  try {
    const { id } = req.params;

    // Solo profesionales y admin pueden actualizar
    if (req.user.role !== "profesional" && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para actualizar juegos",
      });
    }

    const juego = await Game.findById(id);

    if (!juego) {
      return res.status(404).json({
        success: false,
        error: "Juego no encontrado",
      });
    }

    // Profesionales solo pueden actualizar sus propios juegos (admin puede todo)
    if (
      req.user.role === "profesional" &&
      juego.creadoPor &&
      juego.creadoPor.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        error: "No tienes permiso para actualizar este juego",
      });
    }

    // Campos actualizables
    const camposPermitidos = [
      "nombre",
      "descripcion",
      "instrucciones",
      "areaTerapeutica",
      "nivelDificultad",
      "rangoEdad",
      "objetivos",
      "palabrasClave",
      "duracionEstimada",
      "numeroRondas",
      "puntuacionMaxima",
      "porcentajeAprobacion",
      "thumbnail",
      "urlJuego",
      "publicado",
      "activo",
    ];

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        juego[campo] = req.body[campo];
      }
    });

    await juego.save();

    res.json({
      success: true,
      message: "Juego actualizado exitosamente",
      data: juego.getDatosCompletos(),
    });
  } catch (error) {
    console.error("Error al actualizar juego:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al actualizar juego",
    });
  }
};

// ============================================
// ELIMINAR JUEGO (Desactivar)
// ============================================
/**
 * DELETE /api/games/:id
 */
const eliminar = async (req, res) => {
  try {
    const { id } = req.params;

    // Solo admin puede eliminar
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Solo administradores pueden eliminar juegos",
      });
    }

    const juego = await Game.findById(id);

    if (!juego) {
      return res.status(404).json({
        success: false,
        error: "Juego no encontrado",
      });
    }

    // Soft delete
    juego.activo = false;
    await juego.save();

    res.json({
      success: true,
      message: "Juego desactivado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar juego:", error);
    res.status(500).json({
      success: false,
      error: "Error al eliminar juego",
    });
  }
};

// ============================================
// BUSCAR JUEGOS POR ÁREA
// ============================================
/**
 * GET /api/games/area/:area
 */
const buscarPorArea = async (req, res) => {
  try {
    const { area } = req.params;

    const juegos = await Game.buscarPorArea(area);

    res.json({
      success: true,
      count: juegos.length,
      data: juegos.map((j) => j.getDatosCompletos()),
    });
  } catch (error) {
    console.error("Error al buscar juegos por área:", error);
    res.status(500).json({
      success: false,
      error: "Error al buscar juegos",
    });
  }
};

// ============================================
// BUSCAR JUEGOS POR EDAD
// ============================================
/**
 * GET /api/games/edad/:edad
 */
const buscarPorEdad = async (req, res) => {
  try {
    const { edad } = req.params;
    const edadNum = parseInt(edad);

    if (isNaN(edadNum) || edadNum < 2 || edadNum > 18) {
      return res.status(400).json({
        success: false,
        error: "Edad inválida (debe estar entre 2 y 18)",
      });
    }

    const juegos = await Game.buscarPorEdad(edadNum);

    res.json({
      success: true,
      count: juegos.length,
      data: juegos.map((j) => j.getDatosCompletos()),
    });
  } catch (error) {
    console.error("Error al buscar juegos por edad:", error);
    res.status(500).json({
      success: false,
      error: "Error al buscar juegos",
    });
  }
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================
module.exports = {
  crear,
  obtenerTodos,
  obtenerPorId,
  obtenerPorCodigo,
  actualizar,
  eliminar,
  buscarPorArea,
  buscarPorEdad,
};
