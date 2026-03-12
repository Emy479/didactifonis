# 🎓 Didactifonis - Plataforma Educativa de Terapia Fonoaudiológica

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)
![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D6.0-green.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

Plataforma educativa MERN Stack para terapia fonoaudiológica infantil. Conecta tutores (padres), profesionales (fonoaudiólogos) y pacientes (niños/as) a través de juegos educativos personalizados con seguimiento de progreso en tiempo real.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Scripts Disponibles](#-scripts-disponibles)
- [Modelo de Negocio](#-modelo-de-negocio)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Seguridad](#-seguridad)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### Para Tutores (Padres)
- ✅ Registro y gestión de pacientes (hijos)
- ✅ Asignación de profesionales verificados
- ✅ Acceso a catálogo de juegos educativos
- ✅ Seguimiento de progreso en tiempo real
- ✅ Estadísticas y reportes de evolución
- ✅ Dashboard personalizado

### Para Profesionales (Fonoaudiólogos)
- ✅ Gestión de múltiples pacientes
- ✅ Creación de juegos educativos personalizados
- ✅ Asignación de juegos con configuración específica
- ✅ Seguimiento detallado de progreso
- ✅ Reportes clínicos y gráficas de evolución
- ✅ Sistema de notas y observaciones

### Para Pacientes (Niños/as)
- ✅ Acceso sin login mediante token único
- ✅ Interfaz adaptada por edad
- ✅ Juegos personalizados según necesidades
- ✅ Feedback inmediato de progreso
- ✅ Avatares y gamificación

### Sistema
- ✅ Modelo de negocio dual (Plan Familiar / Plan Profesional)
- ✅ Autenticación JWT con roles (tutor, profesional, admin)
- ✅ Permisos granulares según tipo de cuenta
- ✅ Seguridad de nivel profesional
- ✅ Rate limiting y protección contra ataques
- ✅ API RESTful documentada

---

## 🛠️ Tecnologías

### Backend
- **Node.js** (v18+) - Runtime de JavaScript
- **Express.js** (v4.19+) - Framework web
- **MongoDB** (v6.0+) - Base de datos NoSQL
- **Mongoose** (v8.7+) - ODM para MongoDB

### Seguridad
- **bcryptjs** - Hashing de contraseñas
- **jsonwebtoken** - Autenticación JWT
- **helmet** - Protección de headers HTTP
- **cors** - Control de acceso CORS
- **express-rate-limit** - Rate limiting
- **express-validator** - Validación de datos

### Utilidades
- **dotenv** - Gestión de variables de entorno
- **morgan** - Logger HTTP
- **nodemon** - Hot reload en desarrollo

---

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                  DIDACTIFONIS ARCHITECTURE               │
└─────────────────────────────────────────────────────────┘

Frontend (React)          Backend (Node/Express)        Database (MongoDB)
┌──────────────┐         ┌──────────────────┐          ┌──────────────┐
│              │         │                  │          │              │
│  Tutor App   │────────▶│  Auth Service    │─────────▶│    users     │
│  (Dashboard) │         │  JWT + bcrypt    │          │   patients   │
│              │         │                  │          │    games     │
└──────────────┘         ├──────────────────┤          │ assignments  │
                         │                  │          │  progresses  │
┌──────────────┐         │  Patient Service │          │              │
│              │         │  Dual Model      │          └──────────────┘
│Professional  │────────▶│                  │
│  Dashboard   │         ├──────────────────┤
│              │         │                  │
└──────────────┘         │  Game Service    │
                         │  CRUD + Config   │
┌──────────────┐         │                  │
│              │         ├──────────────────┤
│ Patient App  │────────▶│                  │
│ (Unity/HTML5)│  Token  │ Progress Service │
│              │         │  Stats + Reports │
└──────────────┘         └──────────────────┘

               Security Layers: Helmet, CORS, Rate Limiting, Validation
```

---

## 🚀 Instalación

### Prerrequisitos

- Node.js >= 18.0.0
- MongoDB >= 6.0
- npm o yarn
- Git

### Paso 1: Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/didactifonis.git
cd didactifonis
```

### Paso 2: Instalar dependencias del backend

```bash
cd backend
npm install
```

### Paso 3: Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` con tus configuraciones:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/didactifonis

# JWT
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion

# CORS (opcional)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Paso 4: Iniciar MongoDB

```bash
# En una terminal separada
mongod
```

### Paso 5: Iniciar el servidor

```bash
npm run dev
```

El servidor estará corriendo en `http://localhost:3000`

---

## ⚙️ Configuración

### Variables de Entorno

| Variable | Descripción | Requerido | Default |
|----------|-------------|-----------|---------|
| `PORT` | Puerto del servidor | No | 3000 |
| `NODE_ENV` | Entorno de ejecución | No | development |
| `MONGODB_URI` | URI de MongoDB | Sí | - |
| `JWT_SECRET` | Secreto para JWT | Sí | - |
| `ALLOWED_ORIGINS` | Orígenes CORS permitidos | No | * |

### Configuración de MongoDB

Por defecto, la aplicación se conecta a:
```
mongodb://localhost:27017/didactifonis
```

Para MongoDB Atlas:
```
mongodb+srv://usuario:password@cluster.mongodb.net/didactifonis
```

---

## 📜 Scripts Disponibles

```bash
# Desarrollo (con hot reload)
npm run dev

# Producción
npm start

# Testing
npm test

# Linting
npm run lint

# Base de datos
npm run seed        # Poblar con datos de prueba
npm run db:reset    # Resetear base de datos
```

---

## 💼 Modelo de Negocio

### Plan Familiar ($9.99/mes)

```
TUTOR (Padre/Madre)
├─ Registra cuenta
├─ Crea perfiles de hijos (hasta 5)
├─ Asigna profesionales (opcional)
└─ Paga suscripción

CARACTERÍSTICAS:
✅ Hasta 5 pacientes
✅ Acceso a juegos publicados
✅ Dashboard familiar
✅ Reportes básicos
```

### Plan Profesional ($49.99/mes)

```
PROFESIONAL (Fonoaudiólogo)
├─ Registra cuenta (verificación requerida)
├─ Crea perfiles de pacientes (hasta 20)
├─ Puede crear juegos personalizados
└─ Paga suscripción

CARACTERÍSTICAS:
✅ Hasta 20 pacientes
✅ Crear juegos personalizados
✅ Dashboard profesional
✅ Reportes clínicos avanzados
✅ Notas y seguimiento detallado
```

### Diferencias Clave

| Característica | Plan Familiar | Plan Profesional |
|----------------|---------------|------------------|
| **Quién paga** | Tutor | Profesional |
| **Pacientes** | Hijos del tutor | Cualquier niño |
| **Tutor requerido** | Sí (el mismo) | No (opcional) |
| **Crear juegos** | ❌ | ✅ |
| **Reportes** | Básicos | Avanzados |
| **Precio** | $9.99/mes | $49.99/mes |

---

## 📁 Estructura del Proyecto

```
didactifonis/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── config.js              # Configuración general
│   │   │   ├── database.js            # Conexión MongoDB
│   │   │   └── securityConfig.js      # Configuración de seguridad
│   │   ├── models/
│   │   │   ├── User.js                # Modelo de usuarios
│   │   │   ├── Patient.js             # Modelo de pacientes (dual)
│   │   │   ├── Game.js                # Modelo de juegos
│   │   │   ├── Assignment.js          # Asignaciones juego-paciente
│   │   │   └── Progress.js            # Progreso de sesiones
│   │   ├── controllers/
│   │   │   ├── authController.js      # Autenticación
│   │   │   ├── patientsController.js  # Gestión de pacientes
│   │   │   ├── gamesController.js     # Gestión de juegos
│   │   │   ├── assignmentsController.js # Asignaciones
│   │   │   └── progressController.js  # Progreso y estadísticas
│   │   ├── middleware/
│   │   │   ├── auth.js                # Verificación JWT
│   │   │   ├── validators.js          # Validación de datos
│   │   │   ├── errorHandler.js        # Manejo de errores
│   │   │   └── logger.js              # Logger personalizado
│   │   └── routes/
│   │       ├── authRoutes.js          # Rutas de autenticación
│   │       ├── patientsRoutes.js      # Rutas de pacientes
│   │       ├── gamesRoutes.js         # Rutas de juegos
│   │       ├── assignmentsRoutes.js   # Rutas de asignaciones
│   │       └── progressRoutes.js      # Rutas de progreso
│   ├── .env                           # Variables de entorno
│   ├── .env.example                   # Ejemplo de .env
│   ├── server.js                      # Punto de entrada
│   ├── package.json                   # Dependencias
│   └── test.http                      # Tests con REST Client
├── frontend/                          # (Pendiente - React)
├── games/                             # (Pendiente - Unity/HTML5)
├── docs/
│   ├── API_DOCUMENTATION.md           # Documentación de API
│   ├── DEPLOYMENT.md                  # Guía de deployment
│   └── architecture/                  # Diagramas
└── README.md                          # Este archivo
```

---

## 🔌 API Endpoints

### Resumen de Endpoints

| Grupo | Endpoints | Autenticación |
|-------|-----------|---------------|
| **Auth** | 6 | Mixto |
| **Patients** | 10 | JWT |
| **Games** | 8 | JWT |
| **Assignments** | 8 | Mixto |
| **Progress** | 6 | Mixto |

**Total:** 38+ endpoints

Ver documentación completa en [API_DOCUMENTATION.md](docs/API_DOCUMENTATION.md)

### Ejemplos Rápidos

#### Registro
```http
POST /api/auth/registro
Content-Type: application/json

{
  "nombre": "María González",
  "email": "maria@ejemplo.com",
  "password": "password123",
  "role": "tutor"
}
```

#### Crear Paciente (Tutor)
```http
POST /api/patients
Authorization: Bearer {token}

{
  "nombre": "Mateo",
  "apellido": "González",
  "fechaNacimiento": "2020-05-15",
  "genero": "masculino"
}
```

#### Guardar Progreso (Juego)
```http
POST /api/progress

{
  "token": "{accessToken}",
  "asignacionId": "{id}",
  "puntuacion": 85,
  "tiempoJugado": 180,
  "completado": true
}
```

---

## 🔒 Seguridad

### Capas de Seguridad Implementadas

✅ **Helmet** - Protección de headers HTTP  
✅ **CORS** - Control de orígenes permitidos  
✅ **Rate Limiting** - Prevención de fuerza bruta  
✅ **JWT** - Autenticación segura con tokens  
✅ **bcrypt** - Hashing de contraseñas (10 rounds)  
✅ **express-validator** - Validación de entrada  
✅ **Permisos granulares** - Por rol y tipo de cuenta  

### Rate Limits

| Endpoint | Límite | Ventana |
|----------|--------|---------|
| General API | 100 req | 15 min |
| Login | 5 intentos | 15 min |
| Registro | 20 registros | 1 hora |
| Guardar Progreso | 30 sesiones | 1 min |

### Mejores Prácticas

- Cambiar `JWT_SECRET` en producción
- Usar HTTPS en producción
- Mantener dependencias actualizadas
- Revisar logs regularmente
- Backup de base de datos diario

---

## 🧪 Testing

### Testing Manual

```bash
# Usar REST Client (VS Code)
# Abrir backend/test.http
# Ejecutar peticiones una por una
```

### Testing Automatizado (Pendiente)

```bash
npm test
```

### Cobertura de Tests

- ✅ Autenticación (registro, login, JWT)
- ✅ Gestión de pacientes (modelo dual)
- ✅ CRUD de juegos
- ✅ Asignaciones personalizadas
- ✅ Progreso y estadísticas
- ✅ Permisos por rol
- ✅ Rate limiting
- ✅ Validaciones

---

## 🌐 Deployment

Ver guía completa en [DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Deployment Rápido (Railway/Render)

1. Conectar repositorio GitHub
2. Configurar variables de entorno
3. Deploy automático

### Variables de Entorno en Producción

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secreto-largo-aleatorio-seguro
ALLOWED_ORIGINS=https://didactifonis.com
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas!

1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

### Convenciones de Código

- ES6+ JavaScript
- Prettier para formateo
- ESLint para linting
- Commits semánticos (feat, fix, docs, etc.)

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 👥 Equipo

- **Desarrollador Principal** - [Tu Nombre](https://github.com/tu-usuario)

---

## 📞 Contacto

- **Email:** contacto@didactifonis.com
- **Website:** https://didactifonis.com
- **GitHub:** https://github.com/Emy479/didactifonis

---

## 🙏 Agradecimientos

- Anthropic Claude por asistencia en desarrollo
- Comunidad de Node.js
- MongoDB University
- Express.js Team

---

<p align="center">
  Hecho con ❤️ para mejorar la terapia fonoaudiológica infantil
</p>

<p align="center">
  <a href="#-didactifonis---plataforma-educativa-de-terapia-fonoaudiológica">⬆ Volver arriba</a>
</p>
