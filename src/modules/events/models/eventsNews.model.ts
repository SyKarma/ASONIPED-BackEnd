import { db } from '../../../db';

export interface EventNews {
  id?: number;
  title: string;
  description: string;
  date: string;
  imageUrl?: string;
  type?: 'evento' | 'noticia';
}

// Get all events/news
export const getAllEventsNews = async (): Promise<EventNews[]> => {
  const [rows] = await db.query('SELECT * FROM events_news');
  return rows as EventNews[];
};

// Get a single event/news by ID
export const getEventNewsById = async (id: number): Promise<EventNews | null> => {
  const [rows] = await db.query('SELECT * FROM events_news WHERE id = ?', [id]);
  const events = rows as EventNews[];
  return events.length > 0 ? events[0] : null;
};

// Create a new event/news
export const createEventNews = async (event: Omit<EventNews, 'id'>): Promise<void> => {
  await db.query(
    `INSERT INTO events_news (title, description, date, imageUrl, type) VALUES (?, ?, ?, ?, ?)` ,
    [event.title, event.description, event.date, event.imageUrl, event.type || 'evento']
  );
};

// Update an event/news
export const updateEventNews = async (id: number, event: Omit<EventNews, 'id'>): Promise<void> => {
  await db.query(
    `UPDATE events_news SET title=?, description=?, date=?, imageUrl=?, type=? WHERE id=?`,
    [event.title, event.description, event.date, event.imageUrl, event.type || 'evento', id]
  );
};

// Delete an event/news
export const deleteEventNews = async (id: number): Promise<void> => {
  await db.query('DELETE FROM events_news WHERE id=?', [id]);
};