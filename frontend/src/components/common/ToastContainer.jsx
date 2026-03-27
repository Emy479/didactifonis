/**
 * ToastContainer
 * Renderiza las notificaciones flotantes en esquina inferior derecha
 */

import { useContext } from "react";
import ToastContext from "../../context/ToastContext";

const TIPOS = {
  exito: {
    bg: "#f0fdf4",
    borde: "#86efac",
    icono: "✓",
    iconoBg: "#22c55e",
    texto: "#15803d",
  },
  error: {
    bg: "#fef2f2",
    borde: "#fca5a5",
    icono: "✕",
    iconoBg: "#ef4444",
    texto: "#b91c1c",
  },
  info: {
    bg: "#eff6ff",
    borde: "#93c5fd",
    icono: "i",
    iconoBg: "#3b82f6",
    texto: "#1d4ed8",
  },
  advertencia: {
    bg: "#fffbeb",
    borde: "#fcd34d",
    icono: "!",
    iconoBg: "#f59e0b",
    texto: "#92400e",
  },
};

const ToastContainer = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;

  const { toasts, removeToast } = ctx;

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "360px",
        width: "100%",
      }}
    >
      {toasts.map(({ id, mensaje, tipo }) => {
        const estilo = TIPOS[tipo] || TIPOS.info;
        return (
          <div
            key={id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              backgroundColor: estilo.bg,
              border: `1px solid ${estilo.borde}`,
              borderRadius: "10px",
              padding: "12px 14px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              animation: "toastEntrar 0.25s ease",
            }}
          >
            {/* Ícono */}
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                backgroundColor: estilo.iconoBg,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: "bold",
                flexShrink: 0,
                marginTop: "1px",
              }}
            >
              {estilo.icono}
            </div>

            {/* Mensaje */}
            <p
              style={{
                flex: 1,
                margin: 0,
                fontSize: "14px",
                color: estilo.texto,
                lineHeight: "1.4",
              }}
            >
              {mensaje}
            </p>

            {/* Botón cerrar */}
            <button
              onClick={() => removeToast(id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#9ca3af",
                fontSize: "16px",
                padding: "0",
                lineHeight: "1",
                flexShrink: 0,
              }}
            >
              ×
            </button>
          </div>
        );
      })}

      {/* Animación de entrada */}
      <style>{`
        @keyframes toastEntrar {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ToastContainer;
