import { Request, Response } from 'express';
import * as WorkshopEnrollmentsModel from '../models/workshop_enrollments.model';
import * as WorkshopModel from '../models/workshop.model';
import { db } from '../../../db';

// Register for a workshop
export const registerForWorkshop = async (req: Request, res: Response): Promise<void> => {
  try {
    
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { workshop_id, notes } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!workshop_id) {
      res.status(400).json({ error: 'Workshop ID is required' });
      return;
    }

    // Check if workshop exists
    const workshop = await WorkshopModel.WorkshopModel.getById(workshop_id);
    if (!workshop) {
      res.status(404).json({ error: 'Workshop not found' });
      return;
    }

    // Check if user is already enrolled
    const [existingEnrollment] = await db.query(
      'SELECT id, status FROM workshop_enrollments WHERE user_id = ? AND workshop_id = ?',
      [userId, workshop_id]
    );

    if ((existingEnrollment as any[]).length > 0) {
      const enrollment = (existingEnrollment as any[])[0];
      if (enrollment.status === 'enrolled') {
        res.status(400).json({ error: 'User is already enrolled in this workshop' });
        return;
      } else if (enrollment.status === 'cancelled') {
        // Update cancelled enrollment to enrolled
        await db.query(
          'UPDATE workshop_enrollments SET status = "enrolled", enrollment_date = NOW(), cancellation_date = NULL, notes = ? WHERE id = ?',
          [notes || null, enrollment.id]
        );
      }
    } else {
      // Check available spots
      const [enrollmentRows] = await db.query(
        'SELECT COUNT(*) as count FROM workshop_enrollments WHERE workshop_id = ? AND status = "enrolled"',
        [workshop_id]
      );
      const enrolledCount = (enrollmentRows as any[])[0].count;
      
      if (enrolledCount >= workshop.capacidad) {
        res.status(400).json({ error: 'No available spots for this workshop' });
        return;
      }

      // Create new enrollment
      await db.query(
        'INSERT INTO workshop_enrollments (user_id, workshop_id, status, notes) VALUES (?, ?, "enrolled", ?)',
        [userId, workshop_id, notes || null]
      );
    }

    // Get updated available spots
    const [enrollmentRows] = await db.query(
      'SELECT COUNT(*) as count FROM workshop_enrollments WHERE workshop_id = ? AND status = "enrolled"',
      [workshop_id]
    );
    const enrolledCount = (enrollmentRows as any[])[0].count;
    const remainingSpots = workshop.capacidad - enrolledCount;

    res.json({
      message: 'Successfully enrolled in workshop',
      remaining_spots: remainingSpots,
      workshop_title: workshop.titulo
    });
  } catch (error: any) {
    console.error('Error enrolling in workshop:', error);
    
    if (error.code === 'ER_SIGNAL_EXCEPTION') {
      res.status(400).json({ error: error.sqlMessage || 'Enrollment failed' });
    } else {
      res.status(500).json({ error: 'Failed to enroll in workshop' });
    }
  }
};

// Cancel workshop enrollment
export const cancelWorkshopEnrollment = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    const { workshop_id } = req.body;

    console.log('Cancel enrollment - User ID:', userId, 'Workshop ID:', workshop_id);
    console.log('Request user object:', (req as any).user);

    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    if (!workshop_id) {
      res.status(400).json({ error: 'Workshop ID is required' });
      return;
    }

    // Check if user has an enrollment for this workshop (any status except already cancelled)
    const [existingEnrollment] = await db.query(
      'SELECT id, status FROM workshop_enrollments WHERE user_id = ? AND workshop_id = ? AND status != "cancelled"',
      [userId, workshop_id]
    );

    console.log('Existing enrollment query result:', existingEnrollment);

    if ((existingEnrollment as any[]).length === 0) {
      res.status(400).json({ error: 'User is not enrolled in this workshop' });
      return;
    }

    const enrollment = (existingEnrollment as any[])[0];
    
    // If already cancelled, return error
    if (enrollment.status === 'cancelled') {
      res.status(400).json({ error: 'Enrollment is already cancelled' });
      return;
    }

    // Cancel the enrollment
    await db.query(
      'UPDATE workshop_enrollments SET status = "cancelled", cancellation_date = NOW() WHERE user_id = ? AND workshop_id = ? AND status != "cancelled"',
      [userId, workshop_id]
    );

    res.json({
      message: 'Successfully cancelled workshop enrollment'
    });
  } catch (error: any) {
    console.error('Error cancelling workshop enrollment:', error);
    
    if (error.code === 'ER_SIGNAL_EXCEPTION') {
      res.status(400).json({ error: error.sqlMessage || 'Cancellation failed' });
    } else {
      res.status(500).json({ error: 'Failed to cancel workshop enrollment' });
    }
  }
};

// Get user's workshop enrollments
export const getUserEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get user enrollments with workshop details (all statuses except cancelled)
    const [rows] = await db.query(`
      SELECT 
        we.*,
        w.titulo as workshop_titulo,
        w.descripcion as workshop_descripcion,
        w.ubicacion as workshop_ubicacion,
        w.fecha as workshop_fecha,
        w.hora as workshop_hora,
        w.capacidad as workshop_capacidad,
        w.materials as workshop_materiales,
        w.aprender as workshop_aprender,
        w.imagen as workshop_imagen
      FROM workshop_enrollments we
      JOIN workshops w ON we.workshop_id = w.id
      WHERE we.user_id = ? AND we.status != 'cancelled'
      ORDER BY we.enrollment_date DESC
    `, [userId]);

    // Parse materiales JSON for each workshop
    const enrollments = (rows as any[]).map(row => ({
      ...row,
      workshop_materiales: JSON.parse(row.workshop_materiales || '[]')
    }));

    res.json(enrollments);
  } catch (error: any) {
    console.error('Error fetching workshop enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch workshop enrollments', details: error.message });
  }
};

// Get all workshop enrollments (admin only) - with pagination
export const getAllWorkshopEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('getAllWorkshopEnrollments called with query:', req.query);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    
    console.log('Pagination params:', { page, limit, offset });

    // Get total count
    const [countRows] = await db.query('SELECT COUNT(*) as total FROM workshop_enrollments');
    const total = (countRows as any[])[0].total;

    // Get enrollments with workshop and user details
    const [rows] = await db.query(`
      SELECT 
        we.*,
        w.titulo as workshop_titulo,
        w.descripcion as workshop_descripcion,
        w.ubicacion as workshop_ubicacion,
        w.fecha as workshop_fecha,
        w.hora as workshop_hora,
        w.capacidad as workshop_capacidad,
        w.materials as workshop_materiales,
        w.aprender as workshop_aprender,
        w.imagen as workshop_imagen,
        u.full_name as user_full_name,
        u.username as user_username,
        u.email as user_email,
        u.phone as user_phone
      FROM workshop_enrollments we
      JOIN workshops w ON we.workshop_id = w.id
      JOIN users u ON we.user_id = u.id
      ORDER BY we.enrollment_date DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    // Parse materiales JSON for each enrollment
    const enrollments = (rows as any[]).map(row => ({
      ...row,
      workshop_materiales: JSON.parse(row.workshop_materiales || '[]')
    }));

    res.json({
      enrollments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching all workshop enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch workshop enrollments', details: error.message });
  }
};

// Get enrollments for a specific workshop (admin only)
export const getWorkshopEnrollments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workshop_id } = req.params;
    const [enrollments] = await db.query(
      'SELECT we.*, w.titulo as workshop_titulo, u.full_name as user_name FROM workshop_enrollments we JOIN workshops w ON we.workshop_id = w.id JOIN users u ON we.user_id = u.id WHERE we.workshop_id = ?',
      [workshop_id]
    );

    res.json(enrollments);
  } catch (error) {
    console.error('Error fetching workshop enrollments:', error);
    res.status(500).json({ error: 'Failed to fetch workshop enrollments' });
  }
};

// Update workshop enrollment status (admin only)
export const updateWorkshopEnrollmentStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['enrolled', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid status. Must be enrolled or cancelled' });
      return;
    }

    // Update the enrollment status
    const [result] = await db.query(
      'UPDATE workshop_enrollments SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, parseInt(id)]
    );

    if ((result as any).affectedRows === 0) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }

    res.json({ message: 'Enrollment status updated successfully' });
  } catch (error: any) {
    console.error('Error updating workshop enrollment status:', error);
    res.status(500).json({ error: 'Failed to update enrollment status', details: error.message });
  }
};

// Get available spots for a workshop
export const getAvailableSpots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { workshop_id } = req.params;
    
    console.log('getAvailableSpots called with workshop_id:', workshop_id);
    
    // Validate workshop_id parameter
    const workshopId = parseInt(workshop_id);
    if (isNaN(workshopId)) {
      console.error('Invalid workshop_id:', workshop_id);
      res.status(400).json({ error: 'Invalid workshop ID' });
      return;
    }
    
    // First check if workshop exists
    const workshop = await WorkshopModel.WorkshopModel.getById(workshopId);
    if (!workshop) {
      res.status(404).json({ error: 'Workshop not found' });
      return;
    }
    
    // Get workshop capacity
    const [workshopRows] = await db.query('SELECT capacidad FROM workshops WHERE id = ?', [workshopId]);
    if ((workshopRows as any[]).length === 0) {
      res.status(404).json({ error: 'Workshop not found' });
      return;
    }
    const totalSpots = (workshopRows as any[])[0].capacidad;
    
    // Get enrolled count
    const [enrollmentRows] = await db.query(
      'SELECT COUNT(*) as count FROM workshop_enrollments WHERE workshop_id = ? AND status = "enrolled"',
      [workshopId]
    );
    const enrolledCount = (enrollmentRows as any[])[0].count;
    
    const availableSpots = totalSpots - enrolledCount;
    
    const spots = {
      available_spots: availableSpots,
      total_spots: totalSpots,
      enrolled_count: enrolledCount
    };

    res.json(spots);
  } catch (error) {
    console.error('Error fetching available spots:', error);
    res.status(500).json({ error: 'Failed to fetch available spots' });
  }
};
