import { db } from '../../../db';

export interface WorkshopEnrollment {
  id?: number;
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
  workshopId: string;
  created_at?: string;
}

export const EnrollmentModel = {
  async getAll() {
    const [rows] = await db.query('SELECT * FROM workshop_enrollments');
    return rows as WorkshopEnrollment[];
  },

  async getById(id: number) {
    const [rows] = await db.query('SELECT * FROM workshop_enrollments WHERE id = ?', [id]);
    return (rows as WorkshopEnrollment[])[0];
  },

  async getByWorkshop(workshopId: string) {
    const [rows] = await db.query('SELECT * FROM workshop_enrollments WHERE workshopId = ?', [workshopId]);
    return rows as WorkshopEnrollment[];
  },

  async create(enrollment: WorkshopEnrollment) {
    const { fullName, email, phone, notes, workshopId } = enrollment;
    const [result] = await db.query(
      'INSERT INTO workshop_enrollments (fullName, email, phone, notes, workshopId) VALUES (?, ?, ?, ?, ?)',
      [fullName, email, phone, notes, workshopId]
    );
    return { id: (result as any).insertId, ...enrollment };
  },

  async update(id: number, enrollment: WorkshopEnrollment) {
    const { fullName, email, phone, notes, workshopId } = enrollment;
    const [result] = await db.query(
      'UPDATE workshop_enrollments SET fullName = ?, email = ?, phone = ?, notes = ?, workshopId = ? WHERE id = ?',
      [fullName, email, phone, notes, workshopId, id]
    );
    return result;
  },

async delete(id: number) {
    const [result] = await db.query('DELETE FROM workshop_enrollments WHERE id = ?', [id]);
    return result;
}
};