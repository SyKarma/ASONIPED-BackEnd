import { Request, Response } from 'express';
import * as StatisticsModel from '../models/statistics.model';

// Get dashboard statistics
export const getStatistics = async (req: Request, res: Response): Promise<void> => {
  try {
    const statistics = await StatisticsModel.getStatistics();
    res.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
};

// Get upcoming calendar activities (admin dashboard home - limited)
export const getUpcomingCalendarActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await StatisticsModel.getUpcomingCalendarActivities(limit);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching upcoming calendar activities:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming calendar activities' });
  }
};

// Get calendar activities by month (admin calendar page)
export const getCalendarActivitiesByMonth = async (req: Request, res: Response): Promise<void> => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    
    if (month < 1 || month > 12) {
      res.status(400).json({ error: 'Invalid month. Must be between 1 and 12' });
      return;
    }
    
    const activities = await StatisticsModel.getCalendarActivitiesByMonth(year, month);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching calendar activities by month:', error);
    res.status(500).json({ error: 'Failed to fetch calendar activities by month' });
  }
};

// Get recent activities (admin dashboard)
export const getRecentActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const activities = await StatisticsModel.getRecentActivities(limit);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({ error: 'Failed to fetch recent activities' });
  }
};