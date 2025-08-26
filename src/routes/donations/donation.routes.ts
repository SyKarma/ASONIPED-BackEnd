import { Router } from 'express';
import * as DonationController from '../../controllers/donations/donation.controller';
import { authenticateAdmin } from '../../middleware/auth.middleware';

const router = Router();

// List all donations
router.get('/', DonationController.getDonations);

// Get a single donation by ID
router.get('/:id', DonationController.getDonationById);

// Create a new donation (public)
router.post('/', DonationController.addDonation);


// Delete a donation (admin)
router.delete('/:id', authenticateAdmin, DonationController.deleteDonation);

export default router;