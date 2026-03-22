/**
 * JugarPage.jsx
 *
 * Página pública accesible por token del paciente.
 * URL: /jugar?token=abc123
 *
 * Muestra los juegos asignados al paciente y permite iniciarlos.
 * No requiere login — usa el token del paciente.
 */

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PlayerJuego from "./PlayerJuego";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const JugarPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [paciente, setPaciente] = useState(null);
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [juegoActivo, setJuegoActivo] = useState(null); // asignación activa

  // ── Cargar datos del paciente por token ───────────────────────────────────
  useEffect(() => {
    const cargar = async () => {
      if (!token) {
        setError("Token no válido. Pide a tu tutor el enlace correcto.");
        setCargando(false);
        return;
      }

      try {
        const res = await fetch(`${API}/assignments/token/${token}/games`);
        const data = await res.json();

        if (!data.success) throw new Error(data.error || "Token inválido");

        setPaciente(data.paciente);
        setJuegos(data.juegos || []);
      } catch (err) {
        setError(err.message || "No se pudo cargar la información");
      } finally {
        setCargando(false);
      }
    };

    cargar();
  }, [token]);

  // ── Render: loading ───────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#0f1923" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-white opacity-60 text-sm">Cargando tus juegos…</p>
        </div>
      </div>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "#0f1923" }}
      >
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-white text-xl font-bold mb-2">
            Ups, algo salió mal
          </h2>
          <p className="text-white opacity-60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // ── Render: player activo ─────────────────────────────────────────────────
  if (juegoActivo) {
    return (
      <PlayerJuego
        asignacion={juegoActivo}
        token={token}
        onTerminar={() => setJuegoActivo(null)}
      />
    );
  }

  // ── Render: lista de juegos ───────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#0f1923" }}
    >
      {/* Cabecera */}
      <div
        className="px-6 py-5 flex items-center gap-4"
        style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
      >
        <div className="text-3xl">🎓</div>
        <div>
          <h1 className="text-white font-bold text-lg">
            ¡Hola, {paciente?.nombre}!
          </h1>
          <p className="text-white opacity-50 text-sm">
            Elige un juego para comenzar
          </p>
        </div>
      </div>

      {/* Lista de juegos */}
      <div className="flex-1 p-6">
        {juegos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="text-6xl">🎮</div>
            <p className="text-white font-medium">
              No tienes juegos asignados aún
            </p>
            <p className="text-white opacity-50 text-sm">
              Pide a tu tutor o profesional que te asigne juegos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {juegos.map((item) => {
              const juego = item.juego;
              return (
                <div
                  key={item.asignacionId}
                  className="rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition-all hover:scale-105"
                  style={{
                    backgroundColor: "#1e2a3a",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onClick={() =>
                    setJuegoActivo({
                      _id: item.asignacionId,
                      juego: juego,
                    })
                  }
                >
                  {/* Thumbnail o emoji */}
                  <div
                    className="w-full h-32 rounded-xl flex items-center justify-center text-6xl"
                    style={{ backgroundColor: "rgba(59,130,246,0.15)" }}
                  >
                    🎮
                  </div>

                  <div>
                    <h3 className="text-white font-bold text-base">
                      {juego?.nombre}
                    </h3>
                    <p className="text-white opacity-50 text-xs mt-0.5 line-clamp-2">
                      {juego?.descripcion}
                    </p>
                  </div>

                  {/* Stats previas */}
                  <div
                    className="flex items-center gap-3 text-xs"
                    style={{ color: "#64748b" }}
                  >
                    <span>
                      🎯 {item.estadisticas?.vecesJugado || 0} veces jugado
                    </span>
                    {item.estadisticas?.completado && (
                      <span style={{ color: "#4ade80" }}>✓ Completado</span>
                    )}
                  </div>

                  <button
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white mt-auto"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6, #6366f1)",
                    }}
                  >
                    ¡Jugar!
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default JugarPage;
