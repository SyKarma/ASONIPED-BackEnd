import { Request, Response } from 'express';
import * as AttendanceRecordModel from '../../models/attendance/attendance_record.model';
import * as ActivityTrackModel from '../../models/attendance/activity_track.model';

// Process QR code scan
export const processQRScan = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { qrData, activityTrackId } = req.body;

    // Validate required fields
    if (!qrData || !qrData.record_id || !qrData.name) {
      res.status(400).json({ error: 'QR data with record_id and name is required' });
      return;
    }

    if (!activityTrackId) {
      res.status(400).json({ error: 'Activity track ID is required' });
      return;
    }

    // Check if there's an active scanning activity track
    const activeTrack = await ActivityTrackModel.getActiveScanningActivityTrack();
    if (!activeTrack) {
      res.status(400).json({ error: 'No active scanning activity track. Please start QR scanning first.' });
      return;
    }

    // Verify the activity track ID matches the active one
    if (activeTrack.id !== activityTrackId) {
      res.status(400).json({ 
        error: 'QR scan does not match the currently active activity track',
        activeTrackId: activeTrack.id
      });
      return;
    }

    // Process the QR scan
    const attendanceRecord = await AttendanceRecordModel.processQRScan(
      qrData,
      activityTrackId,
      userId
    );

    res.status(201).json({
      message: 'Attendance recorded successfully via QR scan',
      attendanceRecord
    });
  } catch (err) {
    console.error('Error processing QR scan:', err);
    
    if (err instanceof Error) {
      if (err.message.includes('already recorded')) {
        res.status(409).json({ error: err.message });
        return;
      }
      if (err.message.includes('not found') || err.message.includes('not active')) {
        res.status(404).json({ error: err.message });
        return;
      }
    }

    res.status(500).json({
      error: 'Error processing QR scan',
      details: (err as Error).message || String(err)
    });
  }
};

// Create manual attendance entry
export const createManualAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const { 
      activity_track_id, 
      attendance_type, 
      full_name, 
      cedula, 
      phone, 
      record_id 
    } = req.body;

    // Validate required fields
    if (!activity_track_id || !attendance_type || !full_name) {
      res.status(400).json({ 
        error: 'Activity track ID, attendance type, and full name are required' 
      });
      return;
    }

    // Validate attendance type
    if (!['beneficiario', 'guest'].includes(attendance_type)) {
      res.status(400).json({ 
        error: 'Attendance type must be either "beneficiario" or "guest"' 
      });
      return;
    }

    // For beneficiarios, record_id is required
    if (attendance_type === 'beneficiario' && !record_id) {
      res.status(400).json({ 
        error: 'Record ID is required for beneficiario attendance' 
      });
      return;
    }

    // Check if activity track exists
    const activityTrack = await ActivityTrackModel.getActivityTrackById(activity_track_id);
    if (!activityTrack) {
      res.status(404).json({ error: 'Activity track not found' });
      return;
    }

    // Check for duplicate attendance
    if (attendance_type === 'beneficiario') {
      const alreadyAttended = await AttendanceRecordModel.checkBeneficiarioAttendance(
        activity_track_id,
        record_id
      );
      if (alreadyAttended) {
        res.status(409).json({ 
          error: 'Attendance already recorded for this beneficiario in this activity' 
        });
        return;
      }
    }

    const attendanceRecordData = {
      activity_track_id,
      record_id: attendance_type === 'beneficiario' ? record_id : null,
      attendance_type,
      full_name,
      cedula: cedula || null,
      phone: phone || null,
      attendance_method: 'manual_form' as const,
      created_by: userId
    };

    const attendanceId = await AttendanceRecordModel.createAttendanceRecord(attendanceRecordData);
    const attendanceRecord = await AttendanceRecordModel.getAttendanceRecordById(attendanceId);

    res.status(201).json({
      message: 'Attendance recorded successfully via manual entry',
      attendanceRecord
    });
  } catch (err) {
    console.error('Error creating manual attendance:', err);
    res.status(500).json({
      error: 'Error creating manual attendance',
      details: (err as Error).message || String(err)
    });
  }
};

// Get attendance records with filtering
export const getAttendanceRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const activityTrackId = req.query.activityTrackId ? parseInt(req.query.activityTrackId as string) : undefined;
    const attendanceType = req.query.attendanceType as 'beneficiario' | 'guest' | undefined;
    const attendanceMethod = req.query.attendanceMethod as 'qr_scan' | 'manual_form' | undefined;
    const startDate = req.query.startDate as string | undefined;
    const endDate = req.query.endDate as string | undefined;

    const { records, total } = await AttendanceRecordModel.getAttendanceRecords(
      page,
      limit,
      activityTrackId,
      attendanceType,
      attendanceMethod,
      startDate,
      endDate
    );

    res.json({
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error getting attendance records:', err);
    res.status(500).json({ error: 'Error getting attendance records' });
  }
};

// Get attendance record by ID
export const getAttendanceRecordById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid attendance record ID' });
      return;
    }

    const attendanceRecord = await AttendanceRecordModel.getAttendanceRecordById(id);
    
    if (!attendanceRecord) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }

    res.json(attendanceRecord);
  } catch (err) {
    console.error('Error getting attendance record:', err);
    res.status(500).json({ error: 'Error getting attendance record' });
  }
};

// Get attendance records for a specific activity track
export const getAttendanceRecordsByActivityTrack = async (req: Request, res: Response): Promise<void> => {
  try {
    const activityTrackId = parseInt(req.params.activityTrackId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    if (!activityTrackId || isNaN(activityTrackId)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    const { records, total } = await AttendanceRecordModel.getAttendanceRecordsByActivityTrack(
      activityTrackId,
      page,
      limit
    );

    res.json({
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error getting attendance records by activity track:', err);
    res.status(500).json({ error: 'Error getting attendance records by activity track' });
  }
};

// Update attendance record
export const updateAttendanceRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid attendance record ID' });
      return;
    }

    const { full_name, cedula, phone } = req.body;

    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (cedula !== undefined) updateData.cedula = cedula;
    if (phone !== undefined) updateData.phone = phone;

    await AttendanceRecordModel.updateAttendanceRecord(id, updateData);

    res.json({ message: 'Attendance record updated successfully' });
  } catch (err) {
    console.error('Error updating attendance record:', err);
    res.status(500).json({ error: 'Error updating attendance record' });
  }
};

// Delete attendance record
export const deleteAttendanceRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid attendance record ID' });
      return;
    }

    await AttendanceRecordModel.deleteAttendanceRecord(id);

    res.json({ message: 'Attendance record deleted successfully' });
  } catch (err) {
    console.error('Error deleting attendance record:', err);
    res.status(500).json({ error: 'Error deleting attendance record' });
  }
};

// Get attendance statistics for an activity track
export const getAttendanceStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const activityTrackId = parseInt(req.params.activityTrackId);
    
    if (!activityTrackId || isNaN(activityTrackId)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    const stats = await AttendanceRecordModel.getAttendanceStats(activityTrackId);

    res.json({ stats });
  } catch (err) {
    console.error('Error getting attendance stats:', err);
    res.status(500).json({ error: 'Error getting attendance stats' });
  }
};

// Get attendance statistics by date range
export const getAttendanceStatsByDateRange = async (req: Request, res: Response): Promise<void> => {
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

    const stats = await AttendanceRecordModel.getAttendanceStatsByDateRange(
      startDate as string,
      endDate as string
    );

    res.json({ stats });
  } catch (err) {
    console.error('Error getting attendance stats by date range:', err);
    res.status(500).json({ error: 'Error getting attendance stats by date range' });
  }
};

// Get recent attendance records
export const getRecentAttendanceRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const records = await AttendanceRecordModel.getRecentAttendanceRecords(limit);

    res.json({ records });
  } catch (err) {
    console.error('Error getting recent attendance records:', err);
    res.status(500).json({ error: 'Error getting recent attendance records' });
  }
};

// Check if a beneficiario has already attended an activity
export const checkBeneficiarioAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const activityTrackId = parseInt(req.params.activityTrackId);
    const recordId = parseInt(req.params.recordId);
    
    if (!activityTrackId || isNaN(activityTrackId)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    if (!recordId || isNaN(recordId)) {
      res.status(400).json({ error: 'Invalid record ID' });
      return;
    }

    const hasAttended = await AttendanceRecordModel.checkBeneficiarioAttendance(
      activityTrackId,
      recordId
    );

    res.json({ hasAttended });
  } catch (err) {
    console.error('Error checking beneficiario attendance:', err);
    res.status(500).json({ error: 'Error checking beneficiario attendance' });
  }
};
