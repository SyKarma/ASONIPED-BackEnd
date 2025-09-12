import { Router } from 'express';
import {getAllHeroSections,getHeroSectionById,createHeroSection,updateHeroSection,deleteHeroSection} from '../../controllers/landing/Hero-section.controller';
import { authenticateToken } from '../../middleware/auth.middleware'; // Use your authentication middleware

const router = Router();
//hero section routes
// Public: Get all sections & get one by ID (if you want it public)
router.get('/', getAllHeroSections);
router.get('/:id', getHeroSectionById);

// Protected: Create, update, delete (based on your auth)
router.post('/', authenticateToken, createHeroSection);
router.put('/:id', authenticateToken, updateHeroSection);
router.delete('/:id', authenticateToken, deleteHeroSection);

export default router;