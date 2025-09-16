import { Request, Response } from 'express';
import { LandingVolunteerModel } from '../../models/landing/landing-volunteer.model';

// Función utilitaria para validar URLs
function isValidUrl(url: string): boolean {
  try { new URL(url); return true;} catch {return false;}
}
// Get all LandingVolunteers
export const getAllLandingVolunteers = async (req: Request, res: Response) => {
  try {
    const volunteers = await LandingVolunteerModel.getAll();
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching volunteers' });
  }
};

// Get LandingVolunteer by ID
export const getLandingVolunteerById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const volunteer = await LandingVolunteerModel.getById(id);
    if (!volunteer) {
      res.status(404).json({ error: 'Volunteer not found' });
      return;
    }
    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching volunteer' });
  }
};

// Create new LandingVolunteer WITH VALIDATION
export const createLandingVolunteer = async (req: Request, res: Response) => {
  const { titulo, descripcion, URL_imagen, subtitulo, texto_boton, color_boton } = req.body;

  if (!titulo || typeof titulo !== "string" || titulo.length < 3 || titulo.length > 255) {
    return res.status(400).json({ error: "titulo es requerido y debe tener entre 3 y 255 caracteres" });
  }
  if (!descripcion || typeof descripcion !== "string" || descripcion.length > 255) {
    return res.status(400).json({ error: "descripcion es requerida y máximo 255 caracteres" });
  }
  if (!URL_imagen || typeof URL_imagen !== "string" || URL_imagen.length > 255 || !isValidUrl(URL_imagen)) {
    return res.status(400).json({ error: "URL_imagen es requerida, válida y máximo 255 caracteres" });
  }
  if (!subtitulo || typeof subtitulo !== "string" || subtitulo.length < 3 || subtitulo.length > 255) {
    return res.status(400).json({ error: "subtitulo es requerido y debe tener entre 3 y 255 caracteres" });
  }
  if (!texto_boton || typeof texto_boton !== "string" || texto_boton.length < 1 || texto_boton.length > 100) {
    return res.status(400).json({ error: "texto_boton es requerido y debe tener entre 1 y 100 caracteres" });
  }
  if (!color_boton || typeof color_boton !== "string" || color_boton.length > 20) {
    return res.status(400).json({ error: "color_boton es requerido y máximo 20 caracteres" });
  }  
 
  // CRUD
  try {
    const id = await LandingVolunteerModel.create(req.body);
    res.status(201).json({ message: 'Volunteer created', id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating volunteer' });
  }
};

// Update LandingVolunteer with VALIDATION
export const updateLandingVolunteer = async (req: Request, res: Response) => {
  const { titulo, descripcion, URL_imagen, subtitulo, texto_boton, color_boton } = req.body;

  if (!titulo || typeof titulo !== "string" || titulo.length < 3 || titulo.length > 255) {
    return res.status(400).json({ error: "titulo es requerido y debe tener entre 3 y 255 caracteres" });
  }
  if (!descripcion || typeof descripcion !== "string" || descripcion.length > 255) {
    return res.status(400).json({ error: "descripcion es requerida y máximo 255 caracteres" });
  }
  if (!URL_imagen || typeof URL_imagen !== "string" || URL_imagen.length > 255 || !isValidUrl(URL_imagen)) {
    return res.status(400).json({ error: "URL_imagen es requerida, válida y máximo 255 caracteres" });
  }
  if (!subtitulo || typeof subtitulo !== "string" || subtitulo.length < 3 || subtitulo.length > 255) {
    return res.status(400).json({ error: "subtitulo es requerido y debe tener entre 3 y 255 caracteres" });
  }
  if (!texto_boton || typeof texto_boton !== "string" || texto_boton.length < 1 || texto_boton.length > 100) {
    return res.status(400).json({ error: "texto_boton es requerido y debe tener entre 1 y 100 caracteres" });
  }
  if (!color_boton || typeof color_boton !== "string" || color_boton.length > 20) {
    return res.status(400).json({ error: "color_boton es requerido y máximo 20 caracteres" });
  }  
  
 // CRUD 
  try {
    const id = parseInt(req.params.id);
    await LandingVolunteerModel.update(id, req.body);
    res.json({ message: 'Volunteer updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating volunteer' });
  }
};

// Delete LandingVolunteer by ID
export const deleteLandingVolunteer = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await LandingVolunteerModel.delete(id);
    res.json({ message: 'Volunteer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting volunteer' });
  }
};