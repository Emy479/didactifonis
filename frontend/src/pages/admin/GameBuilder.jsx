/**
 * Game Builder — Panel Admin
 * Crear juegos HTML5 para Didactifonis sin escribir código.
 *
 * Flujo:
 *   Paso 1 → Elegir mecánica
 *   Paso 2 → Configurar metadatos y visual
 *   Paso 3 → Agregar rondas (formulario por mecánica)
 *   Paso 4 → Revisar y publicar
 */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import SceneEditor from "../../components/games/SceneEditor";
import { crearJuegoBuilder, subirAsset } from "../../api/gameBuilder";
import {
  ArrowLeft, ArrowRight, Gamepad2, Check,
  Plus, Trash2, ChevronDown, ChevronUp, Upload, Volume2,
} from "lucide-react";

// ── Constantes ────────────────────────────────────────────────────────────────
const MECANICAS = [
  {
    id: "seleccion_intruso",
    nombre: "Busca al Intruso",
    descripcion: "El jugador identifica qué elemento no pertenece al grupo.",
    emoji: "🔍",
    ejemplos: "Categorías semánticas, clasificación",
  },
  {
    id: "seleccion_multiple",
    nombre: "Selección Múltiple",
    descripcion: "El jugador elige la respuesta correcta entre varias opciones.",
    emoji: "☑️",
    ejemplos: "Discriminación auditiva, vocabulario",
  },
  {
    id: "ordenar_elementos",
    nombre: "Ordenar Elementos",
    descripcion: "El jugador arrastra fichas para formar una secuencia correcta.",
    emoji: "🔢",
    ejemplos: "Sílabas, palabras, secuencias",
  },
  {
    id: "seleccion_secuencial",
    nombre: "Pasos Secuenciales",
    descripcion: "El jugador responde 2 preguntas en secuencia para completar una ronda.",
    emoji: "👣",
    ejemplos: "Emociones y frases, causa y efecto",
  },
  {
    id: "tipeo",
    nombre: "Tipeo",
    descripcion: "Se muestra una imagen o emoji y el jugador debe escribir la palabra correcta.",
    emoji: "⌨️",
    ejemplos: "Vocabulario, escritura, fonología",
  },
  {
    id: "memoria",
    nombre: "Memoria",
    descripcion: "El jugador voltea cartas de a dos para encontrar todos los pares iguales.",
    emoji: "🃏",
    ejemplos: "Vocabulario, categorías, asociaciones",
  },
  {
    id: "emparejar",
    nombre: "Emparejar",
    descripcion: "El jugador une elementos de la columna izquierda con su par en la derecha.",
    emoji: "🔗",
    ejemplos: "Animal-sonido, imagen-palabra, causa-efecto",
  },
  {
    id: "constructor_historias",
    nombre: "Constructor de Historias",
    descripcion: "El jugador ordena imágenes en secuencia narrativa y luego construye oraciones para cada momento.",
    emoji: "📖",
    ejemplos: "Morfosintaxis, secuencias narrativas, producción de oraciones",
  },
];

const AREAS = [
  { value: "fonologia",     label: "Fonología" },
  { value: "semantica",     label: "Semántica" },
  { value: "morfosintaxis", label: "Morfosintaxis" },
  { value: "pragmatica",    label: "Pragmática" },
  { value: "habla",         label: "Habla" },
  { value: "lenguaje",      label: "Lenguaje" },
];

const NIVELES = [
  { value: "basico",       label: "Básico" },
  { value: "intermedio",   label: "Intermedio" },
  { value: "avanzado",     label: "Avanzado" },
];

const TEMAS = [
  { value: "default",    label: "Azul/Lila (default)", desde: "#dbeafe", hasta: "#ede9fe" },
  { value: "naturaleza", label: "Naturaleza (verde)",  desde: "#d1fae5", hasta: "#a7f3d0" },
  { value: "oceano",     label: "Océano (turquesa)",   desde: "#cffafe", hasta: "#a5f3fc" },
  { value: "fiesta",     label: "Fiesta (amarillo)",   desde: "#fef9c3", hasta: "#fde68a" },
  { value: "espacial",   label: "Espacial (morado)",   desde: "#ede9fe", hasta: "#ddd6fe" },
  { value: "noche",      label: "Noche (oscuro)",      desde: "#1e1b4b", hasta: "#312e81" },
];

const SUBMECANICAS_ARCADE = [
  {
    id: "nave_cazadora",
    nombre: "Nave Cazadora",
    descripcion: "La nave se mueve con el ratón/dedo. Captura palabras correctas, evita las incorrectas.",
    emoji: "🚀",
  },
  {
    id: "plataformero",
    nombre: "Plataformero",
    descripcion: "El personaje salta entre plataformas para tocar palabras correctas.",
    emoji: "🏃",
  },
];

// Mismo layout que en engine-arcade.js
const PLATAFORMAS_DEFECTO = [
  { x: 0.50, y: 0.83, w: 0.88 },
  { x: 0.22, y: 0.66, w: 0.36 },
  { x: 0.76, y: 0.56, w: 0.34 },
  { x: 0.50, y: 0.45, w: 0.40 },
  { x: 0.18, y: 0.33, w: 0.28 },
  { x: 0.80, y: 0.22, w: 0.28 },
];

// Temas visuales arcade — reflejan TEMAS_ARCADE del engine
const TEMAS_ARCADE_UI = [
  { value: "espacial", label: "Espacial",  gradiente: "linear-gradient(135deg,#030712,#0f0720)", desc: "Fondo oscuro, plataformas azul/violeta" },
  { value: "bosque",   label: "Bosque",    gradiente: "linear-gradient(135deg,#052e16,#166534)", desc: "Fondo verde oscuro, plataformas esmeralda" },
  { value: "ciudad",   label: "Ciudad",    gradiente: "linear-gradient(135deg,#0f172a,#334155)", desc: "Fondo noche urbana, plataformas gris pizarra" },
  { value: "oceano",   label: "Océano",    gradiente: "linear-gradient(135deg,#0c4a6e,#0369a1)", desc: "Fondo azul profundo, plataformas celeste" },
  { value: "fiesta",   label: "Fiesta",    gradiente: "linear-gradient(135deg,#1a1a2e,#7c3aed)", desc: "Fondo oscuro, plataformas multicolor" },
];

const PLATAFORMAS_DEFECTO_LANDSCAPE = [
  { x: 0.50, y: 0.88, w: 0.96 },
  { x: 0.16, y: 0.64, w: 0.24 },
  { x: 0.50, y: 0.58, w: 0.26 },
  { x: 0.84, y: 0.64, w: 0.24 },
  { x: 0.28, y: 0.34, w: 0.22 },
  { x: 0.72, y: 0.34, w: 0.22 },
];

// ── Item vacío por mecánica ───────────────────────────────────────────────────
const itemVacio = () => ({
  id: `item_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
  emoji: "",
  imagen: "",
  texto: "",
  audioNombre: null,
  esIntruso: false,
  correcta: false,
});

const opcionVacia = () => ({
  id: `op_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
  emoji: "",
  imagen: "",
  texto: "",
  audioNombre: null,
  correcta: false,
});

const elementoVacio = (pos) => ({
  id: `el_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
  texto: "",
  audio: null,
  posicionCorrecta: pos,
});

const parMemoriaVacio = () => ({
  id: `par_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
  emoji: "",
  texto: "",
  imagen: "",
  audioNombre: null,
});

const oracionVacia = (correcta = false) => ({
  id: `or_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
  texto: "",
  correcta,
});

const imagenHistoriaVacia = (pos) => ({
  id: `img_${Date.now()}_${Math.random().toString(36).slice(2,6)}_${pos}`,
  imagen: "",
  posicionCorrecta: pos,
  oraciones: [
    oracionVacia(true),
    oracionVacia(false),
    oracionVacia(false),
  ],
});

const parEmparejarVacio = () => ({
  izquierda: {
    id: `izq_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    emoji: "",
    texto: "",
    imagen: "",
    audio: null,
  },
  derecha: {
    id: `der_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    texto: "",
    imagen: "",
    audio: null,
  },
});

// ── Ronda vacía por mecánica ──────────────────────────────────────────────────
const rondaVaciaPorMecanica = (mecanica) => {
  if (mecanica === "seleccion_intruso") {
    return {
      textoInstruccion: "",
      audioInstruccion: null,
      items: [itemVacio(), itemVacio(), itemVacio(), itemVacio(), { ...itemVacio(), esIntruso: true }],
    };
  }
  if (mecanica === "seleccion_multiple") {
    return {
      pregunta: "",
      audioPregunta: null,
      opciones: [
        { ...opcionVacia(), correcta: true },
        opcionVacia(),
        opcionVacia(),
        opcionVacia(),
      ],
    };
  }
  if (mecanica === "ordenar_elementos") {
    return {
      textoInstruccion: "",
      imagenApoyo: "",
      audioObjetivo: null,
      textoObjetivo: "",
      elementos: [elementoVacio(1), elementoVacio(2), elementoVacio(3)],
    };
  }
  if (mecanica === "seleccion_secuencial") {
    return {
      imagen: "",
      pasos: [
        {
          pregunta: "",
          audioPregunta: null,
          opciones: [
            { ...opcionVacia(), correcta: true, emoji: "" },
            { ...opcionVacia(), emoji: "" },
            { ...opcionVacia(), emoji: "" },
          ],
        },
        {
          pregunta: "",
          audioPregunta: null,
          opciones: [
            { ...opcionVacia(), correcta: true, emoji: "" },
            { ...opcionVacia(), emoji: "" },
            { ...opcionVacia(), emoji: "" },
          ],
        },
      ],
    };
  }
  if (mecanica === "tipeo") {
    return {
      textoInstruccion: "¿Cómo se llama esto?",
      audioInstruccion: null,
      emoji: "",
      imagen: "",
      audioPrompt: null,
      textoRespuesta: "",
      pistas: [],
    };
  }
  if (mecanica === "memoria") {
    return {
      textoInstruccion: "Encontrá los pares iguales",
      audioInstruccion: null,
      pares: [parMemoriaVacio(), parMemoriaVacio(), parMemoriaVacio(), parMemoriaVacio()],
    };
  }
  if (mecanica === "emparejar") {
    return {
      textoInstruccion: "Uní cada elemento con su par",
      audioInstruccion: null,
      pares: [parEmparejarVacio(), parEmparejarVacio(), parEmparejarVacio()],
    };
  }
  if (mecanica === "constructor_historias") {
    return {
      textoInstruccion: "Ordena las imágenes y elige la oración que describe cada momento",
      audioInstruccion: null,
      audioHistoria: null,
      imagenes: [imagenHistoriaVacia(1), imagenHistoriaVacia(2), imagenHistoriaVacia(3)],
    };
  }
  return {};
};

// ── Categorías de assets ──────────────────────────────────────────────────────
const CATS_IMAGEN = ["animales","frutas","transporte","ropa","hogar","emociones","fondos","palabras","colores","numeros","otros"];
const CATS_AUDIO  = ["palabras","fonemas","silabas","instrucciones","otros"];

// ── Editor visual de plataformas + Layer 2 ────────────────────────────────────
const PLAT_H_PX = 14;
// Dimensiones del canvas de preview según orientación
const PREVIEW_PORTRAIT  = { w: 280, h: 448 }; // proporcional a 400×640
const PREVIEW_LANDSCAPE = { w: 448, h: 280 }; // proporcional a 640×400

const PALETA_OBJETOS = [
  { emoji: "🍎", label: "manzana",   tipo: "positivo", valor: 5 },
  { emoji: "🍊", label: "naranja",   tipo: "positivo", valor: 5 },
  { emoji: "🍋", label: "limón",     tipo: "positivo", valor: 5 },
  { emoji: "🍇", label: "uvas",      tipo: "positivo", valor: 5 },
  { emoji: "🍓", label: "fresa",     tipo: "positivo", valor: 5 },
  { emoji: "🫐", label: "arándano",  tipo: "positivo", valor: 5 },
  { emoji: "⭐", label: "estrella",  tipo: "positivo", valor: 8 },
  { emoji: "💎", label: "gema",      tipo: "positivo", valor: 10 },
  { emoji: "🏅", label: "medalla",   tipo: "positivo", valor: 8 },
  { emoji: "🌟", label: "brillante", tipo: "positivo", valor: 8 },
  { emoji: "💣", label: "bomba",     tipo: "negativo", valor: 1 },
  { emoji: "⚡", label: "rayo",      tipo: "negativo", valor: 1 },
  { emoji: "☠️", label: "peligro",   tipo: "negativo", valor: 1 },
  { emoji: "🔥", label: "fuego",     tipo: "negativo", valor: 1 },
  { emoji: "🕸️", label: "trampa",    tipo: "negativo", valor: 1 },
  { emoji: "👻", label: "fantasma",  tipo: "negativo", valor: 1 },
];

const EditorPlataformas = ({ plataformas, onChange, objetos = [], onChangeObjetos }) => {
  const [vista,        setVista]        = useState("portrait");
  const [selIdx,       setSelIdx]       = useState(null);
  const [modoEdicion,  setModoEdicion]  = useState("plataformas"); // "plataformas" | "objetos"
  const [objetoPaleta, setObjetoPaleta] = useState(null);
  const [uploadingObj, setUploadingObj] = useState(false);
  const dragRef  = useRef(null); // { idx, tipo, startX, startY, startPlat, moved }
  const clickRef = useRef(null); // { startX, startY, canvasX, canvasY }
  const canvasRef = useRef(null);

  const handleSubirImagenObjeto = async (file, tipo) => {
    if (!file) return;
    setUploadingObj(true);
    try {
      const res = await subirAsset(file, "imagen", "otros");
      const url = res.data.url;
      setObjetoPaleta({ tipo, imagen: url, emoji: null, label: "imagen", valor: tipo === "positivo" ? 5 : 1 });
    } catch (err) {
      console.error("Error subiendo imagen de objeto:", err);
    } finally {
      setUploadingObj(false);
    }
  };

  const EW = vista === "landscape" ? PREVIEW_LANDSCAPE.w : PREVIEW_PORTRAIT.w;
  const EH = vista === "landscape" ? PREVIEW_LANDSCAPE.h : PREVIEW_PORTRAIT.h;
  const defecto = vista === "landscape" ? PLATAFORMAS_DEFECTO_LANDSCAPE : PLATAFORMAS_DEFECTO;
  const plats   = plataformas ?? defecto;

  const toStyle = (p) => ({
    left:   p.x * EW - (p.w * EW) / 2,
    top:    p.y * EH - PLAT_H_PX / 2,
    width:  p.w * EW,
    height: PLAT_H_PX,
  });

  const startDrag = (e, idx, tipo) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = { idx, tipo, startX: e.clientX, startY: e.clientY, startPlat: { ...plats[idx] }, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!dragRef.current) return;
    const { idx, tipo, startX, startY, startPlat } = dragRef.current;
    const dx = (e.clientX - startX) / EW;
    const dy = (e.clientY - startY) / EH;
    if (Math.abs(e.clientX - startX) > 3 || Math.abs(e.clientY - startY) > 3) {
      dragRef.current.moved = true;
    }
    if (!dragRef.current.moved) return;
    const rnd = (v) => Math.round(v * 100) / 100;
    onChange(plats.map((p, i) => {
      if (i !== idx) return p;
      if (tipo === "mover") return { ...p,
        x: rnd(Math.max(0.05, Math.min(0.95, startPlat.x + dx))),
        y: rnd(Math.max(0.05, Math.min(0.98, startPlat.y + dy))),
      };
      return { ...p, w: rnd(Math.max(0.08, Math.min(1.0, startPlat.w + dx * 2))) };
    }));
  };

  const onPointerUp = (e, idx) => {
    const wasDrag = dragRef.current?.moved;
    dragRef.current = null;
    if (!wasDrag && idx !== undefined) setSelIdx(prev => prev === idx ? null : idx);
  };

  const updateMovimiento = (campo, valor) => {
    onChange(plats.map((p, i) => i !== selIdx ? p : {
      ...p, movimiento: { ...(p.movimiento ?? { eje: "x", rango: 0.20, velocidad: 1.2 }), [campo]: valor },
    }));
  };

  const toggleMovimiento = (activo) => {
    onChange(plats.map((p, i) => i !== selIdx ? p : {
      ...p, movimiento: activo ? { eje: "x", rango: 0.20, velocidad: 1.2 } : undefined,
    }));
  };

  const platSel = selIdx !== null ? plats[selIdx] : null;

  return (
    <div className="space-y-3">
      {/* Controles superiores */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Orientación */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden text-xs">
          <button type="button" onClick={() => setVista("portrait")}
            className={`px-3 py-1.5 transition-colors ${vista === "portrait" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}>
            📱 Portrait
          </button>
          <button type="button" onClick={() => setVista("landscape")}
            className={`px-3 py-1.5 transition-colors ${vista === "landscape" ? "bg-indigo-600 text-white" : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"}`}>
            💻 Landscape
          </button>
        </div>

        {/* Modo de edición */}
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden text-xs">
          <button type="button" onClick={() => { setModoEdicion("plataformas"); setObjetoPaleta(null); }}
            className={`px-3 py-1.5 transition-colors ${modoEdicion === "plataformas" ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            🟩 Plataformas
          </button>
          <button type="button" onClick={() => { setModoEdicion("objetos"); setSelIdx(null); }}
            className={`px-3 py-1.5 transition-colors ${modoEdicion === "objetos" ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
            🎯 Objetos
          </button>
        </div>

        {modoEdicion === "plataformas" && (
          <>
            <button type="button" onClick={() => { onChange(defecto.map(p => ({ ...p }))); setSelIdx(null); }}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
              Cargar default {vista}
            </button>
            <button type="button" onClick={() => onChange([...plats, { x: 0.5, y: 0.5, w: 0.30 }])}
              className="text-xs px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors">
              + Plataforma
            </button>
            <span className="text-xs text-gray-400">{plats.length} plataformas</span>
          </>
        )}
        {modoEdicion === "objetos" && (
          <>
            <span className="text-xs text-gray-400">{objetos.length} objeto{objetos.length !== 1 ? "s" : ""}</span>
            {objetos.length > 0 && (
              <button type="button" onClick={() => onChangeObjetos([])}
                className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                Limpiar todo
              </button>
            )}
          </>
        )}
      </div>

      <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
        {modoEdicion === "plataformas"
          ? "El mismo layout aplica a portrait y landscape. Verifica ambas vistas. El engine usa defaults separados si no configuras nada."
          : "Modo Objetos: selecciona un item de la paleta y haz clic en el canvas para colocarlo. Clic sobre un objeto ya colocado para eliminarlo."
        }
      </p>

      {/* Layout canvas + panel */}
      <div className="flex gap-4 items-start flex-wrap">
        {/* Canvas de preview */}
        <div
          ref={canvasRef}
          className="relative rounded-xl overflow-hidden border border-indigo-700 select-none flex-shrink-0"
          style={{
            width: EW, height: EH, touchAction: "none",
            background: "linear-gradient(180deg,#1e1b4b 0%,#312e81 60%,#3730a3 100%)",
            cursor: modoEdicion === "objetos" && objetoPaleta ? "crosshair" : "default",
          }}
          onPointerMove={onPointerMove}
          onPointerDown={e => {
            if (modoEdicion === "objetos" && objetoPaleta) {
              const rect = canvasRef.current.getBoundingClientRect();
              clickRef.current = {
                startX: e.clientX, startY: e.clientY,
                canvasX: (e.clientX - rect.left) / EW,
                canvasY: (e.clientY - rect.top)  / EH,
              };
            }
          }}
          onPointerUp={e => {
            const wasDrag = dragRef.current?.moved;
            dragRef.current = null;
            if (clickRef.current && modoEdicion === "objetos" && objetoPaleta && !wasDrag) {
              const dx = Math.abs(e.clientX - clickRef.current.startX);
              const dy = Math.abs(e.clientY - clickRef.current.startY);
              if (dx < 5 && dy < 5) {
                const x = Math.round(clickRef.current.canvasX * 100) / 100;
                const y = Math.round(clickRef.current.canvasY * 100) / 100;
                onChangeObjetos([...objetos, { ...objetoPaleta, x, y }]);
              }
            }
            clickRef.current = null;
          }}
        >
          {/* pointerEvents:none imprescindible — sin esto e.target no es el canvas */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "radial-gradient(circle,white 1px,transparent 1px)",
            backgroundSize: "28px 28px",
            pointerEvents: "none",
          }} />
          <div style={{ position: "absolute", top: 6, left: 8, fontSize: 9, color: "rgba(255,255,255,0.4)", pointerEvents: "none" }}>
            {vista === "portrait" ? "400×640" : "640×400"}
          </div>

          {plats.map((p, idx) => {
            const s   = toStyle(p);
            const mov = p.movimiento;
            const sel = selIdx === idx;

            return (
              <div key={idx}>
                {/* Rango de movimiento (zona sombreada) */}
                {mov && (() => {
                  const dist = mov.rango * (mov.eje === "x" ? EW : EH);
                  return (
                    <div style={{
                      position: "absolute",
                      left: mov.eje === "x" ? s.left - dist : s.left,
                      top:  mov.eje === "y" ? s.top  - dist : s.top,
                      width:  mov.eje === "x" ? s.width + dist * 2 : s.width,
                      height: mov.eje === "y" ? PLAT_H_PX + dist * 2 : PLAT_H_PX,
                      background: "rgba(99,102,241,0.15)",
                      border: "1px dashed rgba(99,102,241,0.45)",
                      borderRadius: 3,
                      pointerEvents: "none",
                    }} />
                  );
                })()}

                {/* Plataforma */}
                <div
                  style={{ position: "absolute", left: s.left, top: s.top, width: s.width, height: PLAT_H_PX, cursor: "grab", touchAction: "none", zIndex: 2 }}
                  className={`rounded-sm shadow-lg ${mov ? "bg-indigo-500" : "bg-green-500"} ${sel ? "ring-2 ring-white ring-offset-1" : ""}`}
                  onPointerDown={e => startDrag(e, idx, "mover")}
                  onPointerUp={e => { e.stopPropagation(); onPointerUp(e, idx); }}>
                  <span style={{ position: "absolute", top: -13, left: 2, fontSize: 9, color: "rgba(255,255,255,0.7)", pointerEvents: "none" }}>
                    P{idx + 1}{mov ? (mov.eje === "x" ? " ↔" : " ↕") : ""}
                  </span>
                  {/* Handle resize */}
                  <div
                    style={{ position: "absolute", right: 0, top: 0, width: 10, height: "100%", cursor: "ew-resize", touchAction: "none" }}
                    className={mov ? "bg-indigo-300 rounded-r-sm" : "bg-green-300 rounded-r-sm"}
                    onPointerDown={e => { e.stopPropagation(); startDrag(e, idx, "resize"); }}
                    onPointerUp={e => e.stopPropagation()}
                  />
                  {/* Eliminar */}
                  {plats.length > 1 && (
                    <button type="button"
                      style={{ position: "absolute", top: -8, right: -8, width: 16, height: 16, zIndex: 10 }}
                      className="bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 leading-none text-xs"
                      onPointerDown={e => e.stopPropagation()}
                      onClick={() => { onChange(plats.filter((_, i) => i !== idx)); if (selIdx === idx) setSelIdx(null); }}>
                      ✕
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Objetos Layer 2 en canvas */}
          {objetos.map((obj, oi) => (
            <div key={oi}
              title={`${obj.imagen ? "imagen" : obj.emoji} ${obj.label} · Clic para eliminar`}
              style={{
                position: "absolute",
                left: obj.x * EW - 16, top: obj.y * EH - 16,
                width: 32, height: 32,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18,
                background: obj.tipo === "positivo" ? "rgba(22,101,52,0.88)" : "rgba(127,29,29,0.88)",
                borderRadius: "50%",
                border: `2px solid ${obj.tipo === "positivo" ? "#4ade80" : "#f87171"}`,
                cursor: modoEdicion === "objetos" ? "pointer" : "default",
                zIndex: 5, userSelect: "none",
              }}
              onPointerDown={e => e.stopPropagation()}
              onPointerUp={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation();
                if (modoEdicion === "objetos") {
                  onChangeObjetos(objetos.filter((_, i) => i !== oi));
                }
              }}>
              {obj.imagen
                ? <img src={obj.imagen} alt={obj.label} style={{ width: 24, height: 24, objectFit: "contain", borderRadius: "50%" }} />
                : obj.emoji
              }
            </div>
          ))}
        </div>

        {/* Panel derecho */}
        {/* Plataformas mode: platform config */}
        {modoEdicion === "plataformas" && platSel && (
          <div className="flex-1 min-w-[200px] border border-gray-200 dark:border-gray-600 rounded-xl p-4 space-y-4 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                P{selIdx + 1} — Configuración
              </span>
              <button type="button" onClick={() => setSelIdx(null)}
                className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
            </div>

            {/* Toggle movimiento */}
            <div className="flex items-center gap-2.5">
              <input type="checkbox" id={`mov-${selIdx}`}
                checked={!!platSel.movimiento}
                onChange={e => toggleMovimiento(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded" />
              <label htmlFor={`mov-${selIdx}`} className="text-sm text-gray-700 cursor-pointer">
                Plataforma móvil
              </label>
            </div>

            {platSel.movimiento && (
              <div className="space-y-4">
                {/* Eje */}
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Eje de movimiento</p>
                  <div className="flex gap-3">
                    {[["x", "Horizontal ↔"], ["y", "Vertical ↕"]].map(([val, label]) => (
                      <label key={val} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input type="radio" name={`eje-${selIdx}`} value={val}
                          checked={platSel.movimiento.eje === val}
                          onChange={() => updateMovimiento("eje", val)}
                          className="text-indigo-600" />
                        {label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Rango */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Rango de desplazamiento</span>
                    <span className="font-medium text-indigo-600">{Math.round(platSel.movimiento.rango * 100)}%</span>
                  </div>
                  <input type="range" min={5} max={45} step={5}
                    value={Math.round(platSel.movimiento.rango * 100)}
                    onChange={e => updateMovimiento("rango", Number(e.target.value) / 100)}
                    className="w-full accent-indigo-600" />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>Mínimo</span><span>Máximo</span>
                  </div>
                </div>

                {/* Velocidad */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Velocidad</span>
                    <span className="font-medium text-indigo-600">{platSel.movimiento.velocidad}×</span>
                  </div>
                  <input type="range" min={0.5} max={3.0} step={0.5}
                    value={platSel.movimiento.velocidad}
                    onChange={e => updateMovimiento("velocidad", Number(e.target.value))}
                    className="w-full accent-indigo-600" />
                  <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                    <span>Lenta</span><span>Rápida</span>
                  </div>
                </div>

                <p className="text-xs text-indigo-600 bg-indigo-50 rounded-lg px-2 py-1.5">
                  La zona sombreada en el canvas muestra el recorrido de esta plataforma.
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-gray-200 space-y-1.5">
              <p className="text-xs text-gray-400">
                Posición: x={platSel.x} · y={platSel.y} · ancho={platSel.w}
              </p>
            </div>
          </div>
        )}

        {modoEdicion === "plataformas" && !platSel && (
          <div className="flex-1 min-w-[160px] flex items-center justify-center text-xs text-gray-400 text-center px-4 py-8 border border-dashed border-gray-200 dark:border-gray-600 rounded-xl">
            Haz clic en una plataforma para configurarla
          </div>
        )}

        {/* Objetos mode: palette panel */}
        {modoEdicion === "objetos" && (
          <div className="flex-1 min-w-[200px] border border-orange-200 rounded-xl p-4 space-y-4 bg-orange-50">
            <p className="text-xs font-bold text-orange-700 uppercase tracking-wide">Paleta de objetos</p>

            <div>
              <p className="text-xs text-green-700 font-medium mb-2">✅ Positivos — suman puntos</p>
              <div className="flex flex-wrap gap-1.5">
                {PALETA_OBJETOS.filter(o => o.tipo === "positivo").map(o => (
                  <button key={o.emoji} type="button"
                    onClick={() => setObjetoPaleta(prev => prev?.emoji === o.emoji ? null : o)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all border-2 ${
                      objetoPaleta?.emoji === o.emoji
                        ? "border-green-500 bg-green-100 scale-110 shadow"
                        : "border-gray-200 bg-white hover:border-green-300"
                    }`}
                    title={o.label}>
                    {o.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-red-700 font-medium mb-2">❌ Negativos — restan vida</p>
              <div className="flex flex-wrap gap-1.5">
                {PALETA_OBJETOS.filter(o => o.tipo === "negativo").map(o => (
                  <button key={o.emoji} type="button"
                    onClick={() => setObjetoPaleta(prev => prev?.emoji === o.emoji ? null : o)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all border-2 ${
                      objetoPaleta?.emoji === o.emoji
                        ? "border-red-500 bg-red-100 scale-110 shadow"
                        : "border-gray-200 bg-white hover:border-red-300"
                    }`}
                    title={o.label}>
                    {o.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom image upload */}
            <div className="border-t border-orange-200 pt-3 space-y-2">
              <p className="text-xs font-medium text-gray-600">📁 Imagen personalizada</p>
              <div className="flex gap-2">
                <label className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                  uploadingObj ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-green-50 text-green-700 hover:bg-green-100 border-green-300"
                }`}>
                  <Upload className="h-3 w-3" />
                  {uploadingObj ? "Subiendo..." : "✅ Positiva"}
                  <input type="file" className="hidden" accept="image/*" disabled={uploadingObj}
                    onChange={e => { handleSubirImagenObjeto(e.target.files?.[0], "positivo"); e.target.value = ""; }} />
                </label>
                <label className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
                  uploadingObj ? "bg-gray-100 text-gray-400 border-gray-200" : "bg-red-50 text-red-700 hover:bg-red-100 border-red-300"
                }`}>
                  <Upload className="h-3 w-3" />
                  {uploadingObj ? "Subiendo..." : "❌ Negativa"}
                  <input type="file" className="hidden" accept="image/*" disabled={uploadingObj}
                    onChange={e => { handleSubirImagenObjeto(e.target.files?.[0], "negativo"); e.target.value = ""; }} />
                </label>
              </div>
              {objetoPaleta?.imagen && (
                <div className="flex items-center gap-2 bg-white rounded-lg border border-orange-200 px-2 py-1.5">
                  <img src={objetoPaleta.imagen} alt="preview" className="w-8 h-8 object-contain rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700">Imagen {objetoPaleta.tipo} lista</p>
                    <p className="text-xs text-gray-400 truncate">{objetoPaleta.imagen.split("/").pop()}</p>
                  </div>
                  <button type="button" onClick={() => setObjetoPaleta(null)}
                    className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                </div>
              )}
            </div>

            {objetoPaleta ? (
              <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                <strong>{objetoPaleta.imagen ? "🖼️ Imagen" : objetoPaleta.emoji} {objetoPaleta.label}</strong> seleccionado.<br />
                Haz clic en el canvas para colocarlo.<br />
                {objetoPaleta.tipo === "positivo" ? `Valor: +${objetoPaleta.valor} pts/acierto` : "Efecto: −1 vida al tocarlo"}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Selecciona un objeto de la paleta o sube una imagen para colocarlo.</p>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400">
        {modoEdicion === "plataformas"
          ? <>Arrastra para mover · Borde derecho = cambiar ancho · Clic = seleccionar ·{" "}
              <span className="text-green-600">Verde</span> = estática ·{" "}
              <span className="text-indigo-500">Azul</span> = móvil</>
          : <>Selecciona objeto → clic en canvas para colocar · Clic sobre objeto colocado = eliminar ·{" "}
              <span className="text-green-600">Verde</span> = positivo ·{" "}
              <span className="text-red-500">Rojo</span> = negativo</>
        }
      </p>
    </div>
  );
};

// ── Componente: subir imagen o audio con preview ──────────────────────────────
const UploadAsset = ({ tipo = "imagen", categoriaDefault = "otros", onUrl, urlActual = "" }) => {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError]       = useState("");
  const [cat, setCat]           = useState(categoriaDefault);
  const cats = tipo === "audio" ? CATS_AUDIO : CATS_IMAGEN;

  const manejarArchivo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setSubiendo(true);
    try {
      const res = await subirAsset(file, tipo, cat);
      onUrl(res.data.url);
    } catch (err) {
      setError(err.response?.data?.error || "Error al subir el archivo");
    } finally {
      setSubiendo(false);
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <select value={cat} onChange={e => setCat(e.target.value)}
          className="text-xs rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-400">
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
          subiendo ? "bg-gray-100 dark:bg-gray-700 text-gray-400" : "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30"
        }`}>
          <Upload className="h-3.5 w-3.5" />
          {subiendo ? "Subiendo..." : `Subir ${tipo}`}
          <input type="file" className="hidden" disabled={subiendo}
            accept={tipo === "audio" ? "audio/*" : "image/*"}
            onChange={manejarArchivo} />
        </label>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {urlActual && (
        <div className="flex items-center gap-2 mt-0.5">
          {tipo === "imagen"
            ? <img src={urlActual} alt="" className="w-10 h-10 object-contain rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700" />
            : <span className="text-xs text-green-600 truncate max-w-[200px]">🔊 {urlActual.split("/").pop()}</span>
          }
          <span className="text-xs text-gray-400 truncate max-w-[180px]">{urlActual}</span>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
const GameBuilder = () => {
  const navigate = useNavigate();
  const toast    = useToast();

  const [paso,      setPaso]      = useState(1); // 1-4
  const [guardando, setGuardando] = useState(false);

  // ── Estado del juego ────────────────────────────────────────────────────────
  const [tipoJuego,    setTipoJuego]    = useState("html5"); // "html5" | "arcade"
  const [submecanica,  setSubmecanica]  = useState(null);
  const [mecanica,    setMecanica]    = useState(null);
  const [meta,        setMeta]        = useState({
    nombre: "", descripcion: "", instrucciones: "",
    areaTerapeutica: "semantica", nivelDificultad: "basico",
    edadMinima: 4, edadMaxima: 10,
    rondasTotal: 10, intentosPorRonda: 2,
    puntajePorAcierto: 10, puntajeMinimo: 60,
    modoRondas: "aleatorio", publicado: false,
    thumbnail: null,
  });
  const [visual,        setVisual]        = useState({ tema: "default", fondo: { tipo: "gradiente", desde: "#dbeafe", hasta: "#ede9fe" } });
  const [accesibilidad, setAccesibilidad] = useState({ audioInstruccion: null, musicaFondo: null });
  const [rondas,        setRondas]        = useState([]);
  const [rondaAbierta, setRondaAbierta] = useState(0);

  // ── Estado específico de juegos arcade ──────────────────────────────────────
  const [arcadeConfig, setArcadeConfig] = useState({
    nombre: "", instruccion: "", descripcion: "",
    areaTerapeutica: "fonologia", nivelDificultad: "basico",
    edadMinima: 4, edadMaxima: 10,
    duracion: 60, vidas: 3,
    puntajePorAcierto: 10, puntajePorError: 5, puntajeMinimo: 60,
    powerUpInterval: 14,
    musica: null, publicado: false, plataformas: null, tema: "espacial", objetos: [],
    thumbnail: null,
    personaje: {
      spritesheet: null, frameWidth: 48, frameHeight: 48, velocidad: 290,
      animaciones: {
        idle: { start: 0, end: 3, frameRate: 8 },
        walk: { start: 4, end: 7, frameRate: 12 },
        jump: { start: 8, end: 9, frameRate: 8 },
      },
    },
    palabras: {
      correctas: [{ texto: "" }],
      incorrectas: [{ texto: "" }],
      velocidadMin: 75, velocidadMax: 145, spawnRate: 1800,
    },
    personaje: {
      velocidad: 290,
      spritesheet: null, frameWidth: 48, frameHeight: 48,
      animaciones: {
        idle: { start: 0, end: 3, frameRate: 8 },
        walk: { start: 4, end: 7, frameRate: 12 },
        jump: { start: 8, end: 9, frameRate: 8 },
      },
    },
  });

  // ── Handlers meta ───────────────────────────────────────────────────────────
  const handleMeta = (e) => {
    const { name, value, type, checked } = e.target;
    setMeta(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  // ── Elegir mecánica ─────────────────────────────────────────────────────────
  const elegirMecanica = (id) => {
    setMecanica(id);
    // Inicializar con 3 rondas vacías
    setRondas([
      rondaVaciaPorMecanica(id),
      rondaVaciaPorMecanica(id),
      rondaVaciaPorMecanica(id),
    ]);
  };

  // ── Agregar/eliminar ronda ──────────────────────────────────────────────────
  const agregarRonda = () => {
    setRondas(prev => [...prev, rondaVaciaPorMecanica(mecanica)]);
    setRondaAbierta(rondas.length);
  };

  const eliminarRonda = (idx) => {
    if (rondas.length <= 1) { toast.advertencia("Debe haber al menos una ronda"); return; }
    setRondas(prev => prev.filter((_, i) => i !== idx));
    setRondaAbierta(Math.max(0, rondaAbierta - 1));
  };

  // ── Actualizar campo de ronda ───────────────────────────────────────────────
  const actualizarRonda = (idx, campo, valor) => {
    setRondas(prev => prev.map((r, i) => i === idx ? { ...r, [campo]: valor } : r));
  };

  // ── Actualizar item dentro de ronda ────────────────────────────────────────
  const actualizarItem = (rondaIdx, itemIdx, campo, valor) => {
    setRondas(prev => prev.map((r, i) => {
      if (i !== rondaIdx) return r;
      const items = [...(r.items || r.opciones || r.elementos)];
      items[itemIdx] = { ...items[itemIdx], [campo]: valor };
      if (r.items)     return { ...r, items };
      if (r.opciones)  return { ...r, opciones: items };
      if (r.elementos) return { ...r, elementos: items };
      return r;
    }));
  };

  // ── Marcar única respuesta correcta ────────────────────────────────────────
  const marcarCorrecta = (rondaIdx, itemIdx) => {
    setRondas(prev => prev.map((r, i) => {
      if (i !== rondaIdx) return r;
      if (r.items) {
        // intruso: toggle
        const items = r.items.map((it, j) => ({ ...it, esIntruso: j === itemIdx }));
        return { ...r, items };
      }
      if (r.opciones) {
        const opciones = r.opciones.map((op, j) => ({ ...op, correcta: j === itemIdx }));
        return { ...r, opciones };
      }
      return r;
    }));
  };

  // ── Actualizar tema visual ──────────────────────────────────────────────────
  const cambiarTema = (temaId) => {
    const t = TEMAS.find(t => t.value === temaId);
    setVisual({ tema: temaId, fondo: { tipo: "gradiente", desde: t.desde, hasta: t.hasta } });
  };

  // ── Handlers arcade ────────────────────────────────────────────────────────
  const handleArcade = (e) => {
    const { name, value, type, checked } = e.target;
    setArcadeConfig(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleArcadePalabras = (campo, valor) => {
    setArcadeConfig(prev => ({ ...prev, palabras: { ...prev.palabras, [campo]: valor } }));
  };

  const handleArcadePersonaje = (campo, valor) => {
    setArcadeConfig(prev => ({ ...prev, personaje: { ...prev.personaje, [campo]: valor } }));
  };

  const elegirTipo = (tipo) => {
    setTipoJuego(tipo);
    setMecanica(null);
    setSubmecanica(null);
  };

  const elegirSubmecanica = (id) => setSubmecanica(id);

  // ── Validar paso actual ─────────────────────────────────────────────────────
  const validarPaso = () => {
    if (paso === 1) {
      if (tipoJuego === "arcade" && !submecanica) {
        toast.advertencia("Elige una submecánica para continuar");
        return false;
      }
      if (tipoJuego === "html5" && !mecanica) {
        toast.advertencia("Elige una mecánica para continuar");
        return false;
      }
    }
    if (paso === 2) {
      if (tipoJuego === "arcade") {
        if (!arcadeConfig.nombre.trim()) { toast.advertencia("El nombre del juego es obligatorio"); return false; }
        if (!arcadeConfig.areaTerapeutica) { toast.advertencia("Elige un área terapéutica"); return false; }
      } else {
        if (!meta.nombre.trim()) { toast.advertencia("El nombre del juego es obligatorio"); return false; }
        if (!meta.areaTerapeutica) { toast.advertencia("Elige un área terapéutica"); return false; }
      }
    }
    if (paso === 3 && tipoJuego === "html5" && rondas.length === 0) {
      toast.advertencia("Agrega al menos una ronda");
      return false;
    }
    if (paso === 3 && tipoJuego === "html5" && mecanica === "constructor_historias") {
      for (const ronda of rondas) {
        if (!ronda.imagenes?.length) { toast.advertencia("Cada historia necesita al menos una imagen"); return false; }
        for (const img of ronda.imagenes) {
          if (!img.imagen) { toast.advertencia("Subí la imagen para cada momento de la historia"); return false; }
          if (!img.oraciones?.some(o => o.correcta && o.texto.trim())) {
            toast.advertencia("Cada imagen necesita una oración correcta definida"); return false;
          }
        }
      }
    }
    if (paso === 3 && tipoJuego === "arcade") {
      const correctas = arcadeConfig.palabras.correctas.filter(p => p.texto.trim());
      if (!correctas.length) { toast.advertencia("Agrega al menos una palabra correcta"); return false; }
    }
    return true;
  };

  // ── Publicar ────────────────────────────────────────────────────────────────
  const handlePublicar = async () => {
    setGuardando(true);
    try {
      let payload;
      if (tipoJuego === "arcade") {
        const correctas   = arcadeConfig.palabras.correctas.filter(p => p.texto.trim());
        const incorrectas = arcadeConfig.palabras.incorrectas.filter(p => p.texto.trim());
        payload = {
          tipo: "arcade",
          nombre:          arcadeConfig.nombre,
          descripcion:     arcadeConfig.descripcion,
          instruccion:     arcadeConfig.instruccion,
          areaTerapeutica: arcadeConfig.areaTerapeutica,
          nivelDificultad: arcadeConfig.nivelDificultad,
          edadMinima:      Number(arcadeConfig.edadMinima),
          edadMaxima:      Number(arcadeConfig.edadMaxima),
          publicado:       arcadeConfig.publicado,
          submecanica,
          duracion:        Number(arcadeConfig.duracion),
          vidas:           Number(arcadeConfig.vidas),
          puntajePorAcierto: Number(arcadeConfig.puntajePorAcierto),
          puntajePorError:   Number(arcadeConfig.puntajePorError),
          puntajeMinimo:     Number(arcadeConfig.puntajeMinimo),
          powerUpInterval:   Number(arcadeConfig.powerUpInterval),
          musica:            arcadeConfig.musica || null,
          thumbnail:         arcadeConfig.thumbnail || null,
          personaje:         arcadeConfig.personaje,
          tema:              arcadeConfig.tema,
          plataformas:       submecanica === "plataformero" ? arcadeConfig.plataformas : undefined,
          objetos:           submecanica === "plataformero" ? (arcadeConfig.objetos ?? []) : undefined,
          palabras: {
            correctas,
            incorrectas,
            velocidadMin: Number(arcadeConfig.palabras.velocidadMin),
            velocidadMax: Number(arcadeConfig.palabras.velocidadMax),
            spawnRate:    Number(arcadeConfig.palabras.spawnRate),
          },
        };
      } else {
        payload = {
          tipo: "html5",
          ...meta,
          mecanica,
          visual,
          accesibilidad: {
            audioAlMostrarItems: false,
            audioAlTocarItem:    true,
            repetirInstruccion:  true,
            textoVisible:        true,
            fallbackAudio:       "sintetizar",
            idiomaVoz:           "es-CL",
            audioInstruccion:    accesibilidad.audioInstruccion || null,
            musicaFondo:         accesibilidad.musicaFondo      || null,
          },
          rondas,
        };
      }
      await crearJuegoBuilder(payload);
      const nombre = tipoJuego === "arcade" ? arcadeConfig.nombre : meta.nombre;
      toast.exito(`¡Juego "${nombre}" creado correctamente!`);
      navigate("/admin/juegos");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al crear el juego");
    } finally {
      setGuardando(false);
    }
  };

  // ── Indicador de pasos ──────────────────────────────────────────────────────
  const pasos = [
    "Tipo",
    "Configuración",
    tipoJuego === "arcade" ? "Palabras" : "Rondas",
    "Publicar",
  ];

  return (
    <DashboardLayout>
      <div className={paso === 3 ? "max-w-5xl mx-auto" : "max-w-4xl mx-auto"}>

        {/* Cabecera */}
        <div className="mb-6">
          <button onClick={() => navigate("/admin/juegos")}
            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4 text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />Volver a juegos
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Gamepad2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Game Builder</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Crea un juego nuevo sin escribir código</p>
            </div>
          </div>
        </div>

        {/* Indicador de pasos */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {pasos.map((nombre, i) => {
            const num = i + 1;
            const activo    = paso === num;
            const completado = paso > num;
            return (
              <div key={num} className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activo    ? "bg-purple-600 text-white" :
                  completado ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                              "bg-gray-100 dark:bg-gray-700 text-gray-400"
                }`}>
                  {completado ? <Check className="h-3.5 w-3.5" /> : <span>{num}</span>}
                  {nombre}
                </div>
                {i < pasos.length - 1 && <div className="w-6 h-px bg-gray-300 dark:bg-gray-600 flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* ── PASO 1: Tipo de juego + Mecánica/Submecánica ── */}
        {paso === 1 && (
          <div className="space-y-6">
            {/* Selector de tipo */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">¿Qué tipo de juego quieres crear?</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => elegirTipo("html5")}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    tipoJuego === "html5" ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" : "border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}>
                  <div className="text-3xl mb-2">🎓</div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Juego Educativo</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Rondas con preguntas, opciones, memoria, tipeo o emparejamiento.</p>
                </button>
                <button onClick={() => elegirTipo("arcade")}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    tipoJuego === "arcade" ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" : "border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                  }`}>
                  <div className="text-3xl mb-2">🕹️</div>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Juego Arcade</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Motor Phaser 3 con nave o plataformero. Palabras vuelan en pantalla.</p>
                </button>
              </div>
            </div>

            {/* Mecánicas HTML5 */}
            {tipoJuego === "html5" && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Elige la mecánica</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {MECANICAS.map(m => (
                    <button key={m.id} onClick={() => elegirMecanica(m.id)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        mecanica === m.id ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" : "border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}>
                      <div className="text-3xl mb-2">{m.emoji}</div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">{m.nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{m.descripcion}</p>
                      <p className="text-xs text-gray-400">Ej: {m.ejemplos}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submecánicas Arcade */}
            {tipoJuego === "arcade" && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">Elige la submecánica arcade</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {SUBMECANICAS_ARCADE.map(s => (
                    <button key={s.id} onClick={() => elegirSubmecanica(s.id)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all ${
                        submecanica === s.id ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20" : "border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                      }`}>
                      <div className="text-3xl mb-2">{s.emoji}</div>
                      <p className="font-semibold text-gray-900 dark:text-white mb-1">{s.nombre}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{s.descripcion}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PASO 2: Configuración Arcade ── */}
        {paso === 2 && tipoJuego === "arcade" && (
          <div className="space-y-6">
            {/* Metadatos arcade */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Información del juego</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del juego <span className="text-red-500">*</span>
                </label>
                <input name="nombre" value={arcadeConfig.nombre} onChange={handleArcade}
                  placeholder="Ej: Nave de las sílabas"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Instrucción al jugador</label>
                <input name="instruccion" value={arcadeConfig.instruccion} onChange={handleArcade}
                  placeholder="Ej: ¡Captura las palabras que empiezan con /p/!"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea name="descripcion" value={arcadeConfig.descripcion} onChange={handleArcade}
                  rows={2} placeholder="Breve descripción del juego..."
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área terapéutica</label>
                  <select name="areaTerapeutica" value={arcadeConfig.areaTerapeutica} onChange={handleArcade}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dificultad</label>
                  <select name="nivelDificultad" value={arcadeConfig.nivelDificultad} onChange={handleArcade}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {NIVELES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad mínima</label>
                  <input type="number" name="edadMinima" value={arcadeConfig.edadMinima} onChange={handleArcade}
                    min={2} max={18}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad máxima</label>
                  <input type="number" name="edadMaxima" value={arcadeConfig.edadMaxima} onChange={handleArcade}
                    min={2} max={18}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
            </div>

            {/* Parámetros de juego arcade */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Parámetros del juego</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (seg)</label>
                  <select name="duracion" value={arcadeConfig.duracion} onChange={handleArcade}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {[30,45,60,90,120].map(s => <option key={s} value={s}>{s}s</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vidas</label>
                  <select name="vidas" value={arcadeConfig.vidas} onChange={handleArcade}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Power-up cada (seg)</label>
                  <select name="powerUpInterval" value={arcadeConfig.powerUpInterval} onChange={handleArcade}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {[10,14,20,30].map(s => <option key={s} value={s}>{s}s</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pts por acierto</label>
                  <input type="number" name="puntajePorAcierto" value={arcadeConfig.puntajePorAcierto} onChange={handleArcade}
                    min={1} max={100}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pts por error</label>
                  <input type="number" name="puntajePorError" value={arcadeConfig.puntajePorError} onChange={handleArcade}
                    min={0} max={50}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">% mín. para ganar</label>
                  <input type="number" name="puntajeMinimo" value={arcadeConfig.puntajeMinimo} onChange={handleArcade}
                    min={0} max={100}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">Música de fondo (opcional)</label>
                <UploadAsset tipo="audio" categoriaDefault="otros"
                  urlActual={arcadeConfig.musica || ""}
                  onUrl={url => setArcadeConfig(prev => ({ ...prev, musica: url }))} />
                {arcadeConfig.musica && (
                  <button onClick={() => setArcadeConfig(prev => ({ ...prev, musica: null }))}
                    className="text-xs text-red-400 hover:text-red-600">✕ Quitar música</button>
                )}
              </div>
              <div className="flex items-center gap-3 pt-1">
                <input type="checkbox" id="arcadePublicado"
                  checked={arcadeConfig.publicado}
                  onChange={e => setArcadeConfig(prev => ({ ...prev, publicado: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded" />
                <label htmlFor="arcadePublicado" className="text-sm text-gray-700">Publicar inmediatamente</label>
              </div>
            </div>

            {/* Tema visual arcade */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Tema visual</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TEMAS_ARCADE_UI.map(t => (
                  <button key={t.value} onClick={() => setArcadeConfig(prev => ({ ...prev, tema: t.value }))}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      arcadeConfig.tema === t.value ? "border-purple-500 bg-purple-50" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    <div className="h-8 rounded-lg mb-2" style={{ background: t.gradiente }} />
                    <p className="text-xs font-semibold text-gray-700">{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Personaje del jugador */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">🎮 Personaje del jugador</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Sube un spritesheet PNG con las poses del personaje. Sin spritesheet se usa el personaje procedural por defecto.
                </p>
              </div>

              {/* Preview personaje actual */}
              {!arcadeConfig.personaje.spritesheet && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="w-10 h-11 rounded-lg overflow-hidden bg-indigo-900 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">🧒</span>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-purple-700">Usando personaje procedural</p>
                    <p className="text-xs text-gray-500">Sprite morado/amarillo generado automáticamente</p>
                  </div>
                </div>
              )}

              {/* Subir spritesheet */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Spritesheet PNG</label>
                <UploadAsset tipo="imagen" categoriaDefault="otros"
                  urlActual={arcadeConfig.personaje.spritesheet || ""}
                  onUrl={url => setArcadeConfig(prev => ({
                    ...prev,
                    personaje: { ...prev.personaje, spritesheet: url },
                  }))} />
                {arcadeConfig.personaje.spritesheet && (
                  <button type="button"
                    onClick={() => setArcadeConfig(prev => ({
                      ...prev,
                      personaje: { ...prev.personaje, spritesheet: null },
                    }))}
                    className="text-xs text-red-400 hover:text-red-600 mt-1">
                    ✕ Quitar spritesheet (volver a procedural)
                  </button>
                )}
              </div>

              {/* Config de frames y velocidad — solo si hay spritesheet */}
              {arcadeConfig.personaje.spritesheet && (
                <>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: "Ancho frame (px)", key: "frameWidth",  min: 16, max: 512 },
                      { label: "Alto frame (px)",  key: "frameHeight", min: 16, max: 512 },
                      { label: "Velocidad",        key: "velocidad",   min: 80, max: 500 },
                    ].map(({ label, key, min, max }) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                        <input type="number" min={min} max={max}
                          value={arcadeConfig.personaje[key]}
                          onChange={e => setArcadeConfig(prev => ({
                            ...prev,
                            personaje: { ...prev.personaje, [key]: Number(e.target.value) },
                          }))}
                          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                      </div>
                    ))}
                  </div>

                  {/* Rangos de animación */}
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-2">Rangos de animación (frames desde 0)</p>
                    <div className="space-y-2">
                      {[
                        { anim: "idle", label: "🧍 Idle" },
                        { anim: "walk", label: "🚶 Caminar" },
                        { anim: "jump", label: "🦘 Saltar" },
                      ].map(({ anim, label }) => (
                        <div key={anim} className="flex items-center gap-3 text-xs">
                          <span className="w-24 text-gray-500">{label}</span>
                          <span className="text-gray-400">inicio</span>
                          <input type="number" min={0} max={99}
                            value={arcadeConfig.personaje.animaciones[anim].start}
                            onChange={e => setArcadeConfig(prev => ({
                              ...prev,
                              personaje: {
                                ...prev.personaje,
                                animaciones: {
                                  ...prev.personaje.animaciones,
                                  [anim]: { ...prev.personaje.animaciones[anim], start: Number(e.target.value) },
                                },
                              },
                            }))}
                            className="w-14 rounded border border-gray-200 px-2 py-1" />
                          <span className="text-gray-400">fin</span>
                          <input type="number" min={0} max={99}
                            value={arcadeConfig.personaje.animaciones[anim].end}
                            onChange={e => setArcadeConfig(prev => ({
                              ...prev,
                              personaje: {
                                ...prev.personaje,
                                animaciones: {
                                  ...prev.personaje.animaciones,
                                  [anim]: { ...prev.personaje.animaciones[anim], end: Number(e.target.value) },
                                },
                              },
                            }))}
                            className="w-14 rounded border border-gray-200 px-2 py-1" />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-amber-600 bg-amber-50 rounded px-2 py-1.5 mt-2">
                      Layout estándar 4×2: idle 0–3 · walk 4–7 · jump 8–9. Los frames se numeran de izquierda a derecha, fila por fila.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Thumbnail del juego */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">🖼️ Miniatura del juego</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Imagen que aparece en la Biblioteca. Se recomienda 16:9 o cuadrada. Sin imagen se muestra un placeholder.
                </p>
              </div>
              {arcadeConfig.thumbnail && (
                <img src={arcadeConfig.thumbnail} alt="thumbnail"
                  className="w-full max-w-xs h-32 object-cover rounded-xl border border-gray-200" />
              )}
              <UploadAsset tipo="imagen" categoriaDefault="fondos"
                urlActual={arcadeConfig.thumbnail || ""}
                onUrl={url => setArcadeConfig(prev => ({ ...prev, thumbnail: url }))} />
              {arcadeConfig.thumbnail && (
                <button type="button" onClick={() => setArcadeConfig(prev => ({ ...prev, thumbnail: null }))}
                  className="text-xs text-red-400 hover:text-red-600">
                  ✕ Quitar miniatura
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── PASO 2: Configuración HTML5 ── */}
        {paso === 2 && tipoJuego === "html5" && (
          <div className="space-y-6">
            {/* Metadatos */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Información del juego</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre del juego <span className="text-red-500">*</span>
                </label>
                <input name="nombre" value={meta.nombre} onChange={handleMeta}
                  placeholder="Ej: La granja de los sonidos"
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                <textarea name="descripcion" value={meta.descripcion} onChange={handleMeta}
                  rows={2} placeholder="Breve descripción del juego..."
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Área terapéutica</label>
                  <select name="areaTerapeutica" value={meta.areaTerapeutica} onChange={handleMeta}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dificultad</label>
                  <select name="nivelDificultad" value={meta.nivelDificultad} onChange={handleMeta}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {NIVELES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad mínima</label>
                  <input type="number" name="edadMinima" value={meta.edadMinima} onChange={handleMeta}
                    min={2} max={18}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad máxima</label>
                  <input type="number" name="edadMaxima" value={meta.edadMaxima} onChange={handleMeta}
                    min={2} max={18}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rondas por sesión</label>
                  <input type="number" name="rondasTotal" value={meta.rondasTotal} onChange={handleMeta}
                    min={1} max={50}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Intentos por ronda</label>
                  <select name="intentosPorRonda" value={meta.intentosPorRonda} onChange={handleMeta}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value={1}>1 intento</option>
                    <option value={2}>2 intentos</option>
                    <option value={3}>3 intentos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Puntos por acierto</label>
                  <input type="number" name="puntajePorAcierto" value={meta.puntajePorAcierto} onChange={handleMeta}
                    min={1} max={100}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">% mínimo para aprobar</label>
                  <input type="number" name="puntajeMinimo" value={meta.puntajeMinimo} onChange={handleMeta}
                    min={0} max={100}
                    className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input type="checkbox" id="modoAleatorio"
                  checked={meta.modoRondas === "aleatorio"}
                  onChange={e => setMeta(prev => ({ ...prev, modoRondas: e.target.checked ? "aleatorio" : "secuencial" }))}
                  className="w-4 h-4 text-purple-600 rounded" />
                <label htmlFor="modoAleatorio" className="text-sm text-gray-700">
                  Mezclar rondas aleatoriamente en cada sesión
                </label>
              </div>
            </div>

            {/* Audio / Accesibilidad */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-purple-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Audio y accesibilidad</h3>
              </div>
              <p className="text-xs text-gray-400 -mt-1">
                Ambos campos son opcionales. Si se configuran, el engine los usa automáticamente.
              </p>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Audio de instrucción general
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    (se reproduce al inicio de cada ronda)
                  </span>
                </label>
                <UploadAsset
                  tipo="audio"
                  categoriaDefault="instrucciones"
                  urlActual={accesibilidad.audioInstruccion || ""}
                  onUrl={url => setAccesibilidad(prev => ({ ...prev, audioInstruccion: url }))}
                />
                {accesibilidad.audioInstruccion && (
                  <button onClick={() => setAccesibilidad(prev => ({ ...prev, audioInstruccion: null }))}
                    className="text-xs text-red-400 hover:text-red-600">
                    ✕ Quitar audio
                  </button>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Música de fondo
                  <span className="ml-1 text-xs text-gray-400 font-normal">
                    (loop continuo durante el juego, con botón de mute)
                  </span>
                </label>
                <UploadAsset
                  tipo="audio"
                  categoriaDefault="otros"
                  urlActual={accesibilidad.musicaFondo || ""}
                  onUrl={url => setAccesibilidad(prev => ({ ...prev, musicaFondo: url }))}
                />
                {accesibilidad.musicaFondo && (
                  <button onClick={() => setAccesibilidad(prev => ({ ...prev, musicaFondo: null }))}
                    className="text-xs text-red-400 hover:text-red-600">
                    ✕ Quitar música
                  </button>
                )}
              </div>
            </div>

            {/* Visual */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Tema visual</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TEMAS.map(t => (
                  <button key={t.value} onClick={() => cambiarTema(t.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      visual.tema === t.value ? "border-purple-500" : "border-gray-200"
                    }`}>
                    <div className="h-8 rounded-lg mb-2"
                      style={{ background: `linear-gradient(135deg, ${t.desde}, ${t.hasta})` }} />
                    <p className="text-xs font-medium text-gray-700">{t.label}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Thumbnail del juego */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">🖼️ Miniatura del juego</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Imagen que aparece en la Biblioteca. Se recomienda 16:9 o cuadrada. Sin imagen se muestra un placeholder.
                </p>
              </div>
              {meta.thumbnail && (
                <img src={meta.thumbnail} alt="thumbnail"
                  className="w-full max-w-xs h-32 object-cover rounded-xl border border-gray-200" />
              )}
              <UploadAsset tipo="imagen" categoriaDefault="fondos"
                urlActual={meta.thumbnail || ""}
                onUrl={url => setMeta(prev => ({ ...prev, thumbnail: url }))} />
              {meta.thumbnail && (
                <button type="button" onClick={() => setMeta(prev => ({ ...prev, thumbnail: null }))}
                  className="text-xs text-red-400 hover:text-red-600">
                  ✕ Quitar miniatura
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── PASO 3: Contenido (arcade o html5) ── */}
        {paso === 3 && tipoJuego === "html5" && mecanica !== "constructor_historias" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {rondas.length} ronda{rondas.length !== 1 ? "s" : ""} en el banco
                {meta.rondasTotal < rondas.length && (
                  <span className="ml-1 text-green-600">
                    · Se seleccionarán {meta.rondasTotal} al azar
                  </span>
                )}
              </p>
            </div>
            <SceneEditor
              mecanica={mecanica}
              rondas={rondas}
              setRondas={setRondas}
              visual={visual}
              onCambiarTema={cambiarTema}
              onAgregarRonda={agregarRonda}
              onEliminarRonda={eliminarRonda}
            />
          </div>
        )}

        {/* ── PASO 3: Constructor de Historias (editor propio) ── */}
        {paso === 3 && tipoJuego === "html5" && mecanica === "constructor_historias" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {rondas.length} historia{rondas.length !== 1 ? "s" : ""} en el banco
                {meta.rondasTotal < rondas.length && (
                  <span className="ml-1 text-green-600">· Se seleccionarán {meta.rondasTotal} al azar</span>
                )}
              </p>
              <button onClick={agregarRonda}
                className="flex items-center gap-1.5 text-sm text-purple-600 hover:text-purple-800 font-medium">
                <Plus className="h-4 w-4" />Historia
              </button>
            </div>

            {rondas.map((ronda, rondaIdx) => (
              <div key={rondaIdx} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Cabecera de la historia */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">📖 Historia {rondaIdx + 1}</span>
                  <button onClick={() => eliminarRonda(rondaIdx)}
                    className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Instrucción */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Instrucción</label>
                    <input value={ronda.textoInstruccion || ""}
                      onChange={e => actualizarRonda(rondaIdx, "textoInstruccion", e.target.value)}
                      placeholder="Ordena las imágenes y elige la oración de cada momento"
                      className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  </div>

                  {/* Audio narración completa */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-medium text-gray-500">
                      Audio narración completa
                      <span className="ml-1 text-gray-400 font-normal">(opcional, se reproduce al completar)</span>
                    </label>
                    <UploadAsset tipo="audio" categoriaDefault="instrucciones"
                      urlActual={ronda.audioHistoria || ""}
                      onUrl={url => actualizarRonda(rondaIdx, "audioHistoria", url)} />
                    {ronda.audioHistoria && (
                      <button onClick={() => actualizarRonda(rondaIdx, "audioHistoria", null)}
                        className="text-xs text-red-400 hover:text-red-600">✕ Quitar audio</button>
                    )}
                  </div>

                  {/* Imágenes */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-gray-500">
                        Imágenes de la historia — {(ronda.imagenes || []).length} / 5
                      </p>
                      {(ronda.imagenes || []).length < 5 && (
                        <button onClick={() => {
                          const imgs = [...(ronda.imagenes || []), imagenHistoriaVacia((ronda.imagenes || []).length + 1)];
                          actualizarRonda(rondaIdx, "imagenes", imgs);
                        }} className="text-xs text-purple-600 hover:underline">+ Imagen</button>
                      )}
                    </div>

                    {(ronda.imagenes || []).map((img, imgIdx) => (
                      <div key={img.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-gray-700/50 mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">
                            Imagen {imgIdx + 1} — posición {img.posicionCorrecta} en la historia
                          </span>
                          {(ronda.imagenes || []).length > 2 && (
                            <button onClick={() => {
                              const imgs = (ronda.imagenes || []).filter((_, i) => i !== imgIdx)
                                .map((im, i) => ({ ...im, posicionCorrecta: i + 1 }));
                              actualizarRonda(rondaIdx, "imagenes", imgs);
                            }} className="p-1 text-gray-400 hover:text-red-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="flex gap-3 items-start">
                          <div className="flex-1 space-y-1.5">
                            <UploadAsset tipo="imagen" categoriaDefault="otros"
                              urlActual={img.imagen || ""}
                              onUrl={url => {
                                const imgs = (ronda.imagenes || []).map((im, i) => i === imgIdx ? { ...im, imagen: url } : im);
                                actualizarRonda(rondaIdx, "imagenes", imgs);
                              }} />
                          </div>
                          {img.imagen && (
                            <img src={img.imagen} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200 flex-shrink-0" />
                          )}
                        </div>

                        {/* Oraciones */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-2">Oraciones — marca la correcta con ✓</p>
                          <div className="space-y-2">
                            {(img.oraciones || []).map((or, orIdx) => (
                              <div key={or.id} className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                                or.correcta ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                              }`}>
                                <button
                                  onClick={() => {
                                    const imgs = (ronda.imagenes || []).map((im, i) => {
                                      if (i !== imgIdx) return im;
                                      return { ...im, oraciones: im.oraciones.map((o, j) => ({ ...o, correcta: j === orIdx })) };
                                    });
                                    actualizarRonda(rondaIdx, "imagenes", imgs);
                                  }}
                                  className={`w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0 transition-colors ${
                                    or.correcta ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 hover:bg-green-100"
                                  }`}>✓</button>
                                <input value={or.texto}
                                  onChange={e => {
                                    const imgs = (ronda.imagenes || []).map((im, i) => {
                                      if (i !== imgIdx) return im;
                                      return { ...im, oraciones: im.oraciones.map((o, j) => j === orIdx ? { ...o, texto: e.target.value } : o) };
                                    });
                                    actualizarRonda(rondaIdx, "imagenes", imgs);
                                  }}
                                  placeholder={or.correcta ? "Oración correcta" : "Oración incorrecta"}
                                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {paso === 3 && tipoJuego === "arcade" && (
          <div className="space-y-6">
            {/* Palabras */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
              <h3 className="font-semibold text-gray-900 dark:text-white">Palabras del juego</h3>

              {/* Correctas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-green-700">✓ Palabras correctas (el jugador debe capturarlas)</p>
                  <button onClick={() => handleArcadePalabras("correctas", [...arcadeConfig.palabras.correctas, { texto: "" }])}
                    className="text-xs text-purple-600 hover:underline">+ Agregar</button>
                </div>
                <div className="space-y-2">
                  {arcadeConfig.palabras.correctas.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={p.texto}
                        onChange={e => {
                          const arr = [...arcadeConfig.palabras.correctas];
                          arr[i] = { texto: e.target.value };
                          handleArcadePalabras("correctas", arr);
                        }}
                        placeholder="Ej: pato"
                        className="flex-1 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-400" />
                      <button onClick={() => handleArcadePalabras("correctas", arcadeConfig.palabras.correctas.filter((_, j) => j !== i))}
                        className="text-gray-400 hover:text-red-500 text-xs px-1 flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Incorrectas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-red-700">✗ Palabras incorrectas (el jugador debe evitarlas)</p>
                  <button onClick={() => handleArcadePalabras("incorrectas", [...arcadeConfig.palabras.incorrectas, { texto: "" }])}
                    className="text-xs text-purple-600 hover:underline">+ Agregar</button>
                </div>
                <div className="space-y-2">
                  {arcadeConfig.palabras.incorrectas.map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input value={p.texto}
                        onChange={e => {
                          const arr = [...arcadeConfig.palabras.incorrectas];
                          arr[i] = { texto: e.target.value };
                          handleArcadePalabras("incorrectas", arr);
                        }}
                        placeholder="Ej: gato"
                        className="flex-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-300" />
                      <button onClick={() => handleArcadePalabras("incorrectas", arcadeConfig.palabras.incorrectas.filter((_, j) => j !== i))}
                        className="text-gray-400 hover:text-red-500 text-xs px-1 flex-shrink-0">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Velocidad y spawn */}
              <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vel. mínima (px/s)</label>
                  <input type="number" value={arcadeConfig.palabras.velocidadMin}
                    onChange={e => handleArcadePalabras("velocidadMin", e.target.value)}
                    min={30} max={300}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Vel. máxima (px/s)</label>
                  <input type="number" value={arcadeConfig.palabras.velocidadMax}
                    onChange={e => handleArcadePalabras("velocidadMax", e.target.value)}
                    min={50} max={400}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Spawn cada (ms)</label>
                  <select value={arcadeConfig.palabras.spawnRate}
                    onChange={e => handleArcadePalabras("spawnRate", e.target.value)}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400">
                    {[1000,1500,1800,2000,2500,3000].map(v => <option key={v} value={v}>{v}ms</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Personaje / Spritesheet */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Personaje</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Velocidad del personaje (px/s)</label>
                <input type="number"
                  value={arcadeConfig.personaje.velocidad}
                  onChange={e => handleArcadePersonaje("velocidad", Number(e.target.value))}
                  min={100} max={600}
                  className="block w-40 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Spritesheet (opcional)
                  <span className="ml-1 text-xs text-gray-400 font-normal">— PNG con frames consecutivos</span>
                </label>
                <UploadAsset tipo="imagen" categoriaDefault="otros"
                  urlActual={arcadeConfig.personaje.spritesheet || ""}
                  onUrl={url => handleArcadePersonaje("spritesheet", url)} />
                {arcadeConfig.personaje.spritesheet && (
                  <button onClick={() => handleArcadePersonaje("spritesheet", null)}
                    className="text-xs text-red-400 hover:text-red-600">✕ Quitar spritesheet</button>
                )}
              </div>
              {arcadeConfig.personaje.spritesheet && (
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Configuración de frames</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Ancho de frame (px)</label>
                      <input type="number"
                        value={arcadeConfig.personaje.frameWidth}
                        onChange={e => handleArcadePersonaje("frameWidth", Number(e.target.value))}
                        min={8} max={256}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Alto de frame (px)</label>
                      <input type="number"
                        value={arcadeConfig.personaje.frameHeight}
                        onChange={e => handleArcadePersonaje("frameHeight", Number(e.target.value))}
                        min={8} max={256}
                        className="block w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400" />
                    </div>
                  </div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">Animaciones</p>
                  {["idle","walk","jump"].map(anim => (
                    <div key={anim} className="grid grid-cols-4 gap-2 items-center">
                      <span className="text-xs font-semibold text-gray-600 capitalize">{anim}</span>
                      {["start","end","frameRate"].map(field => (
                        <div key={field}>
                          <label className="block text-xs text-gray-400 mb-0.5">{field}</label>
                          <input type="number"
                            value={arcadeConfig.personaje.animaciones[anim][field]}
                            onChange={e => {
                              const anims = { ...arcadeConfig.personaje.animaciones };
                              anims[anim] = { ...anims[anim], [field]: Number(e.target.value) };
                              handleArcadePersonaje("animaciones", anims);
                            }}
                            min={0} max={field === "frameRate" ? 60 : 999}
                            className="block w-full rounded-lg border border-gray-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Editor de plataformas (solo plataformero) */}
            {submecanica === "plataformero" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Layout de plataformas</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Define dónde estarán las plataformas en pantalla. Si no modificas nada, el engine usa el layout por defecto.
                  </p>
                </div>
                <EditorPlataformas
                  plataformas={arcadeConfig.plataformas}
                  onChange={plats => setArcadeConfig(prev => ({ ...prev, plataformas: plats }))}
                  objetos={arcadeConfig.objetos ?? []}
                  onChangeObjetos={objs => setArcadeConfig(prev => ({ ...prev, objetos: objs }))}
                />
              </div>
            )}
          </div>
        )}

        {/* ── PASO 4: Revisar y publicar ── */}
        {paso === 4 && (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Resumen del juego</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {(tipoJuego === "arcade" ? [
                  ["Nombre",      arcadeConfig.nombre],
                  ["Tipo",        "🕹️ Arcade"],
                  ["Submecánica", SUBMECANICAS_ARCADE.find(s => s.id === submecanica)?.nombre],
                  ["Área",        AREAS.find(a => a.value === arcadeConfig.areaTerapeutica)?.label],
                  ["Dificultad",  NIVELES.find(n => n.value === arcadeConfig.nivelDificultad)?.label],
                  ["Edad",        `${arcadeConfig.edadMinima} - ${arcadeConfig.edadMaxima} años`],
                  ["Duración",    `${arcadeConfig.duracion}s · ${arcadeConfig.vidas} vidas`],
                  ["Palabras",    `${arcadeConfig.palabras.correctas.filter(p=>p.texto).length} correctas · ${arcadeConfig.palabras.incorrectas.filter(p=>p.texto).length} incorrectas`],
                  ["Puntaje",     `${arcadeConfig.puntajePorAcierto} pts/acierto · mín. ${arcadeConfig.puntajeMinimo}%`],
                  ["Tema",        TEMAS_ARCADE_UI.find(t => t.value === arcadeConfig.tema)?.label ?? "Espacial"],
                  ["Spritesheet", arcadeConfig.personaje.spritesheet ? "Sí" : "Procedural (generado)"],
                  ...(submecanica === "plataformero" ? [
                    ["Plataformas", arcadeConfig.plataformas ? `${arcadeConfig.plataformas.length} personalizadas` : "Layout por defecto"],
                    ["Objetos L2",  arcadeConfig.objetos?.length > 0
                      ? `${arcadeConfig.objetos.filter(o => o.tipo === "positivo").length} positivos · ${arcadeConfig.objetos.filter(o => o.tipo === "negativo").length} negativos`
                      : "Sin objetos"],
                  ] : []),
                ] : [
                  ["Nombre",     meta.nombre],
                  ["Mecánica",   MECANICAS.find(m => m.id === mecanica)?.nombre],
                  ["Área",       AREAS.find(a => a.value === meta.areaTerapeutica)?.label],
                  ["Dificultad", NIVELES.find(n => n.value === meta.nivelDificultad)?.label],
                  ["Edad",       `${meta.edadMinima} - ${meta.edadMaxima} años`],
                  ["Rondas",     `${rondas.length} en banco (${meta.rondasTotal} por sesión)`],
                  ["Puntaje",    `${meta.puntajePorAcierto} pts/acierto · mín. ${meta.puntajeMinimo}%`],
                  ["Modo",       meta.modoRondas === "aleatorio" ? "Aleatorio" : "Secuencial"],
                ]).map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-gray-400 font-medium w-24 flex-shrink-0">{k}:</span>
                    <span className="text-gray-700 dark:text-gray-300">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview del fondo (solo HTML5) */}
            {tipoJuego === "html5" && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Vista previa del tema</h3>
                <div className="h-24 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${visual.fondo.desde}, ${visual.fondo.hasta})` }}>
                  <span className="text-white font-bold text-lg drop-shadow">{meta.nombre || "Mi juego"}</span>
                </div>
              </div>
            )}

            {/* Publicar ahora */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center gap-3">
                {tipoJuego === "arcade" ? (
                  <input type="checkbox" id="publicarAhora"
                    checked={arcadeConfig.publicado}
                    onChange={e => setArcadeConfig(prev => ({ ...prev, publicado: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 rounded" />
                ) : (
                  <input type="checkbox" id="publicarAhora"
                    checked={meta.publicado}
                    onChange={e => setMeta(prev => ({ ...prev, publicado: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 rounded" />
                )}
                <div>
                  <label htmlFor="publicarAhora" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Publicar inmediatamente
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Si no lo publicas ahora, quedará como borrador y puedes publicarlo después desde Gestión de Juegos
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navegación entre pasos */}
        <div className="flex gap-3 mt-8">
          {paso > 1 && (
            <button onClick={() => setPaso(p => p - 1)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              <ArrowLeft className="h-4 w-4" />Atrás
            </button>
          )}

          {paso < 4 ? (
            <button onClick={() => { if (validarPaso()) setPaso(p => p + 1); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors ml-auto">
              Siguiente<ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={handlePublicar} disabled={guardando}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50 ml-auto">
              {guardando ? "Creando juego..." : <><Check className="h-4 w-4" />Crear juego</>}
            </button>
          )}
        </div>

      </div>
    </DashboardLayout>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// FORMULARIO DE RONDA (por mecánica)
// ═══════════════════════════════════════════════════════════════════════════════
const FormularioRonda = ({ mecanica, ronda, rondaIdx, onActualizar, onActualizarItem, onMarcarCorrecta }) => {

  // Instrucción compartida
  const CampoInstruccion = ({ campo = "textoInstruccion", placeholder = "¿Cuál no pertenece al grupo?" }) => (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Instrucción / pregunta</label>
      <input value={ronda[campo] || ""} onChange={e => onActualizar(rondaIdx, campo, e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
    </div>
  );

  // ── seleccion_intruso ───────────────────────────────────────────────────────
  if (mecanica === "seleccion_intruso") {
    return (
      <div className="space-y-4">
        <CampoInstruccion placeholder="¿Cuál no es un animal?" />
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Ítems — marca cuál es el intruso con 🔍
          </p>
          <div className="space-y-2">
            {(ronda.items || []).map((item, iIdx) => (
              <div key={item.id} className={`p-3 rounded-xl border transition-colors space-y-2 ${
                item.esIntruso ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
              }`}>
                <div className="flex items-center gap-2">
                  <input value={item.emoji} onChange={e => onActualizarItem(rondaIdx, iIdx, "emoji", e.target.value)}
                    placeholder="🐶" maxLength={2}
                    className="w-12 text-center rounded-lg border border-gray-200 dark:border-gray-600 px-1 py-1.5 text-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                  <input value={item.texto} onChange={e => onActualizarItem(rondaIdx, iIdx, "texto", e.target.value)}
                    placeholder="Nombre del elemento"
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                  <button onClick={() => onMarcarCorrecta(rondaIdx, iIdx)}
                    title="Marcar como intruso"
                    className={`w-8 h-8 rounded-lg text-sm transition-colors flex-shrink-0 ${
                      item.esIntruso ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500 hover:bg-orange-100"
                    }`}>
                    🔍
                  </button>
                </div>
                <UploadAsset tipo="imagen" categoriaDefault="otros"
                  urlActual={item.imagen || ""}
                  onUrl={url => onActualizarItem(rondaIdx, iIdx, "imagen", url)} />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            El elemento marcado con 🔍 naranja es el intruso.
          </p>
        </div>
      </div>
    );
  }

  // ── seleccion_multiple ──────────────────────────────────────────────────────
  if (mecanica === "seleccion_multiple") {
    return (
      <div className="space-y-4">
        <CampoInstruccion campo="pregunta" placeholder="¿Cuál animal empieza con /p/?" />
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Opciones — marca la respuesta correcta con ✓
          </p>
          <div className="space-y-2">
            {(ronda.opciones || []).map((op, oIdx) => (
              <div key={op.id} className={`p-3 rounded-xl border transition-colors space-y-2 ${
                op.correcta ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
              }`}>
                <div className="flex items-center gap-2">
                  <input value={op.emoji} onChange={e => onActualizarItem(rondaIdx, oIdx, "emoji", e.target.value)}
                    placeholder="🐶" maxLength={2}
                    className="w-12 text-center rounded-lg border border-gray-200 dark:border-gray-600 px-1 py-1.5 text-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                  <input value={op.texto} onChange={e => onActualizarItem(rondaIdx, oIdx, "texto", e.target.value)}
                    placeholder="Opción"
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                  <button onClick={() => onMarcarCorrecta(rondaIdx, oIdx)}
                    title="Marcar como correcta"
                    className={`w-8 h-8 rounded-lg text-sm transition-colors flex-shrink-0 font-bold ${
                      op.correcta ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 hover:bg-green-100"
                    }`}>
                    ✓
                  </button>
                </div>
                <UploadAsset tipo="imagen" categoriaDefault="otros"
                  urlActual={op.imagen || ""}
                  onUrl={url => onActualizarItem(rondaIdx, oIdx, "imagen", url)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── ordenar_elementos ───────────────────────────────────────────────────────
  if (mecanica === "ordenar_elementos") {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Palabra / frase objetivo</label>
          <input value={ronda.textoObjetivo || ""} onChange={e => onActualizar(rondaIdx, "textoObjetivo", e.target.value)}
            placeholder="mariposa"
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Imagen de apoyo (opcional)</label>
          <UploadAsset tipo="imagen" categoriaDefault="palabras"
            urlActual={ronda.imagenApoyo || ""}
            onUrl={url => onActualizar(rondaIdx, "imagenApoyo", url)} />
          <input value={ronda.imagenApoyo || ""} onChange={e => onActualizar(rondaIdx, "imagenApoyo", e.target.value)}
            placeholder="/games/assets/imagenes/palabras/mariposa.png"
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Elementos a ordenar — el orden en que los escribes es el orden correcto
          </p>
          <div className="space-y-2">
            {(ronda.elementos || []).map((el, eIdx) => (
              <div key={el.id} className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {eIdx + 1}
                </span>
                <input value={el.texto} onChange={e => onActualizarItem(rondaIdx, eIdx, "texto", e.target.value)}
                  placeholder={`Elemento ${eIdx + 1} (ej: ma)`}
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
              </div>
            ))}
          </div>
          <button onClick={() => {
            const nuevos = [...(ronda.elementos || []), elementoVacio((ronda.elementos?.length || 0) + 1)];
            onActualizar(rondaIdx, "elementos", nuevos);
          }} className="mt-2 text-xs text-purple-600 hover:underline">
            + Agregar elemento
          </button>
        </div>
      </div>
    );
  }

  // ── seleccion_secuencial ────────────────────────────────────────────────────
  if (mecanica === "seleccion_secuencial") {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Imagen principal (opcional)</label>
          <UploadAsset tipo="imagen" categoriaDefault="emociones"
            urlActual={ronda.imagen || ""}
            onUrl={url => onActualizar(rondaIdx, "imagen", url)} />
          <input value={ronda.imagen || ""} onChange={e => onActualizar(rondaIdx, "imagen", e.target.value)}
            placeholder="/games/assets/imagenes/emociones/alegre.png"
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1" />
        </div>
        {(ronda.pasos || []).map((paso, pIdx) => (
          <div key={pIdx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Paso {pIdx + 1}</p>
            <input value={paso.pregunta} onChange={e => {
              const pasos = [...ronda.pasos];
              pasos[pIdx] = { ...pasos[pIdx], pregunta: e.target.value };
              onActualizar(rondaIdx, "pasos", pasos);
            }} placeholder={`Pregunta del paso ${pIdx + 1}`}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <div className="space-y-2">
              {paso.opciones.map((op, oIdx) => (
                <div key={op.id} className={`p-2 rounded-xl border transition-colors space-y-1.5 ${
                  op.correcta ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50"
                }`}>
                  <div className="flex items-center gap-2">
                    <input value={op.emoji || ""} onChange={e => {
                      const pasos = [...ronda.pasos];
                      const opciones = [...pasos[pIdx].opciones];
                      opciones[oIdx] = { ...opciones[oIdx], emoji: e.target.value };
                      pasos[pIdx] = { ...pasos[pIdx], opciones };
                      onActualizar(rondaIdx, "pasos", pasos);
                    }} placeholder="🐶" maxLength={2}
                      className="w-10 text-center rounded-lg border border-gray-200 dark:border-gray-600 px-1 py-1.5 text-base bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none" />
                    <input value={op.texto} onChange={e => {
                      const pasos = [...ronda.pasos];
                      const opciones = [...pasos[pIdx].opciones];
                      opciones[oIdx] = { ...opciones[oIdx], texto: e.target.value };
                      pasos[pIdx] = { ...pasos[pIdx], opciones };
                      onActualizar(rondaIdx, "pasos", pasos);
                    }} placeholder="Opción"
                      className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none" />
                    <button onClick={() => {
                      const pasos = [...ronda.pasos];
                      const opciones = pasos[pIdx].opciones.map((o, j) => ({ ...o, correcta: j === oIdx }));
                      pasos[pIdx] = { ...pasos[pIdx], opciones };
                      onActualizar(rondaIdx, "pasos", pasos);
                    }} className={`w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0 ${
                      op.correcta ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}>✓</button>
                  </div>
                  <UploadAsset tipo="imagen" categoriaDefault="otros"
                    urlActual={op.imagen || ""}
                    onUrl={url => {
                      const pasos = [...ronda.pasos];
                      const opciones = [...pasos[pIdx].opciones];
                      opciones[oIdx] = { ...opciones[oIdx], imagen: url };
                      pasos[pIdx] = { ...pasos[pIdx], opciones };
                      onActualizar(rondaIdx, "pasos", pasos);
                    }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── tipeo ───────────────────────────────────────────────────────────────────
  if (mecanica === "tipeo") {
    const pistas = ronda.pistas || [];
    return (
      <div className="space-y-4">
        <CampoInstruccion placeholder="¿Cómo se llama esto?" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Emoji (si no hay imagen)</label>
            <input value={ronda.emoji || ""} onChange={e => onActualizar(rondaIdx, "emoji", e.target.value)}
              placeholder="🐶" maxLength={2}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-xl text-center focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Respuesta correcta <span className="text-red-500">*</span></label>
            <input value={ronda.textoRespuesta || ""} onChange={e => onActualizar(rondaIdx, "textoRespuesta", e.target.value)}
              placeholder="perro"
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Imagen (opcional)</label>
          <UploadAsset tipo="imagen" categoriaDefault="otros"
            urlActual={ronda.imagen || ""}
            onUrl={url => onActualizar(rondaIdx, "imagen", url)} />
          <input value={ronda.imagen || ""} onChange={e => onActualizar(rondaIdx, "imagen", e.target.value)}
            placeholder="/games/assets/imagenes/animales/perro.png"
            className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mt-1" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500">Pistas (opcional, de más fácil a más difícil)</label>
            <button onClick={() => onActualizar(rondaIdx, "pistas", [...pistas, ""])}
              className="text-xs text-purple-600 hover:underline">+ Agregar pista</button>
          </div>
          {pistas.map((p, pIdx) => (
            <div key={pIdx} className="flex items-center gap-2 mb-1.5">
              <span className="text-xs text-gray-400 w-4">{pIdx + 1}.</span>
              <input value={p} onChange={e => {
                const arr = [...pistas];
                arr[pIdx] = e.target.value;
                onActualizar(rondaIdx, "pistas", arr);
              }} placeholder={`Pista ${pIdx + 1}`}
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-400" />
              <button onClick={() => onActualizar(rondaIdx, "pistas", pistas.filter((_, i) => i !== pIdx))}
                className="text-gray-400 hover:text-red-500 text-xs px-1">✕</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── memoria ─────────────────────────────────────────────────────────────────
  if (mecanica === "memoria") {
    return (
      <div className="space-y-4">
        <CampoInstruccion placeholder="Encontrá los pares iguales" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500">
              Pares de cartas — cada par aparece dos veces en el tablero
            </p>
            <button onClick={() => onActualizar(rondaIdx, "pares", [...(ronda.pares || []), parMemoriaVacio()])}
              className="text-xs text-purple-600 hover:underline">+ Par</button>
          </div>
          <div className="space-y-2">
            {(ronda.pares || []).map((par, pIdx) => (
              <div key={par.id} className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 w-4 flex-shrink-0">{pIdx + 1}</span>
                  <input value={par.emoji || ""} onChange={e => {
                    const pares = [...ronda.pares];
                    pares[pIdx] = { ...pares[pIdx], emoji: e.target.value };
                    onActualizar(rondaIdx, "pares", pares);
                  }} placeholder="🐶" maxLength={2}
                    className="w-12 text-center rounded-lg border border-gray-200 dark:border-gray-600 px-1 py-1.5 text-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                  <input value={par.texto || ""} onChange={e => {
                    const pares = [...ronda.pares];
                    pares[pIdx] = { ...pares[pIdx], texto: e.target.value };
                    onActualizar(rondaIdx, "pares", pares);
                  }} placeholder="Texto visible"
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                  <button onClick={() => onActualizar(rondaIdx, "pares", ronda.pares.filter((_, i) => i !== pIdx))}
                    className="p-1 text-gray-400 hover:text-red-500 flex-shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <UploadAsset tipo="imagen" categoriaDefault="otros"
                  urlActual={par.imagen || ""}
                  onUrl={url => {
                    const pares = [...ronda.pares];
                    pares[pIdx] = { ...pares[pIdx], imagen: url };
                    onActualizar(rondaIdx, "pares", pares);
                  }} />
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Recomendado: 4-6 pares (8-12 cartas en total)
          </p>
        </div>
      </div>
    );
  }

  // ── emparejar ───────────────────────────────────────────────────────────────
  if (mecanica === "emparejar") {
    return (
      <div className="space-y-4">
        <CampoInstruccion placeholder="Uní cada elemento con su par" />
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500">Pares</p>
            <button onClick={() => onActualizar(rondaIdx, "pares", [...(ronda.pares || []), parEmparejarVacio()])}
              className="text-xs text-purple-600 hover:underline">+ Par</button>
          </div>
          <div className="space-y-3">
            {(ronda.pares || []).map((par, pIdx) => (
              <div key={pIdx} className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-600">Par {pIdx + 1}</span>
                  <button onClick={() => onActualizar(rondaIdx, "pares", ronda.pares.filter((_, i) => i !== pIdx))}
                    className="p-1 text-gray-400 hover:text-red-500">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {/* Izquierda */}
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 font-medium">← Izquierda</p>
                    <input value={par.izquierda.emoji || ""} onChange={e => {
                      const pares = [...ronda.pares];
                      pares[pIdx] = { ...pares[pIdx], izquierda: { ...pares[pIdx].izquierda, emoji: e.target.value } };
                      onActualizar(rondaIdx, "pares", pares);
                    }} placeholder="🐶" maxLength={2}
                      className="block w-full text-center rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                    <input value={par.izquierda.texto || ""} onChange={e => {
                      const pares = [...ronda.pares];
                      pares[pIdx] = { ...pares[pIdx], izquierda: { ...pares[pIdx].izquierda, texto: e.target.value } };
                      onActualizar(rondaIdx, "pares", pares);
                    }} placeholder="Texto / etiqueta"
                      className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                  </div>
                  {/* Derecha */}
                  <div className="space-y-1">
                    <p className="text-xs text-gray-400 font-medium">→ Derecha</p>
                    <input value={par.derecha.emoji || ""} onChange={e => {
                      const pares = [...ronda.pares];
                      pares[pIdx] = { ...pares[pIdx], derecha: { ...pares[pIdx].derecha, emoji: e.target.value } };
                      onActualizar(rondaIdx, "pares", pares);
                    }} placeholder="🔊" maxLength={2}
                      className="block w-full text-center rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-lg bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                    <input value={par.derecha.texto || ""} onChange={e => {
                      const pares = [...ronda.pares];
                      pares[pIdx] = { ...pares[pIdx], derecha: { ...pares[pIdx].derecha, texto: e.target.value } };
                      onActualizar(rondaIdx, "pares", pares);
                    }} placeholder="Texto / etiqueta"
                      className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 px-2 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">Recomendado: 3-5 pares por ronda</p>
        </div>
      </div>
    );
  }

  // ── constructor_historias ────────────────────────────────────────────────────
  if (mecanica === "constructor_historias") {
    const imagenes = ronda.imagenes || [];

    const actualizarImagen = (imgIdx, campo, valor) => {
      const imgs = imagenes.map((img, i) => i === imgIdx ? { ...img, [campo]: valor } : img);
      onActualizar(rondaIdx, "imagenes", imgs);
    };

    const actualizarOracion = (imgIdx, orIdx, campo, valor) => {
      const imgs = imagenes.map((img, i) => {
        if (i !== imgIdx) return img;
        const ors = img.oraciones.map((or, j) => {
          if (campo === "correcta") return { ...or, correcta: j === orIdx };
          return j === orIdx ? { ...or, [campo]: valor } : or;
        });
        return { ...img, oraciones: ors };
      });
      onActualizar(rondaIdx, "imagenes", imgs);
    };

    return (
      <div className="space-y-5">
        <CampoInstruccion placeholder="Ordena las imágenes y elige la oración de cada momento" />

        {/* Audio narración completa */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-gray-500">
            Audio narración completa
            <span className="ml-1 text-gray-400 font-normal">(opcional — se reproduce al completar bien la ronda)</span>
          </label>
          <UploadAsset tipo="audio" categoriaDefault="instrucciones"
            urlActual={ronda.audioHistoria || ""}
            onUrl={url => onActualizar(rondaIdx, "audioHistoria", url)} />
          {ronda.audioHistoria && (
            <button onClick={() => onActualizar(rondaIdx, "audioHistoria", null)}
              className="text-xs text-red-400 hover:text-red-600">✕ Quitar audio</button>
          )}
        </div>

        {/* Botón agregar imagen */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-500">
            Imágenes de la historia — {imagenes.length} en total (máx. 5)
          </p>
          {imagenes.length < 5 && (
            <button onClick={() => onActualizar(rondaIdx, "imagenes", [...imagenes, imagenHistoriaVacia(imagenes.length + 1)])}
              className="text-xs text-purple-600 hover:underline">+ Agregar imagen</button>
          )}
        </div>

        {/* Cada imagen con sus oraciones */}
        {imagenes.map((img, imgIdx) => (
          <div key={img.id} className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 space-y-3 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wide">
                Imagen {imgIdx + 1} — Posición {img.posicionCorrecta} en la historia
              </span>
              {imagenes.length > 2 && (
                <button
                  onClick={() => {
                    const imgs = imagenes.filter((_, i) => i !== imgIdx)
                      .map((img, i) => ({ ...img, posicionCorrecta: i + 1 }));
                    onActualizar(rondaIdx, "imagenes", imgs);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Upload imagen */}
            <UploadAsset tipo="imagen" categoriaDefault="otros"
              urlActual={img.imagen || ""}
              onUrl={url => actualizarImagen(imgIdx, "imagen", url)} />
            {img.imagen && (
              <img src={img.imagen} alt="" className="w-24 h-24 object-cover rounded-xl border border-gray-200" />
            )}

            {/* Oraciones */}
            <p className="text-xs font-medium text-gray-500 mt-1">
              Oraciones — marca cuál describe esta imagen
            </p>
            <div className="space-y-2">
              {(img.oraciones || []).map((or, orIdx) => (
                <div key={or.id} className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                  or.correcta ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                }`}>
                  <button onClick={() => actualizarOracion(imgIdx, orIdx, "correcta", true)}
                    title="Marcar como correcta"
                    className={`w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0 transition-colors ${
                      or.correcta ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 hover:bg-green-100"
                    }`}>✓</button>
                  <input value={or.texto}
                    onChange={e => actualizarOracion(imgIdx, orIdx, "texto", e.target.value)}
                    placeholder={or.correcta ? "Oración correcta" : `Oración incorrecta ${orIdx}`}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-purple-400" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default GameBuilder;
