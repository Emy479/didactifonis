/**
 * BibliotecaJuegos.jsx
 * Tema claro unificado con el resto del dashboard.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import ModalDetallesJuego from "./ModalDetallesJuego";
import ModalAsignarPaciente from "./ModalAsignarPaciente";
import { useToast } from "../../context/ToastContext";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const DIFICULTAD = {
  basico: { label: "Básico", color: "#16a34a", bg: "#dcfce7" },
  intermedio: { label: "Intermedio", color: "#b45309", bg: "#fef3c7" },
  avanzado: { label: "Avanzado", color: "#dc2626", bg: "#fee2e2" },
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
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [areasActivas, setAreasActivas] = useState([]);
  const [difsActivas, setDifsActivas] = useState([]);
  const [rangoEdad, setRangoEdad] = useState(null);
  const [orden, setOrden] = useState("relevancia");
  const [juegoDetalle, setJuegoDetalle] = useState(null);
  const [juegoAsignar, setJuegoAsignar] = useState(null);
  const [asignacionesRealizadas, setAsignacionesRealizadas] = useState({});
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const toast = useToast();

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
    if (areasActivas.length > 0)
      lista = lista.filter((j) =>
        areasActivas.includes(j.areaTerapeutica?.toLowerCase()),
      );
    if (difsActivas.length > 0)
      lista = lista.filter((j) =>
        difsActivas.includes(j.nivelDificultad?.toLowerCase()),
      );
    if (rangoEdad)
      lista = lista.filter(
        (j) =>
          j.rangoEdad?.min <= rangoEdad.max &&
          j.rangoEdad?.max >= rangoEdad.min,
      );
    if (orden === "dificultad") {
      const ord = { basico: 0, intermedio: 1, avanzado: 2 };
      lista.sort(
        (a, b) => (ord[a.nivelDificultad] ?? 1) - (ord[b.nivelDificultad] ?? 1),
      );
    } else if (orden === "edad") {
      lista.sort((a, b) => (a.rangoEdad?.min ?? 0) - (b.rangoEdad?.min ?? 0));
    } else if (orden === "recientes") {
      lista.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return lista;
  }, [juegos, busqueda, areasActivas, difsActivas, rangoEdad, orden]);

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

  const handleAsignado = (nombre, pacienteId) => {
    setAsignacionesRealizadas((prev) => ({
      ...prev,
      [juegoAsignar._id]: [...(prev[juegoAsignar._id] || []), pacienteId],
    }));
    toast.exito(`Juego asignado a ${nombre}`);
  };

  const PanelFiltros = (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-gray-900">Filtros</h3>
        <div className="flex items-center gap-2">
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
            >
              Limpiar
            </button>
          )}
          <button
            onClick={() => setMostrarFiltros(false)}
            className="md:hidden text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ✕
          </button>
        </div>
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
    </div>
  );

  return (
    <div className="flex h-full min-h-screen bg-gray-50 overflow-x-hidden">
      {/* ── SIDEBAR DESKTOP (≥ md) ── */}
      <aside className="hidden md:block w-64 flex-shrink-0 overflow-y-auto bg-white border-r border-gray-200">
        {PanelFiltros}
      </aside>

      {/* ── OVERLAY FILTROS MOBILE (< md) ── */}
      {mostrarFiltros && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onClick={() => setMostrarFiltros(false)}
        >
          <div
            className="absolute top-0 left-0 h-full w-72 max-w-[85vw] bg-white overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {PanelFiltros}
          </div>
        </div>
      )}

      {/* ── ÁREA PRINCIPAL ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Barra superior */}
        <div className="px-4 md:px-7 py-4 flex-shrink-0 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h1 className="text-lg md:text-xl font-bold text-gray-900">
              Biblioteca de Juegos
            </h1>
            <div className="flex items-center gap-2">
              {/* Botón filtros mobile */}
              <button
                onClick={() => setMostrarFiltros(true)}
                className="md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-700"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"
                  />
                </svg>
                Filtros
                {hayFiltros && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center">
                    {areasActivas.length +
                      difsActivas.length +
                      (rangoEdad ? 1 : 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
          {/* Buscador debajo del título */}
          <div className="relative">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Buscar juegos…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1.5">
            {cargando
              ? "Cargando…"
              : `${juegosFiltrados.length} juego${juegosFiltrados.length !== 1 ? "s" : ""} disponible${juegosFiltrados.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Ordenar */}
        <div className="px-4 md:px-7 py-3 flex items-center gap-2 flex-shrink-0 bg-white border-b border-gray-100 overflow-x-auto">
          <span className="text-xs text-gray-500 flex-shrink-0">Ordenar:</span>
          {["relevancia", "dificultad", "edad", "recientes"].map((o) => (
            <button
              key={o}
              onClick={() => setOrden(o)}
              className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all flex-shrink-0"
              style={
                orden === o
                  ? { backgroundColor: "#3b82f6", color: "white" }
                  : { backgroundColor: "#f1f5f9", color: "#64748b" }
              }
            >
              {o.charAt(0).toUpperCase() + o.slice(1)}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 md:px-7 py-4">
          {error && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <span className="text-4xl">⚠️</span>
              <p className="text-sm font-medium text-red-500">{error}</p>
              <button
                onClick={cargarJuegos}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-600"
              >
                Reintentar
              </button>
            </div>
          )}
          {cargando && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl animate-pulse bg-gray-200"
                  style={{ height: "200px" }}
                />
              ))}
            </div>
          )}
          {!cargando && !error && juegosFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <span className="text-4xl">🎮</span>
              <p className="text-sm font-medium text-gray-700">
                No se encontraron juegos
              </p>
              <p className="text-xs text-gray-400">
                Prueba ajustando los filtros
              </p>
              {hayFiltros && (
                <button
                  onClick={limpiarFiltros}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-medium bg-blue-50 text-blue-600"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}
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

      {juegoDetalle && (
        <ModalDetallesJuego
          juego={juegoDetalle}
          onClose={() => setJuegoDetalle(null)}
        />
      )}
      {juegoAsignar && (
        <ModalAsignarPaciente
          juego={juegoAsignar}
          onClose={() => setJuegoAsignar(null)}
          onAsignado={handleAsignado}
          pacientesYaAsignados={asignacionesRealizadas[juegoAsignar._id] || []}
        />
      )}
    </div>
  );
}

function FilterSection({ title, children }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold uppercase tracking-widest mb-2.5 text-gray-400">
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
  activeColor = "#1d4ed8",
  activeBg = "#dbeafe",
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
              backgroundColor: "#f1f5f9",
              color: "#64748b",
              border: "1px solid #e2e8f0",
            }
      }
    >
      {label}
    </button>
  );
}

function JuegoCard({ juego, onDetalles, onAsignar }) {
  const dif =
    DIFICULTAD[juego.nivelDificultad?.toLowerCase()] || DIFICULTAD.intermedio;
  return (
    <div className="rounded-2xl p-4 flex flex-col gap-3 bg-white border border-gray-200 hover:shadow-md transition-shadow">
      <div>
        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">
          {juego.nombre}
        </h3>
        <p className="text-xs leading-relaxed line-clamp-2 text-gray-500">
          {juego.descripcion}
        </p>
      </div>
      {juego.areaTerapeutica && (
        <div className="flex flex-wrap gap-1.5">
          <span className="text-xs px-2 py-0.5 rounded-full capitalize bg-indigo-50 text-indigo-600">
            {juego.areaTerapeutica}
          </span>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
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
      {/* Botones — apilados en mobile, lado a lado en desktop */}
      <div className="flex flex-col sm:flex-row gap-2 mt-auto pt-1">
        <button
          onClick={onDetalles}
          className="w-full py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          ⓘ Detalles
        </button>
        <button
          onClick={onAsignar}
          className="w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-white hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
        >
          📋 Asignar
        </button>
      </div>
    </div>
  );
}
