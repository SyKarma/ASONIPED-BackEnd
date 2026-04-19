import { Request, Response } from 'express';
import * as ActivityTrackModel from '../models/activity_track.model';
import * as AttendanceRecordModel from '../models/attendance_record.model';
import {
  buildParkingLinkSegment,
  currentParkingWindowId,
  parkingWindowExpiresAt,
} from '../utils/parking_public_link';

// Create a new activity track
export const createActivityTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { name, description, event_date, event_time, location, status, parking_enabled } = req.body;

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
      parking_enabled: !!parking_enabled,
      created_by: userId
    };

    const activityTrackId = await ActivityTrackModel.createActivityTrack(activityTrackData);

    const created = await ActivityTrackModel.getActivityTrackById(activityTrackId);

    res.status(201).json({
      message: 'Activity track created successfully',
      activity_track_id: activityTrackId,
      parking_enabled: !!created?.parking_enabled,
      parking_public_token: created?.parking_public_token || null,
    });
  } catch (err) {
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

    const includeArchived =
      req.query.includeArchived === 'true' || req.query.includeArchived === '1';

    const searchRaw = req.query.search;
    const search =
      typeof searchRaw === 'string' && searchRaw.trim() ? searchRaw.trim() : undefined;

    const { activityTracks, total } = await ActivityTrackModel.getActivityTracks(
      page,
      limit,
      status,
      createdBy,
      includeArchived,
      search
    );

    res.json({
      activityTracks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('getActivityTracks', err);
    res.status(500).json({
      error: 'Error getting activity tracks',
      details: (err as Error).message,
    });
  }
};

/** Authenticated: current time-limited parking URL segment + expiry (6h windows). */
export const getActivityParkingPublicLink = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    const track = await ActivityTrackModel.getActivityTrackById(id);
    if (!track) {
      res.status(404).json({ error: 'Activity track not found' });
      return;
    }
    if (!track.parking_enabled || !track.parking_public_token) {
      res.status(400).json({ error: 'Estacionamiento no habilitado para esta actividad' });
      return;
    }
    if ((track as { archived?: boolean }).archived) {
      res.status(400).json({ error: 'Actividad archivada' });
      return;
    }

    const w = currentParkingWindowId();
    const token = buildParkingLinkSegment(track.id!, w, track.parking_public_token);
    const expiresAt = parkingWindowExpiresAt(w).toISOString();
    res.json({ token, expiresAt });
  } catch (err) {
    console.error('getActivityParkingPublicLink', err);
    res.status(500).json({ error: 'Error al generar el enlace' });
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
  } catch {
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

    const { name, description, event_date, event_time, location, status, parking_enabled } = req.body;

    const existing = await ActivityTrackModel.getActivityTrackById(id);
    if (!existing) {
      res.status(404).json({ error: 'Activity track not found' });
      return;
    }

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

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (event_date !== undefined) updateData.event_date = event_date;
    if (event_time !== undefined) updateData.event_time = event_time;
    if (location !== undefined) updateData.location = location;
    if (status !== undefined) updateData.status = status;

    if (parking_enabled !== undefined) {
      const enabled = !!parking_enabled;
      updateData.parking_enabled = enabled;
      if (enabled) {
        if (!existing.parking_public_token) {
          updateData.parking_public_token = ActivityTrackModel.generateParkingPublicToken();
        }
      } else {
        updateData.parking_public_token = null;
      }
    }

    await ActivityTrackModel.updateActivityTrack(id, updateData);

    res.json({ message: 'Activity track updated successfully' });
  } catch {
    res.status(500).json({ error: 'Error updating activity track' });
  }
};

/** Soft-hide: keep row, exclude from default lists and public parking */
export const archiveActivityTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }
    const existing = await ActivityTrackModel.getActivityTrackById(id);
    if (!existing) {
      res.status(404).json({ error: 'Activity track not found' });
      return;
    }
    if (existing.archived) {
      res.status(400).json({ error: 'La actividad ya está archivada' });
      return;
    }
    await ActivityTrackModel.setActivityTrackArchived(id, true);
    res.json({ message: 'Actividad archivada' });
  } catch (err) {
    console.error('archiveActivityTrack', err);
    res.status(500).json({
      error: 'Error al archivar la actividad',
      details: (err as Error).message,
    });
  }
};

export const unarchiveActivityTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }
    const existing = await ActivityTrackModel.getActivityTrackById(id);
    if (!existing) {
      res.status(404).json({ error: 'Activity track not found' });
      return;
    }
    if (!existing.archived) {
      res.status(400).json({ error: 'La actividad no está archivada' });
      return;
    }
    await ActivityTrackModel.setActivityTrackArchived(id, false);
    res.json({ message: 'Actividad restaurada' });
  } catch (err) {
    console.error('unarchiveActivityTrack', err);
    res.status(500).json({
      error: 'Error al restaurar la actividad',
      details: (err as Error).message,
    });
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
  } catch {
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

    if (activityTrack.parking_enabled) {
      res.status(400).json({
        error:
          'El escaneo QR de beneficiarios no aplica a actividades con registro de estacionamiento; use la lista de asistencia en otra actividad o desactive estacionamiento en la actividad.',
      });
      return;
    }

    if (activityTrack.archived) {
      res.status(400).json({ error: 'No se puede escanear en una actividad archivada; restáurala primero.' });
      return;
    }

    await ActivityTrackModel.startQRScanning(id);

    res.json({ message: 'QR scanning started successfully' });
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Error getting activity tracks by date range' });
  }
};

// Get upcoming activity tracks
export const getUpcomingActivityTracks = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;

    const activityTracks = await ActivityTrackModel.getUpcomingActivityTracks(limit);

    res.json({ activityTracks });
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Error getting activity track with attendance' });
  }
};
