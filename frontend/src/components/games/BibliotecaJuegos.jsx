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

  const handleAsignado = (nombre) => {
    setJuegoAsignar(null);
    toast.exito(`Juego asignado a ${nombre}`);
  };

  return (
    <div className="flex h-full min-h-screen bg-gray-50">
      {/* SIDEBAR FILTROS */}
      <aside className="w-64 flex-shrink-0 p-5 overflow-y-auto bg-white border-r border-gray-200">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">Filtros</h3>
          {hayFiltros && (
            <button
              onClick={limpiarFiltros}
              className="text-xs px-2 py-1 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
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

      {/* ÁREA PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Barra superior */}
        <div className="px-7 py-5 flex items-center justify-between gap-4 flex-shrink-0 bg-white border-b border-gray-200">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Biblioteca de Juegos
            </h1>
            <p className="text-sm mt-0.5 text-gray-500">
              {cargando
                ? "Cargando…"
                : `${juegosFiltrados.length} juego${juegosFiltrados.length !== 1 ? "s" : ""} disponible${juegosFiltrados.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="relative flex-1 max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              🔍
            </span>
            <input
              type="text"
              placeholder="Buscar juegos…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl text-sm outline-none border border-gray-200 bg-gray-50 text-gray-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Ordenar */}
        <div className="px-7 py-3 flex items-center gap-2 flex-shrink-0 bg-white border-b border-gray-100">
          <span className="text-xs mr-2 text-gray-500">Ordenar:</span>
          {["relevancia", "dificultad", "edad", "recientes"].map((o) => (
            <button
              key={o}
              onClick={() => setOrden(o)}
              className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all"
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
        <div className="flex-1 overflow-y-auto px-7 py-4">
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
    <div className="rounded-2xl p-5 flex flex-col gap-3 bg-white border border-gray-200 hover:shadow-md transition-shadow">
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

      <div className="flex items-center gap-3 text-xs text-gray-500">
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

      <div className="flex gap-2 mt-auto pt-1">
        <button
          onClick={onDetalles}
          className="flex-1 py-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100 transition-colors"
        >
          ⓘ Detalles
        </button>
        <button
          onClick={onAsignar}
          className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-white hover:opacity-90 transition-opacity"
          style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
        >
          📋 Asignar
        </button>
      </div>
    </div>
  );
}
