import { Router } from 'express';
import { getAllWorkshops, getWorkshopById, createWorkshop, updateWorkshop, deleteWorkshop } from '../../controllers/workshop/workshop.controller';
import { getAllWorkshopEnrollments, updateWorkshopEnrollmentStatus } from '../../controllers/workshop/workshop_enrollments.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Get all workshops (public)
router.get('/', getAllWorkshops);

// Get all workshop enrollments (admin only) - MUST be before /:id route
router.get('/enrollments', authenticateToken, getAllWorkshopEnrollments);

// Update workshop enrollment status (admin only)
router.put('/enrollments/:id/status', authenticateToken, updateWorkshopEnrollmentStatus);

// Get a single workshop by ID (public)
router.get('/:id', getWorkshopById);

// Create a new workshop (protected)
router.post('/', authenticateToken, createWorkshop);

// Update a workshop (protected)
router.put('/:id', authenticateToken, updateWorkshop);

// Delete a workshop (protected)
router.delete('/:id', authenticateToken, deleteWorkshop);

export default router;
