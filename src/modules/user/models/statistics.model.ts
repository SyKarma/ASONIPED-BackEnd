import { db } from '../../../db';

export interface Statistics {
  users: number;
  volunteers: number;
  workshops: number;
  beneficiaries: number;
}

// Get dashboard statistics
export const getStatistics = async (): Promise<Statistics> => {
  try {
    // Get counts for different entities
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM users WHERE status = "active"') as [any[], any];
    const [volunteerCount] = await db.query('SELECT COUNT(*) as count FROM volunteers') as [any[], any];
    const [workshopCount] = await db.query('SELECT COUNT(*) as count FROM workshops') as [any[], any];
    // Count actual records (beneficiaries) - these are the people with disabilities registered in the system
    const [beneficiaryCount] = await db.query('SELECT COUNT(*) as count FROM records WHERE status = "active"') as [any[], any];

    return {
      users: userCount[0].count,
      volunteers: volunteerCount[0].count,
      workshops: workshopCount[0].count,
      beneficiaries: beneficiaryCount[0].count
    };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw new Error('Failed to fetch statistics');
  }
};
