import { Request, Response } from 'express';
import * as VolunteerOptionsModel from '../../models/volunteer/volunteer_options.model';
import { volunteerCache } from '../../services/volunteer-cache.service';

// Register for a volunteer option
export const registerForVolunteer = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { volunteer_option_id, notes } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!volunteer_option_id) {
      res.status(400).json({ error: 'Volunteer option ID is required' });
      return;
    }

    // Check if there are available spots
    const spotsInfo = await VolunteerOptionsModel.getAvailableSpots(volunteer_option_id);
    
    if (spotsInfo.available_spots <= 0) {
      res.status(400).json({ error: 'No available spots for this volunteer option' });
      return;
    }

    // Register the user in volunteer_registrations table
    await VolunteerOptionsModel.registerForVolunteer(userId, volunteer_option_id, notes);

    // Also insert into volunteers table for admin forms view
    try {
      const { getUserById } = await import('../../models/user/user.model');
      const { enrollUserIntoVolunteerOption } = await import('../../models/volunteer/volunteer_forms.model');
      
      const user = await getUserById(userId);
      if (user) {
        await enrollUserIntoVolunteerOption(user, volunteer_option_id);
      }
    } catch (volunteerError) {
      // Don't fail the registration if this fails
    }

    // Clear volunteer options cache to refresh registration status
    volunteerCache.del(volunteerCache.getVolunteerOptionsKey(userId));
    volunteerCache.del(volunteerCache.getVolunteerOptionsKey()); // Clear general cache too
    volunteerCache.invalidateVolunteers(); // Also clear volunteers cache

    // Get updated spots info
    const updatedSpotsInfo = await VolunteerOptionsModel.getAvailableSpots(volunteer_option_id);

    res.status(201).json({ 
      message: 'Successfully registered for volunteer option',
      available_spots: updatedSpotsInfo.available_spots,
      total_spots: updatedSpotsInfo.total_spots,
      registered_count: updatedSpotsInfo.registered_count
    });
  } catch (error: any) {
    console.error('Error registering for volunteer:', error);
    
    if (error.message === 'User is already registered for this volunteer option') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to register for volunteer option' });
    }
  }
};

// Cancel volunteer registration
export const cancelVolunteerRegistration = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { volunteer_option_id } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!volunteer_option_id) {
      res.status(400).json({ error: 'Volunteer option ID is required' });
      return;
    }

    // Cancel the registration
    await VolunteerOptionsModel.cancelVolunteerRegistration(userId, volunteer_option_id);

    // Clear volunteer options cache to refresh registration status
    volunteerCache.del(volunteerCache.getVolunteerOptionsKey(userId));
    volunteerCache.del(volunteerCache.getVolunteerOptionsKey()); // Clear general cache too

    // Get updated spots info
    const updatedSpotsInfo = await VolunteerOptionsModel.getAvailableSpots(volunteer_option_id);

    res.status(200).json({ 
      message: 'Successfully cancelled volunteer registration',
      available_spots: updatedSpotsInfo.available_spots,
      total_spots: updatedSpotsInfo.total_spots,
      registered_count: updatedSpotsInfo.registered_count
    });
  } catch (error: any) {
    console.error('Error cancelling volunteer registration:', error);
    
    if (error.message === 'User is not registered for this volunteer option') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Failed to cancel volunteer registration' });
    }
  }
};

// Get user's volunteer registrations
export const getUserRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const registrations = await VolunteerOptionsModel.getUserRegistrations(userId);
    res.status(200).json(registrations);
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    res.status(500).json({ error: 'Failed to fetch user registrations' });
  }
};

// Get registrations for a specific volunteer option (admin only)
export const getVolunteerRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { volunteer_option_id } = req.params;

    if (!volunteer_option_id) {
      res.status(400).json({ error: 'Volunteer option ID is required' });
      return;
    }

    const registrations = await VolunteerOptionsModel.getVolunteerRegistrations(parseInt(volunteer_option_id));
    res.status(200).json(registrations);
  } catch (error) {
    console.error('Error fetching volunteer registrations:', error);
    res.status(500).json({ error: 'Failed to fetch volunteer registrations' });
  }
};

// Get available spots for a volunteer option
export const getAvailableSpots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { volunteer_option_id } = req.params;

    if (!volunteer_option_id) {
      res.status(400).json({ error: 'Volunteer option ID is required' });
      return;
    }

    const spotsInfo = await VolunteerOptionsModel.getAvailableSpots(parseInt(volunteer_option_id));
    res.status(200).json(spotsInfo);
  } catch (error) {
    console.error('Error fetching available spots:', error);
    res.status(500).json({ error: 'Failed to fetch available spots' });
  }
};
