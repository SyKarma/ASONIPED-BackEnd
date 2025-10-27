import { Request, Response } from 'express';
import { db } from '../../../db';

// Test endpoint to verify backend is working
export const testUserDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    
    res.json({ 
      message: 'User dashboard backend is working!', 
      userId: userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test endpoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's recent activities
export const getUserActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const limit = parseInt(req.query.limit as string) || 5;
    const workshopLimit = Number(Math.ceil(limit / 2));
    const volunteerLimit = Number(Math.ceil(limit / 2));


    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get user's workshop enrollments (including cancelled)
    const workshopEnrollments = await db.execute(`
      SELECT 
        we.id,
        w.titulo as title,
        'workshop' as type,
        w.fecha as date,
        w.hora as time,
        we.status,
        CASE 
          WHEN we.status = 'cancelled' THEN 'Cancelado'
          ELSE 'Inscrito en taller'
        END as description,
        we.created_at
      FROM workshop_enrollments we
      JOIN workshops w ON we.workshop_id = w.id
      WHERE we.user_id = ?
      ORDER BY we.created_at DESC
      LIMIT ${workshopLimit}
    `, [userId]);

    // Get user's volunteer registrations (including cancelled)
    const volunteerRegistrations = await db.execute(`
      SELECT 
        vr.id,
        vo.title,
        'volunteer' as type,
        vo.date,
        vo.hour as time,
        vr.status,
        CASE 
          WHEN vr.status = 'cancelled' THEN 'Cancelado'
          ELSE 'Registrado para voluntariado'
        END as description,
        vr.created_at
      FROM volunteer_registrations vr
      JOIN volunteer_options vo ON vr.volunteer_option_id = vo.id
      WHERE vr.user_id = ? AND (vr.status = 'registered' OR vr.status = 'cancelled')
      ORDER BY vr.created_at DESC
      LIMIT ${volunteerLimit}
    `, [userId]);

    // Get user's attendance records
    const attendanceRecords = await db.execute(`
      SELECT 
        ar.id,
        CONCAT('Asistencia a ', at.name) as title,
        'attendance' as type,
        at.event_date as date,
        at.event_time as time,
        'completed' as status,
        'Asistencia registrada' as description,
        ar.created_at
      FROM attendance_records ar
      JOIN activity_tracks at ON ar.activity_track_id = at.id
      WHERE ar.created_by = ?
      ORDER BY ar.created_at DESC
      LIMIT ${Number(Math.ceil(limit / 2))}
    `, [userId]);

    // Get user's donation tickets
    const donationTickets = await db.execute(`
      SELECT 
        dt.id,
        CONCAT('Ticket de donación #', dt.id) as title,
        'ticket' as type,
        DATE(dt.created_at) as date,
        TIME(dt.created_at) as time,
        dt.status,
        'Ticket de donación creado' as description,
        dt.created_at
      FROM donation_tickets dt
      JOIN donations d ON dt.donation_id = d.id
      WHERE dt.user_id = ?
      ORDER BY dt.created_at DESC
      LIMIT ${Number(Math.ceil(limit / 2))}
    `, [userId]);

    // Combine and sort all activities
    const allActivities = [
      ...(workshopEnrollments[0] as any[]),
      ...(volunteerRegistrations[0] as any[]),
      ...(attendanceRecords[0] as any[]),
      ...(donationTickets[0] as any[])
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
     .slice(0, limit);

    // Transform the data to match frontend interface
    const activities = allActivities.map(activity => {
      // Safely parse date with fallback
      let parsedDate;
      try {
        if (activity.date) {
          const dateObj = new Date(activity.date);
          if (!isNaN(dateObj.getTime())) {
            parsedDate = dateObj.toISOString().split('T')[0];
          } else {
            parsedDate = new Date().toISOString().split('T')[0];
          }
        } else {
          parsedDate = new Date().toISOString().split('T')[0];
        }
      } catch (error) {
        parsedDate = new Date().toISOString().split('T')[0];
      }

      return {
        id: activity.id.toString(),
        title: activity.title,
        type: activity.type,
        date: parsedDate,
        time: activity.time || null,
        status: activity.status,
        description: activity.description
      };
    });

    res.json(activities);
  } catch (error) {
    console.error('Error fetching user activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's calendar events
export const getUserCalendarEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;


    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get user's workshop enrollments for calendar
    const workshopEvents = await db.execute(`
      SELECT 
        we.id,
        w.titulo as title,
        'workshop' as type,
        w.fecha as date,
        w.hora as time,
        w.ubicacion as location,
        we.status
      FROM workshop_enrollments we
      JOIN workshops w ON we.workshop_id = w.id
      WHERE we.user_id = ? AND we.status = 'enrolled'
      ORDER BY w.fecha ASC
    `, [userId]);

    // Get user's volunteer registrations for calendar
    const volunteerEvents = await db.execute(`
      SELECT 
        vr.id,
        vo.title,
        'volunteer' as type,
        vo.date,
        vo.hour as time,
        vo.location,
        vr.status
      FROM volunteer_registrations vr
      JOIN volunteer_options vo ON vr.volunteer_option_id = vo.id
      WHERE vr.user_id = ? AND vr.status = 'registered'
      ORDER BY vo.date ASC
    `, [userId]);

    // Get user's attendance events
    const attendanceEvents = await db.execute(`
      SELECT 
        ar.id,
        at.name as title,
        'attendance' as type,
        at.event_date as date,
        at.event_time as time,
        at.location,
        'registered' as status
      FROM attendance_records ar
      JOIN activity_tracks at ON ar.activity_track_id = at.id
      WHERE ar.record_id = ? AND ar.attendance_type = 'beneficiario'
      ORDER BY at.event_date ASC
    `, [userId]);

    // Combine all events
    const allEvents = [
      ...(workshopEvents[0] as any[]),
      ...(volunteerEvents[0] as any[]),
      ...(attendanceEvents[0] as any[])
    ];

    // Transform the data to match frontend interface
    const events = allEvents.map(event => {
      // Safely parse date with fallback
      let parsedDate;
      try {
        if (event.date) {
          // Handle DD/MM/YYYY format from database
          if (event.date.includes('/')) {
            const [day, month, year] = event.date.split('/');
            const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            if (!isNaN(dateObj.getTime())) {
              parsedDate = dateObj.toISOString().split('T')[0];
            } else {
              parsedDate = new Date().toISOString().split('T')[0];
            }
          } else {
            // Handle other date formats
            const dateObj = new Date(event.date);
            if (!isNaN(dateObj.getTime())) {
              parsedDate = dateObj.toISOString().split('T')[0];
            } else {
              parsedDate = new Date().toISOString().split('T')[0];
            }
          }
        } else {
          parsedDate = new Date().toISOString().split('T')[0];
        }
      } catch (error) {
        parsedDate = new Date().toISOString().split('T')[0];
      }

      return {
        id: event.id.toString(),
        title: event.title,
        type: event.type,
        date: parsedDate,
        time: event.time || '10:00',
        location: event.location || null,
        status: event.status
      };
    });

    res.json(events);
  } catch (error) {
    console.error('Error fetching user calendar events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user statistics
export const getUserStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Get total workshops enrolled
    const [workshopCount] = await db.execute(`
      SELECT COUNT(*) as count
      FROM workshop_enrollments
      WHERE user_id = ?
    `, [userId]);

    // Get total volunteer activities
    const [volunteerCount] = await db.execute(`
      SELECT COUNT(*) as count
      FROM volunteer_registrations
      WHERE user_id = ?
    `, [userId]);

    // Get total records
    const [recordCount] = await db.execute(`
      SELECT COUNT(*) as count
      FROM records
      WHERE user_id = ?
    `, [userId]);

    // Get upcoming events (next 30 days)
    const [upcomingCount] = await db.execute(`
      SELECT COUNT(*) as count
      FROM (
        SELECT we.id FROM workshop_enrollments we
        JOIN workshops w ON we.workshop_id = w.id
        WHERE we.user_id = ? AND w.fecha BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        UNION
        SELECT vr.id FROM volunteer_registrations vr
        JOIN volunteer_options vo ON vr.volunteer_option_id = vo.id
        WHERE vr.user_id = ? AND vo.date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ) as upcoming_events
    `, [userId, userId]);

    const stats = {
      totalWorkshops: (workshopCount as any[])[0]?.count || 0,
      totalVolunteerActivities: (volunteerCount as any[])[0]?.count || 0,
      totalRecords: (recordCount as any[])[0]?.count || 0,
      upcomingEvents: (upcomingCount as any[])[0]?.count || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
