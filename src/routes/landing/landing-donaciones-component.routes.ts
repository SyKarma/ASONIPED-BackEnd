import { Router } from 'express';
import { authenticateToken } from '../../middleware/auth.middleware'; // Use your authentication middleware
import {getAllLandingDonacionesComponents,getLandingDonacionesComponentById,createLandingDonacionesComponent,updateLandingDonacionesComponent,deleteLandingDonacionesComponent} from '../../controllers/landing/landing.controller';
import {getAllLandingDonacionesCards,getLandingDonacionesCardById,createLandingDonacionesCard,updateLandingDonacionesCard,deleteLandingDonacionesCard} from '../../controllers/landing/landing.controller';

const router = Router();

//landing donaciones component routes 
// Public: Get all and get by ID
router.get('/', getAllLandingDonacionesComponents);
router.get('/:id', getLandingDonacionesComponentById);

// Protected: Create, update, delete
router.post('/', authenticateToken, createLandingDonacionesComponent);
router.put('/:id', authenticateToken, updateLandingDonacionesComponent);
router.delete('/:id', authenticateToken, deleteLandingDonacionesComponent);

//landing cards-donaciones component routes
// Public: Get all & get by ID
router.get('/', getAllLandingDonacionesCards);
router.get('/:id', getLandingDonacionesCardById);

// Protected: Create, update, delete (auth required)
router.post('/', authenticateToken, createLandingDonacionesCard);
router.put('/:id', authenticateToken, updateLandingDonacionesCard);
router.delete('/:id', authenticateToken, deleteLandingDonacionesCard);

export default router;