/**
 * ModalAsignarPaciente.jsx
 *
 * Modal que aparece al presionar "Asignar Juego".
 * Lista los pacientes del usuario y crea una Assignment via:
 *   POST /api/assignments  ← body: { pacienteId, juegoId }
 *
 * Props:
 *   juego       - { _id, nombre, ... }
 *   onClose     - fn para cerrar
 *   onAsignado  - fn(pacienteNombre) callback de éxito
 */

import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ModalAsignarPaciente({ juego, onClose, onAsignado }) {
  const [pacientes, setPacientes]   = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState(null);
  const [asignando, setAsignando]   = useState(null);  // _id del paciente en proceso
  const [exitosos, setExitosos]     = useState([]);    // _ids asignados OK en esta sesión

  // ── Cargar mis pacientes ──────────────────────────────────────────────────
  // GET /api/patients → obtenerTodos filtra por rol automáticamente en el backend
  const cargarPacientes = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/patients`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Error al cargar pacientes");
      setPacientes(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarPacientes(); }, [cargarPacientes]);

  // ── Crear Assignment ──────────────────────────────────────────────────────
  // POST /api/assignments  body: { pacienteId, juegoId }
  // El backend determina el "origen" (tutor/profesional) automáticamente
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
        body: JSON.stringify({
          pacienteId: paciente._id,
          juegoId: juego._id,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        // "ya está asignado" → mostrar como éxito visual (no es error para el usuario)
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
      style={{ backgroundColor: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
        style={{ backgroundColor: "#1e2a3a", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {/* Header */}
        <div
          className="px-6 pt-6 pb-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#3b82f6" }}>
                Asignar juego
              </p>
              <h2 className="text-lg font-bold text-white leading-tight">{juego.nombre}</h2>
              <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
                Selecciona a quién le asignas este juego
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cuerpo */}
        <div
          className="p-4 max-h-[420px] overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
        >
          {error && (
            <div
              className="mb-3 px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              {error}
            </div>
          )}

          {cargando && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span className="text-sm" style={{ color: "#64748b" }}>Cargando pacientes…</span>
            </div>
          )}

          {!cargando && pacientes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
              <span className="text-3xl">👦</span>
              <p className="text-sm font-medium text-white">No tienes pacientes aún</p>
              <p className="text-xs" style={{ color: "#64748b" }}>
                Crea pacientes desde "Gestión de Pacientes"
              </p>
            </div>
          )}

          {!cargando && pacientes.length > 0 && (
            <ul className="space-y-2">
              {pacientes.map((p) => {
                const asignado  = exitosos.includes(p._id);
                const enProceso = asignando === p._id;

                return (
                  <li
                    key={p._id}
                    className="flex items-center gap-3 px-3 py-3 rounded-xl"
                    style={{
                      backgroundColor: asignado ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.04)",
                      border: asignado ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{
                        background: asignado
                          ? "linear-gradient(135deg, #22c55e, #16a34a)"
                          : "linear-gradient(135deg, #3b82f6, #6366f1)",
                        color: "white",
                      }}
                    >
                      {asignado ? "✓" : iniciales(p.nombre, p.apellido)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {p.nombre} {p.apellido}
                      </p>
                      <p className="text-xs" style={{ color: "#64748b" }}>
                        {p.edad != null ? `${p.edad} años` : "Edad no disponible"}
                        {p.diagnostico ? ` · ${p.diagnostico.slice(0, 28)}…` : ""}
                      </p>
                    </div>

                    <button
                      onClick={() => !asignado && !enProceso && handleAsignar(p)}
                      disabled={enProceso || asignado}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={
                        asignado
                          ? { backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80", cursor: "default" }
                          : enProceso
                          ? { backgroundColor: "rgba(59,130,246,0.1)", color: "#93c5fd", cursor: "wait" }
                          : { background: "linear-gradient(135deg, #3b82f6, #6366f1)", color: "white" }
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
        <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#94a3b8" }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
