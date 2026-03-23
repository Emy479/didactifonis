/**
 * ModalAsignarProfesional.jsx
 *
 * Modal para que el tutor asigne o remueva profesionales a su paciente.
 * Solo visible para tutores (Plan Familiar).
 *
 * Endpoints utilizados:
 *   GET  /api/auth/profesionales               → listar profesionales verificados
 *   POST /api/patients/:id/asignar-profesional  → asignar
 *   DELETE /api/patients/:id/profesional/:profId → remover
 *
 * Props:
 *   pacienteId          - ID del paciente
 *   profesionalesActuales - array de profesionales ya asignados
 *   onClose             - fn para cerrar
 *   onActualizado       - fn callback cuando se hace un cambio
 */

import { useState, useEffect, useCallback } from "react";
import { listarProfesionales } from "../../api/auth";
import { asignarProfesional } from "../../api/patients";
import { Search, UserCheck, X } from "lucide-react";

const ModalAsignarProfesional = ({
  pacienteId,
  profesionalesActuales = [],
  onClose,
  onActualizado,
}) => {
  const [profesionales, setProfesionales] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(null); // _id en proceso

  // ── Cargar profesionales verificados ─────────────────────────────────────
  const cargarProfesionales = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await listarProfesionales();
      setProfesionales(res.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar profesionales");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarProfesionales();
  }, [cargarProfesionales]);

  // ── Verificar si ya está asignado ─────────────────────────────────────────
  const estaAsignado = (profId) =>
    profesionalesActuales.some(
      (p) => (p._id || p).toString() === profId.toString(),
    );

  // ── Asignar profesional ───────────────────────────────────────────────────
  const handleAsignar = async (profId) => {
    setProcesando(profId);
    setError(null);
    try {
      await asignarProfesional(pacienteId, profId);
      onActualizado?.();
    } catch (err) {
      setError(err.response?.data?.error || "Error al asignar profesional");
    } finally {
      setProcesando(null);
    }
  };

  // ── Filtrar por búsqueda ──────────────────────────────────────────────────
  const profesionalesFiltrados = profesionales.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.especialidad?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Asignar Profesional
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Busca y asigna un fonoaudiólogo verificado
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Buscador */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o especialidad…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-4 px-3 py-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Lista */}
        <div
          className="p-4 max-h-80 overflow-y-auto"
          style={{ scrollbarWidth: "thin" }}
        >
          {cargando && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
          )}

          {!cargando && profesionalesFiltrados.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">
                {busqueda
                  ? "No se encontraron profesionales"
                  : "No hay profesionales verificados aún"}
              </p>
            </div>
          )}

          {!cargando && profesionalesFiltrados.length > 0 && (
            <ul className="space-y-2">
              {profesionalesFiltrados.map((prof) => {
                const asignado = estaAsignado(prof._id);
                const enProceso = procesando === prof._id;
                const iniciales = prof.nombre?.[0]?.toUpperCase() || "P";

                return (
                  <li
                    key={prof._id}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                    style={{
                      borderColor: asignado ? "#bbf7d0" : "#f1f5f9",
                      backgroundColor: asignado ? "#f0fdf4" : "white",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                      style={{
                        backgroundColor: asignado ? "#86efac" : "#dbeafe",
                        color: asignado ? "#166534" : "#1d4ed8",
                      }}
                    >
                      {iniciales}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {prof.nombre}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {prof.especialidad || "Fonoaudiólogo/a"}
                      </p>
                    </div>

                    {/* Botón Asignar */}
                    {!asignado && (
                      <button
                        onClick={() => handleAsignar(prof._id)}
                        disabled={enProceso}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                        style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
                      >
                        {enProceso ? (
                          "…"
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5" /> Asignar
                          </>
                        )}
                      </button>
                    )}
                    {asignado && (
                      <span
                        className="text-xs px-3 py-1.5 rounded-lg font-medium"
                        style={{ backgroundColor: "#dcfce7", color: "#16a34a" }}
                      >
                        ✓ Asignado
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalAsignarProfesional;
