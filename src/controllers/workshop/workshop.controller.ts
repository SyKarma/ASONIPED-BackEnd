import { Request, Response } from 'express';
import { WorkshopModel, Workshop } from '../../models/workshop/workshop.model';

// GET todos los talleres
export const getAllWorkshops = async (req: Request, res: Response) => {
  try {
    const workshops = await WorkshopModel.getAll();
    res.json(workshops);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshops', error });
  }
};

// GET taller por ID
export const getWorkshopById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const workshop = await WorkshopModel.getById(Number(id));
    if (!workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    res.json(workshop);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workshop', error });
  }
};

// POST crear taller
export const createWorkshop = async (req: Request, res: Response) => {
  const { titulo, ubicacion, descripcion, materials, aprender, fecha, hora, capacidad, imagen } = req.body;
  try {
    const newWorkshop: Workshop = {
      titulo,
      ubicacion,
      descripcion,
      materials,
      aprender,
      fecha,
      hora,
      capacidad,
      imagen
    };
    const createdWorkshop = await WorkshopModel.create(newWorkshop);
    res.status(201).json(createdWorkshop);
  } catch (error) {
    res.status(500).json({ message: 'Error creating workshop', error });
  }
};

// PUT actualizar taller
export const updateWorkshop = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { titulo, ubicacion, descripcion, materials, aprender, fecha, hora, capacidad, imagen } = req.body;
  try {
    const updatedWorkshop = await WorkshopModel.update(Number(id), {
      titulo,
      ubicacion,
      descripcion,
      materials,
      aprender,
      fecha,
      hora,
      capacidad,
      imagen
    });
    if (!updatedWorkshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    res.json(updatedWorkshop);
  } catch (error) {
    res.status(500).json({ message: 'Error updating workshop', error });
  }
};

// DELETE taller
export const deleteWorkshop = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const success = await WorkshopModel.delete(Number(id));
    if (!success) {
      return res.status(404).json({ message: 'Workshop not found' });
    }
    res.json({ message: 'Workshop deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting workshop', error });
  }
};