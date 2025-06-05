import { Router } from 'express';
import {
  getAllEnrollments,
  getEnrollmentsByWorkshop,
  getEnrollmentById,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment
} from '../../controllers/workshop/enrollment.controller';

const router = Router();

// Get all enrollments
router.get('/', getAllEnrollments);

// Get enrollments for a specific workshop
router.get('/workshop/:workshopId', getEnrollmentsByWorkshop);

// Get a single enrollment by ID
router.get('/:id', getEnrollmentById);

// Create a new enrollment
router.post('/', createEnrollment);

// Update an enrollment
router.put('/:id', updateEnrollment);

// Delete an enrollment
router.delete('/:id', deleteEnrollment);

export default router;