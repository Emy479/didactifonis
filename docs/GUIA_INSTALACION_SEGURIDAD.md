# 🔒 GUÍA DE INSTALACIÓN - SEGURIDAD

## 📦 PASO 1: INSTALAR DEPENDENCIAS

```bash
cd backend
npm install helmet cors express-rate-limit express-mongo-sanitize
```

Esto instalará:
- **helmet** (~1.2 MB): Protección de headers HTTP
- **cors** (~20 KB): Control de acceso CORS
- **express-rate-limit** (~30 KB): Rate limiting
- **express-mongo-sanitize** (~10 KB): Prevención de inyección NoSQL

---

## 📁 PASO 2: COPIAR ARCHIVO DE CONFIGURACIÓN

Copia el archivo `securityConfig.js` descargado a:

```
backend/src/config/securityConfig.js
```

**Estructura resultante:**
```
backend/
├── src/
│   ├── config/
│   │   ├── config.js
│   │   ├── database.js
│   │   └── securityConfig.js  ← NUEVO
```

---

## 🔄 PASO 3: ACTUALIZAR server.js

**Opción A: Reemplazar completamente**

Reemplaza tu `backend/server.js` con el archivo `server_seguro.js` descargado.

```bash
cp server_seguro.js server.js
```

**Opción B: Actualizar manualmente**

Si prefieres mantener tu server.js actual, agrega esto:

### 3.1 - Agregar imports (al inicio del archivo)

```javascript
// Después de los imports existentes, AGREGAR:
const {
    helmetConfig,
    corsOptions,
    generalLimiter,
    sanitizeConfig
} = require('./src/config/securityConfig');
```

### 3.2 - Agregar middleware de seguridad (ANTES de las rutas)

```javascript
// ============================================
// MIDDLEWARE DE SEGURIDAD
// ============================================

// 1. Helmet - Protección de headers
const helmet = require('helmet');
app.use(helmetConfig);

// 2. CORS - Control de acceso
const cors = require('cors');
app.use(cors(corsOptions));

// 3. Sanitización contra inyección NoSQL
app.use(sanitizeConfig);

// 4. Rate Limiting General
app.use('/api/', generalLimiter);

// ← LUEGO continúa con tus middleware existentes
app.use(express.json());
// etc...
```

---

## 🛣️ PASO 4: ACTUALIZAR RUTAS

### 4.1 - Actualizar authRoutes.js

Reemplaza `backend/src/routes/authRoutes.js` con `authRoutes_seguro.js`:

```bash
cp authRoutes_seguro.js src/routes/authRoutes.js
```

O manualmente, agrega al inicio:

```javascript
const { authLimiter, createLimiter } = require('../config/securityConfig');
```

Y actualiza las rutas:

```javascript
router.post('/registro', createLimiter, validarRegistro, ...);
router.post('/login', authLimiter, validarLogin, ...);
router.put('/cambiar-password', authLimiter, ...);
```

### 4.2 - Actualizar progressRoutes.js

Reemplaza `backend/src/routes/progressRoutes.js` con `progressRoutes_seguro.js`:

```bash
cp progressRoutes_seguro.js src/routes/progressRoutes.js
```

O manualmente:

```javascript
const { progressLimiter } = require('../config/securityConfig');

router.post('/', progressLimiter, validarProgreso, ...);
```

---

## 🔄 PASO 5: REINICIAR EL SERVIDOR

```bash
npm run dev
```

Deberías ver:

```
✅ MongoDB conectado: localhost
📦 Base de datos: didactifonis
🚀 Servidor corriendo en puerto 3000
🌍 Entorno: development
🔒 Seguridad: Helmet, CORS, Rate Limiting, Sanitización
```

---

## 🧪 PASO 6: PROBAR RATE LIMITING

### Test 1: Rate Limit en Login (5 intentos)

Ejecuta esta petición **6 veces seguidas** (cambiar password para que falle):

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
    "email": "maria.test@ejemplo.com",
    "password": "INCORRECTA"
}
```

**En el intento 6, deberías ver (429):**

```json
{
  "success": false,
  "error": "Demasiados intentos de inicio de sesión, intenta de nuevo en 15 minutos"
}
```

✅ **Esto significa que rate limiting funciona.**

---

### Test 2: Rate Limit General (100 peticiones)

Este es más difícil de probar manualmente, pero puedes verificar que el servidor no crashea con muchas peticiones.

---

### Test 3: Sanitización NoSQL

Intenta inyección NoSQL:

```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
    "email": { "$gt": "" },
    "password": { "$gt": "" }
}
```

**Deberías ver en la consola:**

```
⚠️ Intento de inyección NoSQL detectado en: email
⚠️ Intento de inyección NoSQL detectado en: password
```

Y la petición falla porque `$` fue reemplazado por `_`.

✅ **Esto significa que sanitización funciona.**

---

### Test 4: CORS

Si haces una petición desde un origen NO permitido (ej: `http://localhost:8080`), deberías ver error de CORS en la consola del navegador.

---

## 🔧 PASO 7: CONFIGURAR ORÍGENES PERMITIDOS

Edita `backend/src/config/securityConfig.js`:

```javascript
const whitelist = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173', // Vite (React)
    'http://localhost:4200', // Angular
    
    // AGREGAR TUS DOMINIOS:
    'https://didactifonis.com',        // Producción
    'https://app.didactifonis.com',    // App
    'https://staging.didactifonis.com' // Staging
];
```

---

## 📊 CONFIGURACIÓN DE RATE LIMITS

Si necesitas ajustar los límites, edita `securityConfig.js`:

### Límite General (API)
```javascript
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 peticiones por IP
    // Cambiar según necesidad
});
```

### Límite de Autenticación
```javascript
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos de login
    // Ajustar si es muy estricto
});
```

### Límite de Creación
```javascript
const createLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 20, // 20 creaciones por hora
    // Ajustar según volumen esperado
});
```

### Límite de Progreso
```javascript
const progressLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // 30 sesiones por minuto
    // Ajustar si tienes juegos muy rápidos
});
```

---

## 🛡️ CARACTERÍSTICAS DE SEGURIDAD IMPLEMENTADAS

| Característica | Protege Contra | Estado |
|----------------|----------------|--------|
| **Helmet** | XSS, clickjacking, MIME sniffing | ✅ Activo |
| **CORS** | Peticiones de orígenes no autorizados | ✅ Activo |
| **Rate Limiting** | Ataques de fuerza bruta, DDoS | ✅ Activo |
| **Sanitización** | Inyección NoSQL | ✅ Activo |
| **JWT** | Autenticación insegura | ✅ Ya implementado |
| **bcrypt** | Contraseñas en texto plano | ✅ Ya implementado |
| **Validaciones** | Datos malformados | ✅ Ya implementado |

---

## 🔍 MONITOREO DE SEGURIDAD

### Logs de Seguridad

Los intentos de inyección NoSQL se loguean automáticamente:

```
⚠️ Intento de inyección NoSQL detectado en: email
```

### Rate Limit Headers

Cada respuesta incluye headers informativos:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1646928000
```

Puedes verlos en las respuestas de las peticiones.

---

## ✅ CHECKLIST DE INSTALACIÓN

- [ ] Dependencias instaladas (`npm install`)
- [ ] `securityConfig.js` copiado a `src/config/`
- [ ] `server.js` actualizado con middleware de seguridad
- [ ] `authRoutes.js` actualizado con rate limiters
- [ ] `progressRoutes.js` actualizado con rate limiters
- [ ] Servidor reiniciado sin errores
- [ ] Test de rate limiting en login funciona (429 al 6to intento)
- [ ] Warning de inyección NoSQL aparece en consola
- [ ] Orígenes CORS configurados correctamente

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module 'helmet'"
**Solución:** Ejecuta `npm install helmet cors express-rate-limit express-mongo-sanitize`

### Error: "Cannot find module '../config/securityConfig'"
**Solución:** Verifica que `securityConfig.js` esté en `backend/src/config/`

### CORS bloqueando peticiones legítimas
**Solución:** Agrega el origen a la `whitelist` en `securityConfig.js`

### Rate limit demasiado estricto
**Solución:** Ajusta los valores de `max` en `securityConfig.js`

### No veo los warnings de inyección NoSQL
**Solución:** Verifica que `sanitizeConfig` esté antes de las rutas en `server.js`

---

## 🚀 PRÓXIMOS PASOS

Después de instalar la seguridad:

1. ✅ Probar todos los endpoints (deberían seguir funcionando)
2. ✅ Verificar rate limiting
3. ✅ Verificar CORS
4. ✅ Hacer commit de los cambios
5. ➡️ Continuar con Documentación API

---

¡Listo! Tu backend ahora tiene seguridad de nivel profesional. 🔒✨
