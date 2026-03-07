/**
 * Middleware de Manejo de Errores
 *
 * Captura todos los errores y responde de forma consistente.
 */

/**
 * Middleware para manejar rutas no encontradas (404)
 */
const notFound = (req, res, next) => {
  const error = new Error(`Ruta no encontrada: ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Middleware principal de manejo de errores
 */
const errorHandler = (err, req, res, next) => {
  // Si el código de estado no está definido, usar 500
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    error: err.message,
    // Solo mostrar stack trace en desarrollo
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = {
  notFound,
  errorHandler,
};
