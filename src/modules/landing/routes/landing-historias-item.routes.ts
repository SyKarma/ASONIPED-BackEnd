import { Router } from 'express';
import {
  getAllLandingHistoriasItems,
  getLandingHistoriasItemById,
  createLandingHistoriasItem,
  updateLandingHistoriasItem,
  deleteLandingHistoriasItem,
} from '../controllers/landing-historias-item.controller';
import { authenticateAdmin } from '../../../middleware/auth.middleware';

const router = Router();

router.get('/', getAllLandingHistoriasItems);
router.get('/:id', getLandingHistoriasItemById);
router.post('/', authenticateAdmin, createLandingHistoriasItem);
router.put('/:id', authenticateAdmin, updateLandingHistoriasItem);
router.delete('/:id', authenticateAdmin, deleteLandingHistoriasItem);

export default router;
