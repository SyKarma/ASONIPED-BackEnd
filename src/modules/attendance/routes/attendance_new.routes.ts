import express from 'express';
import activityTrackRoutes from './activity_track.routes';
import attendanceRecordRoutes from './attendance_record.routes';
import attendanceAnalyticsRoutes from './attendance_analytics.routes';
import { authenticateToken } from '../../../middleware/auth.middleware';

const router = express.Router();

// Test route for the entire attendance module
router.get('/test', (req: any, res: any) => res.json({ 
  message: 'New Attendance System routes are working!',
  endpoints: {
    activityTracks: '/api/attendance/activity-tracks',
    attendanceRecords: '/api/attendance/attendance-records',
    analytics: '/api/attendance/analytics'
  }
}));

// Mount sub-routes
router.use('/activity-tracks', activityTrackRoutes);
router.use('/attendance-records', attendanceRecordRoutes);
router.use('/analytics', attendanceAnalyticsRoutes);

// Analytics and reporting routes (protected)
router.get('/analytics/overview', authenticateToken, async (req: any, res: any) => {
  try {
    // This will be implemented in the analytics controller
    res.json({ 
      message: 'Analytics overview endpoint - to be implemented',
      features: [
        'Total attendance statistics',
        'Activity track performance',
        'Beneficiarios vs Guests comparison',
        'QR scan vs Manual entry statistics',
        'Date range analytics'
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error getting analytics overview' });
  }
});

router.get('/reports/activity/:activityTrackId', authenticateToken, async (req: any, res: any) => {
  try {
    const activityTrackId = parseInt(req.params.activityTrackId);
    
    if (!activityTrackId || isNaN(activityTrackId)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    // This will be implemented in the analytics controller
    res.json({ 
      message: 'Activity report endpoint - to be implemented',
      activityTrackId,
      features: [
        'Attendance list for the activity',
        'Statistics breakdown',
        'Export capabilities',
        'Beneficiarios and guests lists'
      ]
    });
  } catch (err) {
    res.status(500).json({ error: 'Error generating activity report' });
  }
});

export default router;
