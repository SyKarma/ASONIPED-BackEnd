import { Router } from 'express';
import { getAllWorkshops, getWorkshopById, createWorkshop, updateWorkshop, deleteWorkshop } from '../controllers/workshop.controller';
import { getAllWorkshopEnrollments, updateWorkshopEnrollmentStatus } from '../controllers/workshop_enrollments.controller';
import { authenticateAdmin, authenticateToken } from '../../../middleware/auth.middleware';

const router = Router();

// Get all workshops (public)
router.get('/', getAllWorkshops);

// Get all workshop enrollments (admin only) - MUST be before /:id route
router.get('/enrollments', authenticateAdmin, getAllWorkshopEnrollments);

// Update workshop enrollment status (admin only)
router.put('/enrollments/:id/status', authenticateAdmin, updateWorkshopEnrollmentStatus);

// Get a single workshop by ID (public)
router.get('/:id', getWorkshopById);

// Create a new workshop (protected)
router.post('/', authenticateAdmin, createWorkshop);

// Update a workshop (protected)
router.put('/:id', authenticateAdmin, updateWorkshop);

// Delete a workshop (protected)
router.delete('/:id', authenticateAdmin, deleteWorkshop);

export default router;
