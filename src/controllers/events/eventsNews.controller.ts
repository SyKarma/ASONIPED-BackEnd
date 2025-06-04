import { Request, Response } from 'express';
import {
  getAllEventsNews,
  getEventNewsById,
  createEventNews,
  updateEventNews,
  deleteEventNews,
  EventNews
} from '../../models/events/eventsNews.model';

// Get all events/news
export const getAllEventsNewsController = async (req: Request, res: Response) => {
  try {
    const events = await getAllEventsNews();
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching events/news.' });
  }
};

// Get a single event/news by ID
export const getEventNewsByIdController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const event = await getEventNewsById(id);
    if (!event) {
      res.status(404).json({ message: 'Event/News not found' });
      return;
    }
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching event/news.' });
  }
};

// Create a new event/news
export const createEventNewsController = async (req: Request, res: Response) => {
  try {
    const { title, description, date, imageUrl } = req.body;
    if (!title || !description || !date) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }
    await createEventNews({ title, description, date, imageUrl });
    res.status(201).json({ message: 'Event/News created' });
  } catch (err) {
    res.status(500).json({ message: 'Error creating event/news.' });
  }
};

// Update an event/news
export const updateEventNewsController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title, description, date, imageUrl } = req.body;
    await updateEventNews(id, { title, description, date, imageUrl });
    res.json({ message: 'Event/News updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating event/news.' });
  }
};

// Delete an event/news
export const deleteEventNewsController = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await deleteEventNews(id);
    res.json({ message: 'Event/News deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting event/news.' });
  }
};