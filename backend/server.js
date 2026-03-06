// ============================================
// IMPORTAR MÓDULOS
// ============================================
const express = require("express");

// ============================================
// CREAR APLICACIÓN
// ============================================
const app = express();

// ============================================
// MIDDLEWARE
// ============================================
// Middleware = función que se ejecuta ANTES de las rutas
// Este middleware permite recibir JSON en el body de las peticiones
app.use(express.json());

// Este middleware muestra cada petición en la consola (útil para debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - ${new Date().toLocaleTimeString()}`);
  next(); // Continuar al siguiente middleware o ruta
});

// ============================================
// BASE DE DATOS TEMPORAL (en memoria)
// ============================================
// Por ahora no usamos MongoDB, simulamos una BD con un array
let tareas = [
  { id: 1, titulo: "Aprender Node.js", completada: false },
  { id: 2, titulo: "Crear API REST", completada: false },
  { id: 3, titulo: "Estudiar async/await", completada: true },
];

// Variable para generar IDs únicos
let siguienteId = 4;

// ============================================
// RUTAS
// ============================================

// ──────────────────────────────────────────
// RUTA: GET / (Página de inicio)
// ──────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    mensaje: "Bienvenido a la API de Tareas",
    version: "1.0.0",
    endpoints: {
      "GET /tareas": "Obtener todas las tareas",
      "GET /tareas/:id": "Obtener una tarea por ID",
      "POST /tareas": "Crear una nueva tarea",
      "PUT /tareas/:id": "Actualizar una tarea",
      "DELETE /tareas/:id": "Eliminar una tarea",
    },
  });
});

// ──────────────────────────────────────────
// RUTA: GET /tareas (Obtener todas las tareas)
// ──────────────────────────────────────────
app.get("/tareas", (req, res) => {
  res.json({
    total: tareas.length,
    tareas: tareas,
  });
});

// ──────────────────────────────────────────
// RUTA: GET /tareas/completadas
// ──────────────────────────────────────────
// Debe retornar solo las tareas que tienen completada: true
app.get("/tareas/completadas", (req, res) => {
  const tareasCompletadas = tareas.filter((t) => t.completada === true);

  res.json({
    total: tareasCompletadas.length,
    tareas: tareasCompletadas,
  });
});

// ──────────────────────────────────────────
// RUTA: GET /tareas/:id (Obtener una tarea específica)
// ──────────────────────────────────────────
// :id es un parámetro dinámico
// Si visitas /tareas/2, req.params.id será '2'
app.get("/tareas/:id", (req, res) => {
  // Convertir el id de string a número
  const id = parseInt(req.params.id);

  // Buscar la tarea en el array
  const tarea = tareas.find((t) => t.id === id);

  if (!tarea) {
    return res.status(404).json({
      error: "Tarea no encontrada",
    });
  }

  res.json(tarea);
});

// ──────────────────────────────────────────
// RUTA: POST /tareas (Crear nueva tarea)
// ──────────────────────────────────────────
app.post("/tareas", (req, res) => {
  // req.body contiene los datos enviados por el cliente
  const { titulo } = req.body;

  // Validación simple
  if (!titulo || titulo.trim() === "") {
    return res.status(400).json({
      error: "El título es obligatorio",
    });
  }

  // Crear nueva tarea
  const nuevaTarea = {
    id: siguienteId++,
    titulo: titulo.trim(),
    completada: false,
  };

  // Agregar al array
  tareas.push(nuevaTarea);

  // Responder con código 201 (Created)
  res.status(201).json({
    mensaje: "Tarea creada exitosamente",
    tarea: nuevaTarea,
  });
});

// ──────────────────────────────────────────
// RUTA: PUT /tareas/:id (Actualizar tarea)
// ──────────────────────────────────────────
app.put("/tareas/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { titulo, completada } = req.body;

  // Buscar índice de la tarea
  const index = tareas.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Tarea no encontrada",
    });
  }

  // Actualizar la tarea
  tareas[index] = {
    id: id,
    titulo: titulo || tareas[index].titulo,
    completada:
      completada !== undefined ? completada : tareas[index].completada,
  };

  res.json({
    mensaje: "Tarea actualizada",
    tarea: tareas[index],
  });
});

// ──────────────────────────────────────────
// RUTA: DELETE /tareas/:id (Eliminar tarea)
// ──────────────────────────────────────────
app.delete("/tareas/:id", (req, res) => {
  const id = parseInt(req.params.id);

  const index = tareas.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({
      error: "Tarea no encontrada",
    });
  }

  // Eliminar del array
  const tareaEliminada = tareas.splice(index, 1)[0];

  res.json({
    mensaje: "Tarea eliminada",
    tarea: tareaEliminada,
  });
});

// ──────────────────────────────────────────
// RUTA: GET /estadisticas (nueva funcionalidad)
// ──────────────────────────────────────────
app.get("/estadisticas", (req, res) => {
  const totalTareas = tareas.length;
  const completadas = tareas.filter((t) => t.completada).length;
  const pendientes = totalTareas - completadas;
  const porcentajeCompletado =
    totalTareas > 0 ? ((completadas / totalTareas) * 100).toFixed(2) : 0;

  res.json({
    total: totalTareas,
    completadas: completadas,
    pendientes: pendientes,
    porcentajeCompletado: `${porcentajeCompletado}%`,
  });
});

// ============================================
// MANEJO DE RUTAS NO ENCONTRADAS (404)
// ============================================
// Esta debe ser la ÚLTIMA ruta
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    ruta: req.url,
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = 3000;

app.listen(PORT, () => {
  console.log(`✨ Servidor corriendo en http://localhost:${PORT}`); // Cambié el emoji
  console.log(`📝 Endpoints disponibles:`);
  console.log(`   GET    http://localhost:${PORT}/tareas`);
  console.log(`   GET    http://localhost:${PORT}/tareas/:id`);
  console.log(`   GET    http://localhost:${PORT}/tareas/completadas`);
  console.log(`   POST   http://localhost:${PORT}/tareas`);
  console.log(`   PUT    http://localhost:${PORT}/tareas/:id`);
  console.log(`   DELETE http://localhost:${PORT}/tareas/:id`);
});
