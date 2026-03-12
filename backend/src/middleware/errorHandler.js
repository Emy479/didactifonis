/**
 * Middleware de Manejo de Errores Global
 */

const errorHandler = (err, req, res, next) => {
  console.error("❌ Error:", err);

  // Error de validación de Mongoose
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      error: messages.join(", "),
    });
  }

  // Error de CastError (ID inválido)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: "ID inválido",
    });
  }

  // Error de duplicado (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      error: `Ya existe un registro con ese ${field}`,
    });
  }

  // Error de JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: "Token inválido",
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: "Token expirado",
    });
  }

  // Error genérico
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Error del servidor",
  });
};

module.exports = errorHandler;
