import { Router } from 'express';
import {getAllLandingDonacionesCards,getLandingDonacionesCardById,createLandingDonacionesCard,updateLandingDonacionesCard,deleteLandingDonacionesCard} from '../controllers/landing-donaciones-card.controller';
import { authenticateAdmin } from '../../../middleware/auth.middleware';
import { uploadSingleDocument, handleUploadError } from '../../../middleware/upload.middleware';

const router = Router();

router.get('/', getAllLandingDonacionesCards);
router.get('/:id', getLandingDonacionesCardById);

router.post('/', authenticateAdmin, uploadSingleDocument, handleUploadError, createLandingDonacionesCard);
router.put('/:id', authenticateAdmin, uploadSingleDocument, handleUploadError, updateLandingDonacionesCard);
router.delete('/:id', authenticateAdmin, deleteLandingDonacionesCard);

export default router;