import { db } from '../../db';

export interface VolunteerOption {
  id?: number;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  location: string;
  skills?: string;
  tools?: string;
  hour: string;
  spots: number;
  available_spots?: number;
  registered_count?: number;
  is_registered?: boolean;
}

export interface VolunteerOptionProposal {
  id?: number;
  user_id: number;
  title: string;
  proposal: string;
  location: string;
  date: string;
  tools: string;
  hour?: string;
  spots?: number;
  document_path?: string;
  created_at?: Date;
  status?: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
  full_name?: string;
  email?: string;
}

export interface VolunteerRegistration {
  id?: number;
  user_id: number;
  volunteer_option_id: number;
  status: 'registered' | 'cancelled';
  registration_date?: Date;
  cancellation_date?: Date;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface UserVolunteerRegistration {
  id: number;
  volunteer_option_id: number;
  status: 'registered' | 'cancelled';
  registration_date: Date;
  cancellation_date?: Date;
  notes?: string;
  volunteer_option: {
    id: number;
    title: string;
    description: string;
    date: string;
    location: string;
    hour: string;
    spots: number;
    imageUrl?: string;
    available_spots: number;
    registered_count: number;
  };
}

// Get all volunteer options with registration data
export const getAllVolunteerOptions = async (userId?: number): Promise<VolunteerOption[]> => {
  const query = `
    SELECT 
      vo.*,
      COALESCE(registered_count.count, 0) as registered_count,
      (vo.spots - COALESCE(registered_count.count, 0)) as available_spots,
      CASE 
        WHEN ? IS NOT NULL AND user_registration.id IS NOT NULL THEN 1 
        ELSE 0 
      END as is_registered
    FROM volunteer_options vo
    LEFT JOIN (
      SELECT volunteer_option_id, COUNT(*) as count
      FROM volunteer_registrations 
      WHERE status = 'registered'
      GROUP BY volunteer_option_id
    ) registered_count ON vo.id = registered_count.volunteer_option_id
    LEFT JOIN volunteer_registrations user_registration ON vo.id = user_registration.volunteer_option_id 
      AND user_registration.user_id = ? 
      AND user_registration.status = 'registered'
    ORDER BY vo.id DESC
  `;
  
  const [rows] = await db.query(query, [userId, userId]);
  return rows as VolunteerOption[];
};

// Add a new volunteer option
export const createVolunteerOption = async (option: Omit<VolunteerOption, 'id'>): Promise<void> => {
  try {
    console.log('Model: Creating volunteer option with data:', option);
    
    // Check if the table has the new columns
    try {
      console.log('Model: Attempting to insert with new columns...');
      await db.query(
        `INSERT INTO volunteer_options (title, description, imageUrl, date, location, skills, tools, hour, spots) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [option.title, option.description, option.imageUrl, option.date, option.location, option.skills || null, option.tools || null, option.hour, option.spots]
      );
      console.log('Model: Volunteer option created successfully with new columns');
    } catch (columnError: any) {
      if (columnError.code === 'ER_BAD_FIELD_ERROR' || columnError.message?.includes('Unknown column')) {
        console.log('Model: New columns not found, falling back to old schema...');
        // Fallback to old schema without hour and spots
        await db.query(
          `INSERT INTO volunteer_options (title, description, imageUrl, date, location, skills, tools) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [option.title, option.description, option.imageUrl, option.date, option.location, option.skills || null, option.tools || null]
        );
        console.log('Model: Volunteer option created successfully with old schema');
      } else {
        throw columnError;
      }
    }
  } catch (error) {
    console.error('Model: Error creating volunteer option:', error);
    throw error;
  }
};

// Update a volunteer option
export const updateVolunteerOption = async (id: number, option: Omit<VolunteerOption, 'id'>): Promise<void> => {
  try {
    console.log('Model: Updating volunteer option with data:', option);
    
    // Check if the table has the new columns
    try {
      console.log('Model: Attempting to update with new columns...');
      await db.query(
        `UPDATE volunteer_options SET title=?, description=?, imageUrl=?, date=?, location=?, skills=?, tools=?, hour=?, spots=? WHERE id=?`,
        [option.title, option.description, option.imageUrl, option.date, option.location, option.skills || null, option.tools || null, option.hour, option.spots, id]
      );
      console.log('Model: Volunteer option updated successfully with new columns');
    } catch (columnError: any) {
      if (columnError.code === 'ER_BAD_FIELD_ERROR' || columnError.message?.includes('Unknown column')) {
        console.log('Model: New columns not found, falling back to old schema...');
        // Fallback to old schema without hour and spots
        await db.query(
          `UPDATE volunteer_options SET title=?, description=?, imageUrl=?, date=?, location=?, skills=?, tools=? WHERE id=?`,
          [option.title, option.description, option.imageUrl, option.date, option.location, option.skills || null, option.tools || null, id]
        );
        console.log('Model: Volunteer option updated successfully with old schema');
      } else {
        throw columnError;
      }
    }
  } catch (error) {
    console.error('Model: Error updating volunteer option:', error);
    throw error;
  }
};

// Delete a volunteer option
export const deleteVolunteerOption = async (id: number): Promise<void> => {
  // First, update any volunteers that reference this option to set volunteer_option_id to NULL
  await db.query('UPDATE volunteers SET volunteer_option_id = NULL WHERE volunteer_option_id = ?', [id]);
  // Then delete the option
  await db.query('DELETE FROM volunteer_options WHERE id = ?', [id]);
};

// Store a volunteer option proposal locally
export const createVolunteerOptionProposal = async (proposal: Omit<VolunteerOptionProposal, 'id' | 'created_at' | 'status' | 'admin_note'>): Promise<void> => {
  await db.query(
    `INSERT INTO volunteer_option_proposals (user_id, title, proposal, location, date, tools, hour, spots, document_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [proposal.user_id, proposal.title, proposal.proposal, proposal.location, proposal.date, proposal.tools, proposal.hour || null, proposal.spots || null, proposal.document_path || null]
  );
};

export const getProposalsByUser = async (userId: number): Promise<VolunteerOptionProposal[]> => {
  const [rows] = await db.query(
    'SELECT * FROM volunteer_option_proposals WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows as VolunteerOptionProposal[];
};

export const getAllProposals = async (): Promise<VolunteerOptionProposal[]> => {
  const [rows] = await db.query(`
    SELECT 
      vop.*,
      u.full_name,
      u.email
    FROM volunteer_option_proposals vop
    LEFT JOIN users u ON vop.user_id = u.id
    ORDER BY vop.created_at DESC
  `);
  return rows as VolunteerOptionProposal[];
};

export const updateProposalStatus = async (
  id: number,
  status: 'approved' | 'rejected' | 'filed',
  adminNote?: string
): Promise<void> => {
  await db.query(
    'UPDATE volunteer_option_proposals SET status = ?, admin_note = ? WHERE id = ?',
    [status, adminNote || null, id]
  );
};

export const deleteProposal = async (id: number): Promise<void> => {
  await db.query('DELETE FROM volunteer_option_proposals WHERE id = ?', [id]);
};

// Registration functions
export const registerForVolunteer = async (userId: number, volunteerOptionId: number, notes?: string): Promise<void> => {
  try {
    // First, check if user has a cancelled registration for this volunteer option
    const [existingRows] = await db.query(
      'SELECT id, status FROM volunteer_registrations WHERE user_id = ? AND volunteer_option_id = ?',
      [userId, volunteerOptionId]
    ) as [any[], any];

    if (existingRows.length > 0) {
      const existing = existingRows[0];
      if (existing.status === 'registered') {
        throw new Error('User is already registered for this volunteer option');
      } else if (existing.status === 'cancelled') {
        // Update the cancelled registration to registered
        await db.query(
          'UPDATE volunteer_registrations SET status = ?, registration_date = NOW(), cancellation_date = NULL, notes = ? WHERE id = ?',
          ['registered', notes || null, existing.id]
        );
        return;
      }
    }

    // If no existing record, create a new one
    await db.query(
      'INSERT INTO volunteer_registrations (user_id, volunteer_option_id, notes) VALUES (?, ?, ?)',
      [userId, volunteerOptionId, notes || null]
    );
  } catch (error: any) {
    if (error.message === 'User is already registered for this volunteer option') {
      throw error;
    }
    throw error;
  }
};

export const cancelVolunteerRegistration = async (userId: number, volunteerOptionId: number): Promise<void> => {
  const [result] = await db.query(
    'UPDATE volunteer_registrations SET status = ?, cancellation_date = NOW() WHERE user_id = ? AND volunteer_option_id = ? AND status = ?',
    ['cancelled', userId, volunteerOptionId, 'registered']
  );
  
  if ((result as any).affectedRows === 0) {
    throw new Error('User is not registered for this volunteer option');
  }
};

export const getUserRegistrations = async (userId: number): Promise<UserVolunteerRegistration[]> => {
  const [rows] = await db.query(
    `SELECT 
      vr.id,
      vr.volunteer_option_id,
      vr.status,
      vr.registration_date,
      vr.cancellation_date,
      vr.notes,
      vo.id as volunteer_option_id,
      vo.title as volunteer_option_title,
      vo.description as volunteer_option_description,
      vo.date as volunteer_option_date,
      vo.location as volunteer_option_location,
      vo.hour as volunteer_option_hour,
      vo.spots as volunteer_option_spots,
      vo.imageUrl as volunteer_option_imageUrl,
      (vo.spots - COALESCE(registered_count.count, 0)) as available_spots,
      COALESCE(registered_count.count, 0) as registered_count
    FROM volunteer_registrations vr
    LEFT JOIN volunteer_options vo ON vr.volunteer_option_id = vo.id
    LEFT JOIN (
      SELECT 
        volunteer_option_id,
        COUNT(*) as count
      FROM volunteer_registrations 
      WHERE status = 'registered'
      GROUP BY volunteer_option_id
    ) registered_count ON vo.id = registered_count.volunteer_option_id
    WHERE vr.user_id = ? 
    ORDER BY vr.registration_date DESC`,
    [userId]
  );
  
  // Transform the flat result into the nested structure expected by frontend
  return (rows as any[]).map(row => ({
    id: row.id,
    volunteer_option_id: row.volunteer_option_id,
    status: row.status,
    registration_date: row.registration_date,
    cancellation_date: row.cancellation_date,
    notes: row.notes,
    volunteer_option: {
      id: row.volunteer_option_id,
      title: row.volunteer_option_title,
      description: row.volunteer_option_description,
      date: row.volunteer_option_date,
      location: row.volunteer_option_location,
      hour: row.volunteer_option_hour,
      spots: row.volunteer_option_spots,
      imageUrl: row.volunteer_option_imageUrl,
      available_spots: row.available_spots,
      registered_count: row.registered_count
    }
  }));
};

export const getVolunteerRegistrations = async (volunteerOptionId: number): Promise<VolunteerRegistration[]> => {
  const [rows] = await db.query(
    `SELECT vr.*, u.full_name, u.email 
     FROM volunteer_registrations vr 
     LEFT JOIN users u ON vr.user_id = u.id 
     WHERE vr.volunteer_option_id = ? AND vr.status = 'registered'
     ORDER BY vr.registration_date ASC`,
    [volunteerOptionId]
  );
  return rows as VolunteerRegistration[];
};

export const getAvailableSpots = async (volunteerOptionId: number): Promise<{available_spots: number, total_spots: number, registered_count: number}> => {
  const [rows] = await db.query('CALL GetAvailableSpots(?)', [volunteerOptionId]);
  return (rows as any)[0][0];
};