import { db } from '../../../db';

export type ParkingRegistrationSource = 'public_link' | 'admin';

export interface ActivityParkingRegistration {
  id?: number;
  activity_track_id: number;
  plate_raw: string;
  plate_normalized: string;
  full_name?: string | null;
  cedula?: string | null;
  phone?: string | null;
  source: ParkingRegistrationSource;
  created_by?: number | null;
  created_at?: Date;
}

/** Normalize plate for uniqueness (uppercase, strip spaces/dashes, alphanumeric only). */
export function normalizeParkingPlate(input: string): string {
  return input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 20);
}

export async function listByActivityTrackId(activityTrackId: number): Promise<ActivityParkingRegistration[]> {
  const [rows] = await db.query(
    `SELECT id, activity_track_id, plate_raw, plate_normalized, full_name, cedula, phone, source, created_by, created_at
     FROM activity_parking_registrations
     WHERE activity_track_id = ?
     ORDER BY created_at DESC`,
    [activityTrackId]
  ) as [ActivityParkingRegistration[], unknown];
  return rows || [];
}

export async function createParkingRegistration(
  activityTrackId: number,
  plateRaw: string,
  plateNormalized: string,
  fullName: string | null | undefined,
  cedula: string | null | undefined,
  phone: string | null | undefined,
  source: ParkingRegistrationSource,
  createdBy: number | null
): Promise<number> {
  const [result] = await db.query(
    `INSERT INTO activity_parking_registrations
      (activity_track_id, plate_raw, plate_normalized, full_name, cedula, phone, source, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      activityTrackId,
      plateRaw.slice(0, 32),
      plateNormalized.slice(0, 32),
      fullName?.trim() || null,
      cedula?.trim() || null,
      phone?.trim() ? phone.trim().slice(0, 30) : null,
      source,
      createdBy,
    ]
  );
  return (result as { insertId: number }).insertId;
}
