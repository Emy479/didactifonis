/**
 * Gestión de Juegos - Panel Admin
 * Lista, crea, edita y elimina juegos oficiales
 *
 * Endpoints utilizados:
 *   GET    /api/games          → listar
 *   POST   /api/games          → crear
 *   PUT    /api/games/:id      → editar
 *   DELETE /api/games/:id      → eliminar (soft delete)
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../context/ToastContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  obtenerJuegos,
  crearJuego,
  actualizarJuego,
  eliminarJuego,
} from "../../api/games";
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

const AREAS = [
  { value: "fonologia", label: "Fonología" },
  { value: "semantica", label: "Semántica" },
  { value: "morfosintaxis", label: "Morfosintaxis" },
  { value: "pragmatica", label: "Pragmática" },
  { value: "habla", label: "Habla" },
  { value: "lenguaje", label: "Lenguaje" },
];

const NIVELES = [
  { value: "basico", label: "Básico" },
  { value: "intermedio", label: "Intermedio" },
  { value: "avanzado", label: "Avanzado" },
];

const FORM_VACIO = {
  nombre: "",
  descripcion: "",
  instrucciones: "",
  codigo: "",
  areaTerapeutica: "fonologia",
  nivelDificultad: "basico",
  rangoEdad: { min: 3, max: 8 },
  objetivos: "",
  duracionEstimada: 10,
  numeroRondas: 5,
  puntuacionMaxima: 100,
  porcentajeAprobacion: 70,
  urlJuego: "",
  publicado: false,
};

const GestionJuegos = () => {
  const navigate = useNavigate();

  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const toast = useToast();

  // Formulario
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null); // juego que se edita
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);

  // Eliminar
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // ── Cargar juegos ─────────────────────────────────────────────────────────
  const cargarJuegos = useCallback(async () => {
    setCargando(true);
    try {
      const res = await obtenerJuegos();
      setJuegos(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cargar juegos");
    } finally {
      setCargando(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarJuegos();
  }, [cargarJuegos]);

  // ── Abrir formulario para crear ───────────────────────────────────────────
  const handleNuevo = () => {
    setEditando(null);
    setForm(FORM_VACIO);
    setMostrarForm(true);
  };

  // ── Abrir formulario para editar ──────────────────────────────────────────
  const handleEditar = (juego) => {
    setEditando(juego);
    setForm({
      nombre: juego.nombre || "",
      descripcion: juego.descripcion || "",
      instrucciones: juego.instrucciones || "",
      codigo: juego.codigo || "",
      areaTerapeutica: juego.areaTerapeutica || "fonologia",
      nivelDificultad: juego.nivelDificultad || "basico",
      rangoEdad: juego.rangoEdad || { min: 3, max: 8 },
      objetivos: juego.objetivos?.join("\n") || "",
      duracionEstimada: juego.duracionEstimada || 10,
      numeroRondas: juego.numeroRondas || 5,
      puntuacionMaxima: juego.puntuacionMaxima || 100,
      porcentajeAprobacion: juego.porcentajeAprobacion || 70,
      urlJuego: juego.urlJuego || "",
      publicado: juego.publicado || false,
    });
    setMostrarForm(true);
  };

  // ── Cancelar formulario ───────────────────────────────────────────────────
  const handleCancelar = () => {
    setMostrarForm(false);
    setEditando(null);
    setForm(FORM_VACIO);
  };

  // ── Cambios en el formulario ──────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Código: convertir espacios a _ y forzar mayúsculas
    if (name === "codigo") {
      const codigoLimpio = value
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, "");
      setForm((prev) => ({ ...prev, codigo: codigoLimpio }));
      return;
    }
    if (name === "rangoEdad.min" || name === "rangoEdad.max") {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        rangoEdad: { ...prev.rangoEdad, [key]: parseInt(value) },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  // ── Guardar (crear o editar) ──────────────────────────────────────────────
  const handleGuardar = async (e) => {
    e.preventDefault();
    setGuardando(true);

    try {
      const payload = {
        ...form,
        objetivos: form.objetivos
          ? form.objetivos.split("\n").filter((o) => o.trim())
          : [],
        duracionEstimada: parseInt(form.duracionEstimada),
        numeroRondas: parseInt(form.numeroRondas),
        puntuacionMaxima: parseInt(form.puntuacionMaxima),
        porcentajeAprobacion: parseInt(form.porcentajeAprobacion),
      };

      if (editando) {
        await actualizarJuego(editando._id, payload);
        toast.exito("Juego actualizado exitosamente");
      } else {
        await crearJuego(payload);
        toast.exito("Juego creado exitosamente");
      }

      await cargarJuegos();
      handleCancelar();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al guardar juego");
    } finally {
      setGuardando(false);
    }
  };

  // ── Eliminar ──────────────────────────────────────────────────────────────
  const handleEliminar = async () => {
    setEliminando(true);
    try {
      await eliminarJuego(confirmarEliminar._id);
      setJuegos((prev) => prev.filter((j) => j._id !== confirmarEliminar._id));
      setConfirmarEliminar(null);
      toast.exito("Juego eliminado exitosamente"); // 🔔
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al eliminar juego");
      setConfirmarEliminar(null);
    } finally {
      setEliminando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        {/* Cabecera */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Juegos
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {juegos.length} juego{juegos.length !== 1 ? "s" : ""} en la
                biblioteca
              </p>
            </div>
            {!mostrarForm && (
              <button
                onClick={handleNuevo}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nuevo Juego
              </button>
            )}
          </div>
        </div>

        {/* ── FORMULARIO ── */}
        {mostrarForm && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6">
              {editando ? `Editar: ${editando.nombre}` : "Crear Nuevo Juego"}
            </h2>

            <form onSubmit={handleGuardar} className="space-y-5">
              {/* Nombre y código */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Aventura de Sonidos"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código único <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="codigo"
                    value={form.codigo}
                    onChange={handleChange}
                    required
                    disabled={!!editando}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400 uppercase"
                    placeholder="Ej: AVENTURA_SONIDOS"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  required
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descripción breve del juego..."
                />
              </div>

              {/* Instrucciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instrucciones
                </label>
                <textarea
                  name="instrucciones"
                  value={form.instrucciones}
                  onChange={handleChange}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cómo se juega..."
                />
              </div>

              {/* Área y nivel */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Área Terapéutica
                  </label>
                  <select
                    name="areaTerapeutica"
                    value={form.areaTerapeutica}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {AREAS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nivel de Dificultad
                  </label>
                  <select
                    name="nivelDificultad"
                    value={form.nivelDificultad}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {NIVELES.map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Rango de edad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Edad mínima
                  </label>
                  <input
                    type="number"
                    name="rangoEdad.min"
                    value={form.rangoEdad.min}
                    onChange={handleChange}
                    min={2}
                    max={17}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Edad máxima
                  </label>
                  <input
                    type="number"
                    name="rangoEdad.max"
                    value={form.rangoEdad.max}
                    onChange={handleChange}
                    min={3}
                    max={18}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Configuración numérica */}
              <div className="grid grid-cols-4 gap-4">
                {[
                  { name: "duracionEstimada", label: "Duración (min)" },
                  { name: "numeroRondas", label: "Nº Rondas" },
                  { name: "puntuacionMaxima", label: "Puntuación máx" },
                  { name: "porcentajeAprobacion", label: "% Aprobación" },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {f.label}
                    </label>
                    <input
                      type="number"
                      name={f.name}
                      value={form[f.name]}
                      onChange={handleChange}
                      min={0}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>

              {/* Objetivos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objetivos{" "}
                  <span className="text-gray-400 text-xs">(uno por línea)</span>
                </label>
                <textarea
                  name="objetivos"
                  value={form.objetivos}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mejorar la pronunciación&#10;Reconocer sonidos&#10;..."
                />
              </div>

              {/* URL del juego */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del juego
                </label>
                <input
                  name="urlJuego"
                  value={form.urlJuego}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/games/html5/mi-juego/index.html"
                />
              </div>

              {/* Publicado */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="publicado"
                  name="publicado"
                  checked={form.publicado}
                  onChange={handleChange}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label
                  htmlFor="publicado"
                  className="text-sm font-medium text-gray-700"
                >
                  Publicar juego (visible para tutores y profesionales)
                </label>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {guardando
                    ? "Guardando..."
                    : editando
                      ? "Guardar Cambios"
                      : "Crear Juego"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelar}
                  disabled={guardando}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── LISTA DE JUEGOS ── */}
        {cargando ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200"
              >
                {/* Izquierda */}
                <div className="flex items-center gap-4">
                  {/* Dot publicado */}
                  <div className="w-2 h-2 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-14 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
                {/* Derecha — botones acción */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : juegos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-400 mb-3">No hay juegos creados aún</p>
            <button
              onClick={handleNuevo}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
            >
              Crear primer juego
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {juegos.map((juego) => (
              <div
                key={juego._id}
                className="p-4 bg-white rounded-xl border border-gray-200"
              >
                {/* Fila superior — dot + nombre + botones */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${juego.publicado ? "bg-green-400" : "bg-gray-300"}`}
                    />
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {juego.nombre}
                    </p>
                  </div>

                  {/* Botones acción */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() =>
                        actualizarJuego(juego._id, {
                          publicado: !juego.publicado,
                        }).then(cargarJuegos)
                      }
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title={juego.publicado ? "Despublicar" : "Publicar"}
                    >
                      {juego.publicado ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleEditar(juego)}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmarEliminar(juego)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Fila inferior — metadata */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 ml-5">
                  <span className="text-xs text-gray-400">{juego.codigo}</span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400 capitalize">
                    {juego.areaTerapeutica}
                  </span>
                  <span className="text-xs text-gray-300">·</span>
                  <span className="text-xs text-gray-400 capitalize">
                    {juego.nivelDificultad}
                  </span>
                  <span className="text-xs text-gray-300">·</span>
                  <span
                    className={`text-xs font-medium ${juego.publicado ? "text-green-600" : "text-gray-400"}`}
                  >
                    {juego.publicado ? "Publicado" : "Borrador"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal confirmar eliminar */}
      {confirmarEliminar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                ¿Eliminar juego?
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Esta acción desactivará{" "}
              <span className="font-semibold">{confirmarEliminar.nombre}</span>.
              Las asignaciones existentes no se verán afectadas.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmarEliminar(null)}
                disabled={eliminando}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={eliminando}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {eliminando ? "Eliminando..." : "Sí, eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default GestionJuegos;
