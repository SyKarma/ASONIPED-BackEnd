import { Request, Response } from 'express';
import { LandingDonacionesComponentModel } from '../models/landing-donaciones-component.model';

export const getAllLandingDonacionesComponents = async (req: Request, res: Response): Promise<void> => {
  try {
    const components = await LandingDonacionesComponentModel.getAll();
    res.json(components);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching components' });
  }
};

// Get component by ID
export const getLandingDonacionesComponentById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const component = await LandingDonacionesComponentModel.getById(id);
    if (!component) {
      res.status(404).json({ error: 'Component not found' });
      return;
    }
    res.json(component);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching component' });
  }
};

// Create component
export const createLandingDonacionesComponent = async (req: Request, res: Response): Promise<void> => {
   const { titulo, descripcion } = req.body;

  if (!titulo || typeof titulo !== "string" || titulo.length < 3 || titulo.length > 150) {
    res.status(400).json({ error: "titulo es requerido y debe tener entre 3 y 150 caracteres" });
    return;
  }
  if (!descripcion || typeof descripcion !== "string" || descripcion.length > 2000) {
    res.status(400).json({ error: "descripcion es requerida y máximo 2000 caracteres" });
    return;
  }

// CRUD 
  try {
    const id = await LandingDonacionesComponentModel.create(req.body);
    res.status(201).json({ message: 'Component created', id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating component' });
  }
};

// Update component
export const updateLandingDonacionesComponent = async (req: Request, res: Response): Promise<void> => {
  const { titulo, descripcion } = req.body;

  if (!titulo || typeof titulo !== "string" || titulo.length < 3 || titulo.length > 150) {
    res.status(400).json({ error: "titulo es requerido y debe tener entre 3 y 150 caracteres" });
    return;
  }
  if (!descripcion || typeof descripcion !== "string" || descripcion.length > 2000) {
    res.status(400).json({ error: "descripcion es requerida y máximo 2000 caracteres" });
    return;
  }

 // CRUD 
  try {
    const id = parseInt(req.params.id);
    await LandingDonacionesComponentModel.update(id, req.body);
    res.json({ message: 'Component updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating component' });
  }
};

// Delete component
export const deleteLandingDonacionesComponent = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await LandingDonacionesComponentModel.delete(id);
    res.json({ message: 'Component deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting component' });
  }
};
