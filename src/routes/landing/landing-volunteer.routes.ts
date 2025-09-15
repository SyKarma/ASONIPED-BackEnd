import { Router } from 'express';
import {getAllLandingVolunteers, getLandingVolunteerById,createLandingVolunteer,updateLandingVolunteer,deleteLandingVolunteer,} from '../../controllers/landing/landing-volunteer.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Public endpoints
router.get('/', getAllLandingVolunteers);
router.get('/:id', getLandingVolunteerById);

// Protected endpoints
router.post('/', authenticateToken, createLandingVolunteer);
router.put('/:id', authenticateToken, updateLandingVolunteer);
router.delete('/:id', authenticateToken, deleteLandingVolunteer);

export default router;