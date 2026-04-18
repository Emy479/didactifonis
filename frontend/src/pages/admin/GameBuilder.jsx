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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { crearJuegoBuilder } from "../../api/gameBuilder";
import {
  ArrowLeft, ArrowRight, Gamepad2, Check,
  Plus, Trash2, ChevronDown, ChevronUp,
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

// ── Item vacío por mecánica ───────────────────────────────────────────────────
const itemVacio = () => ({
  id: `item_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
  emoji: "",
  texto: "",
  audioNombre: null,
  esIntruso: false,
  correcta: false,
});

const opcionVacia = () => ({
  id: `op_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
  emoji: "",
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
            { ...opcionVacia(), correcta: true },
            opcionVacia(),
            opcionVacia(),
          ],
        },
        {
          pregunta: "",
          audioPregunta: null,
          opciones: [
            { ...opcionVacia(), correcta: true },
            opcionVacia(),
            opcionVacia(),
          ],
        },
      ],
    };
  }
  return {};
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
  const [mecanica,    setMecanica]    = useState(null);
  const [meta,        setMeta]        = useState({
    nombre: "", descripcion: "", instrucciones: "",
    areaTerapeutica: "semantica", nivelDificultad: "basico",
    edadMinima: 4, edadMaxima: 10,
    rondasTotal: 10, intentosPorRonda: 2,
    puntajePorAcierto: 10, puntajeMinimo: 60,
    modoRondas: "aleatorio", publicado: false,
  });
  const [visual,      setVisual]      = useState({ tema: "default", fondo: { tipo: "gradiente", desde: "#dbeafe", hasta: "#ede9fe" } });
  const [rondas,      setRondas]      = useState([]);
  const [rondaAbierta, setRondaAbierta] = useState(0);

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

  // ── Validar paso actual ─────────────────────────────────────────────────────
  const validarPaso = () => {
    if (paso === 1 && !mecanica) {
      toast.advertencia("Elige una mecánica para continuar");
      return false;
    }
    if (paso === 2) {
      if (!meta.nombre.trim()) { toast.advertencia("El nombre del juego es obligatorio"); return false; }
      if (!meta.areaTerapeutica) { toast.advertencia("Elige un área terapéutica"); return false; }
    }
    if (paso === 3 && rondas.length === 0) {
      toast.advertencia("Agrega al menos una ronda");
      return false;
    }
    return true;
  };

  // ── Publicar ────────────────────────────────────────────────────────────────
  const handlePublicar = async () => {
    setGuardando(true);
    try {
      const payload = {
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
        },
        rondas,
      };
      const res = await crearJuegoBuilder(payload);
      toast.exito(`¡Juego "${meta.nombre}" creado correctamente!`);
      navigate("/admin/juegos");
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al crear el juego");
    } finally {
      setGuardando(false);
    }
  };

  // ── Indicador de pasos ──────────────────────────────────────────────────────
  const pasos = ["Mecánica", "Configuración", "Rondas", "Publicar"];

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">

        {/* Cabecera */}
        <div className="mb-6">
          <button onClick={() => navigate("/admin/juegos")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 text-sm transition-colors">
            <ArrowLeft className="h-4 w-4" />Volver a juegos
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Gamepad2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Game Builder</h1>
              <p className="text-gray-500 text-sm mt-0.5">Crea un juego nuevo sin escribir código</p>
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
                  completado ? "bg-green-100 text-green-700" :
                              "bg-gray-100 text-gray-400"
                }`}>
                  {completado ? <Check className="h-3.5 w-3.5" /> : <span>{num}</span>}
                  {nombre}
                </div>
                {i < pasos.length - 1 && <div className="w-6 h-px bg-gray-300 flex-shrink-0" />}
              </div>
            );
          })}
        </div>

        {/* ── PASO 1: Mecánica ── */}
        {paso === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-2">¿Qué tipo de juego querés crear?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {MECANICAS.map(m => (
                <button key={m.id} onClick={() => elegirMecanica(m.id)}
                  className={`p-5 rounded-2xl border-2 text-left transition-all ${
                    mecanica === m.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}>
                  <div className="text-3xl mb-2">{m.emoji}</div>
                  <p className="font-semibold text-gray-900 mb-1">{m.nombre}</p>
                  <p className="text-sm text-gray-500 mb-2">{m.descripcion}</p>
                  <p className="text-xs text-gray-400">Ej: {m.ejemplos}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── PASO 2: Configuración ── */}
        {paso === 2 && (
          <div className="space-y-6">
            {/* Metadatos */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Información del juego</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del juego <span className="text-red-500">*</span>
                </label>
                <input name="nombre" value={meta.nombre} onChange={handleMeta}
                  placeholder="Ej: La granja de los sonidos"
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea name="descripcion" value={meta.descripcion} onChange={handleMeta}
                  rows={2} placeholder="Breve descripción del juego..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Área terapéutica</label>
                  <select name="areaTerapeutica" value={meta.areaTerapeutica} onChange={handleMeta}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {AREAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dificultad</label>
                  <select name="nivelDificultad" value={meta.nivelDificultad} onChange={handleMeta}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    {NIVELES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edad mínima</label>
                  <input type="number" name="edadMinima" value={meta.edadMinima} onChange={handleMeta}
                    min={2} max={18}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Edad máxima</label>
                  <input type="number" name="edadMaxima" value={meta.edadMaxima} onChange={handleMeta}
                    min={2} max={18}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rondas por sesión</label>
                  <input type="number" name="rondasTotal" value={meta.rondasTotal} onChange={handleMeta}
                    min={1} max={50}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Intentos por ronda</label>
                  <select name="intentosPorRonda" value={meta.intentosPorRonda} onChange={handleMeta}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value={1}>1 intento</option>
                    <option value={2}>2 intentos</option>
                    <option value={3}>3 intentos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puntos por acierto</label>
                  <input type="number" name="puntajePorAcierto" value={meta.puntajePorAcierto} onChange={handleMeta}
                    min={1} max={100}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">% mínimo para aprobar</label>
                  <input type="number" name="puntajeMinimo" value={meta.puntajeMinimo} onChange={handleMeta}
                    min={0} max={100}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
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

            {/* Visual */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Tema visual</h3>
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
          </div>
        )}

        {/* ── PASO 3: Rondas ── */}
        {paso === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {rondas.length} ronda{rondas.length !== 1 ? "s" : ""} en el banco
                {meta.rondasTotal < rondas.length && (
                  <span className="ml-1 text-green-600">
                    · Se seleccionarán {meta.rondasTotal} al azar
                  </span>
                )}
              </p>
              <button onClick={agregarRonda}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors">
                <Plus className="h-4 w-4" />Agregar ronda
              </button>
            </div>

            {rondas.map((ronda, rIdx) => (
              <div key={rIdx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                {/* Header de ronda */}
                <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100 cursor-pointer"
                  onClick={() => setRondaAbierta(rondaAbierta === rIdx ? -1 : rIdx)}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {rIdx + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {(ronda.textoInstruccion || ronda.pregunta || ronda.textoObjetivo || `Ronda ${rIdx + 1}`).slice(0, 50) || `Ronda ${rIdx + 1}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); eliminarRonda(rIdx); }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    {rondaAbierta === rIdx
                      ? <ChevronUp className="h-4 w-4 text-gray-400" />
                      : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>

                {/* Contenido de ronda */}
                {rondaAbierta === rIdx && (
                  <div className="p-5 space-y-4">
                    <FormularioRonda
                      mecanica={mecanica}
                      ronda={ronda}
                      rondaIdx={rIdx}
                      onActualizar={actualizarRonda}
                      onActualizarItem={actualizarItem}
                      onMarcarCorrecta={marcarCorrecta}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── PASO 4: Revisar y publicar ── */}
        {paso === 4 && (
          <div className="space-y-4">
            {/* Resumen */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Resumen del juego</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Nombre",     meta.nombre],
                  ["Mecánica",   MECANICAS.find(m => m.id === mecanica)?.nombre],
                  ["Área",       AREAS.find(a => a.value === meta.areaTerapeutica)?.label],
                  ["Dificultad", NIVELES.find(n => n.value === meta.nivelDificultad)?.label],
                  ["Edad",       `${meta.edadMinima} - ${meta.edadMaxima} años`],
                  ["Rondas",     `${rondas.length} en banco (${meta.rondasTotal} por sesión)`],
                  ["Puntaje",    `${meta.puntajePorAcierto} pts/acierto · mín. ${meta.puntajeMinimo}%`],
                  ["Modo",       meta.modoRondas === "aleatorio" ? "Aleatorio" : "Secuencial"],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-gray-400 font-medium w-24 flex-shrink-0">{k}:</span>
                    <span className="text-gray-700">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview del fondo */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Vista previa del tema</h3>
              <div className="h-24 rounded-xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${visual.fondo.desde}, ${visual.fondo.hasta})` }}>
                <span className="text-white font-bold text-lg drop-shadow">{meta.nombre || "Mi juego"}</span>
              </div>
            </div>

            {/* Publicar ahora */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="publicarAhora"
                  checked={meta.publicado}
                  onChange={e => setMeta(prev => ({ ...prev, publicado: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded" />
                <div>
                  <label htmlFor="publicarAhora" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Publicar inmediatamente
                  </label>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Si no lo publicás ahora, quedará como borrador y podés publicarlo después desde Gestión de Juegos
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
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
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
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
    </div>
  );

  // ── seleccion_intruso ───────────────────────────────────────────────────────
  if (mecanica === "seleccion_intruso") {
    return (
      <div className="space-y-4">
        <CampoInstruccion placeholder="¿Cuál no es un animal?" />
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Ítems — marca cuál es el intruso con el botón 🔍
          </p>
          <div className="space-y-2">
            {(ronda.items || []).map((item, iIdx) => (
              <div key={item.id} className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                item.esIntruso ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-gray-50"
              }`}>
                <input value={item.emoji} onChange={e => onActualizarItem(rondaIdx, iIdx, "emoji", e.target.value)}
                  placeholder="🐶" maxLength={2}
                  className="w-12 text-center rounded-lg border border-gray-200 px-1 py-1.5 text-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-400" />
                <input value={item.texto} onChange={e => onActualizarItem(rondaIdx, iIdx, "texto", e.target.value)}
                  placeholder="Nombre del elemento"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-400" />
                <button onClick={() => onMarcarCorrecta(rondaIdx, iIdx)}
                  title="Marcar como intruso"
                  className={`w-8 h-8 rounded-lg text-sm transition-colors flex-shrink-0 ${
                    item.esIntruso ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500 hover:bg-orange-100"
                  }`}>
                  🔍
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            El elemento marcado con 🔍 naranja es el intruso. Toca el botón para cambiarlo.
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
              <div key={op.id} className={`flex items-center gap-2 p-3 rounded-xl border transition-colors ${
                op.correcta ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50"
              }`}>
                <input value={op.emoji} onChange={e => onActualizarItem(rondaIdx, oIdx, "emoji", e.target.value)}
                  placeholder="🐶" maxLength={2}
                  className="w-12 text-center rounded-lg border border-gray-200 px-1 py-1.5 text-lg bg-white focus:outline-none focus:ring-1 focus:ring-purple-400" />
                <input value={op.texto} onChange={e => onActualizarItem(rondaIdx, oIdx, "texto", e.target.value)}
                  placeholder="Opción"
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-400" />
                <button onClick={() => onMarcarCorrecta(rondaIdx, oIdx)}
                  title="Marcar como correcta"
                  className={`w-8 h-8 rounded-lg text-sm transition-colors flex-shrink-0 font-bold ${
                    op.correcta ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500 hover:bg-green-100"
                  }`}>
                  ✓
                </button>
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
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">URL imagen de apoyo (opcional)</label>
          <input value={ronda.imagenApoyo || ""} onChange={e => onActualizar(rondaIdx, "imagenApoyo", e.target.value)}
            placeholder="/games/assets/imagenes/palabras/mariposa.png"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Elementos a ordenar — el orden en que los escribís es el orden correcto
          </p>
          <div className="space-y-2">
            {(ronda.elementos || []).map((el, eIdx) => (
              <div key={el.id} className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 bg-gray-50">
                <span className="w-6 h-6 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {eIdx + 1}
                </span>
                <input value={el.texto} onChange={e => onActualizarItem(rondaIdx, eIdx, "texto", e.target.value)}
                  placeholder={`Elemento ${eIdx + 1} (ej: ma)`}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-purple-400" />
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
          <label className="block text-xs font-medium text-gray-500 mb-1">URL imagen principal (opcional)</label>
          <input value={ronda.imagen || ""} onChange={e => onActualizar(rondaIdx, "imagen", e.target.value)}
            placeholder="/games/assets/imagenes/emociones/alegre.png"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
        </div>
        {(ronda.pasos || []).map((paso, pIdx) => (
          <div key={pIdx} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Paso {pIdx + 1}</p>
            <input value={paso.pregunta} onChange={e => {
              const pasos = [...ronda.pasos];
              pasos[pIdx] = { ...pasos[pIdx], pregunta: e.target.value };
              onActualizar(rondaIdx, "pasos", pasos);
            }} placeholder={`Pregunta del paso ${pIdx + 1}`}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
            <div className="space-y-2">
              {paso.opciones.map((op, oIdx) => (
                <div key={op.id} className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                  op.correcta ? "border-green-400 bg-green-50" : "border-gray-200 bg-gray-50"
                }`}>
                  <input value={op.texto} onChange={e => {
                    const pasos = [...ronda.pasos];
                    const opciones = [...pasos[pIdx].opciones];
                    opciones[oIdx] = { ...opciones[oIdx], texto: e.target.value };
                    pasos[pIdx] = { ...pasos[pIdx], opciones };
                    onActualizar(rondaIdx, "pasos", pasos);
                  }} placeholder="Opción"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm bg-white focus:outline-none" />
                  <button onClick={() => {
                    const pasos = [...ronda.pasos];
                    const opciones = pasos[pIdx].opciones.map((o, j) => ({ ...o, correcta: j === oIdx }));
                    pasos[pIdx] = { ...pasos[pIdx], opciones };
                    onActualizar(rondaIdx, "pasos", pasos);
                  }} className={`w-7 h-7 rounded-lg text-xs font-bold flex-shrink-0 ${
                    op.correcta ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                  }`}>✓</button>
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
