/**
 * Controlador del Game Builder
 *
 * Permite crear juegos HTML5 completos desde el panel Admin:
 * 1. Genera el data.json con el contenido del juego
 * 2. Genera el index.html
 * 3. Registra el juego en la BD
 *
 * POST /api/game-builder/crear
 */

const fs   = require("fs");
const path = require("path");
const Game = require("../models/Game");

// Ruta base donde viven los juegos (frontend/public/games/html5)
const GAMES_DIR = path.join(__dirname, "..", "..", "..", "frontend", "public", "games", "html5");

// ── Helper: generar slug limpio desde el nombre ──────────────────────────────
const generarSlug = (nombre) =>
  nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // quitar tildes
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

// ── Helper: generar código único ─────────────────────────────────────────────
const generarCodigo = (nombre) =>
  nombre
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 20);

// ── Template index.html ──────────────────────────────────────────────────────
const generarIndexHTML = (titulo) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${titulo}</title>
  <script src="/games/engine.js"></script>
</head>
<body>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      DidactiEngine.init('./data.json');
    });
  </script>
</body>
</html>`;

// ═══════════════════════════════════════════════════════════════════════════
// CREAR JUEGO COMPLETO
// ═══════════════════════════════════════════════════════════════════════════
/**
 * POST /api/game-builder/crear
 * Body: {
 *   // Metadatos del juego (para la BD)
 *   nombre, descripcion, instrucciones,
 *   areaTerapeutica, nivelDificultad,
 *   edadMinima, edadMaxima,
 *   publicado,
 *
 *   // Configuración del engine (para data.json)
 *   mecanica,
 *   rondasTotal, intentosPorRonda,
 *   puntajePorAcierto, puntajeMinimo,
 *   modoRondas,
 *   visual: { fondo, tema },
 *   accesibilidad: { ... },
 *   rondas: [ ... ]
 * }
 */
const crearJuego = async (req, res) => {
  try {
    const {
      nombre, descripcion, instrucciones,
      areaTerapeutica, nivelDificultad,
      edadMinima, edadMaxima, publicado,
      mecanica, rondasTotal, intentosPorRonda,
      puntajePorAcierto, puntajePorAciertoSegundoIntento,
      puntajeMinimo, modoRondas,
      visual, accesibilidad, feedback, rondas,
    } = req.body;

    // ── Validaciones básicas ─────────────────────────────────────────────────
    if (!nombre?.trim()) {
      return res.status(400).json({ success: false, error: "El nombre es obligatorio" });
    }
    if (!mecanica) {
      return res.status(400).json({ success: false, error: "La mecánica es obligatoria" });
    }
    if (!rondas?.length) {
      return res.status(400).json({ success: false, error: "Debes agregar al menos una ronda" });
    }

    const slug   = generarSlug(nombre);
    const codigo = generarCodigo(nombre);
    const urlJuego = `/games/html5/${slug}/index.html`;

    // ── Verificar que el código no exista en la BD ───────────────────────────
    const existe = await Game.findOne({ codigo });
    if (existe) {
      return res.status(400).json({
        success: false,
        error: `Ya existe un juego con el código "${codigo}". Cambia el nombre.`
      });
    }

    // ── Crear directorio del juego ───────────────────────────────────────────
    const dirJuego = path.join(GAMES_DIR, slug);
    if (!fs.existsSync(GAMES_DIR)) {
      fs.mkdirSync(GAMES_DIR, { recursive: true });
    }
    if (fs.existsSync(dirJuego)) {
      return res.status(400).json({
        success: false,
        error: `Ya existe una carpeta para "${slug}". Cambia el nombre del juego.`
      });
    }
    fs.mkdirSync(dirJuego, { recursive: true });

    // ── Construir data.json ──────────────────────────────────────────────────
    const dataJson = {
      titulo:    nombre,
      mecanica,
      version:   "1.0",
      edadMinima:   edadMinima  || 4,
      edadMaxima:   edadMaxima  || 12,
      area:         areaTerapeutica,
      dificultad:   nivelDificultad,
      rondasTotal:  rondasTotal  || 10,
      intentosPorRonda: intentosPorRonda || 2,
      puntajePorAcierto: puntajePorAcierto || 10,
      puntajePorAciertoSegundoIntento: puntajePorAciertoSegundoIntento || 5,
      puntajeMinimo: puntajeMinimo || 60,
      modoRondas:  modoRondas   || "aleatorio",
      visual:      visual       || { fondo: { tipo: "gradiente", desde: "#dbeafe", hasta: "#ede9fe" } },
      accesibilidad: accesibilidad || {
        audioAlMostrarItems: false,
        audioAlTocarItem:    true,
        repetirInstruccion:  true,
        textoVisible:        true,
        fallbackAudio:       "sintetizar",
        idiomaVoz:           "es-CL"
      },
      feedback: feedback || {
        correcto: [
          { texto: "¡Muy bien! 🎉", audio: null },
          { texto: "¡Excelente! ⭐", audio: null }
        ],
        error: [
          { texto: "¡Inténtalo de nuevo! 🤔", audio: null },
          { texto: "¡Casi! 👀", audio: null }
        ]
      },
      rondas,
    };

    // ── Escribir archivos ────────────────────────────────────────────────────
    fs.writeFileSync(
      path.join(dirJuego, "data.json"),
      JSON.stringify(dataJson, null, 2),
      "utf8"
    );
    fs.writeFileSync(
      path.join(dirJuego, "index.html"),
      generarIndexHTML(nombre),
      "utf8"
    );

    // ── Registrar en BD ──────────────────────────────────────────────────────
    const nuevoJuego = new Game({
      nombre,
      descripcion:   descripcion   || "",
      instrucciones: instrucciones || "",
      codigo,
      areaTerapeutica,
      nivelDificultad,
      rangoEdad: { min: edadMinima || 4, max: edadMaxima || 12 },
      duracionEstimada: Math.ceil((rondasTotal || 10) * 1.5),
      numeroRondas:  rondasTotal || 10,
      puntuacionMaxima:   (rondasTotal || 10) * (puntajePorAcierto || 10),
      porcentajeAprobacion: puntajeMinimo || 60,
      urlJuego,
      publicado:  publicado || false,
      creadoPor:  req.user.userId,
    });

    await nuevoJuego.save();

    res.status(201).json({
      success: true,
      message: `Juego "${nombre}" creado correctamente`,
      data: {
        juego:   nuevoJuego.getDatosCompletos(),
        urlJuego,
        slug,
      }
    });

  } catch (error) {
    console.error("Error en Game Builder:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ success: false, error: messages.join(", ") });
    }
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: "El código del juego ya existe" });
    }

    res.status(500).json({ success: false, error: "Error al crear el juego" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// ACTUALIZAR data.json de un juego existente
// ─────────────────────────────────────────────────────────────────────────────
/**
 * PUT /api/game-builder/:id
 * Actualiza el data.json sin tocar la entrada en BD (excepto metadatos básicos)
 */
const actualizarJuego = async (req, res) => {
  try {
    const { id } = req.params;
    const juego = await Game.findById(id);
    if (!juego) return res.status(404).json({ success: false, error: "Juego no encontrado" });

    const slug    = generarSlug(juego.nombre);
    const dirJuego = path.join(GAMES_DIR, slug);

    // Actualizar data.json si existe la carpeta
    if (fs.existsSync(dirJuego)) {
      const dataActual = JSON.parse(fs.readFileSync(path.join(dirJuego, "data.json"), "utf8"));
      const dataNueva  = { ...dataActual, ...req.body.dataJson };
      fs.writeFileSync(path.join(dirJuego, "data.json"), JSON.stringify(dataNueva, null, 2), "utf8");
    }

    // Actualizar metadatos en BD si vienen
    if (req.body.meta) {
      const { descripcion, instrucciones, publicado, nivelDificultad } = req.body.meta;
      if (descripcion   !== undefined) juego.descripcion   = descripcion;
      if (instrucciones !== undefined) juego.instrucciones = instrucciones;
      if (publicado     !== undefined) juego.publicado     = publicado;
      if (nivelDificultad !== undefined) juego.nivelDificultad = nivelDificultad;
      await juego.save();
    }

    res.json({ success: true, message: "Juego actualizado correctamente", data: juego.getDatosCompletos() });
  } catch (error) {
    console.error("Error al actualizar juego:", error);
    res.status(500).json({ success: false, error: "Error al actualizar el juego" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PREVISUALIZAR data.json (sin guardar)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * POST /api/game-builder/preview
 * Devuelve el data.json que se generaría, sin crear archivos ni registro en BD
 */
const previsualizar = (req, res) => {
  const { nombre, mecanica, rondas, ...resto } = req.body;
  res.json({
    success: true,
    data: { titulo: nombre, mecanica, rondas, ...resto }
  });
};

module.exports = { crearJuego, actualizarJuego, previsualizar };
