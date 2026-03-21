/**
 * Gestión de Sugerencias - Panel Admin
 * Aprobar o rechazar sugerencias de juegos con feedback
 *
 * Endpoints utilizados:
 *   GET /api/suggestions              → listar todas
 *   PUT /api/suggestions/:id/estado   → aprobar/rechazar
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import { obtenerSugerencias, cambiarEstadoSugerencia } from "../../api/games";
import { ArrowLeft, CheckCircle, XCircle, Clock, Eye } from "lucide-react";

const ESTADO_CONFIG = {
  pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
  en_revision: { label: "En Revisión", color: "bg-blue-100 text-blue-700" },
  aprobada: { label: "Aprobada", color: "bg-green-100 text-green-700" },
  rechazada: { label: "Rechazada", color: "bg-red-100 text-red-700" },
  implementada: {
    label: "Implementada",
    color: "bg-purple-100 text-purple-700",
  },
};

const GestionSugerencias = () => {
  const navigate = useNavigate();

  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState("todas");

  // Modal de revisión
  const [modalRevision, setModalRevision] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [procesando, setProcesando] = useState(false);

  // ── Cargar sugerencias ────────────────────────────────────────────────────
  const cargarSugerencias = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await obtenerSugerencias();
      setSugerencias(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar sugerencias");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarSugerencias();
  }, [cargarSugerencias]);

  // ── Filtrar sugerencias ───────────────────────────────────────────────────
  const sugerenciasFiltradas =
    filtroEstado === "todas"
      ? sugerencias
      : sugerencias.filter((s) => s.estado === filtroEstado);

  // ── Abrir modal de revisión ───────────────────────────────────────────────
  const handleRevisar = (sugerencia) => {
    setModalRevision(sugerencia);
    setFeedback(sugerencia.notasAdmin || "");
    setError(null);
  };

  // ── Cambiar estado ────────────────────────────────────────────────────────
  const handleCambiarEstado = async (estado) => {
    setProcesando(true);
    setError(null);
    try {
      await cambiarEstadoSugerencia(modalRevision._id, estado, feedback);
      setExito(
        estado === "aprobada"
          ? "Sugerencia aprobada exitosamente"
          : estado === "rechazada"
            ? "Sugerencia rechazada"
            : "Estado actualizado",
      );
      setModalRevision(null);
      setFeedback("");
      await cargarSugerencias();
      setTimeout(() => setExito(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cambiar estado");
    } finally {
      setProcesando(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Cabecera */}
        <div className="mb-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 text-sm transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al panel
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestión de Sugerencias
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Revisa y responde las propuestas de los profesionales
          </p>
        </div>

        {/* Alertas */}
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
            className="mb-4"
          />
        )}
        {exito && <Alert type="success" message={exito} className="mb-4" />}

        {/* Filtros por estado */}
        <div className="flex items-center gap-2 mb-5 flex-wrap">
          {[
            "todas",
            "pendiente",
            "en_revision",
            "aprobada",
            "rechazada",
            "implementada",
          ].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all capitalize ${
                filtroEstado === estado
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {estado === "todas" ? "Todas" : ESTADO_CONFIG[estado]?.label}
              {estado !== "todas" && (
                <span className="ml-1.5 opacity-70">
                  ({sugerencias.filter((s) => s.estado === estado).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Lista */}
        {cargando ? (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : sugerenciasFiltradas.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No hay sugerencias en este estado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sugerenciasFiltradas.map((s) => {
              const est = ESTADO_CONFIG[s.estado] || ESTADO_CONFIG.pendiente;
              return (
                <div
                  key={s._id}
                  className="bg-white rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Título y badge */}
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {s.titulo}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${est.color}`}
                        >
                          {est.label}
                        </span>
                      </div>

                      {/* Descripción */}
                      <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                        {s.descripcion}
                      </p>

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span>👤 {s.profesional?.nombre || "Profesional"}</span>
                        <span>·</span>
                        <span className="capitalize">
                          🧠 {s.areaTerapeutica}
                        </span>
                        <span>·</span>
                        <span>👍 {s.votos || 0} votos</span>
                      </div>

                      {/* Feedback previo */}
                      {s.notasAdmin && (
                        <div className="mt-2 px-3 py-2 bg-gray-50 rounded-lg text-xs text-gray-600">
                          <span className="font-medium">Feedback: </span>
                          {s.notasAdmin}
                        </div>
                      )}
                    </div>

                    {/* Botón revisar */}
                    <button
                      onClick={() => handleRevisar(s)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Revisar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de revisión */}
      {modalRevision && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            {/* Cabecera modal */}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {modalRevision.titulo}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Por {modalRevision.profesional?.nombre || "Profesional"}
              </p>
            </div>

            {/* Detalle */}
            <div className="space-y-3 mb-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Descripción
                </p>
                <p className="text-sm text-gray-700">
                  {modalRevision.descripcion}
                </p>
              </div>

              {modalRevision.objetivos?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Objetivos
                  </p>
                  <ul className="space-y-1">
                    {modalRevision.objetivos.map((obj, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <span className="text-green-500">✓</span> {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-4 text-sm text-gray-600">
                <span>🧠 {modalRevision.areaTerapeutica}</span>
                {modalRevision.rangoEdadSugerido && (
                  <span>
                    👤 {modalRevision.rangoEdadSugerido.min}-
                    {modalRevision.rangoEdadSugerido.max} años
                  </span>
                )}
                <span>👍 {modalRevision.votos || 0} votos</span>
              </div>
            </div>

            {/* Feedback */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Feedback para el profesional
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Explica tu decisión al profesional..."
              />
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              {/* Dropdown de estado */}
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                  Cambiar estado a
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      estado: "en_revision",
                      label: "En Revisión",
                      clase: "bg-blue-50 text-blue-600 hover:bg-blue-100",
                    },
                    {
                      estado: "aprobada",
                      label: "Aprobar",
                      clase: "bg-green-600 text-white hover:bg-green-700",
                    },
                    {
                      estado: "rechazada",
                      label: "Rechazar",
                      clase: "bg-red-50 text-red-600 hover:bg-red-100",
                    },
                    {
                      estado: "implementada",
                      label: "Implementada",
                      clase: "bg-purple-50 text-purple-600 hover:bg-purple-100",
                    },
                  ].map((op) => (
                    <button
                      key={op.estado}
                      onClick={() => handleCambiarEstado(op.estado)}
                      disabled={
                        procesando || modalRevision.estado === op.estado
                      }
                      className={`py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-40 ${op.clase}`}
                    >
                      {procesando ? "..." : op.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cancelar */}
              <button
                onClick={() => {
                  setModalRevision(null);
                  setFeedback("");
                }}
                disabled={procesando}
                className="w-full py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default GestionSugerencias;
