import { Router } from 'express';
import {getAllHeroSections,getHeroSectionById,createHeroSection,updateHeroSection,deleteHeroSection} from '../controllers/Hero-section.controller';
import { authenticateAdmin } from '../../../middleware/auth.middleware';

const router = Router();
//hero section routes
// Public: Get all sections & get one by ID
router.get('/', getAllHeroSections);
router.get('/:id', getHeroSectionById);

// Admin only: Create, update, delete
router.post('/', authenticateAdmin, createHeroSection);
router.put('/:id', authenticateAdmin, updateHeroSection);
router.delete('/:id', authenticateAdmin, deleteHeroSection);

export default router;