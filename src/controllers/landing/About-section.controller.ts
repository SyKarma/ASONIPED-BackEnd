import { Request, Response } from 'express';
import { AboutSectionModel } from '../../models/landing/About-section.model';

//about us controller
// Get all AboutSections
export const getAllAboutSections = async (req: Request, res: Response) => {
  try {
    const sections = await AboutSectionModel.getAll();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching AboutSections' });
  }
};

// Get AboutSection by ID
export const getAboutSectionById = async (req: Request, res: Response) => {
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

// Create AboutSection
export const createAboutSection = async (req: Request, res: Response) => {
  try {
    const id = await AboutSectionModel.create(req.body);
    res.status(201).json({ message: 'AboutSection created', id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating AboutSection' });
  }
};

// Update AboutSection
export const updateAboutSection = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await AboutSectionModel.update(id, req.body);
    res.json({ message: 'AboutSection updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating AboutSection' });
  }
};

// Delete AboutSection
export const deleteAboutSection = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await AboutSectionModel.delete(id);
    res.json({ message: 'AboutSection deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting AboutSection' });
  }
};