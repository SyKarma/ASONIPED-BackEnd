import { Request, Response } from 'express';
import { LandingDonacionesCardModel } from '../../models/landing/landing-donaciones-card.model';

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