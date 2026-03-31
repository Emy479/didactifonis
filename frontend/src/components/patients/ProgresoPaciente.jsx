/**
 * ProgresoPaciente.jsx
 *
 * Muestra estadísticas y gráficas de progreso de un paciente.
 * Se integra dentro de PatientDetail.jsx
 *
 * Endpoints utilizados:
 *   GET /api/progress/estadisticas/:pacienteId  → stats generales
 *   GET /api/progress/patient/:pacienteId        → historial de sesiones
 */

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  obtenerEstadisticasPaciente,
  obtenerProgresoPaciente,
} from "../../api/progress";
import { TrendingUp, Award, Clock, Target } from "lucide-react";

const ProgresoPaciente = ({ pacienteId }) => {
  const [estadisticas, setEstadisticas] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [resStats, resHistorial] = await Promise.all([
        obtenerEstadisticasPaciente(pacienteId),
        obtenerProgresoPaciente(pacienteId, 20),
      ]);
      setEstadisticas(resStats.data);
      setHistorial(resHistorial.data || []);
    } catch (err) {
      setError(err.response?.data?.error || "Error al cargar progreso");
    } finally {
      setCargando(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // ── Preparar datos para gráfica de línea (puntuaciones últimas sesiones) ──
  const datosGrafica = historial
    .slice()
    .reverse()
    .slice(-10)
    .map((sesion, i) => ({
      sesion: i + 1,
      puntuacion: sesion.puntuacion || 0,
      fecha: sesion.fechaSesion
        ? new Date(sesion.fechaSesion).toLocaleDateString("es-CL", {
            day: "2-digit",
            month: "2-digit",
          })
        : `Sesión ${i + 1}`,
    }));

  // ── Preparar datos para gráfica de barras (juegos más jugados) ──
  const datosJuegos =
    estadisticas?.juegosMasJugados?.map((j) => ({
      nombre: j._id?.nombre
        ? j._id.nombre.length > 12
          ? j._id.nombre.slice(0, 12) + "…"
          : j._id.nombre
        : "Juego",
      sesiones: j.totalSesiones || 0,
      promedio: Math.round(j.promedioPuntuacion || 0),
    })) || [];

  // ── Sin datos aún ─────────────────────────────────────────────────────────
  if (!cargando && historial.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 overflow-x-hidden">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Progreso
        </h2>
        <div className="text-center py-8">
          <TrendingUp className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Sin sesiones registradas aún</p>
          <p className="text-xs text-gray-400 mt-1">
            El progreso aparecerá cuando el paciente juegue
          </p>
        </div>
      </div>
    );
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 overflow-x-hidden">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Progreso
        </h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-gray-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 overflow-x-hidden">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
          <TrendingUp className="h-5 w-5 text-blue-500" />
          Progreso
        </h2>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  const gen = estadisticas?.generales;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 overflow-x-hidden">
      <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-5">
        <TrendingUp className="h-5 w-5 text-blue-500" />
        Progreso
      </h2>

      {/* ── Stats rápidas ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
        {[
          {
            icon: Target,
            color: "text-blue-500",
            bg: "bg-blue-50",
            label: "Total sesiones",
            valor: gen?.totalSesiones || 0,
          },
          {
            icon: Award,
            color: "text-green-500",
            bg: "bg-green-50",
            label: "Mejor puntuación",
            valor: gen?.mejorPuntuacion || 0,
          },
          {
            icon: TrendingUp,
            color: "text-purple-500",
            bg: "bg-purple-50",
            label: "Promedio",
            valor: Math.round(gen?.promedioPuntuacion || 0),
          },
          {
            icon: Clock,
            color: "text-orange-500",
            bg: "bg-orange-50",
            label: "Tiempo total (min)",
            valor: Math.round((gen?.tiempoTotalJugado || 0) / 60),
          },
        ].map(({ icon: Icono, color, bg, label, valor }) => (
          <div
            key={label}
            className={`${bg} rounded-xl p-2 md:p-3 text-center`}
          >
            <Icono className={`h-4 w-4 md:h-5 md:w-5 ${color} mx-auto mb-1`} />
            <p className="text-lg md:text-xl font-bold text-gray-900">
              {valor}
            </p>
            <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 leading-tight">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* ── Gráfica de evolución de puntuaciones ── */}
      {datosGrafica.length > 1 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Evolución de puntuaciones (últimas {datosGrafica.length} sesiones)
          </p>
          <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={datosGrafica} margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="fecha"
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [value, "Puntuación"]}
                />
                <Line
                  type="monotone"
                  dataKey="puntuacion"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Gráfica de juegos más jugados ── */}
      {datosJuegos.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Juegos más jugados
          </p>
          <div className="w-full overflow-hidden">
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={datosJuegos}
                layout="vertical"
                margin={{ left: 0, right: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="nombre"
                  tick={{ fontSize: 10, fill: "#6b7280" }}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                  formatter={(value) => [value, "Sesiones"]}
                />
                <Bar dataKey="sesiones" fill="#818cf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── Historial reciente ── */}
      {historial.length > 0 && (
        <div className="mt-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Últimas sesiones
          </p>
          <div className="space-y-2">
            {historial.slice(0, 5).map((sesion) => (
              <div
                key={sesion._id}
                className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg gap-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${sesion.aprobado ? "bg-green-400" : "bg-gray-300"}`}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">
                      {sesion.juego?.nombre || "Juego"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {sesion.fechaSesion
                        ? new Date(sesion.fechaSesion).toLocaleDateString(
                            "es-CL",
                          )
                        : "–"}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-gray-900">
                    {sesion.puntuacion} pts
                  </p>
                  <p className="text-xs text-gray-400">
                    {Math.round((sesion.tiempoJugado || 0) / 60)} min
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgresoPaciente;
