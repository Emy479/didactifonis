/**
 * BibliotecaJuegos.jsx
 *
 * Pantalla principal de la Biblioteca de Juegos.
 *
 * Endpoints utilizados (todos ya existen en el backend):
 *   GET  /api/games                     → listar juegos (gamesController.obtenerTodos)
 *   GET  /api/games/area/:area          → filtrar por área
 *   GET  /api/games/edad/:edad          → filtrar por edad
 *   POST /api/assignments               → asignar juego a paciente
 *   GET  /api/patients                  → listar pacientes (en ModalAsignarPaciente)
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import ModalDetallesJuego from "./ModalDetallesJuego";
import ModalAsignarPaciente from "./ModalAsignarPaciente";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DIFICULTAD = {
  basico: { label: "Básico", color: "#4ade80", bg: "rgba(34,197,94,0.12)" },
  intermedio: {
    label: "Intermedio",
    color: "#facc15",
    bg: "rgba(234,179,8,0.12)",
  },
  avanzado: { label: "Avanzado", color: "#f87171", bg: "rgba(239,68,68,0.12)" },
};

const AREAS = [
  "fonologia",
  "semantica",
  "morfosintaxis",
  "pragmatica",
  "habla",
  "lenguaje",
];
const DIFICULTADES = ["basico", "intermedio", "avanzado"];
const RANGOS_EDAD = [
  { label: "3-4 años", min: 3, max: 4 },
  { label: "5-6 años", min: 5, max: 6 },
  { label: "7-8 años", min: 7, max: 8 },
  { label: "9-10 años", min: 9, max: 10 },
  { label: "11-12 años", min: 11, max: 12 },
];

export default function BibliotecaJuegos() {
  // Estado de datos
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [areasActivas, setAreasActivas] = useState([]);
  const [difsActivas, setDifsActivas] = useState([]);
  const [rangoEdad, setRangoEdad] = useState(null);
  const [orden, setOrden] = useState("relevancia");

  // Modales
  const [juegoDetalle, setJuegoDetalle] = useState(null);
  const [juegoAsignar, setJuegoAsignar] = useState(null);
  const [toast, setToast] = useState(null);

  // ── Cargar juegos ─────────────────────────────────────────────────────────
  // GET /api/games → gamesController.obtenerTodos (requiere token)
  const cargarJuegos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/games`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Error al cargar juegos");
      setJuegos(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarJuegos();
  }, [cargarJuegos]);

  // ── Filtrado y ordenado (client-side) ─────────────────────────────────────
  const juegosFiltrados = useMemo(() => {
    let lista = [...juegos];

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      lista = lista.filter(
        (j) =>
          j.nombre?.toLowerCase().includes(q) ||
          j.descripcion?.toLowerCase().includes(q),
      );
    }

    if (areasActivas.length > 0) {
      lista = lista.filter((j) =>
        areasActivas.includes(j.areaTerapeutica?.toLowerCase()),
      );
    }

    if (difsActivas.length > 0) {
      lista = lista.filter((j) =>
        difsActivas.includes(j.nivelDificultad?.toLowerCase()),
      );
    }

    if (rangoEdad) {
      lista = lista.filter(
        (j) =>
          j.rangoEdad?.min <= rangoEdad.max &&
          j.rangoEdad?.max >= rangoEdad.min,
      );
    }

    if (orden === "dificultad") {
      const ord = { facil: 0, medio: 1, dificil: 2 };
      lista.sort((a, b) => (ord[a.dificultad] ?? 1) - (ord[b.dificultad] ?? 1));
    } else if (orden === "edad") {
      lista.sort((a, b) => (a.rangoEdad?.min ?? 0) - (b.rangoEdad?.min ?? 0));
    } else if (orden === "recientes") {
      lista.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return lista;
  }, [juegos, busqueda, areasActivas, difsActivas, rangoEdad, orden]);

  // ── Helpers de filtros ────────────────────────────────────────────────────
  const toggleArea = (area) =>
    setAreasActivas((p) =>
      p.includes(area) ? p.filter((a) => a !== area) : [...p, area],
    );

  const toggleDif = (dif) =>
    setDifsActivas((p) =>
      p.includes(dif) ? p.filter((d) => d !== dif) : [...p, dif],
    );

  const toggleRango = (rango) =>
    setRangoEdad((p) => (p?.label === rango.label ? null : rango));

  const limpiarFiltros = () => {
    setAreasActivas([]);
    setDifsActivas([]);
    setRangoEdad(null);
    setBusqueda("");
  };

  const hayFiltros =
    areasActivas.length > 0 || difsActivas.length > 0 || rangoEdad || busqueda;

  // ── Callback de asignación exitosa ────────────────────────────────────────
  const handleAsignado = (nombre) => {
    setJuegoAsignar(null);
    setToast(`✓ Juego asignado a ${nombre}`);
    setTimeout(() => setToast(null), 3500);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex h-full"
      style={{ backgroundColor: "#0f1923", color: "white", minHeight: "100vh" }}
    >
      {/* ──── SIDEBAR DE FILTROS ──── */}
      <aside
        className="w-64 flex-shrink-0 p-5 overflow-y-auto"
        style={{
          backgroundColor: "#131f2e",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          scrollbarWidth: "thin",
          scrollbarColor: "#1e2a3a transparent",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-white">Filtros</h3>
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              className="text-xs px-2 py-1 rounded-lg"
              style={{
                backgroundColor: "rgba(239,68,68,0.12)",
                color: "#f87171",
              }}
            >
              Limpiar
            </button>
          )}
        </div>

        <FilterSection title="Área Terapéutica">
          {AREAS.map((area) => (
            <FilterChip
              key={area}
              label={area.charAt(0).toUpperCase() + area.slice(1)}
              active={areasActivas.includes(area)}
              onClick={() => toggleArea(area)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Dificultad">
          {DIFICULTADES.map((dif) => (
            <FilterChip
              key={dif}
              label={DIFICULTAD[dif].label}
              active={difsActivas.includes(dif)}
              activeColor={DIFICULTAD[dif].color}
              activeBg={DIFICULTAD[dif].bg}
              onClick={() => toggleDif(dif)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Rango de Edad">
          {RANGOS_EDAD.map((r) => (
            <FilterChip
              key={r.label}
              label={r.label}
              active={rangoEdad?.label === r.label}
              onClick={() => toggleRango(r)}
            />
          ))}
        </FilterSection>
      </aside>

      {/* ──── ÁREA PRINCIPAL ──── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior */}
        <div
          className="px-7 py-5 flex items-center justify-between gap-4 flex-shrink-0"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div>
            <h1 className="text-xl font-bold text-white">
              Biblioteca de Juegos
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>
              {cargando
                ? "Cargando…"
                : `${juegosFiltrados.length} juego${juegosFiltrados.length !== 1 ? "s" : ""} terapéutico${juegosFiltrados.length !== 1 ? "s" : ""} disponible${juegosFiltrados.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {/* Buscador */}
          <div className="relative flex-1 max-w-xs">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
              style={{ color: "#475569" }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar juegos…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none"
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "white",
              }}
            />
          </div>
        </div>

        {/* Barra de orden */}
        <div className="px-7 py-3 flex items-center gap-2 flex-shrink-0">
          <span className="text-xs mr-2" style={{ color: "#64748b" }}>
            Ordenar:
          </span>
          {["relevancia", "dificultad", "edad", "recientes"].map((o) => (
            <button
              key={o}
              onClick={() => setOrden(o)}
              className="px-3 py-1 rounded-full text-xs font-medium capitalize"
              style={
                orden === o
                  ? { backgroundColor: "#3b82f6", color: "white" }
                  : {
                      backgroundColor: "rgba(255,255,255,0.05)",
                      color: "#94a3b8",
                    }
              }
            >
              {o.charAt(0).toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>

        {/* Grid de juegos */}
        <div
          className="flex-1 overflow-y-auto px-7 py-4"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#1e2a3a transparent",
          }}
        >
          {/* Error */}
          {error && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-4xl">⚠️</span>
              <p className="text-sm font-medium" style={{ color: "#f87171" }}>
                {error}
              </p>
              <button
                onClick={cargarJuegos}
                className="px-4 py-2 rounded-xl text-sm font-medium"
                style={{
                  backgroundColor: "rgba(59,130,246,0.15)",
                  color: "#60a5fa",
                }}
              >
                Reintentar
              </button>
            </div>
          )}

          {/* Skeleton de carga */}
          {cargando && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl animate-pulse"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    height: "200px",
                  }}
                />
              ))}
            </div>
          )}

          {/* Sin resultados */}
          {!cargando && !error && juegosFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <span className="text-4xl">🎮</span>
              <p className="text-sm font-medium text-white">
                No se encontraron juegos
              </p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                Prueba ajustando los filtros
              </p>
              {hayFiltros && (
                <button
                  onClick={limpiarFiltros}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-medium"
                  style={{
                    backgroundColor: "rgba(59,130,246,0.15)",
                    color: "#60a5fa",
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Cards */}
          {!cargando && !error && juegosFiltrados.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-6">
              {juegosFiltrados.map((juego) => (
                <JuegoCard
                  key={juego._id}
                  juego={juego}
                  onDetalles={() => setJuegoDetalle(juego)}
                  onAsignar={() => setJuegoAsignar(juego)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal detalles */}
      {juegoDetalle && (
        <ModalDetallesJuego
          juego={juegoDetalle}
          onClose={() => setJuegoDetalle(null)}
        />
      )}

      {/* Modal asignar directo (desde botón de la card) */}
      {juegoAsignar && (
        <ModalAsignarPaciente
          juego={juegoAsignar}
          onClose={() => setJuegoAsignar(null)}
          onAsignado={handleAsignado}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-xl"
          style={{
            backgroundColor: "rgba(34,197,94,0.15)",
            color: "#4ade80",
            border: "1px solid rgba(34,197,94,0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}

// ── Sub-componentes ────────────────────────────────────────────────────────────

function FilterSection({ title, children }) {
  return (
    <div className="mb-5">
      <p
        className="text-xs font-semibold uppercase tracking-widest mb-2.5"
        style={{ color: "#475569" }}
      >
        {title}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  activeColor = "#93c5fd",
  activeBg = "rgba(59,130,246,0.15)",
}) {
  return (
    <button
      onClick={onClick}
      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
      style={
        active
          ? {
              backgroundColor: activeBg,
              color: activeColor,
              border: `1px solid ${activeColor}40`,
            }
          : {
              backgroundColor: "rgba(255,255,255,0.04)",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.06)",
            }
      }
    >
      {label}
    </button>
  );
}

function JuegoCard({ juego, onDetalles, onAsignar }) {
  const dif =
    DIFICULTAD[juego.nivelDificultad?.toLowerCase()] || DIFICULTAD.medio;

  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{
        backgroundColor: "#131f2e",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div>
        <h3 className="font-bold text-white text-base leading-tight mb-1">
          {juego.nombre}
        </h3>
        <p
          className="text-xs leading-relaxed line-clamp-2"
          style={{ color: "#64748b" }}
        >
          {juego.descripcion}
        </p>
      </div>

      {/* Áreas */}
      <div className="flex flex-wrap gap-1.5">
        {juego.areasTerapeuticas?.slice(0, 3).map((area) => (
          <span
            key={area}
            className="text-xs px-2 py-0.5 rounded-full capitalize"
            style={{
              backgroundColor: "rgba(99,102,241,0.12)",
              color: "#a5b4fc",
            }}
          >
            {area}
          </span>
        ))}
      </div>

      {/* Meta */}
      <div
        className="flex items-center gap-3 text-xs"
        style={{ color: "#64748b" }}
      >
        <span
          className="font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: dif.bg, color: dif.color }}
        >
          {dif.label}
        </span>
        {juego.rangoEdad?.min && juego.rangoEdad?.max && (
          <span>
            👤 {juego.rangoEdad.min}-{juego.rangoEdad.max} años
          </span>
        )}
        {juego.duracionEstimada && <span>🕐 {juego.duracionEstimada} min</span>}
      </div>

      {/* Acciones */}
      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={onDetalles}
          className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            color: "#94a3b8",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          ⓘ Detalles
        </button>
        <button
          onClick={onAsignar}
          className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #6366f1)",
            color: "white",
          }}
        >
          📋 Asignar
        </button>
      </div>
    </div>
  );
}
