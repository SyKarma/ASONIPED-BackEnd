import { Router } from 'express';
import { authenticateToken } from '../../../middleware/auth.middleware';
import * as WorkshopEnrollmentsController from '../controllers/workshop_enrollments.controller';

const router = Router();

// Public routes (no authentication required)
// Get available spots for a workshop
router.get('/available-spots/:workshop_id', WorkshopEnrollmentsController.getAvailableSpots);

// All other routes require authentication
router.use(authenticateToken);

// Register for a workshop
router.post('/register', WorkshopEnrollmentsController.registerForWorkshop);

// Cancel workshop enrollment
router.post('/cancel', WorkshopEnrollmentsController.cancelWorkshopEnrollment);

// Get user's workshop enrollments
router.get('/my-enrollments', WorkshopEnrollmentsController.getUserEnrollments);

// Get enrollments for a specific workshop (admin only)
router.get('/workshop/:workshop_id', WorkshopEnrollmentsController.getWorkshopEnrollments);

export default router;
