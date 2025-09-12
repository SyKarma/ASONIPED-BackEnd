import { Request, Response } from 'express';
import { LandingDonacionesComponentModel } from '../../models/landing/landing.model';
import { LandingDonacionesCardModel } from '../../models/landing/landing.model';

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