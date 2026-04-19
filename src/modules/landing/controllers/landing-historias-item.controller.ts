import { Request, Response } from 'express';
import { LandingHistoriasItemModel } from '../models/landing-historias-item.model';

const isValidOptionalUrl = (s: string | null | undefined): boolean => {
  if (s == null || s === '') return true;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

export const getAllLandingHistoriasItems = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await LandingHistoriasItemModel.getAll();
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error fetching historias items' });
  }
};

export const getLandingHistoriasItemById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await LandingHistoriasItemModel.getById(id);
    if (!row) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(row);
  } catch {
    res.status(500).json({ error: 'Error fetching historias item' });
  }
};

export const createLandingHistoriasItem = async (req: Request, res: Response): Promise<void> => {
  const { nombre, historia, video_url, orden } = req.body;

  if (!nombre || typeof nombre !== 'string' || nombre.length < 1 || nombre.length > 255) {
    res.status(400).json({ error: 'nombre es requerido y máximo 255 caracteres' });
    return;
  }
  if (!historia || typeof historia !== 'string' || historia.length < 1 || historia.length > 8000) {
    res.status(400).json({ error: 'historia es requerida y máximo 8000 caracteres' });
    return;
  }
  if (video_url != null && video_url !== '' && (typeof video_url !== 'string' || video_url.length > 500)) {
    res.status(400).json({ error: 'video_url máximo 500 caracteres' });
    return;
  }
  if (video_url && !isValidOptionalUrl(video_url)) {
    res.status(400).json({ error: 'video_url debe ser una URL http(s) válida' });
    return;
  }
  const ord = typeof orden === 'number' ? orden : parseInt(String(orden ?? 0), 10) || 0;

  try {
    const id = await LandingHistoriasItemModel.create({
      nombre,
      historia,
      video_url: video_url || null,
      orden: ord,
    });
    res.status(201).json({ message: 'Item created', id });
  } catch {
    res.status(500).json({ error: 'Error creating historias item' });
  }
};

export const updateLandingHistoriasItem = async (req: Request, res: Response): Promise<void> => {
  const { nombre, historia, video_url, orden } = req.body;

  if (!nombre || typeof nombre !== 'string' || nombre.length < 1 || nombre.length > 255) {
    res.status(400).json({ error: 'nombre es requerido y máximo 255 caracteres' });
    return;
  }
  if (!historia || typeof historia !== 'string' || historia.length < 1 || historia.length > 8000) {
    res.status(400).json({ error: 'historia es requerida y máximo 8000 caracteres' });
    return;
  }
  if (video_url != null && video_url !== '' && (typeof video_url !== 'string' || video_url.length > 500)) {
    res.status(400).json({ error: 'video_url máximo 500 caracteres' });
    return;
  }
  if (video_url && !isValidOptionalUrl(video_url)) {
    res.status(400).json({ error: 'video_url debe ser una URL http(s) válida' });
    return;
  }
  const ord = typeof orden === 'number' ? orden : parseInt(String(orden ?? 0), 10) || 0;

  try {
    const id = parseInt(req.params.id, 10);
    await LandingHistoriasItemModel.update(id, {
      nombre,
      historia,
      video_url: video_url || null,
      orden: ord,
    });
    res.json({ message: 'Item updated' });
  } catch {
    res.status(500).json({ error: 'Error updating historias item' });
  }
};

export const deleteLandingHistoriasItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await LandingHistoriasItemModel.delete(id);
    res.json({ message: 'Item deleted' });
  } catch {
    res.status(500).json({ error: 'Error deleting historias item' });
  }
};
