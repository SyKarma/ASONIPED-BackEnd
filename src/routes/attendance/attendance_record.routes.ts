import express from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as AttendanceRecordController from '../../controllers/attendance/attendance_record.controller';

const router = express.Router();

// Test route
router.get('/test', (req: any, res: any) => res.json({ message: 'Attendance Record routes are working!' }));

// Protected routes (require authentication)
router.post('/qr-scan', authenticateToken, AttendanceRecordController.processQRScan); // Process QR code scan
router.post('/manual', authenticateToken, AttendanceRecordController.createManualAttendance); // Create manual attendance entry
router.get('/', authenticateToken, AttendanceRecordController.getAttendanceRecords); // Get attendance records with filtering
router.get('/recent', authenticateToken, AttendanceRecordController.getRecentAttendanceRecords); // Get recent attendance records
router.get('/stats/date-range', authenticateToken, AttendanceRecordController.getAttendanceStatsByDateRange); // Get attendance stats by date range

// Routes with specific parameters
router.get('/:id', authenticateToken, AttendanceRecordController.getAttendanceRecordById); // Get attendance record by ID
router.put('/:id', authenticateToken, AttendanceRecordController.updateAttendanceRecord); // Update attendance record
router.delete('/:id', authenticateToken, AttendanceRecordController.deleteAttendanceRecord); // Delete attendance record

// Routes for activity track specific operations
router.get('/activity-track/:activityTrackId', authenticateToken, AttendanceRecordController.getAttendanceRecordsByActivityTrack); // Get attendance records for specific activity track
router.get('/activity-track/:activityTrackId/stats', authenticateToken, AttendanceRecordController.getAttendanceStats); // Get attendance stats for specific activity track
router.get('/activity-track/:activityTrackId/check/:recordId', authenticateToken, AttendanceRecordController.checkBeneficiarioAttendance); // Check if beneficiario has attended

export default router;
