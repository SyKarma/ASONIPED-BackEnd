import { Router } from 'express';
import {getAllLandingDonacionesCards,getLandingDonacionesCardById,createLandingDonacionesCard,updateLandingDonacionesCard,deleteLandingDonacionesCard} from '../../controllers/landing/landing-donaciones-card.controller';

const router = Router();
import { authenticateToken } from '../../middleware/auth.middleware'; // Use your authentication middleware

//landing cards-donaciones component routes
// Public: Get all & get by ID
router.get('/', getAllLandingDonacionesCards);
router.get('/:id', getLandingDonacionesCardById);

// Protected: Create, update, delete (auth required)
router.post('/', authenticateToken, createLandingDonacionesCard);
router.put('/:id', authenticateToken, updateLandingDonacionesCard);
router.delete('/:id', authenticateToken, deleteLandingDonacionesCard);

export default router;