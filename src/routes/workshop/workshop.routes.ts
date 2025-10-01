import { Router } from 'express';
import { getAllWorkshops, getWorkshopById, createWorkshop, updateWorkshop, deleteWorkshop } from '../../controllers/workshop/workshop.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Get all workshops (public)
router.get('/', getAllWorkshops);

// Get a single workshop by ID (public)
router.get('/:id', getWorkshopById);

// Create a new workshop (protected)
router.post('/', authenticateToken, createWorkshop);

// Update a workshop (protected)
router.put('/:id', authenticateToken, updateWorkshop);

// Delete a workshop (protected)
router.delete('/:id', authenticateToken, deleteWorkshop);

export default router;
