import { db } from '../../db';

export interface WorkshopEnrollment {
  id?: number;
  user_id: number;
  workshop_id: number;
  status: 'enrolled' | 'cancelled';
  enrollment_date: Date;
  cancellation_date?: Date;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface EnrollmentWithDetails extends WorkshopEnrollment {
  user_name: string;
  user_email: string;
  workshop_title: string;
}

export interface AvailableSpots {
  available_spots: number;
  total_spots: number;
  enrolled_count: number;
}

export const WorkshopEnrollmentsModel = {
  // Enroll user in a workshop
  async enrollUser(userId: number, workshopId: number, notes?: string): Promise<{ message: string; remaining_spots: number }> {
    const [result] = await db.query('CALL EnrollInWorkshop(?, ?, ?)', [userId, workshopId, notes || null]);
    return (result as any)[0][0];
  },

  // Cancel workshop enrollment
  async cancelEnrollment(userId: number, workshopId: number): Promise<{ message: string }> {
    const [result] = await db.query('CALL CancelWorkshopEnrollment(?, ?)', [userId, workshopId]);
    return (result as any)[0][0];
  },

  // Get available spots for a workshop
  async getAvailableSpots(workshopId: number): Promise<AvailableSpots> {
    try {
      console.log('Getting available spots for workshop ID:', workshopId);
      
      // Get workshop capacity
      const [workshopRows] = await db.query('SELECT capacidad FROM workshops WHERE id = ?', [workshopId]);
      if ((workshopRows as any[]).length === 0) {
        throw new Error('Workshop not found');
      }
      const totalSpots = (workshopRows as any[])[0].capacidad;
      
      // Get enrolled count
      const [enrollmentRows] = await db.query(
        'SELECT COUNT(*) as count FROM workshop_enrollments WHERE workshop_id = ? AND status = "enrolled"',
        [workshopId]
      );
      const enrolledCount = (enrollmentRows as any[])[0].count;
      
      const availableSpots = totalSpots - enrolledCount;
      
      console.log('Available spots calculation:', { totalSpots, enrolledCount, availableSpots });
      
      return {
        available_spots: availableSpots,
        total_spots: totalSpots,
        enrolled_count: enrolledCount
      };
    } catch (error) {
      console.error('Error in getAvailableSpots:', error);
      throw error;
    }
  },

  // Get user's workshop enrollments
  async getUserEnrollments(userId: number): Promise<EnrollmentWithDetails[]> {
    const [rows] = await db.query(`
      SELECT 
        we.*,
        u.full_name as user_name,
        u.email as user_email,
        w.titulo as workshop_title,
        w.fecha,
        w.hora,
        w.ubicacion
      FROM workshop_enrollments we
      JOIN users u ON we.user_id = u.id
      JOIN workshops w ON we.workshop_id = w.id
      WHERE we.user_id = ?
      ORDER BY we.enrollment_date DESC
    `, [userId]);
    return rows as EnrollmentWithDetails[];
  },

  // Get all enrollments for a specific workshop (admin)
  async getWorkshopEnrollments(workshopId: number): Promise<EnrollmentWithDetails[]> {
    const [rows] = await db.query(`
      SELECT 
        we.*,
        u.full_name as user_name,
        u.email as user_email,
        w.titulo as workshop_title,
        w.fecha,
        w.hora,
        w.ubicacion
      FROM workshop_enrollments we
      JOIN users u ON we.user_id = u.id
      JOIN workshops w ON we.workshop_id = w.id
      WHERE we.workshop_id = ?
      ORDER BY we.enrollment_date DESC
    `, [workshopId]);
    return rows as EnrollmentWithDetails[];
  },

  // Check if user is enrolled in a workshop
  async isUserEnrolled(userId: number, workshopId: number): Promise<boolean> {
    const [rows] = await db.query(
      'SELECT id FROM workshop_enrollments WHERE user_id = ? AND workshop_id = ? AND status = "enrolled"',
      [userId, workshopId]
    );
    return (rows as any[]).length > 0;
  },

  // Get enrollment status for a user and workshop
  async getEnrollmentStatus(userId: number, workshopId: number): Promise<WorkshopEnrollment | null> {
    const [rows] = await db.query(
      'SELECT * FROM workshop_enrollments WHERE user_id = ? AND workshop_id = ?',
      [userId, workshopId]
    );
    return (rows as any[])[0] || null;
  },

  // Get workshop enrollments count
  async getEnrollmentCount(workshopId: number): Promise<number> {
    const [rows] = await db.query(
      'SELECT COUNT(*) as count FROM workshop_enrollments WHERE workshop_id = ? AND status = "enrolled"',
      [workshopId]
    );
    return (rows as any[])[0].count;
  }
};
