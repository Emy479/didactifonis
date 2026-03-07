/**
 * Middleware de Logging
 *
 * Registra todas las peticiones HTTP en la consola.
 */

/**
 * Logger personalizado
 * Muestra: método, ruta, código de estado, tiempo de respuesta
 */
const logger = (req, res, next) => {
  const start = Date.now();

  // Cuando la respuesta termine, calcular tiempo
  res.on("finish", () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toLocaleString("es-CL");

    // Colorear según código de estado
    let statusColor = "\x1b[32m"; // Verde por defecto
    if (res.statusCode >= 400 && res.statusCode < 500) {
      statusColor = "\x1b[33m"; // Amarillo para 4xx
    } else if (res.statusCode >= 500) {
      statusColor = "\x1b[31m"; // Rojo para 5xx
    }

    console.log(
      `[${timestamp}] ` +
        `${req.method} ${req.originalUrl} - ` +
        `${statusColor}${res.statusCode}\x1b[0m - ` +
        `${duration}ms`,
    );
  });

  next();
};

module.exports = logger;
