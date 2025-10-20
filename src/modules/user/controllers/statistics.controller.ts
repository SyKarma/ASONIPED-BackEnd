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
