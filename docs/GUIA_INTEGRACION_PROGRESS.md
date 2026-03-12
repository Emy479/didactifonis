# 📋 GUÍA DE INTEGRACIÓN - MODELO DE PROGRESO

## 🎯 ARCHIVOS A AGREGAR/MODIFICAR

### 1. ARCHIVOS NUEVOS

Copia estos archivos a tu proyecto:

```
backend/
├── src/
│   ├── models/
│   │   └── Progress.js              ← NUEVO (descargado)
│   ├── controllers/
│   │   └── progressController.js    ← NUEVO (descargado)
│   └── routes/
│       └── progressRoutes.js        ← NUEVO (descargado)
```

---

### 2. MODIFICAR ARCHIVOS EXISTENTES

#### A. `src/middleware/validators.js`

**Abrir:** `backend/src/middleware/validators.js`

**Al final del archivo, ANTES de `module.exports`, AGREGAR:**

```javascript
/**
 * Validar datos de progreso
 */
const validarProgreso = [
    body('token')
        .trim()
        .notEmpty().withMessage('El token del paciente es obligatorio'),
    
    body('asignacionId')
        .trim()
        .notEmpty().withMessage('El ID de la asignación es obligatorio')
        .isMongoId().withMessage('ID de asignación inválido'),
    
    body('puntuacion')
        .notEmpty().withMessage('La puntuación es obligatoria')
        .isNumeric().withMessage('La puntuación debe ser un número')
        .isFloat({ min: 0 }).withMessage('La puntuación no puede ser negativa'),
    
    body('tiempoJugado')
        .notEmpty().withMessage('El tiempo jugado es obligatorio')
        .isNumeric().withMessage('El tiempo debe ser un número')
        .isFloat({ min: 0 }).withMessage('El tiempo no puede ser negativo'),
    
    body('rondasCompletadas')
        .optional()
        .isInt({ min: 0 }).withMessage('Las rondas completadas deben ser un número entero positivo'),
    
    body('rondasTotales')
        .optional()
        .isInt({ min: 1 }).withMessage('Las rondas totales deben ser al menos 1'),
    
    body('aciertos')
        .optional()
        .isInt({ min: 0 }).withMessage('Los aciertos deben ser un número entero positivo'),
    
    body('errores')
        .optional()
        .isInt({ min: 0 }).withMessage('Los errores deben ser un número entero positivo'),
    
    body('completado')
        .optional()
        .isBoolean().withMessage('Completado debe ser true o false'),
    
    body('datosJuego')
        .optional()
        .isObject().withMessage('Los datos del juego deben ser un objeto'),
    
    body('dispositivo')
        .optional()
        .isIn(['web', 'mobile', 'tablet', 'desktop'])
        .withMessage('Dispositivo debe ser: web, mobile, tablet o desktop')
];
```

**Luego, MODIFICAR el `module.exports`:**

```javascript
module.exports = {
    validarRegistro,
    validarLogin,
    validarPaciente,
    validarJuego,
    validarAsignacion,
    validarProgreso,  // ← AGREGAR ESTA LÍNEA
    validarCampos
};
```

---

#### B. `server.js`

**Abrir:** `backend/server.js`

**AGREGAR la importación de rutas (con las demás importaciones):**

```javascript
const progressRoutes = require('./src/routes/progressRoutes');
```

**AGREGAR el montaje de rutas (después de las otras rutas):**

```javascript
// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/tareas', tareasRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/progress', progressRoutes);  // ← AGREGAR ESTA LÍNEA
```

---

#### C. `test.http`

**Abrir:** `backend/test.http`

**Al final del archivo, AGREGAR todo el contenido de `test_progress.http`**

(El archivo `test_progress.http` descargado tiene todos los ejemplos)

---

## 🚀 PASOS DE INSTALACIÓN

### Paso 1: Copiar Archivos Nuevos

```bash
# Desde la carpeta donde descargaste los archivos:

# Copiar modelo
cp Progress.js backend/src/models/

# Copiar controlador
cp progressController.js backend/src/controllers/

# Copiar rutas
cp progressRoutes.js backend/src/routes/
```

---

### Paso 2: Modificar validators.js

1. Abre `backend/src/middleware/validators.js`
2. Copia el contenido de `validacion_progreso_agregar.txt`
3. Pega al final del archivo, **antes** de `module.exports`
4. Actualiza `module.exports` agregando `validarProgreso`

---

### Paso 3: Modificar server.js

1. Abre `backend/server.js`
2. Agrega la línea de importación
3. Agrega la línea de montaje de rutas

---

### Paso 4: Actualizar test.http

1. Abre `backend/test.http`
2. Al final, pega el contenido de `test_progress.http`

---

### Paso 5: Reiniciar el Servidor

```bash
# El servidor debería reiniciarse automáticamente con Nodemon
# Si no, detén y reinicia:

# Ctrl + C
npm run dev
```

**Deberías ver:**
```
✅ MongoDB conectado: localhost
📦 Base de datos: didactifonis
```

---

## ✅ VERIFICAR INSTALACIÓN

### Test 1: Verificar que las rutas están montadas

```bash
# En otro terminal (sin detener el servidor):
curl http://localhost:3000/api/progress
```

Deberías ver un error 400 o similar (porque falta el body), NO un 404.

---

### Test 2: Crear un registro de progreso

**Requisitos previos:**
- Tener un paciente creado
- Tener un juego creado
- Tener una asignación creada
- Tener el `accessToken` del paciente
- Tener el `_id` de la asignación

**Ejecutar en test.http:**

```http
POST http://localhost:3000/api/progress
Content-Type: application/json

{
    "token": "AQUI_VA_EL_ACCESS_TOKEN_DEL_PACIENTE",
    "asignacionId": "AQUI_VA_EL_ID_DE_LA_ASIGNACION",
    "puntuacion": 85,
    "tiempoJugado": 180,
    "rondasCompletadas": 10,
    "rondasTotales": 10,
    "aciertos": 9,
    "errores": 1,
    "completado": true,
    "dispositivo": "web"
}
```

**Respuesta esperada (201):**

```json
{
  "success": true,
  "message": "Progreso guardado exitosamente",
  "data": {
    "progreso": {
      "_id": "...",
      "puntuacion": 85,
      "porcentajeAcierto": 85,
      "completado": true,
      "aprobado": true
    },
    "aprobado": true,
    "porcentajeAcierto": 85,
    "mensaje": "¡Felicitaciones! Has aprobado este juego."
  }
}
```

---

### Test 3: Consultar progreso del paciente

```http
GET http://localhost:3000/api/progress/patient/PACIENTE_ID
Authorization: Bearer TU_TOKEN_JWT
```

**Respuesta esperada (200):**

```json
{
  "success": true,
  "count": 1,
  "estadisticas": {
    "totalSesiones": 1,
    "sesionesCompletadas": 1,
    "sesionesAprobadas": 1,
    "puntuacionPromedio": 85,
    "porcentajePromedioAcierto": 85,
    "tiempoTotalJugado": 180,
    "mejorPuntuacion": 85
  },
  "data": [ ... ]
}
```

---

### Test 4: Verificar en MongoDB Compass

1. Abre MongoDB Compass
2. Busca la colección `progresses`
3. Deberías ver 1 documento nuevo

**Estructura del documento:**

```javascript
{
  "_id": ObjectId("..."),
  "paciente": ObjectId("..."),
  "juego": ObjectId("..."),
  "asignacion": ObjectId("..."),
  "puntuacion": 85,
  "puntuacionMaxima": 100,
  "porcentajeAcierto": 85,
  "tiempoJugado": 180,
  "rondasCompletadas": 10,
  "rondasTotales": 10,
  "aciertos": 9,
  "errores": 1,
  "completado": true,
  "aprobado": true,
  "datosJuego": {},
  "dispositivo": "web",
  "fechaSesion": ISODate("2026-03-11..."),
  "createdAt": ISODate("2026-03-11..."),
  "updatedAt": ISODate("2026-03-11...")
}
```

---

## 🎮 INTEGRACIÓN CON UNITY

### Ejemplo C#

```csharp
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Collections.Generic;

public class DidactifonisProgress : MonoBehaviour
{
    string apiUrl = "http://localhost:3000/api";
    string patientToken = ""; // Token del paciente
    string assignmentId = ""; // ID de la asignación
    
    public void EnviarProgreso(
        int puntuacion,
        int tiempoJugado,
        int rondasCompletadas,
        int aciertos,
        int errores,
        bool completado
    )
    {
        StartCoroutine(GuardarProgreso(
            puntuacion,
            tiempoJugado,
            rondasCompletadas,
            aciertos,
            errores,
            completado
        ));
    }
    
    IEnumerator GuardarProgreso(
        int puntuacion,
        int tiempoJugado,
        int rondasCompletadas,
        int aciertos,
        int errores,
        bool completado
    )
    {
        string url = $"{apiUrl}/progress";
        
        // Crear JSON
        var data = new {
            token = patientToken,
            asignacionId = assignmentId,
            puntuacion = puntuacion,
            tiempoJugado = tiempoJugado,
            rondasCompletadas = rondasCompletadas,
            rondasTotales = 10,
            aciertos = aciertos,
            errores = errores,
            completado = completado,
            datosJuego = new {
                nivel = 1,
                timestamp = System.DateTime.Now.ToString()
            },
            dispositivo = "desktop"
        };
        
        string jsonData = JsonUtility.ToJson(data);
        
        using (UnityWebRequest request = UnityWebRequest.Post(url, "POST"))
        {
            byte[] bodyRaw = System.Text.Encoding.UTF8.GetBytes(jsonData);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");
            
            yield return request.SendWebRequest();
            
            if (request.result == UnityWebRequest.Result.Success)
            {
                Debug.Log("Progreso guardado: " + request.downloadHandler.text);
                // Mostrar mensaje de éxito al jugador
            }
            else
            {
                Debug.LogError("Error al guardar progreso: " + request.error);
            }
        }
    }
}
```

---

### Ejemplo HTML5 (JavaScript)

```javascript
class DidactifonisProgress {
    constructor(patientToken, assignmentId) {
        this.apiUrl = 'http://localhost:3000/api';
        this.patientToken = patientToken;
        this.assignmentId = assignmentId;
    }
    
    async enviarProgreso(datos) {
        const url = `${this.apiUrl}/progress`;
        
        const body = {
            token: this.patientToken,
            asignacionId: this.assignmentId,
            puntuacion: datos.puntuacion,
            tiempoJugado: datos.tiempoJugado,
            rondasCompletadas: datos.rondasCompletadas || 0,
            rondasTotales: datos.rondasTotales || 10,
            aciertos: datos.aciertos || 0,
            errores: datos.errores || 0,
            completado: datos.completado || false,
            datosJuego: datos.datosJuego || {},
            dispositivo: 'web',
            navegador: this.detectarNavegador(),
            sistemaOperativo: this.detectarSO()
        };
        
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('Progreso guardado:', data);
                alert(data.data.mensaje);
                return data;
            } else {
                throw new Error(data.error);
            }
            
        } catch (error) {
            console.error('Error al guardar progreso:', error);
            alert('Error al guardar el progreso');
            throw error;
        }
    }
    
    detectarNavegador() {
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        return 'Otro';
    }
    
    detectarSO() {
        const ua = navigator.userAgent;
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac')) return 'macOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS')) return 'iOS';
        return 'Desconocido';
    }
}

// Uso:
const progress = new DidactifonisProgress(
    'token-del-paciente',
    'id-de-la-asignacion'
);

// Al terminar el juego:
await progress.enviarProgreso({
    puntuacion: 90,
    tiempoJugado: 165,
    rondasCompletadas: 10,
    aciertos: 9,
    errores: 1,
    completado: true,
    datosJuego: {
        nivel: 'medio',
        intentos: 2
    }
});
```

---

## 📊 ESTRUCTURA DE DATOS

### Datos Mínimos Requeridos

```json
{
  "token": "string (required)",
  "asignacionId": "string (required)",
  "puntuacion": "number (required, >= 0)",
  "tiempoJugado": "number (required, >= 0, en segundos)"
}
```

### Datos Opcionales Recomendados

```json
{
  "rondasCompletadas": "number",
  "rondasTotales": "number",
  "aciertos": "number",
  "errores": "number",
  "completado": "boolean",
  "datosJuego": "object (cualquier estructura JSON)",
  "dispositivo": "'web'|'mobile'|'tablet'|'desktop'",
  "navegador": "string",
  "sistemaOperativo": "string"
}
```

---

## ✅ CHECKLIST FINAL

- [ ] Archivo `Progress.js` copiado a `models/`
- [ ] Archivo `progressController.js` copiado a `controllers/`
- [ ] Archivo `progressRoutes.js` copiado a `routes/`
- [ ] `validators.js` actualizado con `validarProgreso`
- [ ] `server.js` actualizado con importación y montaje
- [ ] `test.http` actualizado con ejemplos
- [ ] Servidor reiniciado sin errores
- [ ] Test POST /api/progress funciona (201)
- [ ] Test GET /api/progress/patient/:id funciona (200)
- [ ] Documento visible en MongoDB Compass
- [ ] Variables en test.http actualizadas

---

## 🎯 PRÓXIMOS PASOS

Una vez que tengas todo funcionando:

1. Prueba guardar varios registros de progreso
2. Ve las estadísticas en `/api/progress/estadisticas/:pacienteId`
3. Verifica la evolución en `/api/progress/evolucion/:pacienteId/:juegoId`
4. Integra con Unity o HTML5

---

## 🐛 TROUBLESHOOTING

### Error: "Cannot find module '../models/Progress'"
**Solución:** Verifica que `Progress.js` esté en `backend/src/models/`

### Error: "validarProgreso is not a function"
**Solución:** Asegúrate de agregar `validarProgreso` al `module.exports` en `validators.js`

### Error 404 en /api/progress
**Solución:** Verifica que agregaste `app.use('/api/progress', progressRoutes)` en `server.js`

### Error: "Token inválido o expirado"
**Solución:** Usa el `accessToken` del paciente (el que obtuviste al crear el paciente), NO el JWT

### Error: "Asignación no encontrada"
**Solución:** Verifica que el `asignacionId` sea correcto y que pertenezca al paciente con ese token

---

¡Todo listo! 🚀
