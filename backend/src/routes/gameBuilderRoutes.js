/**
 * Rutas del Game Builder
 * Solo accesibles para admin
 */

const express = require("express");
const router  = express.Router();
const gameBuilderController = require("../controllers/gameBuilderController");
const { verificarToken, verificarRole } = require("../middleware/auth");

// Todas las rutas requieren token + rol admin
router.use(verificarToken);
router.use(verificarRole(["admin"]));

// Previsualizar data.json sin guardar
router.post("/preview",    gameBuilderController.previsualizar);

// Crear juego completo (archivos + BD)
router.post("/crear",      gameBuilderController.crearJuego);

// Actualizar data.json de juego existente
router.put("/:id",         gameBuilderController.actualizarJuego);

module.exports = router;
