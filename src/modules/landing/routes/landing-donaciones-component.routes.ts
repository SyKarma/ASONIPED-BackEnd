import { Router } from 'express';
import {getAllLandingDonacionesComponents,getLandingDonacionesComponentById,createLandingDonacionesComponent,updateLandingDonacionesComponent,deleteLandingDonacionesComponent} from '../controllers/landing-donaciones-componet.controller';
import { authenticateAdmin } from '../../../middleware/auth.middleware';

const router = Router();

//landing donaciones component routes 
// Public: Get all and get by ID
router.get('/', getAllLandingDonacionesComponents);
router.get('/:id', getLandingDonacionesComponentById);

// Admin only: Create, update, delete
router.post('/', authenticateAdmin, createLandingDonacionesComponent);
router.put('/:id', authenticateAdmin, updateLandingDonacionesComponent);
router.delete('/:id', authenticateAdmin, deleteLandingDonacionesComponent);


export default router;