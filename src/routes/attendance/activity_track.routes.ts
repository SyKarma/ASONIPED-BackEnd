import express from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as ActivityTrackController from '../../controllers/attendance/activity_track.controller';

const router = express.Router();

// Test route
router.get('/test', (req: any, res: any) => res.json({ message: 'Activity Track routes are working!' }));

// Protected routes (require authentication)
router.post('/', authenticateToken, ActivityTrackController.createActivityTrack); // Create activity track
router.get('/', authenticateToken, ActivityTrackController.getActivityTracks); // Get all activity tracks with pagination
router.get('/upcoming', authenticateToken, ActivityTrackController.getUpcomingActivityTracks); // Get upcoming activity tracks
router.get('/date-range', authenticateToken, ActivityTrackController.getActivityTracksByDateRange); // Get activity tracks by date range
router.get('/active-scanning', authenticateToken, ActivityTrackController.getActiveScanningActivityTrack); // Get currently active scanning activity track

// Routes with specific parameters
router.get('/:id', authenticateToken, ActivityTrackController.getActivityTrackById); // Get activity track by ID
router.put('/:id', authenticateToken, ActivityTrackController.updateActivityTrack); // Update activity track
router.delete('/:id', authenticateToken, ActivityTrackController.deleteActivityTrack); // Delete activity track
router.put('/:id/start-scanning', authenticateToken, ActivityTrackController.startQRScanning); // Start QR scanning for activity track
router.put('/:id/stop-scanning', authenticateToken, ActivityTrackController.stopQRScanning); // Stop QR scanning for activity track
router.get('/:id/attendance', authenticateToken, ActivityTrackController.getActivityTrackWithAttendance); // Get activity track with attendance records

export default router;
