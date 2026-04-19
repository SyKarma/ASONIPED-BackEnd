import crypto from 'crypto';
import { db } from '../../../db';

/** Only cache `true` so adding the column via migration is picked up without restart */
let cachedArchivedColumnExists: boolean | null = null;

export async function hasActivityTracksArchivedColumn(): Promise<boolean> {
  if (cachedArchivedColumnExists === true) {
    return true;
  }
  try {
    const [rows] = (await db.query(
      `SELECT 1 AS ok FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'activity_tracks'
         AND COLUMN_NAME = 'archived'
       LIMIT 1`
    )) as [Array<{ ok: number }>, unknown];
    const exists = rows.length > 0;
    if (exists) {
      cachedArchivedColumnExists = true;
    }
    return exists;
  } catch {
    return false;
  }
}

/**
 * Adds `archived` + index if missing (needs ALTER on `activity_tracks`).
 * Call before archive/unarchive so the UI works without a manual migration when the DB user can ALTER.
 */
export async function ensureActivityTracksArchivedColumn(): Promise<void> {
  if (await hasActivityTracksArchivedColumn()) {
    return;
  }
  try {
    await db.query(
      `ALTER TABLE activity_tracks ADD COLUMN archived TINYINT(1) NOT NULL DEFAULT 0`
    );
  } catch (e: unknown) {
    const err = e as { errno?: number; code?: string };
    if (err.errno === 1060 || err.code === 'ER_DUP_FIELDNAME') {
      cachedArchivedColumnExists = true;
      return;
    }
    throw new Error(
      `No se pudo crear activity_tracks.archived (se requiere permiso ALTER o ejecutar la migración SQL). ${(e as Error).message}`
    );
  }
  try {
    await db.query(`CREATE INDEX idx_activity_tracks_archived ON activity_tracks (archived)`);
  } catch (e: unknown) {
    const err = e as { errno?: number; code?: string };
    if (err.errno !== 1061 && err.code !== 'ER_DUP_KEYNAME') {
      // Index is optional for correctness; ignore other failures (e.g. name collision with different definition)
    }
  }
  cachedArchivedColumnExists = true;
}

export function generateParkingPublicToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export interface ActivityTrack {
  id?: number;
  name: string;
  description?: string;
  event_date: string; // YYYY-MM-DD format
  event_time?: string; // HH:MM:SS format
  location?: string;
  status?: 'active' | 'inactive' | 'completed';
  scanning_active?: boolean;
  parking_enabled?: boolean;
  parking_public_token?: string | null;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
  /** When true, hidden from normal lists; data retained */
  archived?: boolean;
}

export interface ActivityTrackWithStats extends ActivityTrack {
  total_attendance?: number;
  beneficiarios_count?: number;
  guests_count?: number;
  created_by_name?: string;
}

// Create a new activity track
export const createActivityTrack = async (activityTrack: Omit<ActivityTrack, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const parkingEnabled = !!activityTrack.parking_enabled;
  const parkingToken = parkingEnabled
    ? activityTrack.parking_public_token || generateParkingPublicToken()
    : null;

  const hasArchived = await hasActivityTracksArchivedColumn();
  const values = [
    activityTrack.name,
    activityTrack.description || null,
    activityTrack.event_date,
    activityTrack.event_time || null,
    activityTrack.location || null,
    activityTrack.status || 'active',
    activityTrack.scanning_active || false,
    parkingEnabled,
    parkingToken,
    activityTrack.created_by,
  ];

  const [result] = hasArchived
    ? await db.query(
        `INSERT INTO activity_tracks (name, description, event_date, event_time, location, status, scanning_active, parking_enabled, parking_public_token, created_by, archived)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        values
      )
    : await db.query(
        `INSERT INTO activity_tracks (name, description, event_date, event_time, location, status, scanning_active, parking_enabled, parking_public_token, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values
      );
  return (result as any).insertId;
};

/** Escape `%`, `_`, `\` for use in SQL LIKE patterns (literal match). */
function sqlLikeContains(term: string): string {
  const escaped = term.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  return `%${escaped}%`;
}

// Get all activity tracks with optional filtering
export const getActivityTracks = async (
  page = 1,
  limit = 10,
  status?: string,
  createdBy?: number,
  includeArchived = false,
  search?: string
): Promise<{ activityTracks: ActivityTrackWithStats[]; total: number }> => {
  const offset = (page - 1) * limit;
  let where = '';
  const params: any[] = [];
  const hasArchived = await hasActivityTracksArchivedColumn();

  const q = search?.trim();
  if (q) {
    const like = sqlLikeContains(q);
    where +=
      '(at.name LIKE ? OR COALESCE(at.description, \'\') LIKE ? OR COALESCE(at.location, \'\') LIKE ?)';
    params.push(like, like, like);
  }

  if (status) {
    if (where) where += ' AND ';
    where += 'at.status = ?';
    params.push(status);
  }

  if (createdBy) {
    if (where) where += ' AND ';
    where += 'at.created_by = ?';
    params.push(createdBy);
  }

  if (!includeArchived && hasArchived) {
    if (where) where += ' AND ';
    where += 'COALESCE(at.archived, 0) = 0';
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

export const getActivityTrackByParkingToken = async (token: string): Promise<ActivityTrack | null> => {
  const hasArchived = await hasActivityTracksArchivedColumn();
  const sql = hasArchived
    ? 'SELECT * FROM activity_tracks WHERE parking_public_token = ? AND COALESCE(archived, 0) = 0 LIMIT 1'
    : 'SELECT * FROM activity_tracks WHERE parking_public_token = ? LIMIT 1';
  const [rows] = await db.query(sql, [token]) as [ActivityTrack[], unknown];
  return rows.length > 0 ? rows[0] : null;
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

// Delete activity track (hard delete; prefer archiving from UI)
export const deleteActivityTrack = async (id: number): Promise<void> => {
  const [result] = await db.query('DELETE FROM activity_tracks WHERE id = ?', [id]) as [any, any];
  
  if (result.affectedRows === 0) {
    throw new Error(`Activity track with ID ${id} not found`);
  }
};

export const setActivityTrackArchived = async (id: number, archived: boolean): Promise<void> => {
  await ensureActivityTracksArchivedColumn();
  if (archived) {
    const [result] = await db.query(
      `UPDATE activity_tracks SET archived = 1, scanning_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    ) as [any, any];
    if (result.affectedRows === 0) {
      throw new Error(`Activity track with ID ${id} not found`);
    }
  } else {
    const [result] = await db.query(
      'UPDATE activity_tracks SET archived = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    ) as [any, any];
    if (result.affectedRows === 0) {
      throw new Error(`Activity track with ID ${id} not found`);
    }
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
  const hasArchived = await hasActivityTracksArchivedColumn();
  const sql = hasArchived
    ? 'SELECT * FROM activity_tracks WHERE scanning_active = true AND COALESCE(archived, 0) = 0 LIMIT 1'
    : 'SELECT * FROM activity_tracks WHERE scanning_active = true LIMIT 1';
  const [rows] = await db.query(sql) as [any[], any];

  return rows.length > 0 ? rows[0] as ActivityTrack : null;
};

// Get activity tracks by date range
export const getActivityTracksByDateRange = async (
  startDate: string,
  endDate: string
): Promise<ActivityTrackWithStats[]> => {
  const hasArchived = await hasActivityTracksArchivedColumn();
  const archivedClause = hasArchived ? ' AND COALESCE(at.archived, 0) = 0' : '';
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
     WHERE at.event_date BETWEEN ? AND ?${archivedClause}
     GROUP BY at.id
     ORDER BY at.event_date ASC`,
    [startDate, endDate]
  ) as [any[], any];

  return rows as ActivityTrackWithStats[];
};

// Get upcoming activity tracks
export const getUpcomingActivityTracks = async (limit = 5): Promise<ActivityTrackWithStats[]> => {
  const hasArchived = await hasActivityTracksArchivedColumn();
  const archivedClause = hasArchived ? ' AND COALESCE(at.archived, 0) = 0' : '';
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
     WHERE at.event_date >= CURDATE() AND at.status = 'active'${archivedClause}
     GROUP BY at.id
     ORDER BY at.event_date ASC
     LIMIT ?`,
    [limit]
  ) as [any[], any];

  return rows as ActivityTrackWithStats[];
};
