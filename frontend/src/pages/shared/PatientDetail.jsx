/**
 * Página Detalle de Paciente - Ficha Clínica
 * Muestra información completa del paciente y sus juegos asignados
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
import {
  obtenerPaciente,
  eliminarPaciente,
  removerProfesional,
} from "../../api/patients";
import {
  obtenerAsignacionesPaciente,
  desactivarAsignacion,
} from "../../api/assignments";
import {
  ArrowLeft,
  User,
  Calendar,
  FileText,
  Brain,
  Gamepad2,
  Users,
  UserCog,
  Trash2,
  Play,
  Download,
} from "lucide-react";
import ProgresoPaciente from "../../components/patients/ProgresoPaciente";
import PlayerJuego from "../jugar/PlayerJuego";
import ModalAsignarProfesional from "../../components/patients/ModalAsignarProfesional";
import ModalExportarPDF from "../../components/patients/ModalExportarPDF";
import HistorialJuego from "../../components/patients/HistorialJuego";

const AREAS_LABEL = {
  fonologia: "Fonología",
  semantica: "Semántica",
  morfosintaxis: "Morfosintaxis",
  pragmatica: "Pragmática",
  habla: "Habla",
  lenguaje: "Lenguaje",
};

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [paciente, setPaciente] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [juegoActivo, setJuegoActivo] = useState(null);
  const [historialJuego, setHistorialJuego] = useState(null); // { juegoId, nombre }
  const [mostrarAsignarProf, setMostrarAsignarProf] = useState(false);
  const [mostrarExportarPDF, setMostrarExportarPDF] = useState(false);

  // ── Cargar datos del paciente y sus asignaciones ──────────────────────────
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const [resPaciente, resAsignaciones] = await Promise.all([
        obtenerPaciente(id),
        obtenerAsignacionesPaciente(id),
      ]);
      setPaciente(resPaciente.data);
      setAsignaciones(resAsignaciones.data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al cargar los datos");
      navigate(
        user?.role === "tutor" ? "/tutor/pacientes" : "/profesional/pacientes",
      );
    } finally {
      setCargando(false);
    }
  }, [id, toast, navigate, user?.role]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ── Desactivar asignación ─────────────────────────────────────────────────
  const handleDesactivar = async (asignacionId) => {
    setEliminando(asignacionId);
    try {
      await desactivarAsignacion(asignacionId);
      setAsignaciones((prev) => prev.filter((a) => a._id !== asignacionId));
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al quitar el juego");
    } finally {
      setEliminando(null);
    }
  };

  // ── Calcular edad ─────────────────────────────────────────────────────────
  const calcularEdad = (fecha) => {
    if (!fecha) return "N/A";
    const hoy = new Date();
    const nac = new Date(fecha);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  };

  // ── Eliminar paciente ─────────────────────────────────────────────────────
  const handleEliminar = async () => {
    try {
      await eliminarPaciente(id);
      navigate(rutaRegreso);
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al eliminar paciente");
      setConfirmarEliminar(false);
    }
  };

  // ── Ruta de regreso según rol ─────────────────────────────────────────────
  const rutaRegreso =
    user?.role === "tutor" ? "/tutor/pacientes" : "/profesional/pacientes";

  // ── Loading ───────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <div className="h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="flex items-start gap-5">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
                <div className="flex gap-2 mt-2">
                  <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6 space-y-4">
            <div className="h-5 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                    <div className="h-4 w-12 bg-gray-200 dark:bg-gray-600 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const nombreCompleto = `${paciente.nombre} ${paciente.apellido}`;
  const iniciales =
    `${paciente.nombre?.[0]}${paciente.apellido?.[0]}`.toUpperCase();

  return (
    <>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Botón volver */}
          <button
            onClick={() => navigate(rutaRegreso)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Volver a pacientes</span>
          </button>

          {/* ── CABECERA ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 mb-6">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 md:w-16 md:h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                  {iniciales}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                    {nombreCompleto}
                  </h1>
                  <span
                    className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
                      paciente.tipoCuenta === "familiar"
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {paciente.tipoCuenta === "familiar"
                      ? "Plan Familiar"
                      : "Plan Profesional"}
                  </span>
                </div>

                {/* Edad y género */}
                <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    {calcularEdad(paciente.fechaNacimiento)} años
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4 flex-shrink-0" />
                    {paciente.genero === "masculino"
                      ? "Masculino"
                      : paciente.genero === "femenino"
                        ? "Femenino"
                        : "No especificado"}
                  </span>
                </div>

                {/* Botones */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={() => navigate(`/pacientes/${id}/editar`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    <UserCog className="h-4 w-4" />
                    Editar
                  </button>

                  {/* ── Botón exportar PDF ── */}
                  <button
                    onClick={() => setMostrarExportarPDF(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                  >
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </button>

                  <button
                    onClick={() => setConfirmarEliminar(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    <Trash2 className="h-4 w-4" />
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* ── DIAGNÓSTICO ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white mb-4">
                <FileText className="h-5 w-5 text-blue-500" />
                Diagnóstico
              </h2>
              {paciente.diagnostico ? (
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {paciente.diagnostico}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Sin diagnóstico registrado
                </p>
              )}
              {paciente.observaciones && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                    Observaciones
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {paciente.observaciones}
                  </p>
                </div>
              )}
            </div>

            {/* ── ÁREAS DE TRABAJO ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white mb-4">
                <Brain className="h-5 w-5 text-purple-500" />
                Áreas de Trabajo
              </h2>
              {paciente.areasTrabajar?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {paciente.areasTrabajar.map((area) => (
                    <span
                      key={area}
                      className="px-3 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium"
                    >
                      {AREAS_LABEL[area] || area}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Sin áreas registradas
                </p>
              )}
            </div>
          </div>

          {/* ── PROFESIONALES ASIGNADOS ── */}
          {(paciente.profesionalesAsignados?.length > 0 ||
            user?.role === "tutor") && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
                  <Users className="h-5 w-5 text-green-500" />
                  Profesionales Asignados
                </h2>
                {user?.role === "tutor" && (
                  <button
                    onClick={() => setMostrarAsignarProf(true)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                    style={{ backgroundColor: "#dbeafe", color: "#1d4ed8" }}
                  >
                    + Asignar
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {paciente.profesionalesAsignados.map((prof) => (
                  <div
                    key={prof._id || prof}
                    className="flex items-center justify-between gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-green-700 dark:text-green-300">
                          {typeof prof === "object" ? prof.nombre?.[0] : "?"}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-green-800 dark:text-green-300">
                        {typeof prof === "object" ? prof.nombre : "Profesional"}
                      </span>
                    </div>
                    {user?.role === "tutor" && (
                      <button
                        onClick={() =>
                          removerProfesional(paciente._id, prof._id).then(cargarDatos)
                        }
                        className="text-xs text-red-400 hover:text-red-600 font-medium transition-colors"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── JUEGOS ASIGNADOS ── */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white mb-4">
              <Gamepad2 className="h-5 w-5 text-orange-500" />
              Juegos Asignados
              <span className="ml-auto text-sm font-normal text-gray-400">
                {asignaciones.length}{" "}
                {asignaciones.length === 1 ? "juego" : "juegos"}
              </span>
            </h2>
            {asignaciones.length === 0 ? (
              <div className="text-center py-8">
                <Gamepad2 className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No hay juegos asignados aún</p>
                <p className="text-xs text-gray-400 mt-1">
                  Ve a la Biblioteca de Juegos para asignar uno
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {asignaciones.map((asignacion) => (
                  <div
                    key={asignacion._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      {asignacion.juego?.thumbnail && asignacion.juego.thumbnail !== "default-game.png" ? (
                        <img
                          src={asignacion.juego.thumbnail}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Gamepad2 className="h-5 w-5 text-orange-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {asignacion.juego?.nombre || "Juego"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {asignacion.estadisticas?.vecesJugado || 0} veces jugado
                          {asignacion.estadisticas?.completado && (
                            <span className="ml-2 text-green-600 font-medium">
                              ✓ Completado
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() =>
                          setJuegoActivo({
                            _id: asignacion._id,
                            juego: asignacion.juego,
                          })
                        }
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 font-medium transition-colors"
                      >
                        <Play className="h-3 w-3" />
                        Jugar
                      </button>
                      {asignacion.estadisticas?.vecesJugado > 0 && (
                        <button
                          onClick={() => setHistorialJuego({
                            juegoId: asignacion.juego?._id,
                            nombre: asignacion.juego?.nombre || "Juego",
                          })}
                          className="flex items-center gap-1 text-xs text-purple-500 hover:text-purple-700 font-medium transition-colors"
                        >
                          📊 Historial
                        </button>
                      )}
                      <button
                        onClick={() => handleDesactivar(asignacion._id)}
                        disabled={eliminando === asignacion._id}
                        className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors disabled:opacity-50"
                      >
                        {eliminando === asignacion._id ? "Quitando…" : "Quitar"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── PROGRESO ── */}
          <div className="mt-6">
            <ProgresoPaciente pacienteId={id} />
          </div>

          {/* Modal confirmar eliminar */}
          {confirmarEliminar && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
            >
              <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    ¿Eliminar paciente?
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Esta acción desactivará el perfil de{" "}
                  <span className="font-semibold">{nombreCompleto}</span>. No se
                  eliminarán sus datos históricos.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmarEliminar(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleEliminar}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>

      {/* Modal asignar profesional */}
      {mostrarAsignarProf && (
        <ModalAsignarProfesional
          pacienteId={id}
          profesionalesActuales={paciente?.profesionalesAsignados || []}
          onClose={() => setMostrarAsignarProf(false)}
          onActualizado={() => {
            setMostrarAsignarProf(false);
            cargarDatos();
          }}
        />
      )}

      {/* Modal exportar PDF */}
      {mostrarExportarPDF && paciente && (
        <ModalExportarPDF
          paciente={paciente}
          asignaciones={asignaciones}
          onClose={() => setMostrarExportarPDF(false)}
        />
      )}

      {/* Player de juego */}
      {juegoActivo && (
        <PlayerJuego
          asignacion={juegoActivo}
          token={paciente?.accessToken}
          onTerminar={() => {
            setJuegoActivo(null);
            cargarDatos();
          }}
        />
      )}

      {/* Historial de puntuaciones — solo visible para profesional/tutor */}
      {historialJuego && (
        <HistorialJuego
          pacienteId={id}
          juegoId={historialJuego.juegoId}
          juegoNombre={historialJuego.nombre}
          onClose={() => setHistorialJuego(null)}
        />
      )}
    </>
  );
};

export default PatientDetail;
