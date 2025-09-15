import { Request, Response } from 'express';
import { LandingVolunteerModel } from '../../models/landing/landing-volunteer.model';

export const getAllLandingVolunteers = async (req: Request, res: Response) => {
  try {
    const volunteers = await LandingVolunteerModel.getAll();
    res.json(volunteers);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching volunteers' });
  }
};

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

export const createLandingVolunteer = async (req: Request, res: Response) => {
  try {
    const id = await LandingVolunteerModel.create(req.body);
    res.status(201).json({ message: 'Volunteer created', id });
  } catch (err) {
    res.status(500).json({ error: 'Error creating volunteer' });
  }
};

export const updateLandingVolunteer = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await LandingVolunteerModel.update(id, req.body);
    res.json({ message: 'Volunteer updated' });
  } catch (err) {
    res.status(500).json({ error: 'Error updating volunteer' });
  }
};

export const deleteLandingVolunteer = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await LandingVolunteerModel.delete(id);
    res.json({ message: 'Volunteer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting volunteer' });
  }
};