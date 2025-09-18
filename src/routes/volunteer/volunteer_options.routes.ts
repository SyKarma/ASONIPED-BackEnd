import { Router } from 'express';
import * as VolunteerOptionController from '../../controllers/volunteer/volunteer_options.controller';
import { authenticateAdmin, authenticateToken } from '../../middleware/auth.middleware'; // protect routes
import { uploadSingleDocument, handleUploadError } from '../../middleware/upload.middleware';

const router = Router();

// Get all volunteer options
router.get('/', VolunteerOptionController.getVolunteerOptions);

// Add a new volunteer option (protected)
router.post('/', authenticateAdmin, VolunteerOptionController.addVolunteerOption);

// Update a volunteer option (protected)
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

export default router;