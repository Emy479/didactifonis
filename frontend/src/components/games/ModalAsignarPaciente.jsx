/**
 * ModalAsignarPaciente.jsx
 * Tema claro unificado con el resto del dashboard.
 */

import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ModalAsignarPaciente({ juego, onClose, onAsignado }) {
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [asignando, setAsignando] = useState(null);
  const [exitosos, setExitosos] = useState([]);

  const cargarPacientes = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success)
        throw new Error(data.error || "Error al cargar pacientes");
      setPacientes(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  const handleAsignar = async (paciente) => {
    setAsignando(paciente._id);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/assignments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ pacienteId: paciente._id, juegoId: juego._id }),
      });
      const data = await res.json();
      if (!data.success) {
        if (data.error?.includes("ya está asignado")) {
          setExitosos((prev) => [...prev, paciente._id]);
        } else {
          throw new Error(data.error || "Error al asignar juego");
        }
      } else {
        setExitosos((prev) => [...prev, paciente._id]);
        onAsignado?.(`${paciente.nombre} ${paciente.apellido}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAsignando(null);
    }
  };

  const iniciales = (nombre, apellido) =>
    `${nombre?.[0] || ""}${apellido?.[0] || ""}`.toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1 text-blue-600">
                Asignar juego
              </p>
              <h2 className="text-lg font-bold text-gray-900 leading-tight">
                {juego.nombre}
              </h2>
              <p className="text-sm mt-1 text-gray-500">
                Selecciona a quién le asignas este juego
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="p-4 max-h-[420px] overflow-y-auto">
          {error && (
            <div className="mb-3 px-3 py-2 rounded-lg text-sm bg-red-50 text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {cargando && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span className="text-sm text-gray-400">Cargando pacientes…</span>
            </div>
          )}

          {!cargando && pacientes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <span className="text-3xl">👦</span>
              <p className="text-sm font-medium text-gray-700">
                No tienes pacientes aún
              </p>
              <p className="text-xs text-gray-400">
                Crea pacientes desde "Gestión de Pacientes"
              </p>
            </div>
          )}

          {!cargando && pacientes.length > 0 && (
            <ul className="space-y-2">
              {pacientes.map((p) => {
                const asignado = exitosos.includes(p._id);
                const enProceso = asignando === p._id;

                return (
                  <li
                    key={p._id}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl border transition-all"
                    style={{
                      backgroundColor: asignado ? "#f0fdf4" : "#f8fafc",
                      borderColor: asignado ? "#bbf7d0" : "#e2e8f0",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white"
                      style={{
                        background: asignado
                          ? "linear-gradient(135deg, #22c55e, #16a34a)"
                          : "linear-gradient(135deg, #3b82f6, #6366f1)",
                      }}
                    >
                      {asignado ? "✓" : iniciales(p.nombre, p.apellido)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {p.nombre} {p.apellido}
                      </p>
                      <p className="text-xs text-gray-400">
                        {p.edad != null
                          ? `${p.edad} años`
                          : "Edad no disponible"}
                        {p.diagnostico
                          ? ` · ${p.diagnostico.slice(0, 28)}…`
                          : ""}
                      </p>
                    </div>

                    {/* Botón */}
                    <button
                      onClick={() =>
                        !asignado && !enProceso && handleAsignar(p)
                      }
                      disabled={enProceso || asignado}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-60"
                      style={
                        asignado
                          ? {
                              backgroundColor: "#dcfce7",
                              color: "#16a34a",
                              cursor: "default",
                            }
                          : enProceso
                            ? {
                                backgroundColor: "#dbeafe",
                                color: "#3b82f6",
                                cursor: "wait",
                              }
                            : {
                                background:
                                  "linear-gradient(135deg, #3b82f6, #6366f1)",
                                color: "white",
                              }
                      }
                    >
                      {asignado ? "✓ Asignado" : enProceso ? "…" : "Asignar"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
