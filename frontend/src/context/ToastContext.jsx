/**
 * ToastContext
 * Sistema global de notificaciones tipo toast
 */

import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((mensaje, tipo = 'info', duracion = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, mensaje, tipo, duracion }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duracion);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Helpers para cada tipo
  const toast = {
    exito:     (msg, dur) => addToast(msg, 'exito', dur),
    error:     (msg, dur) => addToast(msg, 'error', dur),
    info:      (msg, dur) => addToast(msg, 'info', dur),
    advertencia: (msg, dur) => addToast(msg, 'advertencia', dur),
  };

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx.toast;
};

export default ToastContext;