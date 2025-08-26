Orden de insercion de tablas: 
1- records
2- personal_data
3- disability_data
4- registration_requirements
5- enrollment_form
6- socioeconomic_data
7- record_documents
8- record_notes

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