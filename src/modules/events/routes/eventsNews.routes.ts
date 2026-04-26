import { Router } from 'express';
import {getAllEventsNewsController, getEventNewsByIdController, createEventNewsController, updateEventNewsController, deleteEventNewsController} from '../controllers/eventsNews.controller';
import { authenticateAdmin, authenticateToken } from '../../../middleware/auth.middleware';

const router = Router();
router.get('/', getAllEventsNewsController);
router.get('/:id', getEventNewsByIdController);
router.post('/', authenticateAdmin, createEventNewsController);
router.put('/:id', authenticateAdmin, updateEventNewsController);
router.delete('/:id', authenticateAdmin, deleteEventNewsController);

export default router;