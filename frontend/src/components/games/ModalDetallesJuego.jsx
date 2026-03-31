/**
 * ModalDetallesJuego.jsx
 * Tema claro unificado con el resto del dashboard.
 */

import { useState } from "react";
import ModalAsignarPaciente from "./ModalAsignarPaciente";
import { useToast } from "../../context/ToastContext";

const DIFICULTAD = {
  basico: { label: "Básico", color: "#16a34a", bg: "#dcfce7" },
  intermedio: { label: "Intermedio", color: "#b45309", bg: "#fef3c7" },
  avanzado: { label: "Avanzado", color: "#dc2626", bg: "#fee2e2" },
};

export default function ModalDetallesJuego({ juego, onClose }) {
  const [mostrarAsignar, setMostrarAsignar] = useState(false);
  const toast = useToast(); // 🔔 reemplaza toast local

  const dif =
    DIFICULTAD[juego.nivelDificultad?.toLowerCase()] || DIFICULTAD.intermedio;

  const handleAsignado = (nombre) => {
    setMostrarAsignar(false);
    toast.exito(`"${juego.nombre}" asignado a ${nombre}`);
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div
          className="relative w-full sm:max-w-lg bg-white sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl border border-gray-200 flex flex-col"
          style={{ maxHeight: "92vh" }}
        >
          {/* Cabecera */}
          <div className="relative px-5 pt-5 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex-shrink-0">
            {/* Handle mobile */}
            <div className="sm:hidden w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />

            <span
              className="inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2"
              style={{ backgroundColor: dif.bg, color: dif.color }}
            >
              {dif.label}
            </span>

            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>

            <h2 className="text-lg font-bold text-gray-900 pr-8">
              {juego.nombre}
            </h2>
          </div>

          {/* Cuerpo scrolleable */}
          <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
            {/* Descripción */}
            <p className="text-sm leading-relaxed text-gray-600">
              {juego.descripcion}
            </p>

            {/* Stats — 3 columnas en sm, 3 columnas compactas en mobile */}
            <div className="grid grid-cols-3 gap-2">
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
                  <span className="text-base">{icon}</span>
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-semibold text-gray-900 leading-tight">
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
          <div className="px-5 py-4 flex gap-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
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
              📋 Asignar Juego
            </button>
          </div>
        </div>
      </div>

      {mostrarAsignar && (
        <ModalAsignarPaciente
          juego={juego}
          onClose={() => setMostrarAsignar(false)}
          onAsignado={handleAsignado}
        />
      )}
    </>
  );
}
