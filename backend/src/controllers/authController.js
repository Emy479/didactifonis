/**
 * Controlador de Autenticación
 *
 * Maneja registro, login y operaciones relacionadas con autenticación.
 */

const User = require("../models/User");

// ============================================
// REGISTRO DE USUARIO
// ============================================
/**
 * POST /api/auth/registro
 * Body: { nombre, email, password, role?, telefono?, especialidad?, numeroRegistro? }
 */
const registro = async (req, res) => {
  try {
    const {
      nombre,
      email,
      password,
      role,
      telefono,
      especialidad,
      numeroRegistro,
    } = req.body;

    // Verificar si el email ya existe
    const usuarioExiste = await User.findOne({ email });

    if (usuarioExiste) {
      return res.status(400).json({
        success: false,
        error: "El email ya está registrado",
      });
    }

    // Crear usuario
    const nuevoUsuario = new User({
      nombre,
      email,
      password, // Se hasheará automáticamente por el pre-save middleware
      role: role || "tutor",
      telefono,
      especialidad,
      numeroRegistro,
    });

    // Guardar en la base de datos
    await nuevoUsuario.save();

    // Generar JWT
    const token = nuevoUsuario.generarJWT();

    // Obtener datos públicos (sin password)
    const datosUsuario = nuevoUsuario.getDatosPublicos();

    res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      token,
      user: datosUsuario,
    });
  } catch (error) {
    console.error("Error en registro:", error);

    // Manejar errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    // Error de clave duplicada (email único)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "El email ya está registrado",
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al registrar usuario",
    });
  }
};

// ============================================
// LOGIN
// ============================================
/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email (incluyendo password)
    const usuario = await User.buscarPorEmail(email);

    if (!usuario) {
      return res.status(401).json({
        success: false,
        error: "Credenciales inválidas",
      });
    }

    // Verificar que la cuenta esté activa
    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        error: "Cuenta desactivada. Contacta al administrador",
      });
    }

    // Comparar contraseña
    const passwordValido = await usuario.compararPassword(password);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        error: "Credenciales inválidas",
      });
    }

    // Actualizar último login
    usuario.ultimoLogin = new Date();
    await usuario.save();

    // Generar JWT
    const token = usuario.generarJWT();

    // Obtener datos públicos
    const datosUsuario = usuario.getDatosPublicos();

    res.json({
      success: true,
      message: "Login exitoso",
      token,
      user: datosUsuario,
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      success: false,
      error: "Error al iniciar sesión",
    });
  }
};

// ============================================
// OBTENER PERFIL DEL USUARIO AUTENTICADO
// ============================================
/**
 * GET /api/auth/perfil
 * Headers: Authorization: Bearer <token>
 */
const obtenerPerfil = async (req, res) => {
  try {
    // req.user fue establecido por el middleware de autenticación
    const usuario = await User.findById(req.user.userId);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const datosUsuario = usuario.getDatosPublicos();

    res.json({
      success: true,
      user: datosUsuario,
    });
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener perfil",
    });
  }
};

// ============================================
// ACTUALIZAR PERFIL
// ============================================
/**
 * PUT /api/auth/perfil
 * Body: { nombre?, telefono?, especialidad? }
 */
const actualizarPerfil = async (req, res) => {
  try {
    const { nombre, telefono, especialidad } = req.body;

    // Campos permitidos para actualizar
    const camposActualizables = {};
    if (nombre) camposActualizables.nombre = nombre;
    if (telefono) camposActualizables.telefono = telefono;
    if (especialidad) camposActualizables.especialidad = especialidad;

    const usuarioActualizado = await User.findByIdAndUpdate(
      req.user.userId,
      camposActualizables,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!usuarioActualizado) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    const datosUsuario = usuarioActualizado.getDatosPublicos();

    res.json({
      success: true,
      message: "Perfil actualizado exitosamente",
      user: datosUsuario,
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      error: "Error al actualizar perfil",
    });
  }
};

// ============================================
// CAMBIAR CONTRASEÑA
// ============================================
/**
 * PUT /api/auth/cambiar-password
 * Body: { passwordActual, passwordNuevo }
 */
const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    // Validaciones básicas
    if (!passwordActual || !passwordNuevo) {
      return res.status(400).json({
        success: false,
        error: "Debes proporcionar la contraseña actual y la nueva",
      });
    }

    if (passwordNuevo.length < 6) {
      return res.status(400).json({
        success: false,
        error: "La nueva contraseña debe tener al menos 6 caracteres",
      });
    }

    // Buscar usuario con password
    const usuario = await User.findById(req.user.userId).select("+password");

    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: "Usuario no encontrado",
      });
    }

    // Verificar contraseña actual
    const passwordValido = await usuario.compararPassword(passwordActual);

    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        error: "Contraseña actual incorrecta",
      });
    }

    // Actualizar contraseña (se hasheará automáticamente)
    usuario.password = passwordNuevo;
    await usuario.save();

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    res.status(500).json({
      success: false,
      error: "Error al cambiar contraseña",
    });
  }
};

// ============================================
// LISTAR PROFESIONALES (Público)
// ============================================
/**
 * GET /api/auth/profesionales
 * Retorna lista de profesionales verificados
 */
const listarProfesionales = async (req, res) => {
  try {
    const profesionales = await User.obtenerProfesionales();

    const profesionalesPublicos = profesionales.map((prof) => ({
      _id: prof._id,
      nombre: prof.nombre,
      especialidad: prof.especialidad,
      createdAt: prof.createdAt,
    }));

    res.json({
      success: true,
      count: profesionalesPublicos.length,
      data: profesionalesPublicos,
    });
  } catch (error) {
    console.error("Error al listar profesionales:", error);
    res.status(500).json({
      success: false,
      error: "Error al obtener profesionales",
    });
  }
};

// ============================================
// EXPORTAR FUNCIONES
// ============================================
module.exports = {
  registro,
  login,
  obtenerPerfil,
  actualizarPerfil,
  cambiarPassword,
  listarProfesionales,
};
