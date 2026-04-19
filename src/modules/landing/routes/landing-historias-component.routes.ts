import { Router } from 'express';
import {
  getAllLandingHistoriasComponents,
  getLandingHistoriasComponentById,
  createLandingHistoriasComponent,
  updateLandingHistoriasComponent,
  deleteLandingHistoriasComponent,
} from '../controllers/landing-historias-component.controller';
import { authenticateAdmin } from '../../../middleware/auth.middleware';

const router = Router();

router.get('/', getAllLandingHistoriasComponents);
router.get('/:id', getLandingHistoriasComponentById);
router.post('/', authenticateAdmin, createLandingHistoriasComponent);
router.put('/:id', authenticateAdmin, updateLandingHistoriasComponent);
router.delete('/:id', authenticateAdmin, deleteLandingHistoriasComponent);

export default router;
