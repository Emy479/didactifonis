/**
 * PlayerJuego.jsx
 *
 * Player fullscreen para juegos HTML5.
 * Recibe el juego via props o parámetros de URL.
 * Escucha mensajes postMessage del juego y envía progreso a la API.
 *
 * Props:
 *   asignacion  - objeto de asignación { _id, juego, ... }
 *   token       - token del paciente
 *   onTerminar  - callback cuando termina la sesión
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Maximize2, Minimize2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const PlayerJuego = ({ asignacion, token, onTerminar }) => {
  const iframeRef = useRef(null);
  const [cargando, setCargando] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [resultado, setResultado] = useState(null); // resultado final
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const juego = asignacion?.juego;

  // ── Construir URL del juego con parámetros ────────────────────────────────
  const urlJuego = juego?.urlJuego
    ? `${juego.urlJuego}?token=${token}&asignacionId=${asignacion._id}`
    : null;

  // ── Escuchar mensajes del juego (postMessage) ─────────────────────────────
  const handleMessage = useCallback(
    async (event) => {
      if (event.data?.tipo !== "JUEGO_TERMINADO") return;

      const datos = event.data.datos;
      setResultado(datos);
      setEnviando(true);
      setError(null);

      try {
        // Enviar progreso al backend
        const res = await fetch(`${API}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            asignacionId: asignacion._id,
            puntuacion: datos.puntuacion,
            tiempoJugado: datos.tiempoJugado,
            rondasCompletadas: datos.rondasCompletadas,
            rondasTotales: datos.rondasTotales,
            aciertos: datos.aciertos,
            errores: datos.errores,
            completado: datos.completado,
          }),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.error);
      } catch (err) {
        setError(
          "No se pudo guardar el progreso. El resultado fue registrado localmente.",
        );
        console.error("Error al guardar progreso:", err);
      } finally {
        setEnviando(false);
      }
    },
    [token, asignacion],
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // ── Toggle fullscreen ─────────────────────────────────────────────────────
  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  };

  // ── Render: pantalla de resultado ─────────────────────────────────────────
  if (resultado) {
    const aprobado =
      resultado.puntuacion >= (juego?.puntuacionMaxima * 0.6 || 60);
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "#0f1923" }}
      >
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
          <div className="text-6xl mb-4">{aprobado ? "🏆" : "💪"}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            {aprobado ? "¡Excelente!" : "¡Buen intento!"}
          </h2>
          <p className="text-gray-500 text-sm mb-6">{juego?.nombre}</p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { label: "Puntos", valor: resultado.puntuacion },
              { label: "Aciertos", valor: resultado.aciertos },
              { label: "Tiempo", valor: `${resultado.tiempoJugado}s` },
            ].map(({ label, valor }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-xl font-bold text-gray-900">{valor}</p>
                <p className="text-xs text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Estado de guardado */}
          {enviando && (
            <p className="text-sm text-blue-500 mb-4">Guardando progreso…</p>
          )}
          {error && <p className="text-xs text-red-400 mb-4">{error}</p>}

          <button
            onClick={onTerminar}
            disabled={enviando}
            className="w-full py-3 rounded-xl font-bold text-white transition-colors disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #3b82f6, #6366f1)" }}
          >
            {enviando ? "Guardando…" : "Volver"}
          </button>
        </div>
      </div>
    );
  }

  // ── Render: player con iframe ─────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "#0f1923" }}
    >
      {/* Barra superior mínima */}
      <div
        className="flex items-center justify-between px-4 py-2 flex-shrink-0"
        style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      >
        <span className="text-white font-medium text-sm truncate">
          {juego?.nombre || "Juego"}
        </span>

        <div className="flex items-center gap-2">
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-white opacity-60 hover:opacity-100 transition-opacity"
          >
            {fullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>

          {/* Cerrar */}
          <button
            onClick={onTerminar}
            className="p-1.5 rounded-lg text-white opacity-60 hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* iframe del juego */}
      <div className="flex-1 relative">
        {cargando && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
              <span className="text-white text-sm opacity-60">
                Cargando juego…
              </span>
            </div>
          </div>
        )}

        {urlJuego ? (
          <iframe
            ref={iframeRef}
            src={urlJuego}
            className="w-full h-full border-0"
            onLoad={() => setCargando(false)}
            allow="autoplay; fullscreen"
            title={juego?.nombre || "Juego"}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-white opacity-60">URL del juego no disponible</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerJuego;
