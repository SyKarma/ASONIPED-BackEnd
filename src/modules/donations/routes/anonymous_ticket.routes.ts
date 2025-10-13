import { Router } from 'express';
import { AnonymousTicketController } from '../controllers/anonymous_ticket.controller';
import { authenticateToken } from '../../../middleware/auth.middleware';

const router = Router();

// Public routes (no authentication required)
router.post('/', AnonymousTicketController.create);
router.get('/:ticketId', AnonymousTicketController.getByTicketId);
router.get('/:ticketId/messages', AnonymousTicketController.getMessages);
router.post('/:ticketId/messages', AnonymousTicketController.sendMessage);

// Protected routes (admin only)
router.get('/', authenticateToken, AnonymousTicketController.getAll);
router.get('/id/:id', authenticateToken, AnonymousTicketController.getById);
router.put('/:id', authenticateToken, AnonymousTicketController.update);
router.patch('/:id/close', authenticateToken, AnonymousTicketController.close);
router.patch('/:id/archive', authenticateToken, AnonymousTicketController.archive);

export default router;
