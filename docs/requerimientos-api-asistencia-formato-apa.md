# Requerimientos del API para el Modulo de Asistencia Movil

## Resumen

Este documento presenta los requerimientos del API necesarios para soportar una aplicacion movil orientada al registro de asistencia mediante escaneo de codigos QR y registro manual. El alcance del analisis se centra en la integracion con el backend existente, en la definicion de requisitos funcionales y no funcionales, y en las condiciones tecnicas que garantizan seguridad, consistencia de datos y continuidad operativa. La propuesta esta redactada en formato academico y en estilo narrativo con el fin de servir como base de alineacion entre equipos de producto, frontend movil y backend.

## Introduccion

La arquitectura actual del backend contempla un modulo de asistencia bajo el prefijo `/api/attendance`, asi como un subsistema de autenticacion y sesion bajo el prefijo `/users`. Para habilitar una experiencia movil confiable en escenarios de control de ingreso, el API debe responder de forma predecible ante operaciones de autenticacion, consulta de actividades, habilitacion de escaneo, registro de asistencias y consulta de historiales. En este contexto, los requerimientos del API no solo describen rutas y payloads, sino tambien reglas de negocio, validaciones, codigos de respuesta y restricciones de sesion que condicionan el comportamiento del cliente movil.

## Requerimientos funcionales del API

El primer requerimiento funcional del API establece que todo acceso al modulo de asistencia debe partir de una autenticacion valida por token Bearer en formato JWT. La ruta `POST /users/login` debe permitir credenciales por nombre de usuario o correo electronico, devolver token con vigencia definida y adjuntar informacion minima de usuario para que la aplicacion movil pueda inicializar contexto de sesion. Complementariamente, la ruta `POST /users/validate-session` debe permitir validar la vigencia efectiva de la sesion para controlar expiracion, cierre remoto o invalidacion por concurrencia.

El segundo requerimiento funcional del API indica que la aplicacion movil debe poder consultar y administrar actividades de asistencia denominadas activity tracks. Para ese objetivo, el backend debe exponer operaciones autenticadas de consulta general y filtrada en `GET /api/attendance/activity-tracks`, consulta de proximas actividades en `GET /api/attendance/activity-tracks/upcoming`, consulta de actividad activa para escaneo en `GET /api/attendance/activity-tracks/active-scanning` y control de ciclo de escaneo mediante `PUT /api/attendance/activity-tracks/:id/start-scanning` y `PUT /api/attendance/activity-tracks/:id/stop-scanning`. Este requerimiento implica que el API garantice coherencia de estado para evitar multiples actividades en escaneo simultaneo y para rechazar activaciones sobre actividades invalidadas por reglas de negocio, como estados no activos o condiciones de archivado.

El tercer requerimiento funcional del API corresponde al registro de asistencia por QR y exige que la ruta `POST /api/attendance/attendance-records/qr-scan` reciba un objeto `qrData` con `record_id` y `name`, ademas de `activityTrackId`, valide existencia de actividad en escaneo activo y confirme que el identificador enviado por el cliente coincida con la actividad efectivamente habilitada en servidor. Bajo esta condicion, el API debe crear el registro de asistencia como tipo beneficiario y metodo qr_scan, devolver respuesta de creacion exitosa y bloquear duplicados de la misma persona en la misma actividad mediante respuesta de conflicto.

El cuarto requerimiento funcional del API establece el registro manual de asistencia por medio de `POST /api/attendance/attendance-records/manual`, permitiendo capturar asistencia de beneficiarios e invitados cuando el escaneo QR no sea aplicable. Este requerimiento demanda que el API valide obligatoriamente `activity_track_id`, `attendance_type` y `full_name`, y que imponga `record_id` cuando el tipo sea beneficiario. Asimismo, el backend debe validar existencia de la actividad, rechazar duplicados para beneficiarios y normalizar campos opcionales como cedula y telefono sin comprometer la integridad del registro.

El quinto requerimiento funcional del API describe la necesidad de trazabilidad y consulta operativa para el cliente movil, de forma que la app pueda recuperar historial reciente, registros filtrados y verificaciones puntuales de asistencia. En consecuencia, el API debe mantener disponibles rutas autenticadas como `GET /api/attendance/attendance-records/recent`, `GET /api/attendance/attendance-records` con filtros por actividad, tipo, metodo y rango de fechas, `GET /api/attendance/attendance-records/activity-track/:activityTrackId` para detalle por evento, y `GET /api/attendance/attendance-records/activity-track/:activityTrackId/check/:recordId` para validacion de asistencia previa. Este requerimiento permite retroalimentacion inmediata al operador y soporta decisiones en tiempo real durante jornadas de registro.

El sexto requerimiento funcional del API contempla capacidades de analitica y reporte para supervision operativa y auditoria. En este marco, las rutas bajo `/api/attendance/analytics`, incluyendo `overview`, `insights`, `activity/:activityTrackId/report`, `activity/comparison` y `export`, deben permanecer consistentes en estructura de respuesta y control de acceso para que los consumidores moviles o administrativos puedan obtener resumenes, comparativos y exportaciones sin ambiguedades semanticas ni variaciones imprevistas de contrato.

## Requerimientos no funcionales del API

En materia de seguridad, el API debe exigir autenticacion por token para todos los recursos de asistencia, validar firma y estructura del JWT, y rechazar solicitudes sin credenciales o con credenciales invalidas mediante codigos apropiados de autenticacion y autorizacion. Dado que la sesion activa se controla actualmente en memoria de servidor, el contrato operativo debe advertir que un reinicio de infraestructura puede invalidar sesiones vigentes y forzar nuevo inicio de sesion desde la aplicacion movil.

En terminos de rendimiento, el API debe mantener tiempos de respuesta estables para escenarios de alto flujo de lectura de QR, priorizando latencias bajas en el endpoint de registro para no afectar la experiencia del operador en campo. Esta condicion requiere consultas optimizadas por identificadores de actividad y beneficiario, y mecanismos de control de duplicidad que resuelvan de manera atomica los conflictos de concurrencia.

Respecto de disponibilidad y resiliencia, el API debe devolver respuestas estructuradas y diferenciables ante fallos de validacion, conflictos de negocio y errores internos. La aplicacion movil depende de esta consistencia para implementar reintentos seguros, mensajes comprensibles al usuario y recuperacion de estado de interfaz despues de eventos de red inestable. Por este motivo, la respuesta de error debe mantener campos semanticos estables, ya sea mediante `error` o `message`, y preservar el significado de codigos HTTP como 400, 401, 403, 404, 409 y 500.

En cuanto a interoperabilidad, el API debe sostener convenciones uniformes de serializacion JSON, nombres de atributos y formato de fechas para minimizar transformaciones en el cliente movil. La normalizacion de nombres entre rutas y payloads debe documentarse y mantenerse bajo control de cambios, especialmente en campos sensibles del flujo de asistencia como `activityTrackId`, `activity_track_id`, `attendance_type`, `attendance_method` y `record_id`, cuya interpretacion impacta directamente en la validez del registro.

## Integracion contractual con cliente movil

Desde la perspectiva de contrato de integracion, el API debe garantizar que la secuencia login, consulta de actividad activa, envio de escaneo o registro manual y consulta de confirmacion pueda ejecutarse sin ambiguedades. Esto implica que el backend debe preservar compatibilidad retroactiva en los endpoints criticos del modulo de asistencia y evitar cambios disruptivos en estructuras de respuesta sin versionado explicito. Asimismo, la documentacion viva en Swagger, disponible en `/api-docs` y `/api-docs.json`, debe reflejar de forma sincronizada las rutas de produccion para reducir desviaciones entre especificacion y comportamiento real.

## Conclusiones

Los requerimientos del API para asistencia movil se sintetizan en la necesidad de un contrato robusto de autenticacion, gestion de actividades, registro de asistencia por QR y por formulario manual, consulta de historiales y explotacion analitica, todo ello bajo reglas estrictas de validacion y seguridad. La calidad de la integracion movil depende directamente de la estabilidad semantica de estos contratos, de la claridad en los codigos de error y de la capacidad del backend para sostener estados coherentes de sesion y escaneo activo. En consecuencia, la adopcion de estos requerimientos como linea base permite avanzar en la implementacion del cliente movil con menor riesgo tecnico, mayor trazabilidad de datos y mejor experiencia operativa en escenarios reales de asistencia.

## Referencias

ASONIPED Digital. (2026). `src/index.ts`.

ASONIPED Digital. (2026). `src/middleware/auth.middleware.ts`.

ASONIPED Digital. (2026). `src/modules/user/routes/user.routes.ts`.

ASONIPED Digital. (2026). `src/modules/user/controllers/user.controller.ts`.

ASONIPED Digital. (2026). `src/modules/attendance/routes/attendance_new.routes.ts`.

ASONIPED Digital. (2026). `src/modules/attendance/routes/activity_track.routes.ts`.

ASONIPED Digital. (2026). `src/modules/attendance/routes/attendance_record.routes.ts`.

ASONIPED Digital. (2026). `src/modules/attendance/controllers/activity_track.controller.ts`.

ASONIPED Digital. (2026). `src/modules/attendance/controllers/attendance_record.controller.ts`.

ASONIPED Digital. (2026). `src/config/swagger.ts`.
