import { db } from '../../db';
import type { User } from '../user/user.model';

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

// Find existing volunteer record by email and option to avoid duplicates
export const findVolunteerByEmailAndOption = async (
  email: string,
  volunteerOptionId: number
): Promise<Volunteer | null> => {
  const [rows] = await db.query(
    'SELECT * FROM volunteers WHERE email = ? AND volunteer_option_id = ? LIMIT 1',
    [email, volunteerOptionId]
  );
  const volunteers = rows as Volunteer[];
  return volunteers.length > 0 ? volunteers[0] : null;
};

// Enroll a logged-in user into a volunteer option using account data
export const enrollUserIntoVolunteerOption = async (
  user: User,
  volunteerOptionId: number
): Promise<{ created: boolean; volunteerId: number }> => {
  // Prevent duplicate enrollment by email + option
  const existing = await findVolunteerByEmailAndOption(user.email, volunteerOptionId);
  if (existing && existing.id) {
    return { created: false, volunteerId: existing.id };
  }

  const [firstName, ...rest] = (user.full_name || '').trim().split(' ');
  const lastName = rest.join(' ').trim();

  const [result] = await db.query(
    `INSERT INTO volunteers 
      (first_name, last_name, email, phone, status, volunteer_option_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      firstName || user.username,
      lastName || '',
      user.email,
      user.phone || null,
      'pending',
      volunteerOptionId,
    ]
  );

  return { created: true, volunteerId: (result as any).insertId };
};

export interface VolunteerEnrollment {
  volunteer_id: number;
  status: string;
  submission_date: Date;
  volunteer_option_id: number;
  option_title: string;
  option_description: string;
  option_imageUrl: string;
  option_date: string;
  option_location: string;
  option_skills?: string;
  option_tools?: string;
}

// Get enrollments for a user by email, joined with volunteer_options
export const getEnrollmentsByEmail = async (email: string): Promise<VolunteerEnrollment[]> => {
  if (!email) {
    return [];
  }
  const [rows] = await db.query(
    `SELECT v.id as volunteer_id, v.status, v.submission_date, v.volunteer_option_id,
            o.title as option_title, o.description as option_description, o.imageUrl as option_imageUrl,
            o.date as option_date, o.location as option_location,
            o.skills as option_skills, o.tools as option_tools
     FROM volunteers v
     LEFT JOIN volunteer_options o ON v.volunteer_option_id = o.id
     WHERE v.email = ?
     ORDER BY v.submission_date DESC`,
    [email]
  );
  return rows as VolunteerEnrollment[];
};