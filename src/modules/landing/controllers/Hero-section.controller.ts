import { Request, Response } from 'express';
import { HeroSectionModel } from '../models/Hero-section.model';

// Función utilitaria para validar URLs
function isValidUrl(url: string): boolean { 
  try { new URL(url); return true;} catch {return false;}
}

// Get all hero sections
export const getAllHeroSections = async (req: Request, res: Response): Promise<void> => {
  try {
    const sections = await HeroSectionModel.getAll();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching hero sections' });
  }
};

// Get single hero section by ID
export const getHeroSectionById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const section = await HeroSectionModel.getById(id);
    if (!section) {
      res.status(404).json({ error: 'Hero section not found' });
      return;
    }
    res.json(section);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching hero section' });
  }
};

// Create new hero section WITH VALIDATION
export const createHeroSection = async (req: Request, res: Response): Promise<void> => {
  // VALIDACIONES
  const { titulo, URL_imagen, descripcion, texto_boton_izquierdo, color_boton_izquierdo, texto_boton_derecho, color_boton_derecho } = req.body;

  if (!titulo || typeof titulo !== "string" || titulo.length < 3 || titulo.length > 255) {
    res.status(400).json({ error: "titulo es requerido y debe tener entre 3 y 255 caracteres" });
    return;
  }
  if (URL_imagen && (typeof URL_imagen !== "string" || URL_imagen.length > 255 || !isValidUrl(URL_imagen))) {
    res.status(400).json({ error: "URL_imagen debe ser una URL válida y máximo 255 caracteres" });
    return;
  }
  if (!descripcion || typeof descripcion !== "string" || descripcion.length > 2000) {
    res.status(400).json({ error: "descripcion es requerida y máximo 2000 caracteres" });
    return;
  }
  if (!texto_boton_izquierdo || typeof texto_boton_izquierdo !== "string" || texto_boton_izquierdo.length < 1 || texto_boton_izquierdo.length > 100) {
    res.status(400).json({ error: "texto_boton_izquierdo es requerido y debe tener entre 1 y 100 caracteres" });
    return;
  }
  if (!color_boton_izquierdo || typeof color_boton_izquierdo !== "string" || color_boton_izquierdo.length > 20) {
    res.status(400).json({ error: "color_boton_izquierdo es requerido y máximo 20 caracteres" });
    return;
  }
  if (!texto_boton_derecho || typeof texto_boton_derecho !== "string" || texto_boton_derecho.length < 1 || texto_boton_derecho.length > 100) {
    res.status(400).json({ error: "texto_boton_derecho es requerido y debe tener entre 1 y 100 caracteres" });
    return;
  }
  if (!color_boton_derecho || typeof color_boton_derecho !== "string" || color_boton_derecho.length > 20) {
    res.status(400).json({ error: "color_boton_derecho es requerido y máximo 20 caracteres" });
    return;
  }

  // CRUD
  try {
    const id = await HeroSectionModel.create(req.body);
    res.status(201).json({ message: 'Hero section created', id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating hero section' });
  }
};

// Update hero section WITH VALIDATION
export const updateHeroSection = async (req: Request, res: Response): Promise<void> => {
  // VALIDACIONES
  const { titulo, URL_imagen, descripcion, texto_boton_izquierdo, color_boton_izquierdo, texto_boton_derecho, color_boton_derecho } = req.body;

  if (!titulo || typeof titulo !== "string" || titulo.length < 3 || titulo.length > 255) {
    res.status(400).json({ error: "titulo es requerido y debe tener entre 3 y 255 caracteres" });
    return;
  }
  if (URL_imagen && (typeof URL_imagen !== "string" || URL_imagen.length > 255 || !isValidUrl(URL_imagen))) {
    res.status(400).json({ error: "URL_imagen debe ser una URL válida y máximo 255 caracteres" });
    return;
  }
  if (!descripcion || typeof descripcion !== "string" || descripcion.length > 2000) {
    res.status(400).json({ error: "descripcion es requerida y máximo 2000 caracteres" });
    return;
  }
  if (!texto_boton_izquierdo || typeof texto_boton_izquierdo !== "string" || texto_boton_izquierdo.length < 1 || texto_boton_izquierdo.length > 100) {
    res.status(400).json({ error: "texto_boton_izquierdo es requerido y debe tener entre 1 y 100 caracteres" });
    return;
  }
  if (!color_boton_izquierdo || typeof color_boton_izquierdo !== "string" || color_boton_izquierdo.length > 20) {
    res.status(400).json({ error: "color_boton_izquierdo es requerido y máximo 20 caracteres" });
    return;
  }
  if (!texto_boton_derecho || typeof texto_boton_derecho !== "string" || texto_boton_derecho.length < 1 || texto_boton_derecho.length > 100) {
    res.status(400).json({ error: "texto_boton_derecho es requerido y debe tener entre 1 y 100 caracteres" });
    return;
  }
  if (!color_boton_derecho || typeof color_boton_derecho !== "string" || color_boton_derecho.length > 20) {
    res.status(400).json({ error: "color_boton_derecho es requerido y máximo 20 caracteres" });
    return;
  }

  // CRUD
  try {
    const id = parseInt(req.params.id);
    await HeroSectionModel.update(id, req.body);
    res.json({ message: 'Hero section updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating hero section' });
  }
};

// Delete hero section
export const deleteHeroSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await HeroSectionModel.delete(id);
    res.json({ message: 'Hero section deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting hero section' });
  }
};