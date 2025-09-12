import { Request, Response } from 'express';
import { HeroSectionModel } from '../../models/landing/Hero-section.model';

// Get all hero sections
export const getAllHeroSections = async (req: Request, res: Response) => {
  try {
    const sections = await HeroSectionModel.getAll();
    res.json(sections);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching hero sections' });
  }
};

// Get single hero section by ID
export const getHeroSectionById = async (req: Request, res: Response) => {
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

// Create new hero section
export const createHeroSection = async (req: Request, res: Response) => {
  try {
    const id = await HeroSectionModel.create(req.body);
    res.status(201).json({ message: 'Hero section created', id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating hero section' });
  }
};

// Update hero section
export const updateHeroSection = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await HeroSectionModel.update(id, req.body);
    res.json({ message: 'Hero section updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating hero section' });
  }
};

// Delete hero section
export const deleteHeroSection = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await HeroSectionModel.delete(id);
    res.json({ message: 'Hero section deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting hero section' });
  }
};