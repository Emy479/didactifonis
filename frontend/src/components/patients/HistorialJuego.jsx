/**
 * HistorialJuego — Modal de historial de puntuaciones
 * Visible solo para el profesional/tutor que gestiona al paciente.
 * No es información pública entre distintos pacientes.
 */

import { useState, useEffect } from "react";
import { obtenerEvolucion } from "../../api/progress";
import { X, TrendingUp, Trophy, Clock, Target } from "lucide-react";

const fmt = {
  fecha: (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });
  },
  hora: (iso) => new Date(iso).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }),
  tiempo: (seg) => {
    if (!seg) return "—";
    const m = Math.floor(seg / 60);
    const s = seg % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  },
};

export default function HistorialJuego({ pacienteId, juegoId, juegoNombre, onClose }) {
  const [sesiones, setSesiones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [dias, setDias] = useState(30);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    obtenerEvolucion(pacienteId, juegoId, dias)
      .then((res) => {
        if (!cancelado) setSesiones(res.data?.sesiones ?? res.data ?? []);
      })
      .catch(() => {})
      .finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [pacienteId, juegoId, dias]);

  const totalSesiones = sesiones.length;
  const mejorPuntaje  = totalSesiones ? Math.max(...sesiones.map((s) => s.puntuacion ?? 0)) : 0;
  const promedioPorc  = totalSesiones
    ? Math.round(sesiones.reduce((acc, s) => acc + (s.porcentajeAcierto ?? 0), 0) / totalSesiones)
    : 0;
  const aprobadas     = sesiones.filter((s) => s.aprobado).length;

  // Barra de progreso para la sparkline
  const maxPts = Math.max(...sesiones.map((s) => s.puntuacion ?? 0), 1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
              📊 Historial — {juegoNombre}
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Solo visible para el profesional/tutor asignado
            </p>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filtro rango */}
        <div className="flex items-center gap-2 px-5 pt-4">
          <span className="text-xs text-gray-500">Últimos:</span>
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDias(d)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                dias === d ? "bg-indigo-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}>
              {d} días
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="flex-1 flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : totalSesiones === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-6">
            <Trophy className="h-12 w-12 text-gray-200 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Sin sesiones en este período</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">El paciente no ha jugado este juego en los últimos {dias} días</p>
          </div>
        ) : (
          <>
            {/* Stats resumen */}
            <div className="grid grid-cols-4 gap-3 px-5 pt-4">
              {[
                { label: "Sesiones",   value: totalSesiones,  icon: Target,    color: "text-blue-600",   bg: "bg-blue-50 dark:bg-blue-900/20" },
                { label: "Mejor",      value: mejorPuntaje,   icon: Trophy,    color: "text-yellow-600 dark:text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/20" },
                { label: "% promedio", value: `${promedioPorc}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
                { label: "Aprobadas",  value: aprobadas,      icon: Clock,     color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                  <Icon className={`h-4 w-4 ${color} mx-auto mb-1`} />
                  <p className={`text-base font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            {/* Sparkline de barras */}
            {totalSesiones > 1 && (
              <div className="px-5 pt-4">
                <p className="text-xs text-gray-400 mb-2">Evolución de puntuaciones</p>
                <div className="flex items-end gap-1 h-12">
                  {[...sesiones].reverse().map((s, i) => {
                    const h = Math.round(((s.puntuacion ?? 0) / maxPts) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col justify-end" title={`${s.puntuacion} pts`}>
                        <div
                          className={`w-full rounded-t transition-all ${s.aprobado ? "bg-green-400" : "bg-indigo-300"}`}
                          style={{ height: `${Math.max(h, 8)}%` }}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                  <span>más antiguo</span>
                  <span>más reciente</span>
                </div>
              </div>
            )}

            {/* Lista de sesiones */}
            <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5 space-y-2">
              {[...sesiones].reverse().map((s, i) => (
                <div key={s._id ?? i}
                  className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
                    s.aprobado
                      ? "bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900"
                      : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"
                  }`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        s.aprobado ? "bg-green-500 text-white" : "bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300"
                      }`}>
                        {s.aprobado ? "✓" : "✗"}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white">{s.puntuacion ?? 0} pts</span>
                      {s.porcentajeAcierto != null && (
                        <span className="text-xs text-gray-400">({s.porcentajeAcierto}%)</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {fmt.fecha(s.fechaSesion)} · {fmt.hora(s.fechaSesion)}
                      {s.tiempoJugado ? ` · ${fmt.tiempo(s.tiempoJugado)}` : ""}
                    </p>
                  </div>
                  {(s.aciertos != null || s.errores != null) && (
                    <div className="flex gap-3 text-xs flex-shrink-0 ml-3">
                      <span className="text-green-600 font-medium">✓ {s.aciertos ?? 0}</span>
                      <span className="text-red-400 font-medium">✗ {s.errores ?? 0}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
