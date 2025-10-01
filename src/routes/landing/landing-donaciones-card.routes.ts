import { Router } from 'express';
import multer from 'multer';
import {getAllLandingDonacionesCards,getLandingDonacionesCardById,createLandingDonacionesCard,updateLandingDonacionesCard,deleteLandingDonacionesCard} from '../../controllers/landing/landing-donaciones-card.controller';

const router = Router();
//import { authenticateToken } from '../../middleware/auth.middleware'; // Use your authentication middleware
const upload = multer({ dest: 'uploads/' });
//landing cards-donaciones component routes
// Public: Get all & get by ID
router.get('/', getAllLandingDonacionesCards);
router.get('/:id', getLandingDonacionesCardById);

// Protected: Create, update, delete (auth required)
// Rutas para crear/actualizar/eliminar (POST/PUT aceptan imagen)
router.post('/', upload.single('imagen'), createLandingDonacionesCard);
router.put('/:id', upload.single('imagen'), updateLandingDonacionesCard);
router.delete('/:id', deleteLandingDonacionesCard);

export default router;