/**
 * EstadisticasLog.jsx
 * Log de seguimiento por paciente.
 */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";
import DashboardLayout from "../../components/layout/DashboardLayout";
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
  const toast = useToast();

  const [pacientes, setPacientes] = useState([]);
  const [statsMap, setStatsMap] = useState({});
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      const resPacientes = await obtenerMisPacientes();
      const lista = resPacientes.data || [];
      setPacientes(lista);

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
      toast.error(err.response?.data?.error || "Error al cargar datos");
    } finally {
      setCargando(false);
    }
  }, [toast]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        {/* Cabecera */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Seguimiento de Pacientes
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Resumen de actividad —{" "}
            {user?.role === "tutor" ? "tus hijos" : "tus pacientes"}
          </p>
        </div>

        {/* Skeleton loading */}
        {cargando && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-gray-200 p-5"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-36 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-8 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-8 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                  <div className="h-8 flex-1 bg-gray-200 rounded-lg animate-pulse" />
                </div>
              </div>
            ))}
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
                  className={`bg-white rounded-2xl border p-4 md:p-5 transition-all ${
                    paciente.activo
                      ? "border-gray-200 hover:border-blue-200 hover:shadow-sm"
                      : "border-gray-100 opacity-60"
                  }`}
                >
                  {/* Fila superior — avatar + nombre + botón */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${
                          paciente.activo
                            ? "bg-blue-100 text-blue-600"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {iniciales}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm md:text-base font-semibold text-gray-900 truncate">
                            {paciente.nombre} {paciente.apellido}
                          </h3>
                          {!paciente.activo && (
                            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full flex-shrink-0">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {paciente.edad} años
                          {paciente.tipoCuenta && (
                            <span className="ml-1">
                              ·{" "}
                              {paciente.tipoCuenta === "familiar"
                                ? "Plan Familiar"
                                : "Plan Profesional"}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Botón ver ficha */}
                    <button
                      onClick={() => navigate(`/pacientes/${paciente._id}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs md:text-sm font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors flex-shrink-0"
                    >
                      Ver ficha
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Stats — siempre visibles, fila horizontal */}
                  <div className="flex items-center gap-3 md:gap-6">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                      <span className="text-sm font-bold text-gray-900">
                        {tiempoMin}
                      </span>
                      <span className="text-xs text-gray-400">min</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                      <span className="text-sm font-bold text-gray-900">
                        {gen?.totalSesiones || 0}
                      </span>
                      <span className="text-xs text-gray-400">sesiones</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Award className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />
                      <span className="text-sm font-bold text-gray-900">
                        {gen?.mejorPuntuacion || 0}
                      </span>
                      <span className="text-xs text-gray-400">mejor</span>
                    </div>
                  </div>

                  {/* Áreas trabajadas */}
                  {paciente.areasTrabajar?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3">
                      <Brain className="h-3.5 w-3.5 text-purple-400 flex-shrink-0" />
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
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EstadisticasLog;
