import { Router } from 'express';
import * as VolunteerOptionController from '../controllers/volunteer_options.controller';
import { authenticateAdmin, authenticateToken } from '../../../middleware/auth.middleware'; // protect routes
import { uploadSingleDocument, handleUploadError } from '../../../middleware/upload.middleware';

const router = Router();

// Get all volunteer options (optional auth for user-specific registration status)
router.get('/', VolunteerOptionController.getVolunteerOptions);

// Add a new volunteer option (protected) - now accepts Cloudinary URLs
router.post('/', authenticateAdmin, VolunteerOptionController.addVolunteerOption);

// Update a volunteer option (protected) - now accepts Cloudinary URLs
router.put('/:id', authenticateAdmin, VolunteerOptionController.updateVolunteerOption);

// Delete a volunteer option (protected)
router.delete('/:id', authenticateAdmin, VolunteerOptionController.deleteVolunteerOption);

// Authenticated: submit a volunteer option proposal with optional file
router.post('/proposals', authenticateToken, uploadSingleDocument, handleUploadError, VolunteerOptionController.addVolunteerProposal);

// Authenticated: list my proposals
router.get('/proposals/mine', authenticateToken, VolunteerOptionController.getMyProposals);

// Admin: list all proposals
router.get('/proposals', authenticateAdmin, VolunteerOptionController.getAllProposals);

// Admin: approve/reject proposal
router.post('/proposals/:id/status', authenticateAdmin, VolunteerOptionController.setProposalStatus);

// Authenticated: delete my own proposal
router.delete('/proposals/:id', authenticateToken, VolunteerOptionController.deleteMyProposal);

export default router;