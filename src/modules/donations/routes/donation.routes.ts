import { Router } from 'express';
import * as DonationController from '../controllers/donation.controller';
import { authenticateAdmin, authenticateToken } from '../../../middleware/auth.middleware';


const optionalAuth = (req: any, res: any, next: any) => {
  
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
   
    authenticateToken(req, res, next);
  } else {
 
    req.user = null;
    next();
  }
};

const router = Router();
router.get('/', DonationController.getDonations);
router.get('/:id', DonationController.getDonationById);
router.post('/', optionalAuth, DonationController.addDonation);
router.delete('/:id', authenticateAdmin, DonationController.deleteDonation);

export default router;