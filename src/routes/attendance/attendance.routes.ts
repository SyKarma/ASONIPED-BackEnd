import { Router } from 'express';
import {
  getAllAttendanceController,
  createAttendanceController,
} from '../../controllers/attendance/attendance.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Conseguir todos los registros de asistencia (público)
router.get('/', getAllAttendanceController);

// Crar un nuevo registro de asistencia (requiere autenticación)
router.post('/', authenticateToken, createAttendanceController);

export default router;