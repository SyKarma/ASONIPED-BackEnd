import { Router } from 'express';
//import { authenticateToken } from '../../middleware/auth.middleware'; // Use your authentication middleware
import {getAllLandingDonacionesComponents,getLandingDonacionesComponentById,createLandingDonacionesComponent,updateLandingDonacionesComponent,deleteLandingDonacionesComponent} from '../../controllers/landing/landing-donaciones-componet.controller';


const router = Router();

//landing donaciones component routes 
// Public: Get all and get by ID
router.get('/', getAllLandingDonacionesComponents);
router.get('/:id', getLandingDonacionesComponentById);

// Protected: Create, update, delete
router.post('/', createLandingDonacionesComponent);
router.put('/:id', updateLandingDonacionesComponent);
router.delete('/:id', deleteLandingDonacionesComponent);


export default router;