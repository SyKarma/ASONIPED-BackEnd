import { Router } from 'express';
import { TicketMessageController } from '../controllers/ticket_message.controller';
import { authenticateToken } from '../../../middleware/auth.middleware';

const router = Router();

// Rutas públicas
router.post('/', TicketMessageController.create);

// Rutas protegidas
router.get('/', authenticateToken, TicketMessageController.getAll); // Admin
router.get('/ticket/:ticketId', authenticateToken, TicketMessageController.getByTicketId);
router.get('/donation/:ticketId', authenticateToken, TicketMessageController.getByDonationTicketId);
router.delete('/:id', authenticateToken, TicketMessageController.delete);

export default router;
