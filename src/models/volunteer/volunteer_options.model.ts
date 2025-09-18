import { db } from '../../db';

export interface VolunteerOption {
  id?: number;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  location: string;
}

export interface VolunteerOptionProposal {
  id?: number;
  user_id: number;
  title: string;
  proposal: string;
  location: string;
  date: string;
  tools: string;
  document_path?: string;
  created_at?: Date;
  status?: 'pending' | 'approved' | 'rejected';
  admin_note?: string;
}

// Get all volunteer options
export const getAllVolunteerOptions = async (): Promise<VolunteerOption[]> => {
  const [rows] = await db.query('SELECT * FROM volunteer_options');
  return rows as VolunteerOption[];
};

// Add a new volunteer option
export const createVolunteerOption = async (option: Omit<VolunteerOption, 'id'>): Promise<void> => {
  await db.query(
    `INSERT INTO volunteer_options (title, description, imageUrl, date, location) VALUES (?, ?, ?, ?, ?)`,
    [option.title, option.description, option.imageUrl, option.date, option.location]
  );
};

// Update a volunteer option
export const updateVolunteerOption = async (id: number, option: Omit<VolunteerOption, 'id'>): Promise<void> => {
  await db.query(
    `UPDATE volunteer_options SET title=?, description=?, imageUrl=?, date=?, location=? WHERE id=?`,
    [option.title, option.description, option.imageUrl, option.date, option.location, id]
  );
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
    `INSERT INTO volunteer_option_proposals (user_id, title, proposal, location, date, tools, document_path)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [proposal.user_id, proposal.title, proposal.proposal, proposal.location, proposal.date, proposal.tools, proposal.document_path || null]
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
  const [rows] = await db.query('SELECT * FROM volunteer_option_proposals ORDER BY created_at DESC');
  return rows as VolunteerOptionProposal[];
};

export const updateProposalStatus = async (
  id: number,
  status: 'approved' | 'rejected',
  adminNote?: string
): Promise<void> => {
  await db.query(
    'UPDATE volunteer_option_proposals SET status = ?, admin_note = ? WHERE id = ?',
    [status, adminNote || null, id]
  );
};