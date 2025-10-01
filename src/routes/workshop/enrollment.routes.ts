import { Router } from 'express';
import { getAllEnrollments, getEnrollmentsByWorkshop, getEnrollmentById, createEnrollment, updateEnrollment, deleteEnrollment} from '../../controllers/workshop/enrollment.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Get all enrollments (admin only)
router.get('/', authenticateToken, getAllEnrollments);

// Get enrollments for a specific workshop (admin only)
router.get('/workshop/:workshopId', authenticateToken, getEnrollmentsByWorkshop);

// Get a single enrollment by ID (admin only)
router.get('/:id', authenticateToken, getEnrollmentById);

// Create a new enrollment (public)
router.post('/', createEnrollment);

// Update an enrollment (admin only)
router.put('/:id', authenticateToken, updateEnrollment);

// Delete an enrollment (admin only)
router.delete('/:id', authenticateToken, deleteEnrollment);

export default router;