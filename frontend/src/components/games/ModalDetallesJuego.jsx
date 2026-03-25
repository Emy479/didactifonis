/**
 * ModalDetallesJuego.jsx
 * Tema claro unificado con el resto del dashboard.
 */

import { useState } from "react";
import ModalAsignarPaciente from "./ModalAsignarPaciente";

const DIFICULTAD = {
  basico: { label: "Básico", color: "#16a34a", bg: "#dcfce7" },
  intermedio: { label: "Intermedio", color: "#b45309", bg: "#fef3c7" },
  avanzado: { label: "Avanzado", color: "#dc2626", bg: "#fee2e2" },
};

export default function ModalDetallesJuego({ juego, onClose }) {
  const [mostrarAsignar, setMostrarAsignar] = useState(false);
  const [toast, setToast] = useState(null);

  const dif =
    DIFICULTAD[juego.nivelDificultad?.toLowerCase()] || DIFICULTAD.intermedio;

  const handleAsignado = (nombre) => {
    setMostrarAsignar(false);
    setToast(`✓ "${juego.nombre}" asignado a ${nombre}`);
    setTimeout(() => setToast(null), 3500);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="relative w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200"
          style={{ maxHeight: "90vh", overflowY: "auto" }}
        >
          {/* Cabecera */}
          <div className="relative px-6 pt-6 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
            {/* Badge dificultad */}
            <span
              className="inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-3"
              style={{ backgroundColor: dif.bg, color: dif.color }}
            >
              {dif.label}
            </span>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-gray-900">{juego.nombre}</h2>
          </div>

          {/* Cuerpo */}
          <div className="px-6 py-5 space-y-5">
            {/* Descripción */}
            <p className="text-sm leading-relaxed text-gray-600">
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
                  className="flex flex-col items-center gap-1 py-3 rounded-xl text-center bg-gray-50 border border-gray-200"
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-semibold text-gray-900">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* Área terapéutica */}
            {juego.areaTerapeutica && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">
                  Área Terapéutica
                </p>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize bg-indigo-50 text-indigo-600">
                  {juego.areaTerapeutica}
                </span>
              </div>
            )}

            {/* Objetivos */}
            {juego.objetivos?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">
                  Objetivos de Aprendizaje
                </p>
                <ul className="space-y-1.5">
                  {juego.objetivos.map((obj, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <span className="mt-0.5 flex-shrink-0 text-green-500">
                        ✓
                      </span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instrucciones */}
            {juego.instrucciones && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-2 text-gray-400">
                  Instrucciones
                </p>
                <p className="text-sm text-gray-600">{juego.instrucciones}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 flex gap-3 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cerrar
            </button>
            <button
              onClick={() => setMostrarAsignar(true)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 text-white hover:opacity-90 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #6366f1)",
              }}
            >
              <span>📋</span> Asignar Juego
            </button>
          </div>
        </div>
      </div>

      {/* Modal asignar paciente */}
      {mostrarAsignar && (
        <ModalAsignarPaciente
          juego={juego}
          onClose={() => setMostrarAsignar(false)}
          onAsignado={handleAsignado}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-5 py-3 rounded-xl text-sm font-medium shadow-xl bg-green-50 text-green-700 border border-green-200">
          {toast}
        </div>
      )}
    </>
  );
}
