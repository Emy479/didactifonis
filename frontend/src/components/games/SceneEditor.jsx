/**
 * SceneEditor — Editor visual de rondas estilo Phaser Editor
 * 3 paneles: Librería de assets | Canvas del juego | Inspector
 */

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Trash2, Upload, Image as ImageIcon,
  Volume2, Info, X,
} from "lucide-react";
import { subirAsset, listarAssets } from "../../api/gameBuilder";

// ── Categorías ────────────────────────────────────────────────────────────────
const CATS_IMAGEN = ["animales","frutas","transporte","ropa","hogar","emociones","fondos","palabras","colores","numeros","otros"];
const CATS_AUDIO  = ["palabras","fonemas","silabas","instrucciones","otros"];

const TEMAS = [
  { value: "default",    desde: "#dbeafe", hasta: "#ede9fe" },
  { value: "naturaleza", desde: "#d1fae5", hasta: "#a7f3d0" },
  { value: "oceano",     desde: "#cffafe", hasta: "#a5f3fc" },
  { value: "fiesta",     desde: "#fef9c3", hasta: "#fde68a" },
  { value: "espacial",   desde: "#ede9fe", hasta: "#ddd6fe" },
  { value: "noche",      desde: "#1e1b4b", hasta: "#312e81" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const fondoStyle = (visual) => {
  const f = visual?.fondo;
  if (!f) return { background: "linear-gradient(135deg, #dbeafe, #ede9fe)" };
  if (f.tipo === "color")  return { background: f.color || "#dbeafe" };
  if (f.tipo === "imagen") return { backgroundImage: `url(${f.url})`, backgroundSize: "cover", backgroundPosition: "center" };
  return { background: `linear-gradient(${f.direccion || "135deg"}, ${f.desde || "#dbeafe"}, ${f.hasta || "#ede9fe"})` };
};

const getItemData = (rondas, sel) => {
  if (!sel) return null;
  const r = rondas[sel.rondaIdx];
  if (!r) return null;
  switch (sel.kind) {
    case "item":        return r.items?.[sel.idx];
    case "opcion":      return r.opciones?.[sel.idx];
    case "elemento":    return r.elementos?.[sel.idx];
    case "par":         return r.pares?.[sel.idx];
    case "izquierda":   return r.pares?.[sel.idx]?.izquierda;
    case "derecha":     return r.pares?.[sel.idx]?.derecha;
    case "tipeo":       return r;
    case "paso_opcion": return r.pasos?.[sel.pasoIdx]?.opciones?.[sel.idx];
    default:            return null;
  }
};

// ── Tarjeta de ítem en el canvas ──────────────────────────────────────────────
const ItemCard = ({ item, selected, highlight, label, onClick, onDropImage, compact = false }) => {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"));
      if (data.tipo === "imagen") onDropImage(data.url);
    } catch {}
  };

  return (
    <div
      onClick={onClick}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative rounded-xl border-2 cursor-pointer transition-all select-none
        ${compact ? "p-1.5 min-h-[60px]" : "p-2 min-h-[80px]"}
        flex flex-col items-center justify-center gap-1
        ${selected           ? "border-blue-500 ring-2 ring-blue-300 bg-white shadow-lg scale-[1.03]"
        : highlight === "intruso" ? "border-orange-400 bg-orange-50/90"
        : highlight === "correct" ? "border-green-400 bg-green-50/90"
        : dragOver           ? "border-purple-400 bg-purple-50 scale-[1.02]"
        : "border-white/60 bg-white/80 hover:border-purple-300 hover:shadow-md"}`}
    >
      {highlight === "intruso" && (
        <span className="absolute -top-1.5 -right-1.5 bg-orange-500 text-white text-[9px] font-bold px-1 rounded-full">🔍</span>
      )}
      {highlight === "correct" && (
        <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-white text-[9px] font-bold px-1 rounded-full">✓</span>
      )}

      {item?.imagen ? (
        <img src={item.imagen} alt="" className={`object-contain ${compact ? "w-8 h-8" : "w-12 h-12"}`} />
      ) : item?.emoji ? (
        <span className={compact ? "text-2xl" : "text-3xl"}>{item.emoji}</span>
      ) : (
        <div className={`rounded-lg border-2 border-dashed flex items-center justify-center
          ${dragOver ? "border-purple-400 bg-purple-50" : "border-gray-300 bg-gray-50"}
          ${compact ? "w-8 h-8" : "w-12 h-12"}`}>
          <ImageIcon className={`text-gray-300 ${compact ? "h-3.5 w-3.5" : "h-5 w-5"}`} />
        </div>
      )}

      {item?.texto && (
        <p className={`text-center font-medium line-clamp-1 text-gray-800 ${compact ? "text-[10px]" : "text-xs"}`}>
          {item.texto}
        </p>
      )}
      {label && !item?.texto && (
        <p className="text-[10px] text-gray-400 text-center">{label}</p>
      )}
      {(item?.audioNombre || item?.audio) && (
        <span className="absolute bottom-0.5 right-0.5">
          <Volume2 className="h-2.5 w-2.5 text-blue-400" />
        </span>
      )}

      {dragOver && (
        <div className="absolute inset-0 rounded-xl bg-purple-100/80 flex items-center justify-center pointer-events-none">
          <span className="text-[11px] font-bold text-purple-700">Soltar aquí</span>
        </div>
      )}
    </div>
  );
};

// ── Canvas tipeo (necesita su propio estado de dragOver) ──────────────────────
const TipeoCanvas = ({ ronda, selected, onSelect, onDropImage }) => {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`relative rounded-xl border-2 cursor-pointer transition-all p-4 flex flex-col items-center gap-2 min-w-[120px]
          ${selected  ? "border-blue-500 ring-2 ring-blue-300 bg-white shadow-lg"
          : dragOver  ? "border-purple-400 bg-purple-50"
          : "border-white/60 bg-white/80 hover:border-purple-300"}`}
        onClick={onSelect}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          try {
            const data = JSON.parse(e.dataTransfer.getData("application/json"));
            if (data.tipo === "imagen") onDropImage(data.url);
          } catch {}
        }}
      >
        {ronda.imagen ? (
          <img src={ronda.imagen} alt="" className="w-20 h-20 object-contain" />
        ) : ronda.emoji ? (
          <span className="text-5xl">{ronda.emoji}</span>
        ) : (
          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <ImageIcon className="h-8 w-8 text-gray-300" />
          </div>
        )}
        {dragOver && (
          <div className="absolute inset-0 rounded-xl bg-purple-100/80 flex items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-purple-700">Soltar aquí</span>
          </div>
        )}
      </div>
      <div className="bg-white/80 rounded-xl px-4 py-2 min-w-[160px] text-center">
        {ronda.textoRespuesta ? (
          <div className="flex gap-1 justify-center">
            {ronda.textoRespuesta.split("").map((_, i) => (
              <span key={i} className="w-5 h-6 border-b-2 border-gray-400 inline-block" />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400">_ _ _ _</p>
        )}
      </div>
    </div>
  );
};

// ── Canvas por mecánica ────────────────────────────────────────────────────────
const CanvasContent = ({ mecanica, ronda, rondaIdx, seleccion, onSelect, onDropImage }) => {
  if (!ronda) return null;

  const mkSel  = (kind, idx, pasoIdx) => ({ kind, rondaIdx, idx, pasoIdx });
  const isSel  = (kind, idx, pasoIdx) =>
    seleccion?.kind === kind &&
    seleccion?.rondaIdx === rondaIdx &&
    seleccion?.idx === idx &&
    (pasoIdx === undefined || seleccion?.pasoIdx === pasoIdx);

  if (mecanica === "seleccion_intruso") {
    return (
      <div className="grid grid-cols-3 gap-2">
        {(ronda.items || []).map((item, idx) => (
          <ItemCard key={item.id} item={item}
            selected={isSel("item", idx)}
            highlight={item.esIntruso ? "intruso" : null}
            onClick={() => onSelect(mkSel("item", idx))}
            onDropImage={(url) => onDropImage(mkSel("item", idx), url)}
          />
        ))}
      </div>
    );
  }

  if (mecanica === "seleccion_multiple") {
    return (
      <div className="grid grid-cols-2 gap-2">
        {(ronda.opciones || []).map((op, idx) => (
          <ItemCard key={op.id} item={op}
            selected={isSel("opcion", idx)}
            highlight={op.correcta ? "correct" : null}
            onClick={() => onSelect(mkSel("opcion", idx))}
            onDropImage={(url) => onDropImage(mkSel("opcion", idx), url)}
          />
        ))}
      </div>
    );
  }

  if (mecanica === "memoria") {
    return (
      <div>
        <p className="text-xs text-center text-white/70 mb-2">Pares — cada uno aparece dos veces</p>
        <div className="grid grid-cols-4 gap-1.5">
          {(ronda.pares || []).map((par, idx) => (
            <ItemCard key={par.id} item={par} compact
              selected={isSel("par", idx)}
              label={`Par ${idx + 1}`}
              onClick={() => onSelect(mkSel("par", idx))}
              onDropImage={(url) => onDropImage(mkSel("par", idx), url)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (mecanica === "emparejar") {
    return (
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-[11px] text-center text-white/70 mb-1">Izquierda</p>
          {(ronda.pares || []).map((par, idx) => (
            <ItemCard key={par.izquierda.id} item={par.izquierda} compact
              selected={isSel("izquierda", idx)}
              onClick={() => onSelect(mkSel("izquierda", idx))}
              onDropImage={(url) => onDropImage(mkSel("izquierda", idx), url)}
            />
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] text-center text-white/70 mb-1">Derecha</p>
          {(ronda.pares || []).map((par, idx) => (
            <ItemCard key={par.derecha.id} item={par.derecha} compact
              selected={isSel("derecha", idx)}
              onClick={() => onSelect(mkSel("derecha", idx))}
              onDropImage={(url) => onDropImage(mkSel("derecha", idx), url)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (mecanica === "tipeo") {
    return (
      <TipeoCanvas
        ronda={ronda}
        selected={isSel("tipeo", 0)}
        onSelect={() => onSelect(mkSel("tipeo", 0))}
        onDropImage={(url) => onDropImage(mkSel("tipeo", 0), url)}
      />
    );
  }

  if (mecanica === "ordenar_elementos") {
    return (
      <div className="space-y-3">
        {ronda.imagenApoyo && (
          <div className="flex justify-center">
            <img src={ronda.imagenApoyo} alt="" className="h-16 object-contain rounded-lg" />
          </div>
        )}
        <div className="flex flex-wrap gap-2 justify-center">
          {(ronda.elementos || []).map((el, idx) => (
            <div
              key={el.id}
              onClick={() => onSelect(mkSel("elemento", idx))}
              className={`px-4 py-3 rounded-xl border-2 cursor-pointer transition-all font-medium text-sm
                ${isSel("elemento", idx)
                  ? "border-blue-500 ring-2 ring-blue-300 bg-white shadow-lg"
                  : "border-white/60 bg-white/80 hover:border-purple-300"}`}
            >
              {el.texto || <span className="text-gray-400">Elemento {idx + 1}</span>}
            </div>
          ))}
        </div>
        <div className="border-2 border-dashed border-white/40 rounded-xl p-2 text-center">
          <p className="text-xs text-white/50">Zona de ordenado</p>
        </div>
      </div>
    );
  }

  if (mecanica === "seleccion_secuencial") {
    return (
      <div className="space-y-3">
        {ronda.imagen && (
          <div className="flex justify-center">
            <img src={ronda.imagen} alt="" className="h-14 object-contain rounded-lg" />
          </div>
        )}
        {(ronda.pasos || []).map((paso, pIdx) => (
          <div key={pIdx} className="space-y-1.5">
            <p className="text-[11px] text-white/70 text-center">
              Paso {pIdx + 1}: {paso.pregunta || "..."}
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {(paso.opciones || []).map((op, oIdx) => (
                <ItemCard key={op.id} item={op} compact
                  selected={isSel("paso_opcion", oIdx, pIdx)}
                  highlight={op.correcta ? "correct" : null}
                  onClick={() => onSelect(mkSel("paso_opcion", oIdx, pIdx))}
                  onDropImage={(url) => onDropImage(mkSel("paso_opcion", oIdx, pIdx), url)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

// ── Inspector ─────────────────────────────────────────────────────────────────
const Inspector = ({ mecanica, rondas, rondaIdx, seleccion, onCampo, onMarcar, visual, onCambiarTema }) => {
  const ronda = rondas[rondaIdx];
  const item  = getItemData(rondas, seleccion);

  // Sin selección → instrucción + tema
  if (!seleccion || !item) {
    const instrCampo = ronda?.textoInstruccion !== undefined ? "textoInstruccion"
                     : ronda?.pregunta         !== undefined ? "pregunta"
                     : "textoObjetivo";
    return (
      <div className="p-4 space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ronda {rondaIdx + 1}
          </p>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Instrucción</label>
          <textarea
            value={ronda?.[instrCampo] || ""}
            onChange={e => onCampo({ kind: "ronda", rondaIdx }, instrCampo, e.target.value)}
            rows={3}
            placeholder="Instrucción para el jugador..."
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Fondo del juego</label>
          <div className="grid grid-cols-3 gap-1.5">
            {TEMAS.map(t => (
              <button
                key={t.value}
                onClick={() => onCambiarTema(t.value)}
                title={t.value}
                className={`h-8 rounded-lg transition-all border-2 ${
                  visual?.tema === t.value
                    ? "border-purple-500 scale-[1.06]"
                    : "border-transparent hover:border-gray-300"
                }`}
                style={{ background: `linear-gradient(135deg, ${t.desde}, ${t.hasta})` }}
              />
            ))}
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
          <div className="flex gap-2 items-start">
            <Info className="h-3.5 w-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Haz clic en un elemento del canvas para editarlo,
              o arrastra imágenes desde la librería.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const campo = (c) => item?.[c] ?? "";

  const hasEmoji      = ["item","opcion","par","izquierda","derecha","tipeo"].includes(seleccion.kind);
  const hasTexto      = !["tipeo","elemento"].includes(seleccion.kind);
  const hasTextoResp  = seleccion.kind === "tipeo";
  const hasTextoElem  = seleccion.kind === "elemento";
  const hasImagen     = ["item","opcion","par","izquierda","derecha","tipeo"].includes(seleccion.kind);
  const hasEsIntruso  = seleccion.kind === "item" && mecanica === "seleccion_intruso";
  const hasEsCorrecta = (seleccion.kind === "opcion" && mecanica === "seleccion_multiple") ||
                        (seleccion.kind === "paso_opcion");

  const kindLabel = {
    item: "Ítem", opcion: "Opción", par: "Par",
    izquierda: "Izquierda", derecha: "Derecha",
    elemento: "Elemento", tipeo: "Estímulo",
    paso_opcion: `Paso ${(seleccion.pasoIdx ?? 0) + 1} · Opción`,
  }[seleccion.kind] || "Item";

  const imagenVal = seleccion.kind === "tipeo" ? (ronda?.imagen || "") : campo("imagen");

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{kindLabel}</p>
        <button onClick={() => onCampo(null)} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Emoji */}
      {hasEmoji && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Emoji</label>
          <input
            value={campo("emoji")}
            onChange={e => onCampo(seleccion, "emoji", e.target.value)}
            placeholder="🐶" maxLength={2}
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-2xl text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      )}

      {/* Texto / etiqueta */}
      {hasTexto && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Texto / Etiqueta</label>
          <input
            value={campo("texto")}
            onChange={e => onCampo(seleccion, "texto", e.target.value)}
            placeholder="Nombre del elemento"
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      )}

      {/* Respuesta correcta (tipeo) */}
      {hasTextoResp && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Respuesta correcta</label>
          <input
            value={ronda?.textoRespuesta || ""}
            onChange={e => onCampo(seleccion, "textoRespuesta", e.target.value)}
            placeholder="perro"
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      )}

      {/* Texto elemento (ordenar) */}
      {hasTextoElem && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Texto del elemento</label>
          <input
            value={campo("texto")}
            onChange={e => onCampo(seleccion, "texto", e.target.value)}
            placeholder="ma"
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>
      )}

      {/* Imagen */}
      {hasImagen && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Imagen</label>
          {imagenVal && (
            <img
              src={imagenVal}
              alt=""
              className="w-16 h-16 object-contain rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 mb-1.5"
            />
          )}
          <input
            value={imagenVal}
            onChange={e => onCampo(seleccion, "imagen", e.target.value)}
            placeholder="/games/assets/..."
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
          {!imagenVal && (
            <p className="text-[10px] text-gray-400 mt-1">
              Arrastra una imagen de la librería para asignarla
            </p>
          )}
        </div>
      )}

      {/* Audio */}
      {hasImagen && (
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Audio</label>
          <input
            value={campo("audioNombre") || campo("audio") || ""}
            onChange={e => {
              const key = item?.audioNombre !== undefined ? "audioNombre" : "audio";
              onCampo(seleccion, key, e.target.value || null);
            }}
            placeholder="/games/assets/audios/..."
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
        </div>
      )}

      {/* Es intruso */}
      {hasEsIntruso && (
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <input
            type="checkbox" id="esIntruso"
            checked={!!item?.esIntruso}
            onChange={() => onMarcar(seleccion)}
            className="w-4 h-4 text-orange-500 rounded"
          />
          <label htmlFor="esIntruso" className="text-sm font-medium text-orange-700 dark:text-orange-400 cursor-pointer">
            Es el intruso 🔍
          </label>
        </div>
      )}

      {/* Es correcta */}
      {hasEsCorrecta && (
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <input
            type="checkbox" id="esCorrecta"
            checked={!!item?.correcta}
            onChange={() => onMarcar(seleccion)}
            className="w-4 h-4 text-green-500 rounded"
          />
          <label htmlFor="esCorrecta" className="text-sm font-medium text-green-700 dark:text-green-400 cursor-pointer">
            Respuesta correcta ✓
          </label>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
const SceneEditor = ({
  mecanica,
  rondas,
  setRondas,
  visual,
  onCambiarTema,
  onAgregarRonda,
  onEliminarRonda,
}) => {
  const [rondaActual, setRondaActual] = useState(0);
  const [seleccion,   setSeleccion]   = useState(null);
  const [tipoAsset,   setTipoAsset]   = useState("imagen");
  const [catAsset,    setCatAsset]    = useState("animales");
  const [assets,      setAssets]      = useState({ imagenes: {}, audios: {} });
  const [cargando,    setCargando]    = useState(false);
  const [subiendo,    setSubiendo]    = useState(false);

  // Cargar assets al montar
  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try { setAssets(await listarAssets()); } catch {}
      finally { setCargando(false); }
    };
    cargar();
  }, []);

  // Limpiar selección al cambiar ronda
  useEffect(() => { setSeleccion(null); }, [rondaActual]);

  // Ajustar índice si se eliminan rondas
  useEffect(() => {
    if (rondas.length > 0 && rondaActual >= rondas.length) {
      setRondaActual(rondas.length - 1);
    }
  }, [rondas.length, rondaActual]);

  const assetList = tipoAsset === "imagen"
    ? (assets.imagenes?.[catAsset] || [])
    : (assets.audios?.[catAsset]   || []);
  const cats = tipoAsset === "imagen" ? CATS_IMAGEN : CATS_AUDIO;

  // ── Actualizar campo de cualquier ítem ──────────────────────────────────────
  const handleCampo = useCallback((sel, campo, valor) => {
    if (!sel) { setSeleccion(null); return; }

    setRondas(prev => prev.map((r, ri) => {
      if (ri !== sel.rondaIdx) return r;
      switch (sel.kind) {
        case "item": {
          const items = [...r.items];
          items[sel.idx] = { ...items[sel.idx], [campo]: valor };
          return { ...r, items };
        }
        case "opcion": {
          const opciones = [...r.opciones];
          opciones[sel.idx] = { ...opciones[sel.idx], [campo]: valor };
          return { ...r, opciones };
        }
        case "elemento": {
          const elementos = [...r.elementos];
          elementos[sel.idx] = { ...elementos[sel.idx], [campo]: valor };
          return { ...r, elementos };
        }
        case "par": {
          const pares = [...r.pares];
          pares[sel.idx] = { ...pares[sel.idx], [campo]: valor };
          return { ...r, pares };
        }
        case "izquierda": {
          const pares = [...r.pares];
          pares[sel.idx] = { ...pares[sel.idx], izquierda: { ...pares[sel.idx].izquierda, [campo]: valor } };
          return { ...r, pares };
        }
        case "derecha": {
          const pares = [...r.pares];
          pares[sel.idx] = { ...pares[sel.idx], derecha: { ...pares[sel.idx].derecha, [campo]: valor } };
          return { ...r, pares };
        }
        case "tipeo":
          return { ...r, [campo]: valor };
        case "paso_opcion": {
          const pasos = [...r.pasos];
          const opciones = [...pasos[sel.pasoIdx].opciones];
          opciones[sel.idx] = { ...opciones[sel.idx], [campo]: valor };
          pasos[sel.pasoIdx] = { ...pasos[sel.pasoIdx], opciones };
          return { ...r, pasos };
        }
        case "ronda":
          return { ...r, [campo]: valor };
        default:
          return r;
      }
    }));
  }, [setRondas]);

  // ── Marcar correcto / intruso ───────────────────────────────────────────────
  const handleMarcar = useCallback((sel) => {
    setRondas(prev => prev.map((r, ri) => {
      if (ri !== sel.rondaIdx) return r;
      if (sel.kind === "item") {
        return { ...r, items: r.items.map((it, j) => ({ ...it, esIntruso: j === sel.idx })) };
      }
      if (sel.kind === "opcion") {
        return { ...r, opciones: r.opciones.map((op, j) => ({ ...op, correcta: j === sel.idx })) };
      }
      if (sel.kind === "paso_opcion") {
        const pasos = [...r.pasos];
        const opciones = pasos[sel.pasoIdx].opciones.map((op, j) => ({ ...op, correcta: j === sel.idx }));
        pasos[sel.pasoIdx] = { ...pasos[sel.pasoIdx], opciones };
        return { ...r, pasos };
      }
      return r;
    }));
  }, [setRondas]);

  // ── Drop de imagen sobre ítem del canvas ────────────────────────────────────
  const handleDropImage = useCallback((sel, url) => {
    handleCampo(sel, "imagen", url);
    setSeleccion(sel);
  }, [handleCampo]);

  // ── Subir nuevo asset ───────────────────────────────────────────────────────
  const handleSubirAsset = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubiendo(true);
    try {
      await subirAsset(file, tipoAsset, catAsset);
      setAssets(await listarAssets());
    } catch {}
    finally { setSubiendo(false); e.target.value = ""; }
  };

  const ronda      = rondas[rondaActual];
  const instrCampo = ronda?.textoInstruccion !== undefined ? "textoInstruccion"
                   : ronda?.pregunta         !== undefined ? "pregunta"
                   : "textoObjetivo";
  const instruccion = ronda?.[instrCampo] || "";

  return (
    <div className="flex h-[72vh] min-h-[520px] rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-900 shadow-sm">

      {/* ═══ PANEL IZQUIERDO: LIBRERÍA ═══════════════════════════════════════ */}
      <div className="w-52 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">

        {/* Header */}
        <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Librería</p>
          <div className="flex gap-1 mb-2">
            {[["imagen","🖼"],["audio","🔊"]].map(([t, icon]) => (
              <button key={t}
                onClick={() => { setTipoAsset(t); setCatAsset(t === "imagen" ? "animales" : "palabras"); }}
                className={`flex-1 py-1 rounded-lg text-xs font-medium transition-colors ${
                  tipoAsset === t
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}>
                {icon} {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <select
            value={catAsset}
            onChange={e => setCatAsset(e.target.value)}
            className="block w-full rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400"
          >
            {cats.map(c => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Grid de assets */}
        <div className="flex-1 overflow-y-auto p-2">
          {cargando ? (
            <p className="text-xs text-gray-400 text-center mt-6">Cargando...</p>
          ) : assetList.length === 0 ? (
            <p className="text-xs text-gray-400 text-center mt-6 leading-relaxed">
              Sin assets en esta categoría.<br />
              Subí uno con el botón de abajo.
            </p>
          ) : tipoAsset === "imagen" ? (
            <div className="grid grid-cols-3 gap-1">
              {assetList.map((asset, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={e => e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({ url: asset.url, nombre: asset.nombre, tipo: "imagen" })
                  )}
                  title={asset.nombre}
                  className="aspect-square rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 overflow-hidden cursor-grab
                    hover:border-purple-400 hover:shadow-sm transition-all active:opacity-70 active:scale-95"
                >
                  <img src={asset.url} alt={asset.nombre} className="w-full h-full object-contain p-0.5" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {assetList.map((asset, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={e => e.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({ url: asset.url, nombre: asset.nombre, tipo: "audio" })
                  )}
                  title={asset.nombre}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700
                    cursor-grab hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all text-xs"
                >
                  <Volume2 className="h-3 w-3 text-blue-400 flex-shrink-0" />
                  <span className="truncate text-gray-700 dark:text-gray-300">{asset.nombre}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Subir asset */}
        <div className="px-2 py-2 border-t border-gray-100 dark:border-gray-700">
          <label className={`flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs
            font-medium cursor-pointer transition-colors ${
              subiendo
                ? "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                : "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30"
            }`}>
            <Upload className="h-3 w-3" />
            {subiendo ? "Subiendo..." : `Subir ${tipoAsset}`}
            <input
              type="file"
              className="hidden"
              disabled={subiendo}
              accept={tipoAsset === "audio" ? "audio/*" : "image/*"}
              onChange={handleSubirAsset}
            />
          </label>
        </div>
      </div>

      {/* ═══ PANEL CENTRAL: CANVAS ═══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Tabs de rondas */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <p className="text-xs text-gray-400 mr-1 flex-shrink-0">Rondas:</p>
          {rondas.map((_, i) => (
            <button
              key={i}
              onClick={() => setRondaActual(i)}
              className={`w-7 h-7 rounded-full text-xs font-bold flex-shrink-0 transition-colors ${
                rondaActual === i
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900/20 hover:text-purple-700 dark:hover:text-purple-400"
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => { onAgregarRonda(); setRondaActual(rondas.length); }}
            title="Agregar ronda"
            className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/20 hover:text-green-700 dark:hover:text-green-400
              flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          {rondas.length > 1 && (
            <button
              onClick={() => onEliminarRonda(rondaActual)}
              title="Eliminar ronda actual"
              className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400
                flex items-center justify-center flex-shrink-0 transition-colors ml-auto"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Canvas área */}
        <div className="flex-1 overflow-y-auto p-4 flex items-start justify-center">
          <div
            className="w-full max-w-sm rounded-2xl overflow-hidden shadow-xl"
            style={fondoStyle(visual)}
          >
            {/* Header mock */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-black/15 backdrop-blur-sm">
              <span className="text-white text-xs font-semibold">Ronda {rondaActual + 1}</span>
              <div className="flex items-center gap-2">
                <span className="text-white text-xs">0 pts</span>
                <div className="w-16 h-1.5 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/80 rounded-full transition-all"
                    style={{ width: `${((rondaActual + 1) / Math.max(rondas.length, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Instrucción */}
            <div className="px-4 py-2.5 bg-black/10">
              <p className="text-white text-sm text-center font-medium drop-shadow">
                {instruccion || <span className="opacity-40 italic">Instrucción de la ronda...</span>}
              </p>
            </div>

            {/* Items del juego */}
            <div
              className="p-4"
              onClick={() => setSeleccion(null)}
            >
              <div onClick={e => e.stopPropagation()}>
                <CanvasContent
                  mecanica={mecanica}
                  ronda={ronda}
                  rondaIdx={rondaActual}
                  seleccion={seleccion}
                  onSelect={setSeleccion}
                  onDropImage={handleDropImage}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ PANEL DERECHO: INSPECTOR ════════════════════════════════════════ */}
      <div className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Inspector</p>
        </div>
        <Inspector
          mecanica={mecanica}
          rondas={rondas}
          rondaIdx={rondaActual}
          seleccion={seleccion}
          onCampo={handleCampo}
          onMarcar={handleMarcar}
          visual={visual}
          onCambiarTema={onCambiarTema}
        />
      </div>

    </div>
  );
};

export default SceneEditor;
