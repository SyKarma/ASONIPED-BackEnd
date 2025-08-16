# Sistema de Expedientes ASONIPED

## 📋 Descripción General

El Sistema de Expedientes de ASONIPED es una aplicación web completa para la gestión de expedientes de beneficiarios con discapacidad. El sistema implementa un flujo de trabajo de 4 fases que permite un control riguroso del proceso de registro y aprobación.

## 🏗️ Arquitectura del Sistema

### Frontend
- **React + TypeScript**: Interfaz de usuario moderna y responsive
- **Tailwind CSS**: Estilos y diseño
- **Lucide React**: Iconografía
- **TanStack Router**: Enrutamiento

### Backend
- **Node.js + Express**: API REST
- **MySQL**: Base de datos
- **JWT**: Autenticación
- **TypeScript**: Tipado estático

## 📊 Estructura de la Base de Datos

### Tablas Principales

1. **`records`** - Expediente principal
   - `id`: Identificador único
   - `record_number`: Número de expediente (EXP-YYYY-XXXX)
   - `status`: Estado (draft, pending, approved, rejected, active, inactive)
   - `phase`: Fase actual (phase1, phase2, phase3, phase4, completed)
   - `created_by`: ID del usuario que creó el expediente
   - `created_at`, `updated_at`: Timestamps

2. **`personal_data`** - Datos personales del beneficiario
   - Información básica: nombre, cédula, fecha de nacimiento
   - Información de contacto: teléfono, email, dirección
   - Información familiar: padres, contacto de emergencia
   - Información de la PCD: nombre de la persona con discapacidad

3. **`disability_data`** - Información de discapacidad
   - Tipo de discapacidad (física, visual, auditiva, etc.)
   - Diagnóstico médico
   - Beneficios biomecánicos
   - Certificados y registros

4. **`registration_requirements`** - Requisitos de inscripción
   - Documentos requeridos (boolean)
   - Información bancaria
   - Pago de cuota de afiliación

5. **`enrollment_form`** - Boleta de matrícula
   - Datos del solicitante
   - Información médica
   - Datos familiares

6. **`socioeconomic_data`** - Ficha socioeconómica
   - Información familiar
   - Ingresos
   - Vivienda y servicios

7. **`record_documents`** - Documentos adjuntos
   - Archivos subidos
   - Metadatos de archivos

8. **`record_notes`** - Notas administrativas
   - Comentarios del administrador
   - Historial de actividades
   - Hitos importantes

## 🔄 Flujo de Trabajo (4 Fases)

### Fase 1: Registro Inicial
- **Usuario**: Completa formulario básico con datos personales
- **Estado**: `pending`
- **Fase**: `phase1`
- **Acción**: Crear expediente inicial

### Fase 2: Revisión Administrativa
- **Admin**: Revisa datos básicos y toma decisión
- **Acciones**: Aprobar o Rechazar
- **Si Aprobado**: Estado → `approved`, Fase → `phase2`
- **Si Rechazado**: Estado → `rejected`, Fase → `phase1`

### Fase 3: Formulario Completo
- **Usuario**: Completa formulario completo y sube documentos
- **Estado**: `pending`
- **Fase**: `phase3`
- **Acción**: Actualizar expediente con datos completos

### Fase 4: Revisión Final
- **Admin**: Revisa formulario completo y documentos
- **Acciones**: Aprobar o Rechazar
- **Si Aprobado**: Estado → `active`, Fase → `completed`
- **Si Rechazado**: Estado → `rejected`, Fase → `phase3`

## 🚀 Instalación y Configuración

### 1. Base de Datos
```bash
# Ejecutar el script completo
mysql -u root -p asonipeddigitaltest < SISTEMA_EXPEDIENTES_COMPLETO.sql
```

### 2. Backend
```bash
cd BackEnd
npm install
npm run dev
```

### 3. Frontend
```bash
cd FrontEnd
npm install
npm run dev
```

## 📁 Estructura de Archivos

### Backend
```
BackEnd/
├── src/
│   ├── controllers/records/
│   │   └── record.controller.ts
│   ├── models/records/
│   │   ├── record.model.ts
│   │   └── personal_data.model.ts
│   ├── routes/records/
│   │   └── record.routes.ts
│   └── middleware/
│       └── auth.middleware.ts
└── txt.notas/
    ├── SISTEMA_EXPEDIENTES_COMPLETO.sql
    └── README_SISTEMA_EXPEDIENTES.md
```

### Frontend
```
FrontEnd/
├── src/
│   ├── Pages/
│   │   ├── User/
│   │   │   └── ExpedientesPage.tsx
│   │   └── Admin/
│   │       └── ExpedientesAdminPage.tsx
│   ├── Utils/
│   │   └── recordsApi.ts
│   └── types/
│       └── records.ts
```

## 🔌 API Endpoints

### Expedientes
- `GET /records` - Listar expedientes (con filtros)
- `POST /records` - Crear expediente
- `GET /records/:id` - Obtener expediente por ID
- `PUT /records/:id` - Actualizar expediente
- `DELETE /records/:id` - Eliminar expediente

### Aprobaciones
- `PUT /records/:id/approve-phase1` - Aprobar Fase 1
- `PUT /records/:id/reject-phase1` - Rechazar Fase 1
- `PUT /records/:id/approve` - Aprobar expediente completo
- `PUT /records/:id/reject` - Rechazar expediente completo

### Comentarios
- `PUT /records/notes/:noteId` - Actualizar comentario
- `DELETE /records/notes/:noteId` - Eliminar comentario

### Usuario
- `GET /records/my-record` - Obtener expediente del usuario actual
- `GET /records/check-cedula-availability/:cedula` - Verificar disponibilidad de cédula

### Estadísticas
- `GET /records/stats` - Obtener estadísticas

## 🎯 Funcionalidades Principales

### Para Usuarios
- ✅ Registro inicial (Fase 1)
- ✅ Completar formulario completo (Fase 3)
- ✅ Ver estado de su expediente
- ✅ Subir documentos
- ✅ Recibir notificaciones

### Para Administradores
- ✅ Ver todos los expedientes
- ✅ Filtrar y buscar expedientes
- ✅ Revisar y aprobar/rechazar expedientes
- ✅ Agregar comentarios y notas
- ✅ Editar y eliminar comentarios
- ✅ Eliminar expedientes
- ✅ Ver estadísticas

## 🔧 Configuración Avanzada

### Variables de Entorno
```env
# Backend (.env)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=asonipeddigitaltest
JWT_SECRET=your_jwt_secret
PORT=3000
```

### Índices de Base de Datos
El sistema incluye índices optimizados para:
- Búsquedas por estado y fase
- Búsquedas por cédula
- Ordenamiento por fecha de creación
- Búsquedas por número de expediente

### Funciones de Base de Datos
- `generate_record_number()`: Genera números únicos de expediente
- `create_complete_record()`: Procedimiento para crear expediente completo

### Vistas
- `v_records_with_personal_data`: Expedientes con datos personales
- `v_record_stats`: Estadísticas de expedientes

## 🛠️ Mantenimiento

### Backup de Base de Datos
```bash
mysqldump -u root -p asonipeddigitaltest > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Limpieza de Datos
```sql
-- Eliminar expedientes de prueba
DELETE FROM record_notes WHERE record_id IN (SELECT id FROM records WHERE status = 'draft');
DELETE FROM personal_data WHERE record_id IN (SELECT id FROM records WHERE status = 'draft');
DELETE FROM records WHERE status = 'draft';
```

### Optimización de Base de Datos
```sql
-- Analizar tablas
ANALYZE TABLE records, personal_data, record_notes;

-- Optimizar tablas
OPTIMIZE TABLE records, personal_data, record_notes;
```

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de Foreign Key**
   ```sql
   -- Eliminar constraint problemático
   ALTER TABLE records DROP FOREIGN KEY constraint_name;
   ```

2. **Error de Cédula Duplicada**
   ```sql
   -- Verificar cédulas duplicadas
   SELECT cedula, COUNT(*) FROM personal_data GROUP BY cedula HAVING COUNT(*) > 1;
   ```

3. **Error de Permisos**
   ```sql
   -- Verificar permisos de usuario
   SHOW GRANTS FOR 'asoniped_app'@'localhost';
   ```

### Logs de Debug
- Backend: `console.log` en controladores y modelos
- Frontend: DevTools Console
- Base de datos: `SHOW PROCESSLIST;`

## 📈 Mejoras Futuras

### Funcionalidades Planificadas
- [ ] Sistema de notificaciones por email
- [ ] Dashboard de estadísticas avanzadas
- [ ] Exportación de datos a Excel/PDF
- [ ] Sistema de auditoría completo
- [ ] API para integración con otros sistemas
- [ ] Aplicación móvil

### Optimizaciones Técnicas
- [ ] Caché de consultas frecuentes
- [ ] Paginación optimizada
- [ ] Compresión de archivos
- [ ] Backup automático
- [ ] Monitoreo de rendimiento

## 📞 Soporte

Para soporte técnico o preguntas sobre el sistema:
- Revisar logs de error
- Verificar configuración de base de datos
- Comprobar conectividad de red
- Validar permisos de archivos

---

**Versión**: 1.0.0  
**Fecha**: Diciembre 2024  
**Desarrollado por**: ASONIPED Digital Team
