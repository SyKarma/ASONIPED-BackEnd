import { db } from '../../db';

export interface ActivityTrack {
  id?: number;
  name: string;
  description?: string;
  event_date: string; // YYYY-MM-DD format
  event_time?: string; // HH:MM:SS format
  location?: string;
  status?: 'active' | 'inactive' | 'completed';
  scanning_active?: boolean;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ActivityTrackWithStats extends ActivityTrack {
  total_attendance?: number;
  beneficiarios_count?: number;
  guests_count?: number;
  created_by_name?: string;
}

// Create a new activity track
export const createActivityTrack = async (activityTrack: Omit<ActivityTrack, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const [result] = await db.query(
    `INSERT INTO activity_tracks (name, description, event_date, event_time, location, status, scanning_active, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      activityTrack.name,
      activityTrack.description || null,
      activityTrack.event_date,
      activityTrack.event_time || null,
      activityTrack.location || null,
      activityTrack.status || 'active',
      activityTrack.scanning_active || false,
      activityTrack.created_by
    ]
  );
  return (result as any).insertId;
};

// Get all activity tracks with optional filtering
export const getActivityTracks = async (
  page = 1,
  limit = 10,
  status?: string,
  createdBy?: number
): Promise<{ activityTracks: ActivityTrackWithStats[]; total: number }> => {
  const offset = (page - 1) * limit;
  let where = '';
  const params: any[] = [];

  if (status) {
    where += 'at.status = ?';
    params.push(status);
  }

  if (createdBy) {
    if (where) where += ' AND ';
    where += 'at.created_by = ?';
    params.push(createdBy);
  }

  const whereClause = where ? `WHERE ${where}` : '';

  // Get activity tracks with creator information and attendance stats
  const [rows] = await db.query(
    `SELECT 
      at.*,
      u.full_name as created_by_name,
      COUNT(ar.id) as total_attendance,
      COUNT(CASE WHEN ar.attendance_type = 'beneficiario' THEN 1 END) as beneficiarios_count,
      COUNT(CASE WHEN ar.attendance_type = 'guest' THEN 1 END) as guests_count
     FROM activity_tracks at
     LEFT JOIN users u ON at.created_by = u.id
     LEFT JOIN attendance_records ar ON at.id = ar.activity_track_id
     ${whereClause}
     GROUP BY at.id
     ORDER BY at.event_date DESC, at.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  ) as [any[], any];

  // Get total count for pagination
  const [countRows] = await db.query(
    `SELECT COUNT(*) as count FROM activity_tracks at ${whereClause}`,
    params
  ) as [any[], any];

  const total = countRows[0].count;
  return { activityTracks: rows as ActivityTrackWithStats[], total };
};

// Get activity track by ID
export const getActivityTrackById = async (id: number): Promise<ActivityTrackWithStats | null> => {
  const [rows] = await db.query(
    `SELECT 
      at.*,
      u.full_name as created_by_name,
      COUNT(ar.id) as total_attendance,
      COUNT(CASE WHEN ar.attendance_type = 'beneficiario' THEN 1 END) as beneficiarios_count,
      COUNT(CASE WHEN ar.attendance_type = 'guest' THEN 1 END) as guests_count
     FROM activity_tracks at
     LEFT JOIN users u ON at.created_by = u.id
     LEFT JOIN attendance_records ar ON at.id = ar.activity_track_id
     WHERE at.id = ?
     GROUP BY at.id`,
    [id]
  ) as [any[], any];

  return rows.length > 0 ? rows[0] as ActivityTrackWithStats : null;
};

// Update activity track
export const updateActivityTrack = async (id: number, data: Partial<ActivityTrack>): Promise<void> => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  
  if (fields.length === 0) return;
  
  await db.query(
    `UPDATE activity_tracks SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [...values, id]
  );
};

// Delete activity track
export const deleteActivityTrack = async (id: number): Promise<void> => {
  const [result] = await db.query('DELETE FROM activity_tracks WHERE id = ?', [id]) as [any, any];
  
  if (result.affectedRows === 0) {
    throw new Error(`Activity track with ID ${id} not found`);
  }
};

// Start QR scanning for an activity track
export const startQRScanning = async (id: number): Promise<void> => {
  // First, stop scanning for all other activity tracks
  await db.query('UPDATE activity_tracks SET scanning_active = false WHERE scanning_active = true');
  
  // Then start scanning for the specified activity track
  const [result] = await db.query(
    'UPDATE activity_tracks SET scanning_active = true, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id]
  ) as [any, any];
  
  if (result.affectedRows === 0) {
    throw new Error(`Activity track with ID ${id} not found`);
  }
};

// Stop QR scanning for an activity track
export const stopQRScanning = async (id: number): Promise<void> => {
  const [result] = await db.query(
    'UPDATE activity_tracks SET scanning_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [id]
  ) as [any, any];
  
  if (result.affectedRows === 0) {
    throw new Error(`Activity track with ID ${id} not found`);
  }
};

// Get currently active scanning activity track
export const getActiveScanningActivityTrack = async (): Promise<ActivityTrack | null> => {
  const [rows] = await db.query(
    'SELECT * FROM activity_tracks WHERE scanning_active = true LIMIT 1'
  ) as [any[], any];

  return rows.length > 0 ? rows[0] as ActivityTrack : null;
};

// Get activity tracks by date range
export const getActivityTracksByDateRange = async (
  startDate: string,
  endDate: string
): Promise<ActivityTrackWithStats[]> => {
  const [rows] = await db.query(
    `SELECT 
      at.*,
      u.full_name as created_by_name,
      COUNT(ar.id) as total_attendance,
      COUNT(CASE WHEN ar.attendance_type = 'beneficiario' THEN 1 END) as beneficiarios_count,
      COUNT(CASE WHEN ar.attendance_type = 'guest' THEN 1 END) as guests_count
     FROM activity_tracks at
     LEFT JOIN users u ON at.created_by = u.id
     LEFT JOIN attendance_records ar ON at.id = ar.activity_track_id
     WHERE at.event_date BETWEEN ? AND ?
     GROUP BY at.id
     ORDER BY at.event_date ASC`,
    [startDate, endDate]
  ) as [any[], any];

  return rows as ActivityTrackWithStats[];
};

// Get upcoming activity tracks
export const getUpcomingActivityTracks = async (limit = 5): Promise<ActivityTrackWithStats[]> => {
  const [rows] = await db.query(
    `SELECT 
      at.*,
      u.full_name as created_by_name,
      COUNT(ar.id) as total_attendance,
      COUNT(CASE WHEN ar.attendance_type = 'beneficiario' THEN 1 END) as beneficiarios_count,
      COUNT(CASE WHEN ar.attendance_type = 'guest' THEN 1 END) as guests_count
     FROM activity_tracks at
     LEFT JOIN users u ON at.created_by = u.id
     LEFT JOIN attendance_records ar ON at.id = ar.activity_track_id
     WHERE at.event_date >= CURDATE() AND at.status = 'active'
     GROUP BY at.id
     ORDER BY at.event_date ASC
     LIMIT ?`,
    [limit]
  ) as [any[], any];

  return rows as ActivityTrackWithStats[];
};
