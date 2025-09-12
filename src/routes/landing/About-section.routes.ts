import { Router } from 'express';//aboutSection routes
import { authenticateToken } from '../../middleware/auth.middleware'; // Use your authentication middleware
import {getAllAboutSections,getAboutSectionById,createAboutSection,updateAboutSection,deleteAboutSection} from '../../controllers/landing/About-section.controller';


const router = Router();

// Public: Get all sections & get one by ID
router.get('/', getAllAboutSections);
router.get('/:id', getAboutSectionById);

// Protected: Create, update, delete
router.post('/', authenticateToken, createAboutSection);
router.put('/:id', authenticateToken, updateAboutSection);
router.delete('/:id', authenticateToken, deleteAboutSection);

export default router;