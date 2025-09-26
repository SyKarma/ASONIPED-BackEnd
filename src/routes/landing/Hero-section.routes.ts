import { Router } from 'express';
import {getAllHeroSections,getHeroSectionById,createHeroSection,updateHeroSection,deleteHeroSection} from '../../controllers/landing/Hero-section.controller';
import { authenticateToken } from '../../middleware/auth.middleware'; // Use your authentication middleware

const router = Router();
//hero section routes
// Public: Get all sections & get one by ID (if you want it public)
router.get('/', getAllHeroSections);
router.get('/:id', getHeroSectionById);

// Public: Create, update, delete (landing content should be editable)
router.post('/', createHeroSection);
router.put('/:id', updateHeroSection);
router.delete('/:id', deleteHeroSection);

export default router;