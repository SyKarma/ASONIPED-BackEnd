import { db } from '../../db';

export interface VolunteerOption {
  id?: number;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  location: string;
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