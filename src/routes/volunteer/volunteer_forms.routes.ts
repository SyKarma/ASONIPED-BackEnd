import { Router } from 'express';
import * as VolunteerController from '../../controllers/volunteer/volunteer_forms.controller';
import { authenticateAdmin, authenticateToken } from '../../middleware/auth.middleware'; 

const router = Router();

// List volunteers (with pagination/filtering)
router.get('/', VolunteerController.getVolunteers);

// IMPORTANT: define specific routes BEFORE parameterized routes
// Get current user's enrollments
router.get('/me', authenticateToken, VolunteerController.getMyEnrollments);

// Enroll current user into a volunteer option
router.post('/enroll/:optionId', authenticateToken, VolunteerController.enrollCurrentUser);

// Get a single volunteer by ID
router.get('/:id', VolunteerController.getVolunteerById);

// Create a new volunteer
router.post('/', VolunteerController.addVolunteer);

// Update a volunteer (protected)
router.put('/:id', authenticateAdmin, VolunteerController.updateVolunteer);

// Delete a volunteer (protected)
router.delete('/:id', authenticateAdmin,  VolunteerController.deleteVolunteer);


// Get current user's enrollments
router.get('/me', authenticateToken, VolunteerController.getMyEnrollments);

export default router;