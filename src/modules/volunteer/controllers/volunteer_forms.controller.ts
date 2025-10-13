import { Request, Response } from 'express';
import * as VolunteerModel from '../models/volunteer_forms.model';
import { volunteerCache } from '../../../services/volunteer-cache.service';
import { AuthRequest } from '../../../middleware/auth.middleware';
import { getUserById } from '../../user/models/user.model';


// Get all volunteers with pagination and filtering
export const getVolunteers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const name = req.query.name as string | undefined;

    // Create cache key
    const cacheKey = volunteerCache.getVolunteersKey(page, limit, status, name);
    
    // Try to get from cache first
    const cachedData = volunteerCache.get(cacheKey);
    if (cachedData) {
      res.json(cachedData);
      return;
    }

    // If not in cache, fetch from database
    const { volunteers, total } = await VolunteerModel.getVolunteers(page, limit, status, name);
    const response = { volunteers, total, page, limit };
    
    // Cache the response for 5 minutes
    volunteerCache.set(cacheKey, response, 300);
    
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
};


// Get a single volunteer by ID
export const getVolunteerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const cacheKey = volunteerCache.getVolunteerKey(id);
    
    // Try cache first
    const cachedVolunteer = volunteerCache.get(cacheKey);
    if (cachedVolunteer) {
      res.json(cachedVolunteer);
      return;
    }

    const volunteer = await VolunteerModel.getVolunteerById(id);
    if (!volunteer) {
      res.status(404).json({ error: 'Volunteer not found' });
      return;
    }

    // Cache for 10 minutes
    volunteerCache.set(cacheKey, volunteer, 600);
    res.json(volunteer);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch volunteer' });
  }
};

// Create a new volunteer
export const addVolunteer = async (req: Request, res: Response): Promise<void> => {
  try {
    await VolunteerModel.createVolunteer(req.body);
    
    // Invalidate cache since we added a new volunteer
    volunteerCache.invalidateVolunteers();
    
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
    
    // Invalidate specific volunteer cache and list cache
    volunteerCache.del(volunteerCache.getVolunteerKey(id));
    volunteerCache.invalidateVolunteers();
    
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
    
    // Invalidate cache
    volunteerCache.del(volunteerCache.getVolunteerKey(id));
    volunteerCache.invalidateVolunteers();
    
    res.json({ message: 'Volunteer deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete volunteer' });
  }
};

// Enroll current user into a volunteer option using account data
export const enrollCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const optionId = parseInt(req.params.optionId);
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Insert into volunteers table (for admin forms view)
    const result = await VolunteerModel.enrollUserIntoVolunteerOption(user, optionId);

    // Also insert into volunteer_registrations table (for registered_count calculation)
    try {
      const { registerForVolunteer } = await import('../models/volunteer_options.model');
      await registerForVolunteer(req.user.userId, optionId);
    } catch (regError) {
      // Don't fail the entire enrollment if this fails
    }

    // Invalidate list cache
    volunteerCache.invalidateVolunteers();

    res.status(result.created ? 201 : 200).json({
      message: result.created ? 'Enrolled successfully' : 'Already enrolled',
      volunteerId: result.volunteerId,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to enroll into volunteer option' });
  }
};

// Get current user's volunteer enrollments
export const getMyEnrollments = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const user = await getUserById(req.user.userId);
    if (!user) {
      res.json({ enrollments: [] });
      return;
    }
    const enrollments = await VolunteerModel.getEnrollmentsByEmail(user.email || '');
    res.json({ enrollments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
};

// Unenroll current user from a volunteer option
export const unenrollCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const volunteerId = parseInt(req.params.volunteerId);
    if (!req.user || !req.user.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await getUserById(req.user.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Verify that the volunteer enrollment belongs to the user
    const enrollments = await VolunteerModel.getEnrollmentsByEmail(user.email || '');
    const enrollment = enrollments.find(e => e.volunteer_id === volunteerId);
    
    if (!enrollment) {
      res.status(404).json({ error: 'Enrollment not found or not owned by user' });
      return;
    }

    // Delete the volunteer enrollment
    await VolunteerModel.deleteVolunteer(volunteerId);

    // Invalidate cache
    volunteerCache.invalidateVolunteers();

    res.json({ message: 'Successfully unenrolled from volunteer option' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to unenroll from volunteer option' });
  }
};