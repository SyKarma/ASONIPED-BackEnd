import { db } from '../db';

export interface Volunteer {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  age?: string;
  availability_days?: string;
  availability_time_slots?: string;
  interests?: string;
  skills?: string;
  motivation?: string;
  status?: 'pending' | 'approved' | 'rejected';
  submission_date?: Date;
  volunteer_option_id?: number;
}

export const getAllVolunteers = async (): Promise<Volunteer[]> => {
  const [rows] = await db.query('SELECT * FROM volunteers');
  return rows as Volunteer[];
};

export const createVolunteer = async (volunteer: Volunteer): Promise<void> => {
  await db.query(
    `INSERT INTO volunteers 
      (first_name, last_name, email, phone, age, availability_days, availability_time_slots, interests, skills, motivation, status, volunteer_option_id) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      volunteer.first_name,
      volunteer.last_name,
      volunteer.email,
      volunteer.phone,
      volunteer.age,
      volunteer.availability_days,
      volunteer.availability_time_slots,
      volunteer.interests,
      volunteer.skills,
      volunteer.motivation,
      volunteer.status || 'pending',
      volunteer.volunteer_option_id
    ]
  );
};

// Get volunteers with pagination and filtering
export const getVolunteers = async (
  page = 1,
  limit = 10,
  status?: string,
  name?: string
): Promise<{ volunteers: Volunteer[]; total: number }> => {
  const offset = (page - 1) * limit;
  let where = '';
  const params: any[] = [];

  if (status) {
    where += 'status = ?';
    params.push(status);
  }
  if (name) {
    if (where) where += ' AND ';
    where += '(first_name LIKE ? OR last_name LIKE ?)';
    params.push(`%${name}%`, `%${name}%`);
  }

  const whereClause = where ? `WHERE ${where}` : '';
  const [rows] = await db.query(
    `SELECT * FROM volunteers ${whereClause} LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [countRows] = await db.query(
    `SELECT COUNT(*) as count FROM volunteers ${whereClause}`,
    params
  );
  const total = (countRows as any)[0].count;
  return { volunteers: rows as Volunteer[], total };
};

// Get volunteer by ID
export const getVolunteerById = async (id: number): Promise<Volunteer | null> => {
  const [rows] = await db.query('SELECT * FROM volunteers WHERE id = ?', [id]);
  const volunteers = rows as Volunteer[];
  return volunteers.length > 0 ? volunteers[0] : null;
};

// Update volunteer
export const updateVolunteer = async (id: number, data: Partial<Volunteer>): Promise<void> => {
  await db.query('UPDATE volunteers SET ? WHERE id = ?', [data, id]);
};

// Delete volunteer
export const deleteVolunteer = async (id: number): Promise<void> => {
  await db.query('DELETE FROM volunteers WHERE id = ?', [id]);
};