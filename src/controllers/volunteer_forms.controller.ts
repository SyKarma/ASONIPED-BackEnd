import { Request, Response } from 'express';
import * as VolunteerModel from '../models/volunteer_forms.model';

// Get all volunteers with pagination and filtering
export const getVolunteers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const name = req.query.name as string | undefined;

    const { volunteers, total } = await VolunteerModel.getVolunteers(page, limit, status, name);
    res.json({ volunteers, total, page, limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
};

// Get a single volunteer by ID
export const getVolunteerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const volunteer = await VolunteerModel.getVolunteerById(id);
    if (!volunteer) {
      res.status(404).json({ error: 'Volunteer not found' });
      return;
    }
    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch volunteer' });
  }
};

// Create a new volunteer
export const addVolunteer = async (req: Request, res: Response): Promise<void> => {
  try {
    await VolunteerModel.createVolunteer(req.body);
    res.status(201).json({ message: 'Volunteer created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create volunteer' });
  }
};

// Update a volunteer
export const updateVolunteer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await VolunteerModel.updateVolunteer(id, req.body);
    res.json({ message: 'Volunteer updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update volunteer' });
  }
};

// Delete a volunteer
export const deleteVolunteer = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await VolunteerModel.deleteVolunteer(id);
    res.json({ message: 'Volunteer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete volunteer' });
  }
};