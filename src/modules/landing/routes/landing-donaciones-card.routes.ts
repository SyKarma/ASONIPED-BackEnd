import { Router } from 'express';
import {getAllLandingDonacionesCards,getLandingDonacionesCardById,createLandingDonacionesCard,updateLandingDonacionesCard,deleteLandingDonacionesCard} from '../controllers/landing-donaciones-card.controller';
import { authenticateAdmin } from '../../../middleware/auth.middleware';

const router = Router();

router.get('/', getAllLandingDonacionesCards);
router.get('/:id', getLandingDonacionesCardById);

router.post('/', authenticateAdmin, createLandingDonacionesCard);
router.put('/:id', authenticateAdmin, updateLandingDonacionesCard);
router.delete('/:id', authenticateAdmin, deleteLandingDonacionesCard);

export default router;