import { Router } from 'express';
import {getAllHeroSections,getHeroSectionById,createHeroSection,updateHeroSection,deleteHeroSection} from '../../controllers/landing/landing.controller';
import { authenticateToken } from '../../middleware/auth.middleware'; // Use your authentication middleware
import {getAllAboutSections,getAboutSectionById,createAboutSection,updateAboutSection,deleteAboutSection} from '../../controllers/landing/landing.controller';
import {getAllLandingDonacionesComponents,getLandingDonacionesComponentById,createLandingDonacionesComponent,updateLandingDonacionesComponent,deleteLandingDonacionesComponent} from '../../controllers/landing/landing.controller';
import {getAllLandingDonacionesCards,getLandingDonacionesCardById,createLandingDonacionesCard,updateLandingDonacionesCard,deleteLandingDonacionesCard} from '../../controllers/landing/landing.controller';

const router = Router();
//hero section routes
// Public: Get all sections & get one by ID (if you want it public)
router.get('/', getAllHeroSections);
router.get('/:id', getHeroSectionById);

// Protected: Create, update, delete (based on your auth)
router.post('/', authenticateToken, createHeroSection);
router.put('/:id', authenticateToken, updateHeroSection);
router.delete('/:id', authenticateToken, deleteHeroSection);


//aboutSection routes
// Public: Get all sections & get one by ID
router.get('/', getAllAboutSections);
router.get('/:id', getAboutSectionById);

// Protected: Create, update, delete
router.post('/', authenticateToken, createAboutSection);
router.put('/:id', authenticateToken, updateAboutSection);
router.delete('/:id', authenticateToken, deleteAboutSection);

//landing donaciones component routes 
// Public: Get all and get by ID
router.get('/', getAllLandingDonacionesComponents);
router.get('/:id', getLandingDonacionesComponentById);

// Protected: Create, update, delete
router.post('/', authenticateToken, createLandingDonacionesComponent);
router.put('/:id', authenticateToken, updateLandingDonacionesComponent);
router.delete('/:id', authenticateToken, deleteLandingDonacionesComponent);

//landing cards-donaciones component routes
// Public: Get all & get by ID
router.get('/', getAllLandingDonacionesCards);
router.get('/:id', getLandingDonacionesCardById);

// Protected: Create, update, delete (auth required)
router.post('/', authenticateToken, createLandingDonacionesCard);
router.put('/:id', authenticateToken, updateLandingDonacionesCard);
router.delete('/:id', authenticateToken, deleteLandingDonacionesCard);

export default router;