import { db } from '../../db';

export interface Attendance {
  id?: number;
  nombre: string;
  cedula: string;
  tipo: string;
  created_at?: Date;
}

// Get all attendance records
export const getAllAttendance = async (): Promise<Attendance[]> => {
  const [rows] = await db.query('SELECT * FROM attendance ORDER BY created_at DESC');
  return rows as Attendance[];
};

// Create a new attendance record
export const createAttendance = async (record: Omit<Attendance, 'id' | 'created_at'>): Promise<void> => {
  await db.query(
    'INSERT INTO attendance (nombre, cedula, tipo) VALUES (?, ?, ?)',
    [record.nombre, record.cedula, record.tipo]
  );
};