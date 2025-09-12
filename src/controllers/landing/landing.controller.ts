import { Request, Response } from 'express';
import { HeroSectionModel } from '../../models/landing/landing.model';
import { AboutSectionModel } from '../../models/landing/landing.model';
import { LandingDonacionesComponentModel } from '../../models/landing/landing.model';
import { LandingDonacionesCardModel } from '../../models/landing/landing.model';
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
//donaciones controller
// Get all components
export const getAllLandingDonacionesComponents = async (req: Request, res: Response) => {
  try {
    const components = await LandingDonacionesComponentModel.getAll();
    res.json(components);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching components' });
  }
};

// Get component by ID
export const getLandingDonacionesComponentById = async (req: Request, res: Response) => {
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
export const createLandingDonacionesComponent = async (req: Request, res: Response) => {
  try {
    const id = await LandingDonacionesComponentModel.create(req.body);
    res.status(201).json({ message: 'Component created', id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating component' });
  }
};

// Update component
export const updateLandingDonacionesComponent = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await LandingDonacionesComponentModel.update(id, req.body);
    res.json({ message: 'Component updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating component' });
  }
};

// Delete component
export const deleteLandingDonacionesComponent = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await LandingDonacionesComponentModel.delete(id);
    res.json({ message: 'Component deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting component' });
  }
};
//donaciones cards controller
export const getAllLandingDonacionesCards = async (req: Request, res: Response) => {
  try {
    const cards = await LandingDonacionesCardModel.getAll();
    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching cards' });
  }
};

// Get card by ID
export const getLandingDonacionesCardById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const card = await LandingDonacionesCardModel.getById(id);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching card' });
  }
};

// Create card
export const createLandingDonacionesCard = async (req: Request, res: Response) => {
  try {
    const id = await LandingDonacionesCardModel.create(req.body);
    res.status(201).json({ message: 'Card created', id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating card' });
  }
};

// Update card
export const updateLandingDonacionesCard = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await LandingDonacionesCardModel.update(id, req.body);
    res.json({ message: 'Card updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating card' });
  }
};

// Delete card
export const deleteLandingDonacionesCard = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await LandingDonacionesCardModel.delete(id);
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting card' });
  }
};