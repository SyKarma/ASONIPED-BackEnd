import { Router } from 'express';
import { authenticateToken } from '../../../middleware/auth.middleware';
import * as VolunteerRegistrationsController from '../controllers/volunteer_registrations.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Register for a volunteer option
router.post('/register', VolunteerRegistrationsController.registerForVolunteer);

// Cancel volunteer registration
router.post('/cancel', VolunteerRegistrationsController.cancelVolunteerRegistration);

// Get user's volunteer registrations
router.get('/my-registrations', VolunteerRegistrationsController.getUserRegistrations);

// Get registrations for a specific volunteer option (admin only)
router.get('/volunteer-option/:volunteer_option_id', VolunteerRegistrationsController.getVolunteerRegistrations);

// Get available spots for a volunteer option
router.get('/available-spots/:volunteer_option_id', VolunteerRegistrationsController.getAvailableSpots);

export default router;
