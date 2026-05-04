# Estado del Proyecto Didactifonis
*Actualizado: 3 Mayo 2026 — sesión 8*

> **Alcance definido:** Plataforma 1 jugador siempre. Orientada a fonoaudiólogos y terapias lúdicas individuales. El modo multijugador/cooperativo queda fuera del roadmap actual; podría evaluarse en una futura expansión al sector educativo (colegios/profesores), pero no es un objetivo de la versión clínica.

---

## 🎉 COMPLETADO

### Backend
- ✅ 6 Modelos (User, Patient, Game, Assignment, Progress, GameSuggestion)
- ✅ Autenticación JWT con roles (tutor, profesional, admin)
- ✅ Middleware de seguridad (Helmet, CORS, Rate Limiting)
- ✅ 40+ endpoints funcionando
- ✅ Modelo dual de pacientes (familiar/profesional)
- ✅ adminController.js + adminRoutes.js (stats, usuarios, pacientes inactivos)
- ✅ offboardingController.js + offboardingRoutes.js (feedback de cese, reactivación)
- ✅ Modelo OffboardingFeedback
- ✅ gameBuilderController.js + gameBuilderRoutes.js
  - Crea index.html + data.json + registra en BD
  - `POST /upload-asset` con multer (imagen/audio, categorías, 5 MB máx)
  - **v2** Maneja `tipo: "html5"` y `tipo: "arcade"` — genera `generarIndexHTMLArcade()` con Phaser CDN + engine-arcade.js
  - **v3** Guarda campo `tema` para arcade (espacial, bosque, ciudad, oceano, fiesta)

### Frontend
- ✅ Setup Vite + React + TailwindCSS
- ✅ Dashboards reales con datos de API (Tutor, Profesional, Admin)
- ✅ Layout responsive (Navbar, Sidebar por rol)
- ✅ **Tema oscuro (Dark Mode) — 100% completo** — toggle Moon/Sun en Navbar, persiste en localStorage, respeta preferencia del sistema
  - `ThemeContext.jsx` con `isDark` + `toggleTheme()` + clase `dark` en `<html>`
  - `tailwind.config.js`: `darkMode: 'class'`
  - **Cobertura total**: todos los 30+ archivos frontend tienen variantes `dark:` — layout, componentes comunes, todas las páginas admin/profesional/tutor/shared, modales, biblioteca, game builder, scene editor, progreso, sugerencias
  - Palette: `dark:bg-gray-900` (page), `dark:bg-gray-800` (cards), `dark:bg-gray-700` (inputs/hover), badges con `dark:bg-*/900/20`

### Funcionalidades

**Autenticación**
- ✅ Login / Registro / Rutas protegidas por rol
- ✅ Validación frontend completa en Register

**Gestión de Pacientes**
- ✅ CRUD completo (crear, listar, editar, eliminar — soft delete)
- ✅ Ficha clínica con progreso integrado
- ✅ Asignar/remover profesional desde ficha (Plan Familiar)
- ✅ Modal búsqueda profesionales verificados

**Biblioteca de Juegos**
- ✅ Grid con filtros (área, dificultad, edad), búsqueda y ordenamiento
- ✅ Modal detalles y asignación a pacientes
- ✅ Responsive mobile con drawer lateral de filtros
- ✅ Thumbnails reales — `ThumbnailJuego` component: muestra imagen subida o degradado genérico por área terapéutica
- ✅ GestionJuegos: preview thumbnail en lista + upload inline en formulario de edición

**Sistema de Sugerencias**
- ✅ Crear, votar, ver feedback del admin

**Panel Admin**
- ✅ Gestión completa de juegos (crear, editar, eliminar, publicar)
- ✅ Gestión de sugerencias
- ✅ GestionUsuarios (activos, inactivos con log de fechas y feedback, pacientes eliminados)
- ✅ AdminDashboard con 3 tarjetas de stats reales

**Progreso y Estadísticas**
- ✅ Gráficas Recharts en ficha del paciente
- ✅ Log de seguimiento de pacientes (EstadisticasLog)
- ✅ Historial de puntuaciones privado por juego — `HistorialJuego.jsx` (modal con sparkline, resumen stats, lista de sesiones, filtro 7/30/90 días); solo visible para tutor/profesional asignado; acceso desde botón "📊 Historial" en ficha del paciente (aparece solo si `vecesJugado > 0`)

**Sistema de Juegos**
- ✅ Juego HTML5 original: Onomatopeyas de Animales
- ✅ Player fullscreen estilo Wordwall con postMessage
- ✅ Captura y envío de progreso al backend
- ✅ Página pública /jugar?token=...

**Perfil de Usuario**
- ✅ Ver y editar datos personales
- ✅ Cambiar contraseña con validación en tiempo real
- ✅ Modal de offboarding de 3 pasos con cuestionario

**Sistema de Offboarding**
- ✅ Modelo OffboardingFeedback completo
- ✅ historialEstados automático en User (pre-save)
- ✅ Cuestionario al desactivar cuenta
- ✅ Pestaña "Cuentas Inactivas" con log de fechas, duración membresía, feedback

**Exportación PDF de Historial Clínico**
- ✅ generarPDF.js con jsPDF (frontend-only)
- ✅ ModalExportarPDF con formulario de notas clínicas
- ✅ PDF Tutor: informe amigable
- ✅ PDF Profesional: informe técnico con notas editables, tabla de sesiones, firma

**Game Engine (engine.js) — 8 mecánicas + mejoras v1.3**
- ✅ **v1.1** Música de fondo en loop (HTML5 Audio, campo `accesibilidad.musicaFondo` o `visual.musicaFondo`)
- ✅ **v1.1** Botón mute 🔊/🔇 en header — solo visible si hay música configurada
- ✅ **v1.1** Confetti en pantalla de resultados cuando el juego es aprobado (CSS puro + JS)
- ✅ **v1.2** Timer por ronda: campo `temporizadorRonda` (segundos) en data.json — barra de progreso + cuenta regresiva; cambia a naranja ≤10s y rojo ≤5s; al expirar registra ronda como fallida y avanza
- ✅ **v1.2** Progreso en localStorage: guarda `rondaActual + puntaje + detalleRondas` tras cada ronda; botón "▶ Continuar (ronda X/N)" en pantalla de inicio; expira a las 24h
- ✅ **v1.3** Sonidos de feedback configurables: helper `fb` centralizado — `fb.correcto()` / `fb.error()` leen `config.feedback.correcto[]/error[]` (array `{texto, audio}`); elige UN ítem aleatorio y muestra texto + reproduce audio atómicamente; todas las 8 mecánicas actualizadas

**Game Engine (engine.js) — 8 mecánicas completas**
- ✅ `seleccion_intruso` — elegir el elemento que no pertenece al grupo
- ✅ `seleccion_multiple` — elegir la respuesta correcta entre varias opciones
- ✅ `ordenar_elementos` — arrastrar fichas para formar una secuencia (drag & drop + touch)
- ✅ `seleccion_secuencial` — responder 2 preguntas encadenadas por ronda
- ✅ `tipeo` — escribir la respuesta; blancos animados + pistas + normalización de acentos
- ✅ `memoria` — voltear cartas para encontrar pares (flip 3D, preview inicial, contador de movimientos)
- ✅ `emparejar` — unir elementos de dos columnas haciendo clic
- ✅ **`constructor_historias`** — ordenar imágenes en secuencia narrativa (fase 1) + elegir oración correcta por imagen (fase 2); audio de narración completa al finalizar
- ✅ Sistema de accesibilidad: audio por ítem, síntesis de voz fallback (es-CL)
- ✅ Fondos configurables: color, gradiente, imagen
- ✅ 6 temas visuales predefinidos
- ✅ Responsive completo (móvil, tablet, desktop)
- ✅ postMessage automático a Didactifonis al terminar
- ✅ Sistema de trofeos (🥇🥈🥉⭐) con porcentaje

**Arcade Engine (engine-arcade.js) — Phaser 3 — v1.7**
- ✅ Motor arcade paralelo basado en Phaser 3.60 (MIT, gratuito)
- ✅ Flujo de escenas: ScenaCarga → ScenaIntro → ScenaJuego/Plataformero/SideScroller → ScenaResultado
- ✅ Submecánica `nave_cazadora` — cohete recolecta palabras correctas, evita incorrectas
- ✅ Submecánica `plataformero` — personaje con gravedad, plataformas configurables, palabras con bobbing
- ✅ `arcadeShared` mixin — HUD, feedback, pausa, terminar y power-ups compartidos via `Object.assign(Escena.prototype, arcadeShared)`
- ✅ Power-ups: escudo 🛡️ (absorbe 1 error) y turbo ⚡ (velocidad ×1.6 por 5s); spawn configurable `powerUpInterval`
- ✅ `PLATAFORMAS_DEFAULT` + `cfg.plataformas` — coordenadas relativas 0-1 para layout configurable
- ✅ Dificultad progresiva: velocidades escalan 1.0→1.8 a lo largo de la partida
- ✅ Sistema de racha/combo: x1.5 (3+), x2 (5+), x3 (8+)
- ✅ Pausa: tecla P/ESC + botón ⏸ touch-friendly
- ✅ Primer juego arcade: **cohete-volador** — discriminación fonológica /p/ (60s, 3 vidas)
- ✅ **v1.4** Soporte spritesheets con animaciones (idle/walk/jump) vía Phaser Animations API
- ✅ **v1.5** Orientación dual portrait (400×640) / landscape (640×400) — `Scale.FIT` + `CENTER_BOTH`; recarga automática al girar el dispositivo; física y controles ajustados por orientación
- ✅ **v1.5** 5 temas visuales: `espacial`, `bosque`, `ciudad`, `oceano`, `fiesta` — fondo, color de plataformas, suelo, partículas configurables
- ✅ **v1.5** Plataformas móviles (oscilación seno) — campo `movimiento: { eje, rango, velocidad }` en cada plataforma; preview con zona punteada e indicador de dirección en GameBuilder
- ✅ **v1.6** Layer 2 — objetos posicionables (positivo/negativo) con emoji o imagen PNG personalizable; paleta + clic/drag en EditorPlataformas; renderizado en engine-arcade.js como sprites posicionados en coordenadas relativas
- ✅ **v1.6** Fix personaje blanco en Phaser WebGL — `this.add.graphics()` en lugar de `make.graphics({ add: false })` garantiza el flush de WebGL antes de `generateTexture()`
- ✅ **v1.7** Submecánica `side_scroller` — endless runner: mundo scrollea de derecha a izquierda; parallax de 2 capas (far 6%, mid 24%); objetos en 3 alturas (suelo/medio/salto); movimiento ←→ + salto; gravedad ajustada por orientación; botones táctiles ← → ↑; integrada con arcadeShared

**Game Builder Admin — wizard de 4 pasos**
- ✅ Paso 1: selector de tipo (Educativo HTML5 / Arcade 🕹️) + mecánica o submecánica
- ✅ Paso 2: metadatos, visual/tema, configuración (parámetros arcade o rondas HTML5)
- ✅ **Paso 2 (Arcade)**: selector de 5 temas visuales con preview de gradiente
- ✅ **Paso 2**: upload de miniatura del juego (thumbnail) para ambos tipos
- ✅ **Paso 2 (Arcade)**: configuración de personaje — spritesheet URL, frameWidth/Height, rangos de animación idle/walk/jump
- ✅ **Paso 2 (HTML5)**: sección "Sonidos de feedback" — listas correcto/error con texto + audio upload por ítem; add/remove dinámico; payload vía `...meta`
- ✅ Paso 3: SceneEditor visual (HTML5) / editor de palabras + personaje/spritesheet (Arcade) / editor propio (constructor_historias)
- ✅ **Paso 3 (Plataformero)**: `EditorPlataformas` — canvas drag & drop portrait/landscape; selección de plataforma con panel lateral; toggle de movimiento (estática/móvil), eje (x/y), rango (5–45%), velocidad (0.5–3.0×)
- ✅ **Paso 3 (Plataformero)**: paleta Layer 2 — emoji picker + upload PNG → colocar objetos positivos/negativos en coordenadas relativas
- ✅ **Paso 3 (Arcade)**: Modo Imagen — toggle texto/imágenes por palabra; picker inline de assets por categoría (grid 6 columnas); thumbnail + texto opcional por ítem
- ✅ Paso 4: resumen y publicar
- ✅ Genera `index.html` + `data.json` automáticamente en `public/games/html5/[slug]/`
- ✅ Arcade: genera `index.html` con Phaser CDN + `DidactiArcade.init('./data.json')`
- ✅ Validación inteligente por tipo: arcade exige submecánica + palabras; constructor_historias exige imagen + oración correcta por imagen
- ✅ Fix creación: DB se guarda primero, archivos después — rollback automático si falla el filesystem
- ✅ Fix "juego no aparece": modelo `descripcion` ya no requiere valor; `numeroRondas` acepta 0; carpeta huérfana se reutiliza

**UX/UI Polish**
- ✅ Toast notifications globales
- ✅ Skeleton loaders en todas las vistas
- ✅ Responsive mobile — todas las pantallas
- ✅ **Tema oscuro** — toggle en Navbar, persistente, respeta sistema — **cobertura 100%** (30+ archivos)

---

## 📦 PENDIENTE

### 🟠 ALTA PRIORIDAD (Versión 1.0)

**1. Assets reales para los juegos**
- [ ] Conseguir imágenes PNG (400×400px, fondo transparente) por categoría
- [ ] Conseguir audios MP3 (nombres de ítems, instrucciones, feedback)
- [ ] Subir desde Admin → Game Builder (upload ya implementado)
- [ ] Actualizar `busca-intruso/data.json` reemplazando emojis por imágenes reales

*Ver estructura de carpetas en ENGINE_MANUAL.md — sección "Formatos de assets recomendados"*

**3. Crear juegos con el engine**
- [ ] Usar Game Builder para crear juegos de `Ideas Juegos/` (49 ideas documentadas)
- [ ] Priorizar: 2-3 juegos por mecánica para tener contenido mínimo viable

*Con assets listos: 15-30 min por juego*

**4. Plan Clínica — Implementación Completa**

Ver sección detallada más abajo.

### 🌐 DEPLOY

**5. Preparación y Deploy**
- [ ] Backend en Railway o Render
- [ ] Frontend en Vercel o Netlify
- [ ] Base de datos en MongoDB Atlas
- [ ] Rate limiting ajustado para producción
- [ ] Variables de entorno de producción (.env.production)
- [ ] Carpeta `public/games/assets/` persistente en el servidor (no en /tmp)

*Tiempo estimado: 3-4 horas*

---

## 🎮 GAME ENGINE — ESTADO ACTUAL

### Mecánicas en engine.js
| Mecánica | Estado | Game Builder | Descripción breve |
|----------|--------|-------------|-------------------|
| `seleccion_intruso` | ✅ Completa | ✅ SceneEditor | Elegir el que no pertenece |
| `seleccion_multiple` | ✅ Completa | ✅ SceneEditor | Elegir la respuesta correcta |
| `ordenar_elementos` | ✅ Completa | ✅ SceneEditor | Arrastrar fichas en orden |
| `seleccion_secuencial` | ✅ Completa | ✅ SceneEditor | 2 preguntas encadenadas |
| `tipeo` | ✅ Completa | ✅ SceneEditor | Escribir la respuesta |
| `memoria` | ✅ Completa | ✅ SceneEditor | Voltear pares de cartas |
| `emparejar` | ✅ Completa | ✅ SceneEditor | Unir dos columnas |
| `constructor_historias` | ✅ Completa | ✅ Editor propio | Ordenar imágenes + elegir oración |

### Submecánicas en engine-arcade.js (Phaser 3) — v1.7
| Submecánica | Estado | Game Builder | Descripción breve |
|-------------|--------|-------------|-------------------|
| `nave_cazadora` | ✅ Completa | ✅ Wizard arcade | Cohete recoge palabras + power-ups (escudo/turbo) |
| `plataformero` | ✅ Completa | ✅ Wizard arcade + EditorPlataformas | Gravedad, plataformas estáticas/móviles, 5 temas, orientación dual |
| `side_scroller` | ✅ Completa | ✅ Wizard arcade | Endless runner; scrolling izq←; parallax 2 capas; 3 alturas de objeto; salto + movimiento ←→ |

### Temas visuales arcade
| Tema | Fondo | Plataformas | Partícula |
|------|-------|-------------|-----------|
| `espacial` | Azul profundo / negro | Grises metálicos | Blanco |
| `bosque` | Verde oscuro / marrón | Verdes | Verde claro |
| `ciudad` | Gris urbano / azul noche | Grises | Azul claro |
| `oceano` | Azul océano / turquesa | Azules claros | Cian |
| `fiesta` | Morado / rosa | Rosa y naranja | Amarillo |

### Estructura de archivos del engine
```
frontend/public/games/
├── engine.js                    ← SDK base — 8 mecánicas (v1.3)
├── engine-arcade.js             ← Arcade engine — Phaser 3 (v1.7)
├── assets/
│   ├── imagenes/                ← Subir desde Admin → Game Builder
│   │   ├── animales/
│   │   ├── frutas/
│   │   ├── transporte/
│   │   ├── ropa/
│   │   ├── hogar/
│   │   ├── emociones/
│   │   ├── fondos/
│   │   ├── palabras/
│   │   ├── colores/
│   │   ├── numeros/
│   │   └── otros/
│   └── audios/                  ← Subir desde Admin → Game Builder
│       ├── palabras/
│       ├── fonemas/
│       ├── silabas/
│       ├── instrucciones/
│       └── otros/
└── html5/
    ├── busca-intruso/           ← engine.js — seleccion_intruso (emojis placeholder)
    │   ├── index.html
    │   └── data.json
    ├── cohete-volador/          ← engine-arcade.js — nave_cazadora — fonología /p/
    │   ├── index.html
    │   └── data.json
    └── titulo-provisorio/       ← engine-arcade.js — plataformero (demo)
        ├── index.html
        └── data.json
```

### Estructura data.json por mecánica
```jsonc
// seleccion_intruso / seleccion_multiple
{ "items": [{ "id":"i1", "emoji":"🐶", "imagen":"/games/assets/...", "texto":"perro", "esIntruso":true }] }

// ordenar_elementos
{ "textoObjetivo":"mariposa", "imagenApoyo":"/games/assets/...", "elementos":[{ "texto":"ma", "posicionCorrecta":1 }] }

// seleccion_secuencial
{ "imagen":"/games/assets/...", "pasos":[{ "pregunta":"...", "opciones":[{ "emoji":"🐶", "imagen":"...", "correcta":true }] }] }

// tipeo
{ "emoji":"🐶", "imagen":"/games/assets/...", "textoRespuesta":"perro", "pistas":["p","pe"] }

// memoria
{ "pares":[{ "id":"p1", "emoji":"🐶", "imagen":"/games/assets/...", "texto":"perro" }] }

// emparejar
{ "pares":[{ "izquierda":{ "id":"i1", "emoji":"🐶", "texto":"Perro" }, "derecha":{ "id":"d1", "texto":"Guau" } }] }

// constructor_historias
{ "audioHistoria":null, "imagenes":[{ "id":"img_1", "imagen":"/games/assets/...", "posicionCorrecta":1,
  "oraciones":[{ "id":"o1", "texto":"El niño se despertó.", "correcta":true }, ...] }] }

// arcade (nave_cazadora / plataformero) — data.json completo
{ "submecanica":"plataformero", "tema":"bosque", "duracion":60, "vidas":3, "puntajePorAcierto":10,
  "personaje":{ "velocidad":290, "spritesheet":null, "frameWidth":48, "frameHeight":48,
    "animaciones":{ "idle":{"start":0,"end":3,"frameRate":8}, "walk":{"start":4,"end":7,"frameRate":12}, "jump":{"start":8,"end":9,"frameRate":8} } },
  "palabras":{ "correctas":[{"texto":"pato"}], "incorrectas":[{"texto":"gato"}], "velocidadMin":75, "velocidadMax":145, "spawnRate":1800 },
  "plataformas": [
    { "x":0.50, "y":0.88, "w":0.96 },
    { "x":0.25, "y":0.65, "w":0.28, "movimiento":{ "eje":"x", "rango":0.15, "velocidad":1.2 } }
  ]
}
```

### Para crear un juego nuevo
1. Admin → Game Builder → completar 4 pasos → publicar
2. El sistema genera los archivos automáticamente en `html5/[slug]/`
3. Subir assets desde el mismo formulario (paso 3) o desde `public/games/assets/`
4. El juego queda disponible en `/jugar?token=...` inmediatamente

### Manual completo
Ver `Ideas Juegos/ENGINE_MANUAL.md`

---

## 🏥 PLAN CLÍNICA — DISEÑO Y ALCANCE

### Los tres pilares del producto

| Plan | Quién paga | Quién gestiona | Límite pacientes |
|------|-----------|---------------|-----------------|
| **Plan Familiar** | Tutor | El tutor inscribe a sus hijos y elige profesional | Por hijo |
| **Plan Independiente** | Profesional | El profesional gestiona sus propios pacientes | Límite X |
| **Plan Clínica** | La clínica | Director deriva pacientes a sus profesionales empleados | Ilimitado |

### Nuevo modelo en BD: `Clinica`
```
Clinica {
  nombre, dominioEmail, director → User (rol "director"),
  profesionales: [User], logo, direccion, telefono,
  plan: "clinica", activo, timestamps
}
User    → agregar: clinicas: [Clinica]
Patient → agregar: clinica: Clinica (null si no aplica)
```

### Componentes frontend a crear
- `DirectorDashboard`, `GestionProfesionalesClinica`, `GestionPacientesClinica`
- `RegistroClinica`, selector de contexto de clínica en Navbar
- Modificar `Register.jsx` y `PatientDetail`

### Estimación: 15-20 horas (4-5 sesiones)

---

## 🔮 FUNCIONALIDADES FUTURAS

### Mejoras al Game Engine (engine.js)
- ✅ Guardado de progreso parcial en localStorage (mid-game resume) — **v1.2**
- ✅ Timer opcional por ronda (`temporizadorRonda` en data.json) — **v1.2**
- ✅ Sonidos de feedback configurables por juego (`feedback.correcto[]/error[]` + helper `fb`) — **v1.3**

### Mejoras al Arcade Engine (engine-arcade.js)
- ✅ Submecánica `plataformero` completa — **v1.3**
- ✅ Power-ups: escudo 🛡️ y turbo ⚡ — **v1.3**
- ✅ Soporte spritesheets con animaciones (walk, jump, idle) — **v1.4**
- ✅ GameBuilder wizard para crear juegos arcade sin código — **v1.4**
- ✅ Orientación dual portrait/landscape + 5 temas + plataformas móviles + EditorPlataformas — **v1.5**
- ✅ Layer 2: objetos visuales posicionables (emoji o imagen PNG, positivos/negativos) — **v1.6**
- ✅ Submecánica `side_scroller` (endless runner con parallax + 3 alturas) — **v1.7**

### Modo multijugador
- Fuera del roadmap actual. La plataforma es 1 jugador — orientada a terapias individuales fonoaudiológicas.
- Posible evaluación futura si se expande al sector educativo (colegios, grupos de clase).

### Sistema de Pagos
- `motivoSuspension`: voluntario / pago_pendiente / admin
- Reactivación automática al renovar plan
- CRM: trigger al mes de inactividad → cupón basado en motivo de feedback
- `contactoRetorno` en OffboardingFeedback ya preparado
- Pasarela de pago (Stripe / equivalente Chile)

### Traspaso de Profesional
- Plan Familiar: tutor ya puede remover/reasignar
- Plan Independiente: botón "Transferir paciente"
- Plan Clínica: lo gestiona el director

---

## 🏗️ ARQUITECTURA DEL PROYECTO

```
didactifonis/
├── backend/
│   └── src/
│       ├── controllers/   (auth, patients, games, assignments, progress,
│       │                   suggestions, admin, offboarding, gameBuilder)
│       ├── middleware/    (auth.js, validators.js, errorHandler.js)
│       ├── models/        (User, Patient, Game, Assignment, Progress,
│       │                   GameSuggestion, OffboardingFeedback)
│       └── routes/        (auth, patients, games, assignments, progress,
│                           suggestions, admin, offboarding, gameBuilder)
├── frontend/
│   └── src/
│       ├── api/           (auth, patients, games, assignments, progress,
│       │                   suggestions, admin, gameBuilder)
│       ├── components/
│       │   ├── common/    (Button, Card, Input, Spinner, Alert, StatsCard, ToastContainer)
│       │   ├── games/     (BibliotecaJuegos, ModalDetallesJuego, ModalAsignarPaciente, SceneEditor)
│       │   ├── layout/    (DashboardLayout, Navbar, Sidebar)
│       │   └── patients/  (PatientCard, PatientDetail, ProgresoPaciente,
│       │                   ModalAsignarProfesional, ModalExportarPDF, HistorialJuego)
│       ├── context/       (AuthContext, ToastContext, ThemeContext)
│       ├── pages/
│       │   ├── admin/     (AdminDashboard, GestionJuegos, GestionSugerencias,
│       │                   GestionUsuarios, GameBuilder)
│       │   ├── auth/      (Login, Register)
│       │   ├── jugar/     (JugarPage, PlayerJuego)
│       │   ├── profesional/ (ProfesionalDashboard, SuggestGame, SuggestionsList)
│       │   ├── shared/    (BibliotecaPage, CreatePatient, EditPatient,
│       │                   PatientDetail, PatientsList, EstadisticasLog, PerfilUsuario)
│       │   └── tutor/     (TutorDashboard)
│       └── utils/         (generarPDF.js)
└── frontend/public/
    └── games/
        ├── engine.js          ← SDK base — 8 mecánicas
        ├── engine-arcade.js   ← Arcade engine — Phaser 3 (v1.5)
        ├── assets/            ← imágenes y audios (subir desde Admin)
        └── html5/
            ├── busca-intruso/
            ├── cohete-volador/
            └── titulo-provisorio/
├── Ideas Juegos/
│   ├── ENGINE_MANUAL.md   ← documentación del engine
│   ├── Fonológica/        (10 ideas)
│   ├── Semántica/         (11 ideas)
│   ├── Morfosintaxis/     (14 ideas)
│   └── Pragmática/        (14 ideas)
```

---

## 🔑 DATOS IMPORTANTES

**Puertos:**
- Backend: localhost:3001
- Frontend: localhost:5173

**Variables de entorno backend (.env):**
- MONGODB_URI=mongodb://localhost:27017/didactifonis
- JWT_SECRET=[tu secreto]
- NODE_ENV=development
- PORT=3001

---

## 📝 LECCIONES APRENDIDAS CLAVE

1. **Modelo dual** — siempre verificar `paciente.tutor && paciente.tutor.toString()`
2. **Rutas Express** — rutas específicas ANTES de `/:id`
3. **Archivos estáticos** — juegos HTML5 van en `frontend/public/` para que Vite los sirva
4. **postMessage** — comunicación entre iframe (juego) y React (player)
5. **Rate limiting** — en desarrollo usar `process.env.NODE_ENV === "development" ? 1000 : 100`
6. **Soft delete** — reactivar desde GestionUsuarios (admin) o MongoDB Compass
7. **ESLint** — limpiar imports no usados; nunca usar useState dentro de un useEffect
8. **Toast notifications** — usar `useToast()` del ToastContext
9. **Skeleton loaders** — usar `animate-pulse` de Tailwind
10. **Variables de entorno** — verificar que el puerto en `.env` coincida con el backend
11. **Validaciones frontend** — siempre validar campos condicionales antes de enviar al backend
12. **updateUser en contexto** — llamar `updateUser(res.user)` al guardar perfil
13. **Propiedades temporales en modelos** — usar `this._campo` antes del save para pasar contexto al pre-save
14. **PDF con jsPDF** — separar lógica en `utils/generarPDF.js`; usar `verificarSalto()` para saltos de página
15. **Game Engine** — el `data.json` es la única diferencia entre juegos; el engine maneja todo lo demás
16. **Game Builder** — el backend escribe los archivos en `frontend/public/games/html5/[slug]/`; path usa `path.join(__dirname, "..", "..", "..", "frontend", "public", "games", "html5")`
17. **multer en Game Builder** — `upload.single("archivo")` se usa como callback dentro del handler, no como middleware de Express, para poder manejar errores correctamente con `res.status()`
18. **Mecánica tipeo** — normalizar acentos con `.normalize("NFD").replace(/[̀-ͯ]/g, "")` para comparar "colibrí" == "colibri"
19. **Mecánica memoria** — `backface-visibility: hidden` es esencial para el flip 3D; duplicar pares con `inst: "a"/"b"` para identificar instancias sin repetir id
20. **Mecánica emparejar** — el mapa `izquierda.id → derecha.id` se construye al renderizar la ronda, no en cada clic
21. **Phaser 3 + Text objects** — `physics.add.existing(textObject)` crea body pero NO mueve el visual; usar array manual `{bg, txt, vx, vy}` con movimiento `p.bg.x += vx * (delta/1000)` y sincronizar `p.txt.x = p.bg.x`
22. **Phaser Scale.FIT** — el div padre DEBE tener `position: fixed; inset: 0`, NO `display: flex`. Flexbox rompe el cálculo de CENTER_BOTH y el canvas queda descentrado
23. **React hooks en condicional** — nunca llamar `useState()` dentro de un `if`. Extraer la rama en un componente separado que llame el hook incondicionalmente
24. **SceneEditor drag & drop** — usar `e.dataTransfer.setData("application/json", JSON.stringify({...}))` y leer con `JSON.parse(e.dataTransfer.getData("application/json"))` en el drop handler
25. **GestionJuegos y GameBuilder** — no duplicar la creación de juegos. "Nuevo Juego" en GestionJuegos debe navegar a `/admin/game-builder`; GestionJuegos solo gestiona publish/edit/delete de juegos existentes
26. **Mixin pattern Phaser** — `Object.assign(Escena.prototype, mixinObj)` permite compartir métodos entre clases sin herencia múltiple; `this` funciona correctamente en tiempo de ejecución porque apunta a la instancia de la escena
27. **Phaser staticGroup + plat-px** — para plataformas sólidas usar `physics.add.staticGroup()` + textura invisible de 4×4px generada con `make.graphics()` + `generateTexture()`; superponer un rectangle visual por separado; `plat.setDisplaySize(w, h).refreshBody()` es obligatorio para redimensionar el cuerpo físico
28. **Gravedad por cuerpo en Phaser arcade** — con `gravity.y = 0` global, usar `jugador.body.setGravityY(480)` para aplicar gravedad solo al jugador; las plataformas estáticas no necesitan gravedad
29. **Touch one-shot jump** — usar flag `_btnSaltoJP = true` en `pointerdown` y consumirlo con `this._btnSaltoJP; this._btnSaltoJP = false` en `update()`, equivalente a `JustDown` para botones táctiles
30. **localStorage engine.js** — guardar solo cuando `rondaActual > 0` (no guardar el estado inicial); clave única por juego usando `config.id || config.titulo`; expirar a las 24h para evitar progreso obsoleto
31. **Timer por ronda centralizado** — colocar `_timerRonda.iniciar()` al final del método `renderizar()` de cada mecánica; `iniciar()` llama a `detener()` internamente, evitando timers duplicados al avanzar rondas
32. **constructor_historias — dos fases encadenadas** — la mecánica usa estado interno (`enRiel`, `imagenesOrdenadas`, `imagenActualIdx`) para separar la fase de ordenamiento visual de la fase de selección de oraciones; el puntaje es proporcional a oraciones acertadas (no todo-o-nada)
33. **Arcade engine — spritesheet transparente** — al cargar el spritesheet bajo la misma key que la textura procedural (`'rocket'` o `'jugador_plat'`), el `if (this.textures.exists(key)) return` en `_generarTextura*()` lo respeta automáticamente; no se necesita cambiar la línea `this.physics.add.sprite(x, y, 'rocket')`
34. **GameBuilder arcade vs educativo** — el backend detecta `tipo === "arcade"` para generar `index.html` con Phaser CDN + `DidactiArcade.init()`; el educativo genera solo `engine.js`; la validación también es diferente (arcade: submecanica + palabras.correctas; educativo: mecanica + rondas)
35. **Editor inline por mecánica especial** — cuando una mecánica tiene estructura de datos anidada compleja (como `constructor_historias`: imágenes → oraciones), es más claro crear un editor inline específico en GameBuilder paso 3 que forzar esa estructura al SceneEditor genérico
36. **Phaser orientación dual** — detectar `window.innerWidth > window.innerHeight` en `init()` para definir `isLandscape`; guardar las dimensiones en `this.W / this.H` desde `sys.game.config`; escuchar `orientationchange` para recargar con `setTimeout(() => window.location.reload(), 400)`
37. **Plataformas móviles Phaser** — usar `physics.add.group()` (NO staticGroup) con `setImmovable(true)` + `allowGravity = false`; mover con `sprite.body.reset(nx, ny)` cada frame; la posición seno es `baseX + Math.sin(t * velocidad) * rango * dimension`
38. **Drag vs clic en editor React** — trackear `moved: boolean` en el ref de arrastre; si el puntero se movió menos de 3px = clic para seleccionar; más de 3px = drag para mover. Evita seleccionar accidentalmente al arrastrar
39. **Dark mode Tailwind** — usar `darkMode: 'class'` en tailwind.config.js; aplicar clase `dark` a `document.documentElement`; persistir en `localStorage`; leer preferencia del sistema con `window.matchMedia("(prefers-color-scheme: dark)")` solo al inicializar
40. **Phaser WebGL texture — `add` vs `make`** — `this.make.graphics({ add: false }).generateTexture()` no hace flush del buffer WebGL y produce textura en blanco; usar `this.add.graphics()` (agrega al display list) para garantizar el render pass antes de `generateTexture()`; luego `g.destroy()` para no dejar el objeto en escena
41. **Mongoose required + string vacío** — `required: true` rechaza `""` igual que `null`; para campos opcionales con valor por defecto usar `default: ""` en vez de `required: true`; esto aplica especialmente a campos como `descripcion` o `instrucciones` que el formulario puede dejar vacíos
42. **Atomic DB+file en Game Builder** — guardar en BD primero (`await nuevoJuego.save()`), luego crear archivos en try/catch; si el filesystem falla, hacer rollback con `await Game.deleteOne({ _id: nuevoJuego._id })`; nunca al revés (archivos huérfanos son más difíciles de limpiar que registros BD)
43. **Carpeta huérfana en Game Builder** — si `fs.existsSync(dirJuego)` es true pero no hay registro en BD, reutilizar la carpeta en vez de lanzar error 400; esto evita que juegos "fantasmas" bloqueen la re-creación con el mismo nombre
44. **Feedback atómico en engine.js** — el helper `fb` elige UN ítem aleatorio del array y muestra texto + reproduce audio del mismo objeto; el patrón anterior llamaba `audio.reproducirAleatorio()` por separado y podía reproducir un audio distinto al texto mostrado
45. **React hooks — Temporal Dead Zone** — un `useEffect` con `arcadeConfig.palabras.modo` en el array de dependencias DEBE declararse DESPUÉS del `useState` que inicializa `arcadeConfig`; las variables `const` no se hoistan y el deps array se evalúa en tiempo de render
46. **Side scroller — wrapping de tiles de suelo** — usar un array de N tiles (ancho/W + 1) cada uno de ancho W/N; en `update()` mover todos por `vel*delta`; cuando `tile.x + tileW < 0`, reposicionarlo al final del grupo con `tile.x = max(tile.x) + tileW`; evita gaps y es más limpio que un solo tile infinito
47. **Parallax en Phaser sin TileSprite** — guardar array de shapes/graphics en `this._far` / `this._mid`; en update mover cada elemento a velocidad proporcional (`farSpeed = vel * 0.06`); al salir por la izquierda, reaparecer a la derecha con posición aleatoria en Y

---

## 🎯 WORKFLOW PARA CONTINUAR

1. **Filesystem MCP activo** — Claude lee/escribe en `C:\didactifonis-aprendizaje` directamente

2. **Git al terminar cada funcionalidad:**
   ```bash
   git add .
   git commit -m "feat/fix/style: descripción"
   git push origin main
   ```

3. **Contexto para nuevo chat:**
   *"Continúo desarrollando Didactifonis, plataforma MERN de terapia fonoaudiológica. Repo: github.com/Emy479/didactifonis. Lee el archivo Pendientes.md para ver el estado actual del proyecto. Quiero continuar con [funcionalidad]."*

**Reglas de código:**
- Variables y UI en español neutro (sin voseo argentino)
- Tailwind + `style={{}}` para colores específicos
- **Dark mode activo** — agregar `dark:` variants al crear nuevas páginas o componentes
- Patrón: cada página usa `<DashboardLayout>`
- API calls en `frontend/src/api/[recurso].js`
- Toast con `useToast()`, Skeleton con `animate-pulse`
- Modales mobile: `items-end sm:items-center` + `rounded-t-2xl sm:rounded-2xl`
- PDF: frontend-only con jsPDF en `utils/generarPDF.js`
- Juegos: engine.js + data.json; Game Builder en `/admin/game-builder`
- Upload de assets: `subirAsset(archivo, tipo, categoria)` desde `api/gameBuilder.js`
- **Plataforma 1 jugador** — no implementar mecánicas multijugador
