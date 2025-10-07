import { db } from '../../db';

export interface AttendanceRecord {
  id?: number;
  activity_track_id: number;
  record_id?: number; // For beneficiarios, NULL for guests
  attendance_type: 'beneficiario' | 'guest';
  full_name: string;
  cedula?: string; // Optional for guests
  phone?: string; // Optional for guests
  attendance_method: 'qr_scan' | 'manual_form';
  scanned_at?: Date;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface AttendanceRecordWithDetails extends AttendanceRecord {
  activity_track_name?: string;
  activity_track_date?: string;
  record_number?: string; // From records table for beneficiarios
  created_by_name?: string;
}

export interface QRScanData {
  record_id: number;
  name: string;
}

// Create attendance record (for both QR scan and manual entry)
export const createAttendanceRecord = async (record: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>): Promise<number> => {
  const [result] = await db.query(
    `INSERT INTO attendance_records 
     (activity_track_id, record_id, attendance_type, full_name, cedula, phone, attendance_method, scanned_at, created_by) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.activity_track_id,
      record.record_id || null,
      record.attendance_type,
      record.full_name,
      record.cedula || null,
      record.phone || null,
      record.attendance_method,
      record.scanned_at || new Date(),
      record.created_by
    ]
  );
  return (result as any).insertId;
};

// Process QR code scan
export const processQRScan = async (
  qrData: QRScanData,
  activityTrackId: number,
  createdBy: number
): Promise<AttendanceRecord> => {
  // First, verify the record exists and get the full name
  const [recordRows] = await db.query(
    `SELECT r.id, r.record_number, 
            COALESCE(cpd.full_name, pd.full_name) as full_name
     FROM records r
     LEFT JOIN complete_personal_data cpd ON r.id = cpd.record_id
     LEFT JOIN personal_data pd ON r.id = pd.record_id
     WHERE r.id = ? AND r.status = 'active'`,
    [qrData.record_id]
  ) as [any[], any];

  if (recordRows.length === 0) {
    throw new Error('Record not found or not active');
  }

  const record = recordRows[0];

  // Check if attendance already exists for this record in this activity track
  const [existingRows] = await db.query(
    'SELECT id FROM attendance_records WHERE activity_track_id = ? AND record_id = ? AND attendance_type = "beneficiario"',
    [activityTrackId, qrData.record_id]
  ) as [any[], any];

  if (existingRows.length > 0) {
    throw new Error('Attendance already recorded for this beneficiario in this activity');
  }

  // Create attendance record
  const attendanceRecord: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'> = {
    activity_track_id: activityTrackId,
    record_id: qrData.record_id,
    attendance_type: 'beneficiario',
    full_name: record.full_name,
    attendance_method: 'qr_scan',
    scanned_at: new Date(),
    created_by: createdBy
  };

  const attendanceId = await createAttendanceRecord(attendanceRecord);

  // Return the created record with details
  return await getAttendanceRecordById(attendanceId) as AttendanceRecord;
};

// Get attendance record by ID
export const getAttendanceRecordById = async (id: number): Promise<AttendanceRecordWithDetails | null> => {
  const [rows] = await db.query(
    `SELECT 
      ar.*,
      at.name as activity_track_name,
      at.event_date as activity_track_date,
      r.record_number,
      u.full_name as created_by_name
     FROM attendance_records ar
     LEFT JOIN activity_tracks at ON ar.activity_track_id = at.id
     LEFT JOIN records r ON ar.record_id = r.id
     LEFT JOIN users u ON ar.created_by = u.id
     WHERE ar.id = ?`,
    [id]
  ) as [any[], any];

  return rows.length > 0 ? rows[0] as AttendanceRecordWithDetails : null;
};

// Get attendance records for a specific activity track
export const getAttendanceRecordsByActivityTrack = async (
  activityTrackId: number,
  page = 1,
  limit = 50
): Promise<{ records: AttendanceRecordWithDetails[]; total: number }> => {
  const offset = (page - 1) * limit;

  const [rows] = await db.query(
    `SELECT 
      ar.*,
      at.name as activity_track_name,
      at.event_date as activity_track_date,
      r.record_number,
      u.full_name as created_by_name
     FROM attendance_records ar
     LEFT JOIN activity_tracks at ON ar.activity_track_id = at.id
     LEFT JOIN records r ON ar.record_id = r.id
     LEFT JOIN users u ON ar.created_by = u.id
     WHERE ar.activity_track_id = ?
     ORDER BY ar.scanned_at DESC
     LIMIT ? OFFSET ?`,
    [activityTrackId, limit, offset]
  ) as [any[], any];

  const [countRows] = await db.query(
    'SELECT COUNT(*) as count FROM attendance_records WHERE activity_track_id = ?',
    [activityTrackId]
  ) as [any[], any];

  const total = countRows[0].count;
  return { records: rows as AttendanceRecordWithDetails[], total };
};

// Get attendance records with filtering
export const getAttendanceRecords = async (
  page = 1,
  limit = 50,
  activityTrackId?: number,
  attendanceType?: 'beneficiario' | 'guest',
  attendanceMethod?: 'qr_scan' | 'manual_form',
  startDate?: string,
  endDate?: string
): Promise<{ records: AttendanceRecordWithDetails[]; total: number }> => {
  const offset = (page - 1) * limit;
  let where = '';
  const params: any[] = [];

  if (activityTrackId) {
    where += 'ar.activity_track_id = ?';
    params.push(activityTrackId);
  }

  if (attendanceType) {
    if (where) where += ' AND ';
    where += 'ar.attendance_type = ?';
    params.push(attendanceType);
  }

  if (attendanceMethod) {
    if (where) where += ' AND ';
    where += 'ar.attendance_method = ?';
    params.push(attendanceMethod);
  }

  if (startDate) {
    if (where) where += ' AND ';
    where += 'DATE(ar.scanned_at) >= ?';
    params.push(startDate);
  }

  if (endDate) {
    if (where) where += ' AND ';
    where += 'DATE(ar.scanned_at) <= ?';
    params.push(endDate);
  }

  const whereClause = where ? `WHERE ${where}` : '';

  const [rows] = await db.query(
    `SELECT 
      ar.*,
      at.name as activity_track_name,
      at.event_date as activity_track_date,
      r.record_number,
      u.full_name as created_by_name
     FROM attendance_records ar
     LEFT JOIN activity_tracks at ON ar.activity_track_id = at.id
     LEFT JOIN records r ON ar.record_id = r.id
     LEFT JOIN users u ON ar.created_by = u.id
     ${whereClause}
     ORDER BY ar.scanned_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  ) as [any[], any];

  const [countRows] = await db.query(
    `SELECT COUNT(*) as count FROM attendance_records ar ${whereClause}`,
    params
  ) as [any[], any];

  const total = countRows[0].count;
  return { records: rows as AttendanceRecordWithDetails[], total };
};

// Update attendance record
export const updateAttendanceRecord = async (id: number, data: Partial<AttendanceRecord>): Promise<void> => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  
  if (fields.length === 0) return;
  
  await db.query(
    `UPDATE attendance_records SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [...values, id]
  );
};

// Delete attendance record
export const deleteAttendanceRecord = async (id: number): Promise<void> => {
  const [result] = await db.query('DELETE FROM attendance_records WHERE id = ?', [id]) as [any, any];
  
  if (result.affectedRows === 0) {
    throw new Error(`Attendance record with ID ${id} not found`);
  }
};

// Get attendance statistics for an activity track
export const getAttendanceStats = async (activityTrackId: number): Promise<{
  total_attendance: number;
  beneficiarios_count: number;
  guests_count: number;
  qr_scans_count: number;
  manual_entries_count: number;
}> => {
  const [rows] = await db.query(
    `SELECT 
      COUNT(*) as total_attendance,
      COUNT(CASE WHEN attendance_type = 'beneficiario' THEN 1 END) as beneficiarios_count,
      COUNT(CASE WHEN attendance_type = 'guest' THEN 1 END) as guests_count,
      COUNT(CASE WHEN attendance_method = 'qr_scan' THEN 1 END) as qr_scans_count,
      COUNT(CASE WHEN attendance_method = 'manual_form' THEN 1 END) as manual_entries_count
     FROM attendance_records 
     WHERE activity_track_id = ?`,
    [activityTrackId]
  ) as [any[], any];

  return rows[0];
};

// Get attendance statistics for date range
export const getAttendanceStatsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<{
  total_attendance: number;
  beneficiarios_count: number;
  guests_count: number;
  qr_scans_count: number;
  manual_entries_count: number;
  daily_breakdown: Array<{
    date: string;
    total: number;
    beneficiarios: number;
    guests: number;
  }>;
}> => {
  // Get overall stats
  const [overallRows] = await db.query(
    `SELECT 
      COUNT(*) as total_attendance,
      COUNT(CASE WHEN ar.attendance_type = 'beneficiario' THEN 1 END) as beneficiarios_count,
      COUNT(CASE WHEN ar.attendance_type = 'guest' THEN 1 END) as guests_count,
      COUNT(CASE WHEN ar.attendance_method = 'qr_scan' THEN 1 END) as qr_scans_count,
      COUNT(CASE WHEN ar.attendance_method = 'manual_form' THEN 1 END) as manual_entries_count
     FROM attendance_records ar
     LEFT JOIN activity_tracks at ON ar.activity_track_id = at.id
     WHERE at.event_date BETWEEN ? AND ?`,
    [startDate, endDate]
  ) as [any[], any];

  // Get daily breakdown
  const [dailyRows] = await db.query(
    `SELECT 
      at.event_date as date,
      COUNT(ar.id) as total,
      COUNT(CASE WHEN ar.attendance_type = 'beneficiario' THEN 1 END) as beneficiarios,
      COUNT(CASE WHEN ar.attendance_type = 'guest' THEN 1 END) as guests
     FROM activity_tracks at
     LEFT JOIN attendance_records ar ON at.id = ar.activity_track_id
     WHERE at.event_date BETWEEN ? AND ?
     GROUP BY at.event_date
     ORDER BY at.event_date ASC`,
    [startDate, endDate]
  ) as [any[], any];

  return {
    ...overallRows[0],
    daily_breakdown: dailyRows
  };
};

// Check if a beneficiario has already attended an activity
export const checkBeneficiarioAttendance = async (
  activityTrackId: number,
  recordId: number
): Promise<boolean> => {
  const [rows] = await db.query(
    'SELECT id FROM attendance_records WHERE activity_track_id = ? AND record_id = ? AND attendance_type = "beneficiario"',
    [activityTrackId, recordId]
  ) as [any[], any];

  return rows.length > 0;
};

// Get recent attendance records
export const getRecentAttendanceRecords = async (limit = 10): Promise<AttendanceRecordWithDetails[]> => {
  const [rows] = await db.query(
    `SELECT 
      ar.*,
      at.name as activity_track_name,
      at.event_date as activity_track_date,
      r.record_number,
      u.full_name as created_by_name
     FROM attendance_records ar
     LEFT JOIN activity_tracks at ON ar.activity_track_id = at.id
     LEFT JOIN records r ON ar.record_id = r.id
     LEFT JOIN users u ON ar.created_by = u.id
     ORDER BY ar.scanned_at DESC
     LIMIT ?`,
    [limit]
  ) as [any[], any];

  return rows as AttendanceRecordWithDetails[];
};
