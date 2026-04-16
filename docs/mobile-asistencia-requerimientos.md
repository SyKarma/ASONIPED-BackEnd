# Requerimientos Frontend Movil e Integracion Backend - Modulo de Asistencia

## 1. Objetivo

Definir los requerimientos para una aplicacion movil que:

1. Se conecte al modulo de asistencia actual del backend.
2. Use la camara del telefono para escanear codigos QR.
3. Permita registrar asistencia manualmente (beneficiario o invitado).

Este documento cubre **frontend movil** y **contratos de integracion con backend**. No incluye desarrollo de codigo.

---

## 2. Alcance funcional (MVP)

### Incluido

- Inicio de sesion con usuario existente.
- Seleccion de actividad de asistencia (activity track).
- Activacion/desactivacion de escaneo QR por actividad.
- Registro de asistencia por QR.
- Registro de asistencia manual:
  - Tipo `beneficiario` (requiere `record_id`).
  - Tipo `guest` (invitado).
- Consulta de asistencias recientes e historial por actividad.
- Consulta de estadisticas basicas.

### Fuera de alcance (por ahora)

- Modo offline con sincronizacion diferida.
- Notificaciones push.
- Impresion o generacion de codigos QR en la app movil.
- Control de permisos por rol desde backend (hoy las rutas de asistencia requieren token, pero no validan rol especifico).

---

## 3. Arquitectura de integracion movil -> backend

## 3.1 Base URL

- Backend base: definir por ambiente (dev/staging/prod).
- Rutas principales usadas por movil:
  - Auth: `/users/*`
  - Asistencia: `/api/attendance/*`

## 3.2 Autenticacion

- Tipo: JWT Bearer token.
- Login: `POST /users/login`
- Header requerido en rutas protegidas:

```http
Authorization: Bearer <token>
Content-Type: application/json
```

## 3.3 Swagger disponible

- UI: `GET /api-docs`
- JSON OpenAPI: `GET /api-docs.json`

---

## 4. Requerimientos de frontend movil

## 4.1 Pantallas minimas

1. **Login**
   - Campos: usuario/correo, password.
   - Guarda token seguro en dispositivo.
2. **Selector de actividad**
   - Lista de actividades (`activity-tracks`) activas/proximas.
   - Estado de escaneo activo global.
3. **Escaner QR**
   - Preview de camara.
   - Lectura QR y envio inmediato al endpoint de escaneo.
   - Feedback visual y sonoro (ok/error/duplicado).
4. **Registro manual**
   - Formulario con `attendance_type`.
   - Si `beneficiario`: `record_id` obligatorio.
   - Si `guest`: `record_id` opcional/no usado.
5. **Historial y estadisticas**
   - Lista de asistencias recientes.
   - Filtros por actividad, tipo, metodo y fecha.

## 4.2 Requerimientos funcionales detallados

- El usuario debe iniciar sesion antes de acceder al modulo.
- La app debe poder consultar la actividad con escaneo activo:
  - `GET /api/attendance/activity-tracks/active-scanning`
- Para escaneo QR exitoso se requiere:
  - Actividad activa en backend (`scanning_active = true`).
  - `activityTrackId` enviado desde app debe coincidir con la actividad activa.
- La app debe prevenir doble envio accidental (debounce de escaneo).
- La app debe mostrar errores de negocio:
  - duplicado de asistencia (409),
  - actividad no activa o inexistente (400/404),
  - sesion invalida (401/403).

## 4.3 Requerimientos no funcionales

- Soporte Android e iOS.
- Permisos de camara solicitados al entrar al escaner.
- Tiempo de respuesta objetivo para registrar asistencia: <= 2 segundos en red estable.
- Tolerancia a fallos de red:
  - Mostrar reintento manual.
  - No registrar localmente como confirmado hasta recibir `201`.
- Seguridad:
  - Almacenamiento seguro de token (Keychain/Keystore).
  - Logout elimina token local.

---

## 5. Contratos backend relevantes para movil

## 5.1 Auth / sesion

### POST `/users/login`

Request:

```json
{
  "username": "usuario_o_correo",
  "password": "********"
}
```

Response 200 (ejemplo):

```json
{
  "message": "Login successful",
  "token": "jwt_token",
  "user": {
    "id": 10,
    "username": "operador1",
    "email": "operador@org.com",
    "full_name": "Operador Asistencia",
    "roles": ["admin"]
  }
}
```

Errores frecuentes:
- 400: faltan credenciales
- 401: credenciales invalidas / cuenta inactiva / email no verificado

### POST `/users/validate-session`

Valida token actual para renovar estado de sesion en app.

---

## 5.2 Actividades de asistencia (Activity Tracks)

Prefijo: `/api/attendance/activity-tracks`

Endpoints principales para app movil:

- `GET /` lista paginada.
- `GET /upcoming` actividades proximas.
- `GET /active-scanning` actividad actualmente habilitada para escaneo.
- `PUT /:id/start-scanning` activa escaneo QR para una actividad.
- `PUT /:id/stop-scanning` desactiva escaneo QR.
- `GET /:id/attendance` detalle de actividad + asistencias.

Estructura esperada de actividad:

```json
{
  "id": 12,
  "name": "Jornada de Rehabilitacion",
  "description": "Actividad semanal",
  "event_date": "2026-04-20",
  "event_time": "09:00:00",
  "location": "Salon Principal",
  "status": "active",
  "scanning_active": true,
  "created_by": 3
}
```

---

## 5.3 Registro de asistencia

Prefijo: `/api/attendance/attendance-records`

### POST `/qr-scan`

Uso: registrar beneficiario desde QR.

Request:

```json
{
  "qrData": {
    "record_id": 123,
    "name": "Nombre en QR"
  },
  "activityTrackId": 12
}
```

Notas:
- `qrData.name` es validado por backend como requerido.
- El backend usa `record_id` para buscar nombre oficial del expediente activo.

Response 201:

```json
{
  "message": "Attendance recorded successfully via QR scan",
  "attendanceRecord": {
    "id": 555,
    "activity_track_id": 12,
    "record_id": 123,
    "attendance_type": "beneficiario",
    "full_name": "Nombre Oficial",
    "attendance_method": "qr_scan",
    "scanned_at": "2026-04-16T03:00:00.000Z"
  }
}
```

Errores de negocio:
- 400: no hay actividad activa de escaneo o no coincide `activityTrackId`.
- 404: record no encontrado/no activo.
- 409: asistencia duplicada del mismo beneficiario en la misma actividad.

### POST `/manual`

Uso: registrar asistencia manual.

Request base:

```json
{
  "activity_track_id": 12,
  "attendance_type": "beneficiario",
  "full_name": "Nombre Apellido",
  "cedula": "001-000000-0000A",
  "phone": "88887777",
  "record_id": 123
}
```

Reglas:
- Requeridos: `activity_track_id`, `attendance_type`, `full_name`.
- `attendance_type` permitido: `beneficiario` o `guest`.
- Si `beneficiario`, `record_id` es obligatorio.

Response 201:

```json
{
  "message": "Attendance recorded successfully via manual entry",
  "attendanceRecord": {
    "id": 556,
    "attendance_method": "manual_form"
  }
}
```

### Consultas de asistencia utiles para app

- `GET /recent?limit=10`
- `GET /?page=1&limit=50&activityTrackId=12&attendanceType=beneficiario&attendanceMethod=qr_scan&startDate=2026-04-01&endDate=2026-04-30`
- `GET /activity-track/:activityTrackId`
- `GET /activity-track/:activityTrackId/stats`
- `GET /activity-track/:activityTrackId/check/:recordId`

---

## 5.4 Analitica (opcional para MVP de operador)

Prefijo: `/api/attendance/analytics`

- `GET /overview`
- `GET /insights`
- `GET /activity/:activityTrackId/report`
- `GET /activity/comparison?activityIds=1,2,3`
- `GET /export?format=json|csv&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

---

## 6. Flujo sugerido de uso en movil

## 6.1 Flujo de escaneo QR

1. Login (`/users/login`) y guardar token.
2. Obtener actividad activa:
   - `GET /api/attendance/activity-tracks/active-scanning`
3. Abrir camara y escanear QR.
4. Enviar `POST /api/attendance/attendance-records/qr-scan`.
5. Mostrar resultado:
   - Exito -> confirmacion visual + sonido.
   - 409 -> "Asistencia ya registrada".
   - 400/404 -> mensaje de actividad/QR invalido.

## 6.2 Flujo manual

1. Usuario selecciona actividad.
2. Completa formulario manual.
3. App valida requeridos segun tipo.
4. Envia `POST /api/attendance/attendance-records/manual`.
5. Refresca listado reciente (`/recent`).

---

## 7. Validaciones recomendadas en frontend

- Antes de enviar QR:
  - confirmar que existe actividad activa.
  - no reenviar mismo QR en ventana corta (ej. 2-3 segundos).
- En manual:
  - bloquear submit hasta completar requeridos.
  - si `beneficiario`, exigir `record_id` numerico.
- Manejo de errores:
  - backend usa respuestas con `error` o `message`; frontend debe soportar ambos.

---

## 8. Riesgos/observaciones tecnicas actuales del backend

1. **Sesion en memoria del servidor**  
   El backend valida token contra una sesion activa en memoria (`sessionService`). Si el servidor reinicia, el cliente movil debe volver a iniciar sesion.

2. **Permisos por rol no forzados en modulo asistencia**  
   Las rutas de asistencia exigen token, pero no distinguen rol (admin/operador). Si se requiere control fino, debe definirse en backend.

3. **Dependencia online**  
   No existe confirmacion offline/cola en backend para asistencias. El MVP movil depende de conectividad al momento del registro.

---

## 9. Checklist para iniciar implementacion movil

- [ ] Definir URLs por ambiente (dev/staging/prod).
- [ ] Definir stack movil (React Native/Flutter/nativo).
- [ ] Implementar cliente HTTP con interceptor Bearer token.
- [ ] Implementar gestion segura de token.
- [ ] Implementar modulo de camara + lector QR.
- [ ] Implementar flujo de actividad activa + escaneo.
- [ ] Implementar formulario manual (beneficiario/guest).
- [ ] Implementar manejo estandar de errores API.
- [ ] Ejecutar pruebas integrales con backend real.

---

## 10. Criterios de aceptacion (producto)

1. Un operador autenticado puede registrar asistencia por QR en una actividad activa.
2. El sistema evita duplicados de beneficiario en la misma actividad.
3. Un operador puede registrar asistencia manual para beneficiario o invitado.
4. El historial reciente refleja nuevos registros en tiempo real de consulta.
5. La app muestra mensajes claros para errores 400/401/403/404/409.

