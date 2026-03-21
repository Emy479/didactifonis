/**
 * EstadisticasLog.jsx
 *
 * Log de seguimiento por paciente.
 * Muestra resumen no invasivo de cada paciente con acceso a su ficha.
 *
 * Endpoints utilizados:
 *   GET /api/patients          → listar pacientes
 *   GET /api/progress/estadisticas/:id → stats por paciente
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Spinner from "../../components/common/Spinner";
import Alert from "../../components/common/Alert";
import { obtenerMisPacientes } from "../../api/patients";
import { obtenerEstadisticasPaciente } from "../../api/progress";
import {
  TrendingUp,
  Clock,
  Award,
  Brain,
  ArrowRight,
  User,
} from "lucide-react";

const AREAS_LABEL = {
  fonologia: "Fonología",
  semantica: "Semántica",
  morfosintaxis: "Morfosintaxis",
  pragmatica: "Pragmática",
  habla: "Habla",
  lenguaje: "Lenguaje",
};

const EstadisticasLog = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pacientes, setPacientes] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // ── Cargar pacientes y sus stats ──────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const resPacientes = await obtenerMisPacientes();
      const lista = resPacientes.data || [];
      setPacientes(lista);

      // Cargar stats de cada paciente en paralelo
      const statsResultados = await Promise.allSettled(
        lista.map((p) => obtenerEstadisticasPaciente(p._id)),
      );

      const mapa = {};
      statsResultados.forEach((resultado, i) => {
        if (resultado.status === "fulfilled") {
          mapa[lista[i]._id] = resultado.value.data;
        } else {
          mapa[lista[i]._id] = null;
        }
      });
      setStatsMap(mapa);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Cabecera */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Seguimiento de Pacientes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Resumen de actividad —{" "}
            {user?.role === "tutor" ? "tus hijos" : "tus pacientes"}
          </p>
        </div>

        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}

        {/* Loading */}
        {cargando && (
          <div className="flex justify-center py-20">
            <Spinner size="lg" />
          </div>
        )}

        {/* Sin pacientes */}
        {!cargando && pacientes.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <User className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No tienes pacientes registrados
            </p>
          </div>
        )}

        {/* Lista de tarjetas */}
        {!cargando && pacientes.length > 0 && (
          <div className="space-y-4">
            {pacientes.map((paciente) => {
              const stats = statsMap[paciente._id];
              const gen = stats?.generales;
              const iniciales =
                `${paciente.nombre?.[0] || ""}${paciente.apellido?.[0] || ""}`.toUpperCase();
              const tiempoMin = Math.round((gen?.tiempoTotalJugado || 0) / 60);

              return (
                <div
                  key={paciente._id}
                  className={`bg-white rounded-2xl border p-5 transition-all ${
                    paciente.activo
                      ? "border-gray-200 hover:border-blue-200 hover:shadow-sm"
                      : "border-gray-100 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Info del paciente */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                          paciente.activo
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {iniciales}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-semibold text-gray-900">
                            {paciente.nombre} {paciente.apellido}
                          </h3>
                          {!paciente.activo && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-0.5">
                          {paciente.edad} años
                          {paciente.tipoCuenta && (
                            <span className="ml-2 capitalize">
                              ·{" "}
                              {paciente.tipoCuenta === "familiar"
                                ? "Plan Familiar"
                                : "Plan Profesional"}
                            </span>
                          )}
                        </p>

                        {/* Áreas trabajadas */}
                        {paciente.areasTrabajar?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Brain className="h-3.5 w-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                            {paciente.areasTrabajar.map((area) => (
                              <span
                                key={area}
                                className="text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full"
                              >
                                {AREAS_LABEL[area] || area}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats de actividad */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      {/* Tiempo jugado */}
                      <div className="text-center hidden sm:block">
                        <div className="flex items-center gap-1 justify-center">
                          <Clock className="h-4 w-4 text-orange-400" />
                          <span className="text-lg font-bold text-gray-900">
                            {tiempoMin}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">min jugados</p>
                      </div>

                      {/* Sesiones */}
                      <div className="text-center hidden sm:block">
                        <div className="flex items-center gap-1 justify-center">
                          <TrendingUp className="h-4 w-4 text-blue-400" />
                          <span className="text-lg font-bold text-gray-900">
                            {gen?.totalSesiones || 0}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">sesiones</p>
                      </div>

                      {/* Mejor puntuación */}
                      <div className="text-center hidden md:block">
                        <div className="flex items-center gap-1 justify-center">
                          <Award className="h-4 w-4 text-yellow-400" />
                          <span className="text-lg font-bold text-gray-900">
                            {gen?.mejorPuntuacion || 0}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">mejor punt.</p>
                      </div>

                      {/* Botón ver ficha */}
                      <button
                        onClick={() => navigate(`/pacientes/${paciente._id}`)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0"
                      >
                        Ver ficha
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EstadisticasLog;
