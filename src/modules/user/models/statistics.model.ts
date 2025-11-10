import { db } from '../../../db';

export interface Statistics {
  users: number;
  volunteers: number;
  workshops: number;
  beneficiaries: number;
  events: number;
  tickets: number;
}

// Get dashboard statistics
export const getStatistics = async (): Promise<Statistics> => {
  try {
    // Get counts for different entities
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE status = "active"') as [any[], any];
    const [volunteerCount] = await db.query('SELECT COUNT(*) as count FROM volunteer_options') as [any[], any];
    const [workshopCount] = await db.query('SELECT COUNT(*) as count FROM workshops') as [any[], any];
    // Count actual records (beneficiaries) - these are the people with disabilities registered in the system
    const [beneficiaryCount] = await db.query('SELECT COUNT(*) as count FROM records WHERE status = "active"') as [any[], any];
    // Count events/news
    const [eventsCount] = await db.query('SELECT COUNT(*) as count FROM events_news') as [any[], any];
    // Count open tickets only (both donation_tickets and anonymous_tickets)
    const [donationTicketsCount] = await db.query("SELECT COUNT(*) as count FROM donation_tickets WHERE status = 'open'") as [any[], any];
    const [anonymousTicketsCount] = await db.query("SELECT COUNT(*) as count FROM anonymous_tickets WHERE status = 'open'") as [any[], any];
    const openTickets = (donationTicketsCount[0].count || 0) + (anonymousTicketsCount[0].count || 0);

    return {
      users: userCount[0].count,
      volunteers: volunteerCount[0].count,
      workshops: workshopCount[0].count,
      beneficiaries: beneficiaryCount[0].count,
      events: eventsCount[0].count,
      tickets: openTickets
    };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw new Error('Failed to fetch statistics');
  }
};

// Get all upcoming calendar activities (workshops, volunteer options, events)
export interface CalendarActivity {
  id: string;
  title: string;
  type: 'workshop' | 'volunteer' | 'event';
  date: string;
  time: string;
  location: string | null;
}

// Helper function to build date filter condition
const buildDateFilter = (columnName: string, startDate?: string, endDate?: string): string => {
  if (!startDate && !endDate) return '';
  
  let conditions: string[] = [];
  
  if (startDate) {
    // Escape single quotes in date string
    const escapedStartDate = startDate.replace(/'/g, "''");
    const startDateFormat = startDate.includes('/') ? '%d/%m/%Y' : '%Y-%m-%d';
    conditions.push(`(
      (${columnName} LIKE '%/%' AND STR_TO_DATE(${columnName}, '%d/%m/%Y') >= STR_TO_DATE('${escapedStartDate}', '${startDateFormat}'))
      OR (${columnName} LIKE '%-%' AND STR_TO_DATE(${columnName}, '%Y-%m-%d') >= STR_TO_DATE('${escapedStartDate}', '${startDateFormat}'))
    )`);
  }
  
  if (endDate) {
    // Escape single quotes in date string
    const escapedEndDate = endDate.replace(/'/g, "''");
    const endDateFormat = endDate.includes('/') ? '%d/%m/%Y' : '%Y-%m-%d';
    conditions.push(`(
      (${columnName} LIKE '%/%' AND STR_TO_DATE(${columnName}, '%d/%m/%Y') <= STR_TO_DATE('${escapedEndDate}', '${endDateFormat}'))
      OR (${columnName} LIKE '%-%' AND STR_TO_DATE(${columnName}, '%Y-%m-%d') <= STR_TO_DATE('${escapedEndDate}', '${endDateFormat}'))
    )`);
  }
  
  return conditions.length > 0 ? `AND (${conditions.join(' AND ')})` : '';
};

// Get upcoming calendar activities (for dashboard home - limited)
export const getUpcomingCalendarActivities = async (limit: number = 10): Promise<CalendarActivity[]> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const workshopDateFilter = buildDateFilter('w.fecha', today);
    const volunteerDateFilter = buildDateFilter('vo.date', today);
    const eventDateFilter = buildDateFilter('en.date', today);
    
    const query = `
      SELECT 
        CONCAT('workshop-', w.id) as id,
        w.titulo as title,
        'workshop' as type,
        w.fecha as date,
        w.hora as time,
        w.ubicacion as location
      FROM workshops w
      WHERE w.fecha IS NOT NULL 
        AND w.fecha != ''
        ${workshopDateFilter}
      
      UNION ALL
      
      SELECT 
        CONCAT('volunteer-', vo.id) as id,
        vo.title,
        'volunteer' as type,
        vo.date,
        vo.hour as time,
        vo.location
      FROM volunteer_options vo
      WHERE vo.date IS NOT NULL 
        AND vo.date != ''
        ${volunteerDateFilter}
      
      UNION ALL
      
      SELECT 
        CONCAT('event-', en.id) as id,
        en.title,
        'event' as type,
        en.date,
        COALESCE(en.hour, '10:00') as time,
        NULL as location
      FROM events_news en
      WHERE en.type = 'evento'
        AND en.date IS NOT NULL 
        AND en.date != ''
        ${eventDateFilter}
      
      ORDER BY 
        CASE 
          WHEN date LIKE '%/%' THEN STR_TO_DATE(date, '%d/%m/%Y')
          WHEN date LIKE '%-%' THEN STR_TO_DATE(date, '%Y-%m-%d')
          ELSE NULL
        END ASC,
        time ASC
      LIMIT ?
    `;
    
    const [activities] = await db.query(query, [limit]) as [any[], any];

    return activities.map((activity: any) => ({
      id: activity.id.toString(),
      title: activity.title || '',
      type: activity.type,
      date: activity.date || '',
      time: activity.time || '10:00',
      location: activity.location || null
    }));
  } catch (error) {
    console.error('Error fetching upcoming calendar activities:', error);
    throw new Error('Failed to fetch upcoming calendar activities');
  }
};

// Get calendar activities by month (for calendar page)
export const getCalendarActivitiesByMonth = async (year: number, month: number): Promise<CalendarActivity[]> => {
  try {
    // Get first and last day of the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // Last day of month
    
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    
    const workshopDateFilter = buildDateFilter('w.fecha', startDateStr, endDateStr);
    const volunteerDateFilter = buildDateFilter('vo.date', startDateStr, endDateStr);
    const eventDateFilter = buildDateFilter('en.date', startDateStr, endDateStr);
    
    const query = `
      SELECT 
        CONCAT('workshop-', w.id) as id,
        w.titulo as title,
        'workshop' as type,
        w.fecha as date,
        w.hora as time,
        w.ubicacion as location
      FROM workshops w
      WHERE w.fecha IS NOT NULL 
        AND w.fecha != ''
        ${workshopDateFilter}
      
      UNION ALL
      
      SELECT 
        CONCAT('volunteer-', vo.id) as id,
        vo.title,
        'volunteer' as type,
        vo.date,
        vo.hour as time,
        vo.location
      FROM volunteer_options vo
      WHERE vo.date IS NOT NULL 
        AND vo.date != ''
        ${volunteerDateFilter}
      
      UNION ALL
      
      SELECT 
        CONCAT('event-', en.id) as id,
        en.title,
        'event' as type,
        en.date,
        COALESCE(en.hour, '10:00') as time,
        NULL as location
      FROM events_news en
      WHERE en.type = 'evento'
        AND en.date IS NOT NULL 
        AND en.date != ''
        ${eventDateFilter}
      
      ORDER BY 
        CASE 
          WHEN date LIKE '%/%' THEN STR_TO_DATE(date, '%d/%m/%Y')
          WHEN date LIKE '%-%' THEN STR_TO_DATE(date, '%Y-%m-%d')
          ELSE NULL
        END ASC,
        time ASC
    `;
    
    const [activities] = await db.query(query) as [any[], any];

    return activities.map((activity: any) => ({
      id: activity.id.toString(),
      title: activity.title || '',
      type: activity.type,
      date: activity.date || '',
      time: activity.time || '10:00',
      location: activity.location || null
    }));
  } catch (error) {
    console.error('Error fetching calendar activities by month:', error);
    throw new Error('Failed to fetch calendar activities by month');
  }
};

// Get recent activities from all sources
export interface RecentActivity {
  id: string;
  title: string;
  type: 'expediente' | 'ticket' | 'taller' | 'voluntario';
  user?: string;
  workshop?: string;
  event?: string;
  time: string;
  timestamp: Date;
}

export const getRecentActivities = async (limit: number = 10): Promise<RecentActivity[]> => {
  try {
    const [activities] = await db.query(`
      SELECT 
        CONCAT('expediente-', r.id) as id,
        CONCAT('Nuevo expediente #', r.record_number) as title,
        'expediente' as type,
        COALESCE(u.full_name, 'Usuario') as user,
        NULL as workshop,
        NULL as event,
        r.created_at as timestamp
      FROM records r
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      
      UNION ALL
      
      SELECT 
        CONCAT('ticket-', dt.id) as id,
        CONCAT('Nuevo ticket de donación') as title,
        'ticket' as type,
        COALESCE(u.full_name, 'Anónimo') as user,
        NULL as workshop,
        NULL as event,
        dt.created_at as timestamp
      FROM donation_tickets dt
      LEFT JOIN users u ON dt.user_id = u.id
      WHERE dt.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      
      UNION ALL
      
      SELECT 
        CONCAT('taller-', we.id) as id,
        CONCAT('Inscripción en taller: ', w.titulo) as title,
        'taller' as type,
        COALESCE(u.full_name, 'Usuario') as user,
        w.titulo as workshop,
        NULL as event,
        we.enrollment_date as timestamp
      FROM workshop_enrollments we
      JOIN workshops w ON we.workshop_id = w.id
      LEFT JOIN users u ON we.user_id = u.id
      WHERE we.enrollment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND we.status = 'enrolled'
      
      UNION ALL
      
      SELECT 
        CONCAT('voluntario-', vr.id) as id,
        CONCAT('Registro en voluntariado: ', vo.title) as title,
        'voluntario' as type,
        COALESCE(u.full_name, 'Usuario') as user,
        NULL as workshop,
        NULL as event,
        vr.registration_date as timestamp
      FROM volunteer_registrations vr
      JOIN volunteer_options vo ON vr.volunteer_option_id = vo.id
      LEFT JOIN users u ON vr.user_id = u.id
      WHERE vr.registration_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        AND vr.status = 'registered'
      
      ORDER BY timestamp DESC
      LIMIT ?
    `, [limit]) as [any[], any];

    return activities.map((activity: any) => ({
      id: activity.id.toString(),
      title: activity.title || '',
      type: activity.type,
      user: activity.user || undefined,
      workshop: activity.workshop || undefined,
      event: activity.event || undefined,
      time: activity.timestamp ? new Date(activity.timestamp).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '',
      timestamp: new Date(activity.timestamp)
    }));
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw new Error('Failed to fetch recent activities');
  }
};
