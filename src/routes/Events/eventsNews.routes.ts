import { Router } from 'express';
import {
  getAllEventsNewsController,
  getEventNewsByIdController,
  createEventNewsController,
  updateEventNewsController,
  deleteEventNewsController,
} from '../../controllers/events/eventsNews.controller';
import { authenticateToken } from '../../middleware/auth.middleware';

const router = Router();

// GET all events/news
router.get('/', getAllEventsNewsController);

// GET a single event/news by ID
router.get('/:id', getEventNewsByIdController);

// POST create a new event/news (protected)
router.post('/', authenticateToken, createEventNewsController);

// PUT update an event/news (protected)
router.put('/:id', authenticateToken, updateEventNewsController);

// DELETE an event/news (protected)
router.delete('/:id', authenticateToken, deleteEventNewsController);

export default router;