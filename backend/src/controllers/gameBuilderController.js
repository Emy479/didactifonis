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

const fs     = require("fs");
const path   = require("path");
const multer = require("multer");
const Game   = require("../models/Game");

// Ruta base donde viven los juegos (frontend/public/games/html5)
const GAMES_DIR   = path.join(__dirname, "..", "..", "..", "frontend", "public", "games", "html5");
// Ruta base de assets estáticos
const ASSETS_DIR  = path.join(__dirname, "..", "..", "..", "frontend", "public", "games", "assets");

// ── Categorías y tipos de asset permitidos ───────────────────────────────────
const CATEGORIAS_IMAGEN = ["animales", "frutas", "transporte", "ropa", "hogar", "emociones", "fondos", "palabras", "colores", "numeros", "otros"];
const CATEGORIAS_AUDIO  = ["palabras", "fonemas", "silabas", "instrucciones", "feedback"];
const MIME_IMAGEN = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"];
const MIME_AUDIO  = ["audio/mpeg", "audio/mp3", "audio/ogg", "audio/wav", "audio/webm"];
const MAX_SIZE    = 5 * 1024 * 1024; // 5 MB

// ── Storage dinámico con multer ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const { tipo, categoria } = req.query;
    const subcarpeta = tipo === "audio" ? "audios" : "imagenes";
    const cat = (CATEGORIAS_IMAGEN.includes(categoria) || CATEGORIAS_AUDIO.includes(categoria))
      ? categoria
      : "otros";
    const destino = path.join(ASSETS_DIR, subcarpeta, cat);
    fs.mkdirSync(destino, { recursive: true });
    cb(null, destino);
  },
  filename(_req, file, cb) {
    // Nombre limpio: sin tildes, solo alfanumérico + guiones
    const base = path.parse(file.originalname).name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60);
    const ext  = path.extname(file.originalname).toLowerCase();
    const unico = `${base}-${Date.now()}${ext}`;
    cb(null, unico);
  }
});

const fileFilter = (req, file, cb) => {
  const { tipo } = req.query;
  const permitidos = tipo === "audio" ? MIME_AUDIO : MIME_IMAGEN;
  if (permitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });

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

const generarIndexHTMLArcade = (titulo) => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>${titulo}</title>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.60.0/dist/phaser.min.js"></script>
  <script src="/games/engine-arcade.js"></script>
</head>
<body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
  <div id="dg-arcade"></div>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      DidactiArcade.init('./data.json');
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
      tipo = "html5",
      nombre, descripcion, instrucciones,
      areaTerapeutica, nivelDificultad,
      edadMinima, edadMaxima, publicado,
      // HTML5
      mecanica, rondasTotal, intentosPorRonda,
      puntajePorAcierto, puntajePorAciertoSegundoIntento,
      puntajeMinimo, modoRondas,
      visual, accesibilidad, feedback, rondas,
      // Arcade
      submecanica, instruccion,
      duracion, vidas, puntajePorError, powerUpInterval,
      musica, personaje, palabras, plataformas, tema, objetos,
      thumbnail,
    } = req.body;

    // ── Validaciones ─────────────────────────────────────────────────────────
    if (!nombre?.trim()) {
      return res.status(400).json({ success: false, error: "El nombre es obligatorio" });
    }
    if (tipo === "arcade") {
      if (!submecanica) {
        return res.status(400).json({ success: false, error: "La submecánica arcade es obligatoria" });
      }
      if (!palabras?.correctas?.length) {
        return res.status(400).json({ success: false, error: "Agrega al menos una palabra correcta" });
      }
    } else {
      if (!mecanica) {
        return res.status(400).json({ success: false, error: "La mecánica es obligatoria" });
      }
      if (!rondas?.length) {
        return res.status(400).json({ success: false, error: "Debes agregar al menos una ronda" });
      }
    }

    const slug     = generarSlug(nombre);
    const codigo   = generarCodigo(nombre);
    const urlJuego = `/games/html5/${slug}/index.html`;

    // ── Verificar que el código no exista en la BD ───────────────────────────
    const existe = await Game.findOne({ codigo });
    if (existe) {
      return res.status(400).json({
        success: false,
        error: `Ya existe un juego con el código "${codigo}". Cambia el nombre.`
      });
    }

    // ── Verificar carpeta: si existe sin entrada en BD es un juego huérfano ──
    // (puede ocurrir si un save() anterior falló tras crear los archivos)
    // En ese caso se reutiliza la carpeta en lugar de rechazar la operación.
    const dirJuego = path.join(GAMES_DIR, slug);
    if (!fs.existsSync(GAMES_DIR)) fs.mkdirSync(GAMES_DIR, { recursive: true });
    const carpetaExiste = fs.existsSync(dirJuego);

    // ── Construir data.json e index.html según tipo ──────────────────────────
    let dataJson, indexHtml;

    if (tipo === "arcade") {
      dataJson = {
        titulo:    nombre,
        instruccion: instruccion || "",
        area:      areaTerapeutica,
        dificultad: nivelDificultad,
        edadMinima: edadMinima  || 4,
        edadMaxima: edadMaxima  || 10,
        submecanica,
        duracion:  duracion     || 60,
        vidas:     vidas        || 3,
        puntajePorAcierto: puntajePorAcierto || 10,
        puntajePorError:   puntajePorError   || 5,
        puntajeMinimo:     puntajeMinimo     || 60,
        musica:    musica       || null,
        powerUpInterval: powerUpInterval || 14,
        personaje: personaje || {
          velocidad: 290,
          spritesheet: null,
          frameWidth: 48,
          frameHeight: 48,
          animaciones: {
            idle: { start: 0, end: 3, frameRate: 8 },
            walk: { start: 4, end: 7, frameRate: 12 },
            jump: { start: 8, end: 9, frameRate: 8 },
          },
        },
        palabras: palabras || {
          correctas: [],
          incorrectas: [],
          velocidadMin: 75,
          velocidadMax: 145,
          spawnRate: 1800,
        },
        plataformas: plataformas || null,
        tema:        tema        || 'espacial',
        objetos:     objetos     || [],
      };
      indexHtml = generarIndexHTMLArcade(nombre);
    } else {
      dataJson = {
        titulo:    nombre,
        mecanica,
        version:   "1.0",
        edadMinima: edadMinima  || 4,
        edadMaxima: edadMaxima  || 12,
        area:      areaTerapeutica,
        dificultad: nivelDificultad,
        rondasTotal: rondasTotal || 10,
        intentosPorRonda: intentosPorRonda || 2,
        puntajePorAcierto: puntajePorAcierto || 10,
        puntajePorAciertoSegundoIntento: puntajePorAciertoSegundoIntento || 5,
        puntajeMinimo: puntajeMinimo || 60,
        modoRondas: modoRondas || "aleatorio",
        visual: visual || { fondo: { tipo: "gradiente", desde: "#dbeafe", hasta: "#ede9fe" } },
        accesibilidad: accesibilidad || {
          audioAlMostrarItems: false,
          audioAlTocarItem:    true,
          repetirInstruccion:  true,
          textoVisible:        true,
          fallbackAudio:       "sintetizar",
          idiomaVoz:           "es-CL",
        },
        feedback: feedback || {
          correcto: [
            { texto: "¡Muy bien! 🎉", audio: null },
            { texto: "¡Excelente! ⭐", audio: null },
          ],
          error: [
            { texto: "¡Inténtalo de nuevo! 🤔", audio: null },
            { texto: "¡Casi! 👀", audio: null },
          ],
        },
        rondas,
      };
      indexHtml = generarIndexHTML(nombre);
    }

    // ── Registrar en BD PRIMERO (si falla la validación, no se crean archivos) ─
    const nuevoJuego = new Game({
      nombre,
      descripcion:   descripcion   || "",
      instrucciones: tipo === "arcade" ? (instruccion || "") : (instrucciones || ""),
      codigo,
      areaTerapeutica,
      nivelDificultad,
      rangoEdad: { min: edadMinima || 4, max: edadMaxima || 12 },
      duracionEstimada: tipo === "arcade"
        ? Math.max(1, Math.ceil((duracion || 60) / 60))
        : Math.ceil((rondasTotal || 10) * 1.5),
      numeroRondas:  tipo === "arcade" ? 0 : (rondasTotal || 10),
      puntuacionMaxima: tipo === "arcade" ? 999 : (rondasTotal || 10) * (puntajePorAcierto || 10),
      porcentajeAprobacion: puntajeMinimo || 60,
      thumbnail:  thumbnail || "default-game.png",
      urlJuego,
      publicado:  publicado || false,
      creadoPor:  req.user.userId,
    });

    await nuevoJuego.save();

    // ── Escribir archivos (rollback BD si falla) ─────────────────────────────
    try {
      if (!carpetaExiste) fs.mkdirSync(dirJuego, { recursive: true });
      fs.writeFileSync(path.join(dirJuego, "data.json"), JSON.stringify(dataJson, null, 2), "utf8");
      fs.writeFileSync(path.join(dirJuego, "index.html"), indexHtml, "utf8");
    } catch (fileError) {
      await Game.deleteOne({ _id: nuevoJuego._id });
      throw fileError;
    }

    res.status(201).json({
      success: true,
      message: `Juego "${nombre}" creado correctamente`,
      data: { juego: nuevoJuego.getDatosCompletos(), urlJuego, slug },
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

// ─────────────────────────────────────────────────────────────────────────────
// SUBIR ASSET (imagen o audio)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * POST /api/game-builder/upload-asset?tipo=imagen&categoria=animales
 * Body: multipart/form-data con campo "archivo"
 * Devuelve la URL pública del archivo subido.
 */
const subirAssetMiddleware = upload.single("archivo");

const subirAsset = (req, res) => {
  subirAssetMiddleware(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ success: false, error: "El archivo supera el máximo de 5 MB" });
      }
      return res.status(400).json({ success: false, error: err.message || "Error al subir el archivo" });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: "No se recibió ningún archivo" });
    }

    const { tipo, categoria } = req.query;
    const subcarpeta = tipo === "audio" ? "audios" : "imagenes";
    const cat = (CATEGORIAS_IMAGEN.includes(categoria) || CATEGORIAS_AUDIO.includes(categoria))
      ? categoria
      : "otros";

    const urlPublica = `/games/assets/${subcarpeta}/${cat}/${req.file.filename}`;

    res.json({
      success: true,
      message: "Archivo subido correctamente",
      data: {
        url: urlPublica,
        filename: req.file.filename,
        size: req.file.size,
        tipo,
        categoria: cat,
      }
    });
  });
};

// ═══════════════════════════════════════════════════════════════════════════
// LISTAR ASSETS DEL FILESYSTEM
// ═══════════════════════════════════════════════════════════════════════════
/**
 * GET /api/game-builder/assets
 * Devuelve todas las imágenes y audios subidos, agrupados por categoría.
 */
exports.listarAssets = async (req, res) => {
  try {
    const resultado = { imagenes: {}, audios: {} };

    for (const cat of CATEGORIAS_IMAGEN) {
      const dir = path.join(ASSETS_DIR, "imagenes", cat);
      if (fs.existsSync(dir)) {
        resultado.imagenes[cat] = fs.readdirSync(dir)
          .filter(f => /\.(png|jpe?g|gif|webp|svg)$/i.test(f))
          .map(f => ({
            nombre: f.replace(/-\d{13}(\.[^.]+)$/, "$1").replace(/\.[^.]+$/, ""),
            url: `/games/assets/imagenes/${cat}/${f}`,
          }));
      } else {
        resultado.imagenes[cat] = [];
      }
    }

    for (const cat of CATEGORIAS_AUDIO) {
      const dir = path.join(ASSETS_DIR, "audios", cat);
      if (fs.existsSync(dir)) {
        resultado.audios[cat] = fs.readdirSync(dir)
          .filter(f => /\.(mp3|ogg|wav|webm)$/i.test(f))
          .map(f => ({
            nombre: f.replace(/-\d{13}(\.[^.]+)$/, "$1").replace(/\.[^.]+$/, ""),
            url: `/games/assets/audios/${cat}/${f}`,
          }));
      } else {
        resultado.audios[cat] = [];
      }
    }

    res.json(resultado);
  } catch (err) {
    console.error("listarAssets:", err);
    res.status(500).json({ error: "Error al listar assets" });
  }
};

module.exports = { crearJuego, actualizarJuego, previsualizar, subirAsset, listarAssets: exports.listarAssets };
