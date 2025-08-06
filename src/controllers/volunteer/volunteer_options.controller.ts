import { Request, Response } from 'express';
import * as VolunteerOptionModel from '../../models/volunteer/volunteer_options.model';
import { volunteerCache } from '../../services/volunteer-cache.service';

// Get all volunteer options
export const getVolunteerOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const cacheKey = volunteerCache.getVolunteerOptionsKey();
    
    // Try cache first
    const cachedOptions = volunteerCache.get(cacheKey);
    if (cachedOptions) {
      res.json(cachedOptions);
      return;
    }

    const options = await VolunteerOptionModel.getAllVolunteerOptions();
    
    // Cache for 15 minutes (options don't change often)
    volunteerCache.set(cacheKey, options, 900);
    
    res.json(options);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch volunteer options' });
  }
};

// Add a new volunteer option
export const addVolunteerOption = async (req: Request, res: Response): Promise<void> => {
  try {
    await VolunteerOptionModel.createVolunteerOption(req.body);
    
    // Invalidate options cache
    volunteerCache.del(volunteerCache.getVolunteerOptionsKey());
    
    res.status(201).json({ message: 'Volunteer option created' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create volunteer option' });
  }
};

// Update a volunteer option
export const updateVolunteerOption = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await VolunteerOptionModel.updateVolunteerOption(id, req.body);
    
    // Invalidate options cache
    volunteerCache.del(volunteerCache.getVolunteerOptionsKey());
    
    res.json({ message: 'Volunteer option updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update volunteer option' });
  }
};


// Delete a volunteer option
export const deleteVolunteerOption = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    await VolunteerOptionModel.deleteVolunteerOption(id);
    
    // Invalidate options cache
    volunteerCache.del(volunteerCache.getVolunteerOptionsKey());
    
    res.json({ message: 'Volunteer option deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete volunteer option' });
  }
};