# 📁 ESTRUCTURA DEL FRONTEND REACT

## Estructura Completa

```
frontend/
├── public/
│   ├── favicon.ico
│   └── logo.png
├── src/
│   ├── api/                    # Llamadas al backend
│   │   ├── axios.js           # Configuración de Axios
│   │   ├── auth.js            # Endpoints de autenticación
│   │   ├── patients.js        # Endpoints de pacientes
│   │   ├── games.js           # Endpoints de juegos
│   │   ├── assignments.js     # Endpoints de asignaciones
│   │   └── progress.js        # Endpoints de progreso
│   ├── assets/                # Imágenes, iconos, etc.
│   │   ├── images/
│   │   └── icons/
│   ├── components/            # Componentes reutilizables
│   │   ├── common/           # Componentes comunes
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── Alert.jsx
│   │   ├── layout/           # Layout components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   ├── patients/         # Componentes de pacientes
│   │   │   ├── PatientCard.jsx
│   │   │   ├── PatientList.jsx
│   │   │   └── PatientForm.jsx
│   │   ├── games/            # Componentes de juegos
│   │   │   ├── GameCard.jsx
│   │   │   ├── GameList.jsx
│   │   │   └── GameForm.jsx
│   │   └── charts/           # Componentes de gráficas
│   │       ├── ProgressChart.jsx
│   │       ├── EvolutionChart.jsx
│   │       └── StatsCard.jsx
│   ├── context/              # Context API
│   │   ├── AuthContext.jsx   # Contexto de autenticación
│   │   └── NotificationContext.jsx
│   ├── hooks/                # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   └── useNotification.js
│   ├── pages/                # Páginas principales
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── tutor/
│   │   │   ├── TutorDashboard.jsx
│   │   │   ├── PatientDetail.jsx
│   │   │   └── AssignProfessional.jsx
│   │   ├── profesional/
│   │   │   ├── ProfesionalDashboard.jsx
│   │   │   ├── CreateGame.jsx
│   │   │   ├── AssignGame.jsx
│   │   │   └── PatientProgress.jsx
│   │   ├── shared/
│   │   │   ├── Profile.jsx
│   │   │   └── Settings.jsx
│   │   └── NotFound.jsx
│   ├── routes/               # Configuración de rutas
│   │   ├── AppRoutes.jsx     # Todas las rutas
│   │   └── ProtectedRoute.jsx # Rutas protegidas
│   ├── utils/                # Utilidades
│   │   ├── constants.js      # Constantes
│   │   ├── helpers.js        # Funciones auxiliares
│   │   └── validators.js     # Validaciones
│   ├── App.jsx               # Componente principal
│   ├── main.jsx             # Punto de entrada
│   └── index.css            # Estilos globales
├── .env                      # Variables de entorno (local)
├── .env.example             # Ejemplo de variables
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── vite.config.js
```

## Orden de Creación (Día 1-2)

### 1. Configuración base (Ya hecho)
- ✅ Vite + React
- ✅ TailwindCSS
- ✅ Dependencias

### 2. API Configuration
```
src/api/
└── axios.js  ← PRIMERO
```

### 3. Context & Auth
```
src/context/
└── AuthContext.jsx  ← SEGUNDO
```

### 4. Common Components
```
src/components/common/
├── Button.jsx
├── Input.jsx
├── Card.jsx
└── Spinner.jsx
```

### 5. Layout
```
src/components/layout/
├── Navbar.jsx
└── Sidebar.jsx
```

### 6. Auth Pages
```
src/pages/auth/
├── Login.jsx
└── Register.jsx
```

### 7. Routes
```
src/routes/
├── ProtectedRoute.jsx
└── AppRoutes.jsx
```

### 8. App.jsx
Conectar todo

---

## Variables de Entorno

Crear `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Didactifonis
```

Crear `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Didactifonis
```

---

## Próximos Archivos a Crear

En orden de prioridad:

1. **src/api/axios.js** - Configuración de Axios
2. **src/context/AuthContext.jsx** - Autenticación
3. **src/components/common/** - Componentes base
4. **src/pages/auth/Login.jsx** - Página de login
5. **src/routes/AppRoutes.jsx** - Rutas
6. **src/App.jsx** - App principal

---

Una vez completado el setup básico, continuaremos con la implementación de cada componente.
