import { Router } from 'express';
import * as VolunteerOptionController from '../../controllers/volunteer/volunteer_options.controller';
import { authenticateAdmin } from '../../middleware/auth.middleware'; // protect routes

const router = Router();

// Get all volunteer options
router.get('/', VolunteerOptionController.getVolunteerOptions);

// Add a new volunteer option (protected)
router.post('/', authenticateAdmin, VolunteerOptionController.addVolunteerOption);

// Update a volunteer option (protected)
router.put('/:id', authenticateAdmin, VolunteerOptionController.updateVolunteerOption);

// Delete a volunteer option (protected)
router.delete('/:id', authenticateAdmin, VolunteerOptionController.deleteVolunteerOption);

export default router;