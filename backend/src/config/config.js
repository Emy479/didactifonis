/**
 * Configuración de la aplicación
 */

require("dotenv").config();

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3002,

  db: {
    uri: process.env.MONGODB_URI || "mongodb://localhost:27017/didactifonis",
  },

  jwt: {
    secret: process.env.JWT_SECRET || "tu-secreto-super-seguro",
    expiresIn: "7d",
  },
};
