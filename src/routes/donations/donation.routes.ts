import { Router } from 'express';
import * as DonationController from '../../controllers/donations/donation.controller';
import { authenticateAdmin, authenticateToken } from '../../middleware/auth.middleware';

// Custom middleware for optional authentication
const optionalAuth = (req: any, res: any, next: any) => {
  // Try to authenticate, but don't fail if no token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // If token exists, try to authenticate
    authenticateToken(req, res, next);
  } else {
    // No token, continue without authentication
    req.user = null;
    next();
  }
};

const router = Router();

// List all donations
router.get('/', DonationController.getDonations);

// Get a single donation by ID
router.get('/:id', DonationController.getDonationById);

// Create a new donation (allows both authenticated and anonymous users)
router.post('/', optionalAuth, DonationController.addDonation);

// Delete a donation (admin)
router.delete('/:id', authenticateAdmin, DonationController.deleteDonation);

export default router;