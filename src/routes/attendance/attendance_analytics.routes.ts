import express from 'express';
import { authenticateToken } from '../../middleware/auth.middleware';
import * as AttendanceAnalyticsController from '../../controllers/attendance/attendance_analytics.controller';

const router = express.Router();

// Test route
router.get('/test', (req: any, res: any) => res.json({ message: 'Attendance Analytics routes are working!' }));

// Analytics routes (all require authentication)
router.get('/overview', authenticateToken, AttendanceAnalyticsController.getAttendanceAnalyticsOverview); // Get comprehensive analytics overview
router.get('/insights', authenticateToken, AttendanceAnalyticsController.getAttendanceInsights); // Get attendance patterns and insights
router.get('/export', authenticateToken, AttendanceAnalyticsController.exportAttendanceData); // Export attendance data

// Activity-specific analytics
router.get('/activity/:activityTrackId/report', authenticateToken, AttendanceAnalyticsController.getActivityReport); // Get detailed activity report
router.get('/activity/comparison', authenticateToken, AttendanceAnalyticsController.getActivityComparison); // Compare multiple activities

export default router;
