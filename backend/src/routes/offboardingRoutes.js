/**
 * Rutas de Offboarding
 */

const express = require("express");
const router = express.Router();
const offboardingController = require("../controllers/offboardingController");
const { verificarToken, verificarRole } = require("../middleware/auth");

// Desactivar cuenta (usuario autenticado, cualquier rol)
router.post(
  "/desactivar",
  verificarToken,
  offboardingController.desactivarCuenta,
);

// Rutas admin — ver feedbacks
router.get(
  "/feedbacks",
  verificarToken,
  verificarRole(["admin"]),
  offboardingController.listarFeedbacks,
);

router.get(
  "/feedbacks/stats",
  verificarToken,
  verificarRole(["admin"]),
  offboardingController.statsOffboarding,
);

module.exports = router;
