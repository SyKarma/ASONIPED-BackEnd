import { Router } from 'express';
import * as AboutSectionController from '../controllers/About-section.controller';
import { authenticateAdmin } from '../../../middleware/auth.middleware';

const router = Router();

// Public: Get all sections & get one by ID
router.get('/', AboutSectionController.getAllAboutSections);
router.get('/:id', AboutSectionController.getAboutSectionById);

// Admin only: Create, update, delete
router.post('/', authenticateAdmin, AboutSectionController.createAboutSection);
router.put('/:id', authenticateAdmin, AboutSectionController.updateAboutSection);
router.delete('/:id', authenticateAdmin, AboutSectionController.deleteAboutSection);

export default router;