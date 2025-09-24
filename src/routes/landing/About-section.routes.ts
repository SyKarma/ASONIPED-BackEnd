import { Router } from 'express';//aboutSection routes
import {getAllAboutSections,getAboutSectionById,createAboutSection,updateAboutSection,deleteAboutSection} from '../../controllers/landing/About-section.controller';


const router = Router();

// Public: Get all sections & get one by ID
router.get('/', getAllAboutSections);
router.get('/:id', getAboutSectionById);

// Public: Create, update, delete (temporarily public)
router.post('/', createAboutSection);
router.put('/:id', updateAboutSection);
router.delete('/:id', deleteAboutSection);

export default router;