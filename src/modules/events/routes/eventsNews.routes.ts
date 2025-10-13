import { Router } from 'express';
import {getAllEventsNewsController, getEventNewsByIdController, createEventNewsController, updateEventNewsController, deleteEventNewsController} from '../controllers/eventsNews.controller';
import { authenticateToken } from '../../../middleware/auth.middleware';

const router = Router();
router.get('/', getAllEventsNewsController);
router.get('/:id', getEventNewsByIdController);
router.post('/', authenticateToken, createEventNewsController);
router.put('/:id', authenticateToken, updateEventNewsController);
router.delete('/:id', authenticateToken, deleteEventNewsController);

export default router;