import express from 'express';
import * as UserDashboardController from '../controllers/user_dashboard.controller';
import { authenticateToken } from '../../../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Test endpoint
router.get('/test', UserDashboardController.testUserDashboard);

// User dashboard endpoints
router.get('/activities', UserDashboardController.getUserActivities);
router.get('/calendar', UserDashboardController.getUserCalendarEvents);
router.get('/stats', UserDashboardController.getUserStats);

export default router;
