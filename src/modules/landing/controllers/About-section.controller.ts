import { Request, Response } from 'express';
import { AboutSectionModel } from '../models/About-section.model';

// Función utilitaria para validar URLs
function isValidUrl(url: string): boolean {
  try { new URL(url); return true;} catch {return false;}
}

// Get all AboutSections
export const getAllAboutSections = async (req: Request, res: Response): Promise<void> => {
  try {
    const sections = await AboutSectionModel.getAll();
    res.json(sections);
  } catch (err) {
    console.error('❌ Error fetching AboutSections:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error('❌ Error stack:', errorStack);
    res.status(500).json({ 
      error: 'Error fetching AboutSections',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

// Get AboutSection by ID
export const getAboutSectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const section = await AboutSectionModel.getById(id);
    if (!section) {
      res.status(404).json({ error: 'AboutSection not found' });
      return;
    }
    res.json(section);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching AboutSection' });
  }
};



// Create new AboutSection WITH VALIDATION  
export const createAboutSection = async (req: Request, res: Response): Promise<void> => {
  const { titulo, URL_imagen, descripcion, texto_boton, color_boton } = req.body;

  if (!titulo || typeof titulo !== "string" || titulo.length < 3 || titulo.length > 255) {
    res.status(400).json({ error: "titulo es requerido y debe tener entre 3 y 255 caracteres" });
    return;
  }
  if (!URL_imagen || typeof URL_imagen !== "string" || URL_imagen.length > 255 || !isValidUrl(URL_imagen)) {
    res.status(400).json({ error: "URL_imagen es requerida, válida y máximo 255 caracteres" });
    return;
  }
  if (!descripcion || typeof descripcion !== "string" || descripcion.length > 2000) {
    res.status(400).json({ error: "descripcion es requerida y máximo 2000 caracteres" });
    return;
  }
  if (!texto_boton || typeof texto_boton !== "string" || texto_boton.length < 1 || texto_boton.length > 100) {
    res.status(400).json({ error: "texto_boton es requerido y debe tener entre 1 y 100 caracteres" });
    return;
  }
  if (!color_boton || typeof color_boton !== "string" || color_boton.length > 20) {
    res.status(400).json({ error: "color_boton es requerido y máximo 20 caracteres" });
    return;
  }

  // CRUD 
  try {
    const id = await AboutSectionModel.create(req.body);
    res.status(201).json({ message: 'AboutSection created', id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating AboutSection' });
  }
};

// Update AboutSection WITH VALIDATION
export const updateAboutSection = async (req: Request, res: Response): Promise<void> => {
  const { titulo, URL_imagen, descripcion, texto_boton, color_boton } = req.body;

  if (!titulo || typeof titulo !== "string" || titulo.length < 3 || titulo.length > 255) {
    res.status(400).json({ error: "titulo es requerido y debe tener entre 3 y 255 caracteres" });
    return;
  }
  if (!URL_imagen || typeof URL_imagen !== "string" || URL_imagen.length > 255 || !isValidUrl(URL_imagen)) {
    res.status(400).json({ error: "URL_imagen es requerida, válida y máximo 255 caracteres" });
    return;
  }
  if (!descripcion || typeof descripcion !== "string" || descripcion.length > 2000) {
    res.status(400).json({ error: "descripcion es requerida y máximo 2000 caracteres" });
    return;
  }
  if (!texto_boton || typeof texto_boton !== "string" || texto_boton.length < 1 || texto_boton.length > 100) {
    res.status(400).json({ error: "texto_boton es requerido y debe tener entre 1 y 100 caracteres" });
    return;
  }
  if (!color_boton || typeof color_boton !== "string" || color_boton.length > 20) {
    res.status(400).json({ error: "color_boton es requerido y máximo 20 caracteres" });
    return;
  }
  
  // CRUD
  try {
    const id = parseInt(req.params.id);
    await AboutSectionModel.update(id, req.body);
    res.json({ message: 'AboutSection updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating AboutSection' });
  }
};

// Delete AboutSection
export const deleteAboutSection = async (req: Request, res: Response): Promise<void> => {
  
  try {
    const id = parseInt(req.params.id);
    await AboutSectionModel.delete(id);
    res.json({ message: 'AboutSection deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting AboutSection' });
  }
};