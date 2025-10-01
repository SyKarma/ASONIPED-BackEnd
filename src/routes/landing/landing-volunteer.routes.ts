import { Router } from 'express';
import {getAllLandingVolunteers, getLandingVolunteerById,createLandingVolunteer,updateLandingVolunteer,deleteLandingVolunteer,} from '../../controllers/landing/landing-volunteer.controller';

const router = Router();

// Public endpoints
router.get('/', getAllLandingVolunteers);
router.get('/:id', getLandingVolunteerById);

// Make editable for now (public like hero/about)
router.post('/', createLandingVolunteer);
router.put('/:id', updateLandingVolunteer);
router.delete('/:id', deleteLandingVolunteer);

export default router; 