/**
 * ModalDetallesJuego.jsx
 *
 * Modal flotante con detalles completos del juego.
 * Botón "Asignar Juego" abre ModalAsignarPaciente.
 *
 * Props:
 *   juego    - objeto completo del juego desde GET /api/games
 *   onClose  - fn para cerrar
 */

import { useState } from "react";
import ModalAsignarPaciente from "./ModalAsignarPaciente";

const DIFICULTAD = {
  basico: { label: "Básico", color: "#4ade80", bg: "rgba(34,197,94,0.12)" },
  intermedio: {
    label: "Intermedio",
    color: "#facc15",
    bg: "rgba(234,179,8,0.12)",
  },
  avanzado: { label: "Avanzado", color: "#f87171", bg: "rgba(239,68,68,0.12)" },
};

export default function ModalDetallesJuego({ juego, onClose }) {
  const [mostrarAsignar, setMostrarAsignar] = useState(false);
  const [toast, setToast] = useState(null);

  const dif =
    DIFICULTAD[juego.nivelDificultad?.toLowerCase()] || DIFICULTAD.medio;

  const handleAsignado = (nombre) => {
    setMostrarAsignar(false);
    setToast(`✓ "${juego.nombre}" asignado a ${nombre}`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <>
      {/* Overlay principal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(6px)",
        }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="relative w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl"
          style={{
            backgroundColor: "#1e2a3a",
            border: "1px solid rgba(255,255,255,0.09)",
            maxHeight: "90vh",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#334155 transparent",
          }}
        >
          {/* ── Cabecera con imagen ── */}
          <div
            className="relative h-36 flex items-end"
            style={{
              background: "linear-gradient(135deg, #1e3a5f 0%, #1e2a3a 100%)",
            }}
          >
            {juego.imagen && (
              <img
                src={juego.imagen}
                alt={juego.nombre}
                className="absolute inset-0 w-full h-full object-cover opacity-20"
              />
            )}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to top, #1e2a3a 0%, transparent 60%)",
              }}
            />

            {/* Badge dificultad */}
            <div className="absolute top-4 left-6">
              <span
                className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ backgroundColor: dif.bg, color: dif.color }}
              >
                {dif.label}
              </span>
            </div>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-sm"
              style={{ backgroundColor: "rgba(0,0,0,0.4)", color: "#94a3b8" }}
            >
              ✕
            </button>

            <div className="relative px-6 pb-4">
              <h2 className="text-xl font-bold text-white">{juego.nombre}</h2>
            </div>
          </div>

          {/* ── Cuerpo ── */}
          <div className="px-6 py-5 space-y-5">
            {/* Descripción */}
            <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
              {juego.descripcion}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: "🕐",
                  label: "Duración",
                  value: juego.duracionEstimada
                    ? `${juego.duracionEstimada} min`
                    : "–",
                },
                {
                  icon: "👤",
                  label: "Edad",
                  value:
                    juego.rangoEdad?.min && juego.rangoEdad?.max
                      ? `${juego.rangoEdad.min}-${juego.rangoEdad.max} años`
                      : "–",
                },
                {
                  icon: "⭐",
                  label: "Rondas",
                  value: juego.numeroRondas
                    ? `${juego.numeroRondas} rondas`
                    : "–",
                },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 py-3 rounded-xl text-center"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs" style={{ color: "#64748b" }}>
                    {label}
                  </span>
                  <span className="text-xs font-semibold text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Áreas terapéuticas */}
            {juego.areaTerapeutica && (
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "#64748b" }}
                >
                  Área Terapéutica
                </p>
                <div className="flex flex-wrap gap-2">
                  {[juego.areaTerapeutica].map((area) => (
                    <span
                      key={area}
                      className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                      style={{
                        backgroundColor: "rgba(99,102,241,0.15)",
                        color: "#a5b4fc",
                      }}
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Objetivos */}
            {juego.objetivos?.length > 0 && (
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "#64748b" }}
                >
                  Objetivos de Aprendizaje
                </p>
                <ul className="space-y-1.5">
                  {juego.objetivos.map((obj, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm"
                      style={{ color: "#cbd5e1" }}
                    >
                      <span
                        className="mt-0.5 flex-shrink-0"
                        style={{ color: "#22c55e" }}
                      >
                        ✓
                      </span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Beneficios clínicos */}
            {juego.beneficiosAdicionales && (
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "#64748b" }}
                >
                  Beneficios Clínicos
                </p>
                <p className="text-sm" style={{ color: "#94a3b8" }}>
                  {juego.beneficiosAdicionales}
                </p>
              </div>
            )}

            {/* Compatibilidad */}
            {juego.compatibilidad?.length > 0 && (
              <div>
                <p
                  className="text-xs font-semibold uppercase tracking-widest mb-2"
                  style={{ color: "#64748b" }}
                >
                  Compatibilidad
                </p>
                <div className="flex flex-wrap gap-3">
                  {juego.compatibilidad.map((c) => (
                    <span
                      key={c}
                      className="text-xs"
                      style={{ color: "#64748b" }}
                    >
                      ✓ {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Footer acciones ── */}
          <div
            className="px-6 py-4 flex gap-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "#94a3b8",
              }}
            >
              Cerrar
            </button>
            <button
              onClick={() => setMostrarAsignar(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                color: "white",
              }}
            >
              <span>📋</span> Asignar Juego
            </button>
          </div>
        </div>
      </div>

      {/* Modal de selección de paciente (z-index mayor) */}
      {mostrarAsignar && (
        <ModalAsignarPaciente
          juego={juego}
          onClose={() => setMostrarAsignar(false)}
          onAsignado={handleAsignado}
        />
      )}

      {/* Toast de éxito */}
      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-xl text-sm font-medium shadow-xl"
          style={{
            backgroundColor: "rgba(34,197,94,0.15)",
            color: "#4ade80",
            border: "1px solid rgba(34,197,94,0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          {toast}
        </div>
      )}
    </>
  );
}
