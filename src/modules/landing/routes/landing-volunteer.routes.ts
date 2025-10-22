import { Router } from 'express';
import {getAllLandingVolunteers, getLandingVolunteerById,createLandingVolunteer,updateLandingVolunteer,deleteLandingVolunteer,} from '../../landing/controllers/landing-volunteer.controller';
import { authenticateAdmin } from '../../../middleware/auth.middleware';

const router = Router();

// Public endpoints
router.get('/', getAllLandingVolunteers);
router.get('/:id', getLandingVolunteerById);

// Admin only: Create, update, delete
router.post('/', authenticateAdmin, createLandingVolunteer);
router.put('/:id', authenticateAdmin, updateLandingVolunteer);
router.delete('/:id', authenticateAdmin, deleteLandingVolunteer);

export default router; 