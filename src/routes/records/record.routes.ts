import express from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as RecordController from '../../controllers/records/record.controller';

const router = express.Router();

// Rutas públicas (para formulario de inscripción)
router.post('/', RecordController.createRecord); // Crear expediente público

// Rutas protegidas (requieren autenticación)
router.get('/', authenticateToken, RecordController.getRecords); // Listar expedientes
router.get('/stats', authenticateToken, RecordController.getRecordStats); // Estadísticas
router.get('/search/cedula/:cedula', authenticateToken, RecordController.searchRecordByCedula); // Buscar por cédula
router.get('/check-cedula/:cedula', authenticateToken, RecordController.checkCedulaExists); // Verificar cédula

// Rutas para expedientes específicos
router.get('/:id', authenticateToken, RecordController.getRecordById); // Obtener expediente
router.put('/:id', authenticateToken, RecordController.updateRecord); // Actualizar expediente
router.delete('/:id', authenticateToken, RecordController.deleteRecord); // Eliminar expediente
router.patch('/:id/status', authenticateToken, RecordController.updateRecordStatus); // Cambiar estado

export default router; 