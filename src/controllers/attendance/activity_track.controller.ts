import { Request, Response } from 'express';
import * as ActivityTrackModel from '../../models/attendance/activity_track.model';
import * as AttendanceRecordModel from '../../models/attendance/attendance_record.model';

// Create a new activity track
export const createActivityTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { name, description, event_date, event_time, location, status } = req.body;

    // Validate required fields
    if (!name || !event_date) {
      res.status(400).json({ error: 'Name and event date are required' });
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(event_date)) {
      res.status(400).json({ error: 'Event date must be in YYYY-MM-DD format' });
      return;
    }

    // Validate time format if provided
    if (event_time) {
      const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
      if (!timeRegex.test(event_time)) {
        res.status(400).json({ error: 'Event time must be in HH:MM or HH:MM:SS format' });
        return;
      }
    }

    const activityTrackData = {
      name,
      description,
      event_date,
      event_time,
      location,
      status: status || 'active',
      created_by: userId
    };

    const activityTrackId = await ActivityTrackModel.createActivityTrack(activityTrackData);

    res.status(201).json({
      message: 'Activity track created successfully',
      activity_track_id: activityTrackId
    });
  } catch (err) {
    console.error('Error creating activity track:', err);
    res.status(500).json({
      error: 'Error creating activity track',
      details: (err as Error).message || String(err)
    });
  }
};

// Get all activity tracks with pagination and filtering
export const getActivityTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const createdBy = req.query.createdBy ? parseInt(req.query.createdBy as string) : undefined;

    const { activityTracks, total } = await ActivityTrackModel.getActivityTracks(
      page,
      limit,
      status,
      createdBy
    );

    res.json({
      activityTracks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error getting activity tracks:', err);
    res.status(500).json({ error: 'Error getting activity tracks' });
  }
};

// Get activity track by ID
export const getActivityTrackById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    const activityTrack = await ActivityTrackModel.getActivityTrackById(id);
    
    if (!activityTrack) {
      res.status(404).json({ error: 'Activity track not found' });
      return;
    }

    res.json(activityTrack);
  } catch (err) {
    console.error('Error getting activity track:', err);
    res.status(500).json({ error: 'Error getting activity track' });
  }
};

// Update activity track
export const updateActivityTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    const { name, description, event_date, event_time, location, status } = req.body;

    // Validate date format if provided
    if (event_date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(event_date)) {
        res.status(400).json({ error: 'Event date must be in YYYY-MM-DD format' });
        return;
      }
    }

    // Validate time format if provided
    if (event_time) {
      const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/;
      if (!timeRegex.test(event_time)) {
        res.status(400).json({ error: 'Event time must be in HH:MM or HH:MM:SS format' });
        return;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (event_date !== undefined) updateData.event_date = event_date;
    if (event_time !== undefined) updateData.event_time = event_time;
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;

    await ActivityTrackModel.updateActivityTrack(id, updateData);

    res.json({ message: 'Activity track updated successfully' });
  } catch (err) {
    console.error('Error updating activity track:', err);
    res.status(500).json({ error: 'Error updating activity track' });
  }
};

// Delete activity track
export const deleteActivityTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    await ActivityTrackModel.deleteActivityTrack(id);

    res.json({ message: 'Activity track deleted successfully' });
  } catch (err) {
    console.error('Error deleting activity track:', err);
    res.status(500).json({ error: 'Error deleting activity track' });
  }
};

// Start QR scanning for an activity track
export const startQRScanning = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    // Check if activity track exists
    const activityTrack = await ActivityTrackModel.getActivityTrackById(id);
    if (!activityTrack) {
      res.status(404).json({ error: 'Activity track not found' });
      return;
    }

    // Check if activity track is active
    if (activityTrack.status !== 'active') {
      res.status(400).json({ error: 'Only active activity tracks can have QR scanning enabled' });
      return;
    }

    await ActivityTrackModel.startQRScanning(id);

    res.json({ message: 'QR scanning started successfully' });
  } catch (err) {
    console.error('Error starting QR scanning:', err);
    res.status(500).json({ error: 'Error starting QR scanning' });
  }
};

// Stop QR scanning for an activity track
export const stopQRScanning = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    await ActivityTrackModel.stopQRScanning(id);

    res.json({ message: 'QR scanning stopped successfully' });
  } catch (err) {
    console.error('Error stopping QR scanning:', err);
    res.status(500).json({ error: 'Error stopping QR scanning' });
  }
};

// Get currently active scanning activity track
export const getActiveScanningActivityTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const activeTrack = await ActivityTrackModel.getActiveScanningActivityTrack();
    
    if (!activeTrack) {
      res.json({ message: 'No active scanning activity track', activeTrack: null });
      return;
    }

    res.json({ activeTrack });
  } catch (err) {
    console.error('Error getting active scanning activity track:', err);
    res.status(500).json({ error: 'Error getting active scanning activity track' });
  }
};

// Get activity tracks by date range
export const getActivityTracksByDateRange = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({ error: 'Start date and end date are required' });
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate as string) || !dateRegex.test(endDate as string)) {
      res.status(400).json({ error: 'Dates must be in YYYY-MM-DD format' });
      return;
    }

    const activityTracks = await ActivityTrackModel.getActivityTracksByDateRange(
      startDate as string,
      endDate as string
    );

    res.json({ activityTracks });
  } catch (err) {
    console.error('Error getting activity tracks by date range:', err);
    res.status(500).json({ error: 'Error getting activity tracks by date range' });
  }
};

// Get upcoming activity tracks
export const getUpcomingActivityTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const activityTracks = await ActivityTrackModel.getUpcomingActivityTracks(limit);

    res.json({ activityTracks });
  } catch (err) {
    console.error('Error getting upcoming activity tracks:', err);
    res.status(500).json({ error: 'Error getting upcoming activity tracks' });
  }
};

// Get activity track with attendance records
export const getActivityTrackWithAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    // Get activity track details
    const activityTrack = await ActivityTrackModel.getActivityTrackById(id);
    if (!activityTrack) {
      res.status(404).json({ error: 'Activity track not found' });
      return;
    }

    // Get attendance records for this activity track
    const { records, total } = await AttendanceRecordModel.getAttendanceRecordsByActivityTrack(
      id,
      page,
      limit
    );

    res.json({
      activityTrack,
      attendanceRecords: {
        records,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('Error getting activity track with attendance:', err);
    res.status(500).json({ error: 'Error getting activity track with attendance' });
  }
};
