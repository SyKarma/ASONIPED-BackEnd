import express from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import { uploadRecordDocuments, handleUploadError } from '../../middleware/upload.middleware';
import * as RecordController from '../../controllers/records/record.controller';

const router = express.Router();

// Rutas públicas (para formulario de inscripción)
router.post('/', authenticateToken, RecordController.createRecord); // Crear expediente (requiere autenticación)

// Rutas de prueba y debug (sin autenticación)
router.get('/test', (req: any, res: any) => res.json({ message: 'Records routes are working!' })); // Ruta de prueba
router.get('/check-personal-data', RecordController.checkPersonalDataTable); // Verificar tabla personal_data
router.get('/debug/database-public', RecordController.debugDatabase); // Debug temporal sin autenticación

// Rutas protegidas específicas (deben ir ANTES de las rutas con parámetros)
router.get('/my-record', authenticateToken, RecordController.getMyRecord); // Obtener expediente del usuario
router.get('/stats', authenticateToken, RecordController.getRecordStats); // Estadísticas
router.get('/debug/database', authenticateToken, RecordController.debugDatabase); // Debug temporal

// Rutas con parámetros específicos
router.get('/search/cedula/:cedula', authenticateToken, RecordController.searchRecordByCedula); // Buscar por cédula
router.get('/check-cedula/:cedula', authenticateToken, RecordController.checkCedulaExists); // Verificar cédula
router.get('/check-cedula-availability/:cedula', RecordController.checkCedulaAvailability); // Verificar disponibilidad de cédula

// Rutas generales (requieren autenticación)
router.get('/', authenticateToken, RecordController.getRecords); // Listar expedientes

// Rutas para expedientes específicos (con parámetros)
router.get('/:id', authenticateToken, RecordController.getRecordById); // Obtener expediente
router.put('/:id', authenticateToken, RecordController.updateRecord); // Actualizar expediente
router.put('/:id/complete', authenticateToken, uploadRecordDocuments, handleUploadError, RecordController.completeRecord); // Completar expediente
router.delete('/:id', authenticateToken, RecordController.deleteRecord); // Eliminar expediente
router.patch('/:id/status', authenticateToken, RecordController.updateRecordStatus); // Cambiar estado

// Rutas para aprobaciones/rechazos
router.put('/:id/approve-phase1', authenticateToken, RecordController.approvePhase1); // Aprobar fase 1
router.put('/:id/reject-phase1', authenticateToken, RecordController.rejectPhase1); // Rechazar fase 1
router.put('/:id/approve', authenticateToken, RecordController.approveRecord); // Aprobar expediente completo
router.put('/:id/reject', authenticateToken, RecordController.rejectRecord); // Rechazar expediente completo

// Rutas para gestionar comentarios
router.put('/notes/:noteId', authenticateToken, RecordController.updateNote); // Actualizar comentario
router.delete('/notes/:noteId', authenticateToken, RecordController.deleteNote); // Eliminar comentario

// Ruta para eliminar expediente
router.delete('/:id', authenticateToken, RecordController.deleteRecord); // Eliminar expediente

export default router; 