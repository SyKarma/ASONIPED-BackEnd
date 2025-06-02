import { Router } from 'express';
import * as VolunteerController from '../controllers/volunteer_forms.controller';
import { authenticateAdmin } from '../middleware/auth.middleware'; 

const router = Router();

// List volunteers (with pagination/filtering)
router.get('/', VolunteerController.getVolunteers);

// Get a single volunteer by ID
router.get('/:id', VolunteerController.getVolunteerById);

// Create a new volunteer
router.post('/', VolunteerController.addVolunteer);

// Update a volunteer (protected)
router.put('/:id', authenticateAdmin, VolunteerController.updateVolunteer);

// Delete a volunteer (protected)
router.delete('/:id', authenticateAdmin,  VolunteerController.deleteVolunteer);

export default router;