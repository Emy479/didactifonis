/**
 * Rutas de Administración
 * Todas requieren token + rol admin
 */

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { verificarToken, verificarRole } = require("../middleware/auth");

// Todas las rutas admin requieren token + rol admin
router.use(verificarToken);
router.use(verificarRole(["admin"]));

// Stats generales
router.get("/stats", adminController.obtenerStats);

// Gestión de usuarios
router.get("/usuarios", adminController.listarUsuarios);
router.put("/usuarios/:id/verificar", adminController.verificarProfesional);
router.put("/usuarios/:id/estado", adminController.cambiarEstadoUsuario);

// Pacientes eliminados
router.get("/pacientes/inactivos", adminController.listarPacientesInactivos);
router.put("/pacientes/:id/reactivar", adminController.reactivarPaciente);

module.exports = router;
