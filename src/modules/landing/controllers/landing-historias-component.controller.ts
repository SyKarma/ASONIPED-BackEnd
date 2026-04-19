import { Request, Response } from 'express';
import { LandingHistoriasComponentModel } from '../models/landing-historias-component.model';

export const getAllLandingHistoriasComponents = async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await LandingHistoriasComponentModel.getAll();
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Error fetching historias component' });
  }
};

export const getLandingHistoriasComponentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    const row = await LandingHistoriasComponentModel.getById(id);
    if (!row) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(row);
  } catch {
    res.status(500).json({ error: 'Error fetching historias component' });
  }
};

export const createLandingHistoriasComponent = async (req: Request, res: Response): Promise<void> => {
  const { titulo, descripcion, color_titulo } = req.body;

  if (!titulo || typeof titulo !== 'string' || titulo.length < 3 || titulo.length > 150) {
    res.status(400).json({ error: 'titulo es requerido y debe tener entre 3 y 150 caracteres' });
    return;
  }
  if (!descripcion || typeof descripcion !== 'string' || descripcion.length > 2000) {
    res.status(400).json({ error: 'descripcion es requerida y máximo 2000 caracteres' });
    return;
  }
  if (color_titulo != null && (typeof color_titulo !== 'string' || color_titulo.length > 20)) {
    res.status(400).json({ error: 'color_titulo máximo 20 caracteres' });
    return;
  }

  try {
    const id = await LandingHistoriasComponentModel.create({
      titulo,
      descripcion,
      color_titulo: typeof color_titulo === 'string' ? color_titulo : '#ea580c',
    });
    res.status(201).json({ message: 'Component created', id });
  } catch {
    res.status(500).json({ error: 'Error creating historias component' });
  }
};

export const updateLandingHistoriasComponent = async (req: Request, res: Response): Promise<void> => {
  const { titulo, descripcion, color_titulo } = req.body;

  if (!titulo || typeof titulo !== 'string' || titulo.length < 3 || titulo.length > 150) {
    res.status(400).json({ error: 'titulo es requerido y debe tener entre 3 y 150 caracteres' });
    return;
  }
  if (!descripcion || typeof descripcion !== 'string' || descripcion.length > 2000) {
    res.status(400).json({ error: 'descripcion es requerida y máximo 2000 caracteres' });
    return;
  }
  if (color_titulo != null && (typeof color_titulo !== 'string' || color_titulo.length > 20)) {
    res.status(400).json({ error: 'color_titulo máximo 20 caracteres' });
    return;
  }

  try {
    const id = parseInt(req.params.id, 10);
    await LandingHistoriasComponentModel.update(id, {
      titulo,
      descripcion,
      color_titulo: typeof color_titulo === 'string' ? color_titulo : '#ea580c',
    });
    res.json({ message: 'Component updated' });
  } catch {
    res.status(500).json({ error: 'Error updating historias component' });
  }
};

export const deleteLandingHistoriasComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    await LandingHistoriasComponentModel.delete(id);
    res.json({ message: 'Component deleted' });
  } catch {
    res.status(500).json({ error: 'Error deleting historias component' });
  }
};
