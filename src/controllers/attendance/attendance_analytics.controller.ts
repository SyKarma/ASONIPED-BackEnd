import { Request, Response } from 'express';
import * as ActivityTrackModel from '../../models/attendance/activity_track.model';
import * as AttendanceRecordModel from '../../models/attendance/attendance_record.model';
import { db } from '../../db';

// Get comprehensive attendance analytics overview
export const getAttendanceAnalyticsOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    // Get overall statistics
    let overallStats;
    if (startDate && endDate) {
      overallStats = await AttendanceRecordModel.getAttendanceStatsByDateRange(
        startDate as string,
        endDate as string
      );
    } else {
      // Get stats for all time
      const [rows] = await db.query(
        `SELECT 
          COUNT(*) as total_attendance,
          COUNT(CASE WHEN ar.attendance_type = 'beneficiario' THEN 1 END) as beneficiarios_count,
          COUNT(CASE WHEN ar.attendance_type = 'guest' THEN 1 END) as guests_count,
          COUNT(CASE WHEN ar.attendance_method = 'qr_scan' THEN 1 END) as qr_scans_count,
          COUNT(CASE WHEN ar.attendance_method = 'manual_form' THEN 1 END) as manual_entries_count
         FROM attendance_records ar`
      ) as [any[], any];
      
      overallStats = {
        total_attendance: rows[0].total_attendance,
        beneficiarios_count: rows[0].beneficiarios_count,
        guests_count: rows[0].guests_count,
        qr_scans_count: rows[0].qr_scans_count,
        manual_entries_count: rows[0].manual_entries_count,
        daily_breakdown: []
      };
    }

    // Get activity track statistics
    const [activityStats] = await db.query(
      `SELECT 
        COUNT(*) as total_activities,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_activities,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_activities,
        AVG(attendance_count) as avg_attendance_per_activity
       FROM (
         SELECT at.*, COUNT(ar.id) as attendance_count
         FROM activity_tracks at
         LEFT JOIN attendance_records ar ON at.id = ar.activity_track_id
         GROUP BY at.id
       ) as activity_with_attendance`
    ) as [any[], any];

    // Get top performing activities
    const [topActivities] = await db.query(
      `SELECT 
        at.id,
        at.name,
        at.event_date,
        COUNT(ar.id) as attendance_count,
        COUNT(CASE WHEN ar.attendance_type = 'beneficiario' THEN 1 END) as beneficiarios_count,
        COUNT(CASE WHEN ar.attendance_type = 'guest' THEN 1 END) as guests_count
       FROM activity_tracks at
       LEFT JOIN attendance_records ar ON at.id = ar.activity_track_id
       GROUP BY at.id
       ORDER BY attendance_count DESC
       LIMIT 5`
    ) as [any[], any];

    // Get attendance trends (last 30 days)
    const [trends] = await db.query(
      `SELECT 
        DATE(ar.scanned_at) as date,
        COUNT(ar.id) as total_attendance,
        COUNT(CASE WHEN ar.attendance_type = 'beneficiario' THEN 1 END) as beneficiarios_count,
        COUNT(CASE WHEN ar.attendance_type = 'guest' THEN 1 END) as guests_count
       FROM attendance_records ar
       WHERE ar.scanned_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
       GROUP BY DATE(ar.scanned_at)
       ORDER BY date DESC`
    ) as [any[], any];

    res.json({
      overview: {
        overall_stats: overallStats,
        activity_stats: activityStats[0],
        top_activities: topActivities,
        attendance_trends: trends
      }
    });
  } catch (err) {
    console.error('Error getting attendance analytics overview:', err);
    res.status(500).json({ error: 'Error getting attendance analytics overview' });
  }
};

// Get detailed activity report
export const getActivityReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const activityTrackId = parseInt(req.params.activityTrackId);
    
    if (!activityTrackId || isNaN(activityTrackId)) {
      res.status(400).json({ error: 'Invalid activity track ID' });
      return;
    }

    // Get activity track details
    const activityTrack = await ActivityTrackModel.getActivityTrackById(activityTrackId);
    if (!activityTrack) {
      res.status(404).json({ error: 'Activity track not found' });
      return;
    }

    // Get attendance statistics
    const stats = await AttendanceRecordModel.getAttendanceStats(activityTrackId);

    // Get detailed attendance records
    const { records } = await AttendanceRecordModel.getAttendanceRecordsByActivityTrack(
      activityTrackId,
      1,
      1000 // Get all records for the report
    );

    // Separate beneficiarios and guests
    const beneficiarios = records.filter(record => record.attendance_type === 'beneficiario');
    const guests = records.filter(record => record.attendance_type === 'guest');

    // Get attendance by method
    const qrScans = records.filter(record => record.attendance_method === 'qr_scan');
    const manualEntries = records.filter(record => record.attendance_method === 'manual_form');

    // Get attendance by time (hourly breakdown)
    const [hourlyBreakdown] = await db.query(
      `SELECT 
        HOUR(scanned_at) as hour,
        COUNT(*) as count
       FROM attendance_records 
       WHERE activity_track_id = ?
       GROUP BY HOUR(scanned_at)
       ORDER BY hour`
    ) as [any[], any];

    res.json({
      activity_track: activityTrack,
      statistics: stats,
      breakdown: {
        by_type: {
          beneficiarios: {
            count: beneficiarios.length,
            records: beneficiarios
          },
          guests: {
            count: guests.length,
            records: guests
          }
        },
        by_method: {
          qr_scans: {
            count: qrScans.length,
            records: qrScans
          },
          manual_entries: {
            count: manualEntries.length,
            records: manualEntries
          }
        },
        hourly_breakdown: hourlyBreakdown
      }
    });
  } catch (err) {
    console.error('Error generating activity report:', err);
    res.status(500).json({ error: 'Error generating activity report' });
  }
};

// Get attendance comparison between activities
export const getActivityComparison = async (req: Request, res: Response): Promise<void> => {
  try {
    const { activityIds } = req.query;
    
    if (!activityIds || typeof activityIds !== 'string') {
      res.status(400).json({ error: 'Activity IDs are required' });
      return;
    }

    const ids = activityIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    
    if (ids.length < 2) {
      res.status(400).json({ error: 'At least 2 activity IDs are required for comparison' });
      return;
    }

    const comparison = [];

    for (const activityId of ids) {
      const activityTrack = await ActivityTrackModel.getActivityTrackById(activityId);
      if (activityTrack) {
        const stats = await AttendanceRecordModel.getAttendanceStats(activityId);
        comparison.push({
          activity_track: activityTrack,
          statistics: stats
        });
      }
    }

    res.json({ comparison });
  } catch (err) {
    console.error('Error getting activity comparison:', err);
    res.status(500).json({ error: 'Error getting activity comparison' });
  }
};

// Get attendance patterns and insights
export const getAttendanceInsights = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    // Get most active days of the week
    const [dayOfWeekStats] = await db.query(
      `SELECT 
        DAYNAME(ar.scanned_at) as day_name,
        DAYOFWEEK(ar.scanned_at) as day_number,
        COUNT(*) as attendance_count,
        COUNT(CASE WHEN ar.attendance_type = 'beneficiario' THEN 1 END) as beneficiarios_count,
        COUNT(CASE WHEN ar.attendance_type = 'guest' THEN 1 END) as guests_count
       FROM attendance_records ar
       ${startDate && endDate ? 'WHERE DATE(ar.scanned_at) BETWEEN ? AND ?' : ''}
       GROUP BY DAYOFWEEK(ar.scanned_at), DAYNAME(ar.scanned_at)
       ORDER BY day_number`
    ) as [any[], any];

    // Get most active hours
    const [hourlyStats] = await db.query(
      `SELECT 
        HOUR(ar.scanned_at) as hour,
        COUNT(*) as attendance_count
       FROM attendance_records ar
       ${startDate && endDate ? 'WHERE DATE(ar.scanned_at) BETWEEN ? AND ?' : ''}
       GROUP BY HOUR(ar.scanned_at)
       ORDER BY attendance_count DESC
       LIMIT 10`
    ) as [any[], any];

    // Get QR vs Manual entry trends
    const [methodTrends] = await db.query(
      `SELECT 
        DATE(ar.scanned_at) as date,
        COUNT(CASE WHEN ar.attendance_method = 'qr_scan' THEN 1 END) as qr_scans,
        COUNT(CASE WHEN ar.attendance_method = 'manual_form' THEN 1 END) as manual_entries,
        COUNT(*) as total
       FROM attendance_records ar
       ${startDate && endDate ? 'WHERE DATE(ar.scanned_at) BETWEEN ? AND ?' : ''}
       GROUP BY DATE(ar.scanned_at)
       ORDER BY date DESC
       LIMIT 30`
    ) as [any[], any];

    // Get top beneficiarios by attendance frequency
    const [topBeneficiarios] = await db.query(
      `SELECT 
        ar.record_id,
        ar.full_name,
        COUNT(*) as attendance_count,
        COUNT(DISTINCT ar.activity_track_id) as activities_attended
       FROM attendance_records ar
       WHERE ar.attendance_type = 'beneficiario'
       ${startDate && endDate ? 'AND DATE(ar.scanned_at) BETWEEN ? AND ?' : ''}
       GROUP BY ar.record_id, ar.full_name
       ORDER BY attendance_count DESC
       LIMIT 10`
    ) as [any[], any];

    res.json({
      insights: {
        day_of_week_patterns: dayOfWeekStats,
        hourly_patterns: hourlyStats,
        method_trends: methodTrends,
        top_beneficiarios: topBeneficiarios
      }
    });
  } catch (err) {
    console.error('Error getting attendance insights:', err);
    res.status(500).json({ error: 'Error getting attendance insights' });
  }
};

// Export attendance data for external analysis
export const exportAttendanceData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    let whereClause = '';
    const params: any[] = [];

    if (startDate && endDate) {
      whereClause = 'WHERE DATE(ar.scanned_at) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const [exportData] = await db.query(
      `SELECT 
        ar.id,
        ar.activity_track_id,
        at.name as activity_name,
        at.event_date,
        at.event_time,
        at.location,
        ar.record_id,
        r.record_number,
        ar.attendance_type,
        ar.full_name,
        ar.cedula,
        ar.phone,
        ar.attendance_method,
        ar.scanned_at,
        u.full_name as created_by_name,
        ar.created_at
       FROM attendance_records ar
       LEFT JOIN activity_tracks at ON ar.activity_track_id = at.id
       LEFT JOIN records r ON ar.record_id = r.id
       LEFT JOIN users u ON ar.created_by = u.id
       ${whereClause}
       ORDER BY ar.scanned_at DESC`
    ) as [any[], any];

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = [
        'ID', 'Activity Track ID', 'Activity Name', 'Event Date', 'Event Time', 'Location',
        'Record ID', 'Record Number', 'Attendance Type', 'Full Name', 'Cedula', 'Phone',
        'Attendance Method', 'Scanned At', 'Created By', 'Created At'
      ].join(',');

      const csvRows = exportData.map((row: any) => [
        row.id,
        row.activity_track_id,
        `"${row.activity_name || ''}"`,
        row.event_date || '',
        row.event_time || '',
        `"${row.location || ''}"`,
        row.record_id || '',
        `"${row.record_number || ''}"`,
        row.attendance_type,
        `"${row.full_name}"`,
        `"${row.cedula || ''}"`,
        `"${row.phone || ''}"`,
        row.attendance_method,
        row.scanned_at,
        `"${row.created_by_name || ''}"`,
        row.created_at
      ].join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance_export.csv"');
      res.send(csvContent);
    } else {
      res.json({
        export_data: exportData,
        metadata: {
          total_records: exportData.length,
          export_date: new Date().toISOString(),
          date_range: startDate && endDate ? { start: startDate, end: endDate } : 'all_time'
        }
      });
    }
  } catch (err) {
    console.error('Error exporting attendance data:', err);
    res.status(500).json({ error: 'Error exporting attendance data' });
  }
};
