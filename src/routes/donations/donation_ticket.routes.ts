import { Router } from 'express';
import { DonationTicketController } from '../../controllers/donations/donation_ticket.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// Rutas públicas
router.post('/', DonationTicketController.create);

// Rutas protegidas
router.get('/', authenticateToken, DonationTicketController.getAll); // Admin
router.get('/user/:userId', authenticateToken, DonationTicketController.getByUserId);
router.get('/:id', authenticateToken, DonationTicketController.getById);
router.put('/:id', authenticateToken, DonationTicketController.update);
router.patch('/:id/close', authenticateToken, DonationTicketController.close);
router.patch('/:id/archive', authenticateToken, DonationTicketController.archive);

export default router;
