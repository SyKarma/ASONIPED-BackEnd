import { Router } from 'express';
import multer from 'multer';
import {getAllLandingDonacionesCards,getLandingDonacionesCardById,createLandingDonacionesCard,updateLandingDonacionesCard,deleteLandingDonacionesCard} from '../controllers/landing-donaciones-card.controller';
import { authenticateAdmin } from '../../../middleware/auth.middleware';

const router = Router();
const upload = multer({ dest: 'uploads/' });

router.get('/', getAllLandingDonacionesCards);
router.get('/:id', getLandingDonacionesCardById);


router.post('/', upload.single('imagen'), authenticateAdmin, createLandingDonacionesCard);
router.put('/:id', upload.single('imagen'), authenticateAdmin, updateLandingDonacionesCard);
router.delete('/:id', authenticateAdmin, deleteLandingDonacionesCard);

export default router;