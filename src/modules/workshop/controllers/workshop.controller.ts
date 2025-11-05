import { Request, Response } from 'express';
import { WorkshopModel, Workshop } from '../models/workshop.model';

// Helper for validation
function validateWorkshop(data: Partial<Workshop>) {
  const errors: string[] = [];

  if (!data.titulo || typeof data.titulo !== 'string' || data.titulo.trim().length === 0) {
    errors.push('El título es obligatorio y debe ser un texto.');
  }
  if (!data.ubicacion || typeof data.ubicacion !== 'string' || data.ubicacion.trim().length === 0) {
    errors.push('La ubicación es obligatoria y debe ser un texto.');
  }
  if (!data.descripcion || typeof data.descripcion !== 'string' || data.descripcion.trim().length === 0) {
    errors.push('La descripción es obligatoria y debe ser un texto.');
  }
  if (!data.materiales || !Array.isArray(data.materiales) || data.materiales.length === 0) {
    errors.push('Los materiales son obligatorios y deben ser un array.');
  }
  if (!data.aprender || typeof data.aprender !== 'string' || data.aprender.trim().length === 0) {
    errors.push('El campo "aprender" es obligatorio y debe ser un texto.');
  }
  if (!data.fecha || typeof data.fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(data.fecha)) {
    errors.push('La fecha es obligatoria y debe tener formato YYYY-MM-DD.');
  }
  if (!data.hora || typeof data.hora !== 'string' || !/^\d{2}:\d{2}$/.test(data.hora)) {
    errors.push('La hora es obligatoria y debe tener formato HH:MM.');
  }
  if (typeof data.capacidad !== 'number' || isNaN(data.capacidad) || data.capacidad <= 0) {
    errors.push('La capacidad es obligatoria y debe ser un número mayor a 0.');
  }
  if (data.imagen && typeof data.imagen !== 'string') {
    errors.push('La URL de la imagen debe ser un texto válido.');
  }
  return errors;
}

// GET todos los talleres
export const getAllWorkshops = async (req: Request, res: Response): Promise<void> => {
  try {
    const workshops = await WorkshopModel.getAll();
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshops', error });
  }
};

// GET taller por ID
export const getWorkshopById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const workshop = await WorkshopModel.getById(Number(id));
    if (!workshop) {
      res.status(404).json({ message: 'Workshop not found' });
      return;
    }
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshop', error });
  }
};

// POST crear taller
export const createWorkshop = async (req: Request, res: Response): Promise<void> => {
  // Si recibes FormData (multipart/form-data), los valores vienen como string
  // Si recibes JSON, los valores vienen como el tipo que envía el frontend

  // Extrae el body de forma segura
  const body = req.body ?? {};

  // Si recibes capacidad como string, conviértelo a número
  let capacidad = body.capacidad;
  if (typeof capacidad === 'string') {
    capacidad = parseInt(capacidad, 10);
  }

  const newWorkshop: Workshop = {
    titulo: body.titulo ?? '',
    ubicacion: body.ubicacion ?? '',
    descripcion: body.descripcion ?? '',
    materiales: body.materiales ?? '',
    aprender: body.aprender ?? '',
    fecha: body.fecha ?? '',
    hora: body.hora ?? '',
    capacidad: capacidad,
    imagen: body.imagen ?? '',
  };

  const errors = validateWorkshop(newWorkshop);
  if (errors.length > 0) {
    res.status(400).json({ message: 'Error de validación', errors });
    return;
  }

  try {
    const createdWorkshop = await WorkshopModel.create(newWorkshop);
    res.status(201).json(createdWorkshop);
  } catch (error) {
    res.status(500).json({ message: 'Error creating workshop', error });
  }
};

// PUT actualizar taller
export const updateWorkshop = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const body = req.body ?? {};
  let capacidad = body.capacidad;
  if (typeof capacidad === 'string') {
    capacidad = parseInt(capacidad, 10);
  }
  const updatedWorkshopData: Workshop = {
    titulo: body.titulo ?? '',
    ubicacion: body.ubicacion ?? '',
    descripcion: body.descripcion ?? '',
    materiales: body.materiales ?? '',
    aprender: body.aprender ?? '',
    fecha: body.fecha ?? '',
    hora: body.hora ?? '',
    capacidad: capacidad,
    imagen: body.imagen ?? '',
  };

  const errors = validateWorkshop(updatedWorkshopData);
  if (errors.length > 0) {
    res.status(400).json({ message: 'Error de validación', errors });
    return;
  }

  try {
    const updatedWorkshop = await WorkshopModel.update(Number(id), updatedWorkshopData);
    if (!updatedWorkshop) {
      res.status(404).json({ message: 'Workshop not found' });
      return;
    }
    res.json(updatedWorkshop);
  } catch (error) {
    res.status(500).json({ message: 'Error updating workshop', error });
  }
};

// DELETE taller
export const deleteWorkshop = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    const success = await WorkshopModel.delete(Number(id));
    if (!success) {
      res.status(404).json({ message: 'Workshop not found' });
      return;
    }
    res.json({ message: 'Workshop deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting workshop', error });
  }
};