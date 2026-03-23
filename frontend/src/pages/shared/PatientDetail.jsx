/**
 * Página Detalle de Paciente - Ficha Clínica
 * Muestra información completa del paciente y sus juegos asignados
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
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
} from "lucide-react";
import ProgresoPaciente from "../../components/patients/ProgresoPaciente";
import PlayerJuego from "../jugar/PlayerJuego";
import ModalAsignarProfesional from "../../components/patients/ModalAsignarProfesional";

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

  const [paciente, setPaciente] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [juegoActivo, setJuegoActivo] = useState(null);
  const [mostrarAsignarProf, setMostrarAsignarProf] = useState(false);

  // ── Cargar datos del paciente y sus asignaciones ──────────────────────────
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [resPaciente, resAsignaciones] = await Promise.all([
        obtenerPaciente(id),
        obtenerAsignacionesPaciente(id),
      ]);
      setPaciente(resPaciente.data);
      setAsignaciones(resAsignaciones.data);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar los datos");
    } finally {
      setCargando(false);
    }
  }, [id]);

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
      setError(err.response?.data?.error || "Error al quitar el juego");
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
      setError(err.response?.data?.error || "Error al eliminar paciente");
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
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error && !paciente) {
    return (
      <DashboardLayout>
        <Alert type="error" message={error} />
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
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Volver a pacientes</span>
          </button>

          {error && (
            <Alert
              type="error"
              message={error}
              onClose={() => setError(null)}
              className="mb-4"
            />
          )}

          {/* ── CABECERA ── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-blue-600">
                  {iniciales}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {nombreCompleto}
                    </h1>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {calcularEdad(paciente.fechaNacimiento)} años
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {paciente.genero === "masculino"
                          ? "Masculino"
                          : paciente.genero === "femenino"
                            ? "Femenino"
                            : "No especificado"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Badge tipo cuenta */}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        paciente.tipoCuenta === "familiar"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {paciente.tipoCuenta === "familiar"
                        ? "Plan Familiar"
                        : "Plan Profesional"}
                    </span>

                    {/* Botón editar */}
                    <button
                      onClick={() => navigate(`/pacientes/${id}/editar`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
                    >
                      <UserCog className="h-4 w-4" />
                      Editar
                    </button>

                    {/* Botón eliminar */}
                    <button
                      onClick={() => setConfirmarEliminar(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* ── DIAGNÓSTICO ── */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                <FileText className="h-5 w-5 text-blue-500" />
                Diagnóstico
              </h2>
              {paciente.diagnostico ? (
                <p className="text-sm text-gray-600 leading-relaxed">
                  {paciente.diagnostico}
                </p>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Sin diagnóstico registrado
                </p>
              )}

              {paciente.observaciones && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Observaciones
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {paciente.observaciones}
                  </p>
                </div>
              )}
            </div>

            {/* ── ÁREAS DE TRABAJO ── */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                <Brain className="h-5 w-5 text-purple-500" />
                Áreas de Trabajo
              </h2>
              {paciente.areasTrabajar?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {paciente.areasTrabajar.map((area) => (
                    <span
                      key={area}
                      className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium"
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
            <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
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
                    className="flex items-center justify-between gap-2 px-3 py-2 bg-green-50 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-200 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-green-700">
                          {typeof prof === "object" ? prof.nombre?.[0] : "?"}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-green-800">
                        {typeof prof === "object" ? prof.nombre : "Profesional"}
                      </span>
                    </div>

                    {/* Botón remover — solo visible para tutores */}
                    {user?.role === "tutor" && (
                      <button
                        onClick={() =>
                          removerProfesional(paciente._id, prof._id).then(
                            cargarDatos,
                          )
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
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
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
                <p className="text-sm text-gray-400">
                  No hay juegos asignados aún
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Ve a la Biblioteca de Juegos para asignar uno
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {asignaciones.map((asignacion) => (
                  <div
                    key={asignacion._id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Gamepad2 className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {asignacion.juego?.nombre || "Juego"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {asignacion.estadisticas?.vecesJugado || 0} veces
                          jugado
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
          {/* Modal de confirmación */}
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
                    ¿Eliminar paciente?
                  </h3>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Esta acción desactivará el perfil de{" "}
                  <span className="font-semibold">{nombreCompleto}</span>. No se
                  eliminarán sus datos históricos.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmarEliminar(false)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
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
    </>
  );
};

export default PatientDetail;
