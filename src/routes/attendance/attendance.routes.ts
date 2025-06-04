// src/routes/attendance/attendance.routes.ts

import { Router } from 'express';
import {
  getAllAttendanceController,
  createAttendanceController,
} from '../../controllers/attendance/attendance.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// GET all attendance records
router.get('/', getAllAttendanceController);

// POST create a new attendance record (protected)
router.post('/', authenticateToken, createAttendanceController);

export default router;