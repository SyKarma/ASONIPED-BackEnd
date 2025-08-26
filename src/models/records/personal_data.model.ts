import { db } from '../../db';

export interface PersonalData {
  id?: number;
  record_id: number;
  full_name: string;
  pcd_name: string;
  cedula: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: Date;
  birth_place?: string;
  address?: string;
  province?: string;
  district?: string;
  mother_name?: string;
  mother_cedula?: string;
  father_name?: string;
  father_cedula?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Create personal data
export const createPersonalData = async (data: PersonalData): Promise<void> => {
  await db.query(
    `INSERT INTO personal_data 
      (record_id, full_name, pcd_name, cedula, gender, birth_date, birth_place, address, province, district, mother_name, mother_cedula, father_name, father_cedula) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.record_id,
      data.full_name,
      data.pcd_name,
      data.cedula,
      data.gender,
      data.birth_date,
      data.birth_place,
      data.address,
      data.province,
      data.district,
      data.mother_name,
      data.mother_cedula,
      data.father_name,
      data.father_cedula
    ]
  );
};

// Get personal data by record_id
export const getPersonalDataByRecordId = async (recordId: number): Promise<PersonalData | null> => {
  const [rows] = await db.query('SELECT * FROM personal_data WHERE record_id = ?', [recordId]);
  const data = rows as PersonalData[];
  return data.length > 0 ? data[0] : null;
};

// Update personal data
export const updatePersonalData = async (recordId: number, data: Partial<PersonalData>): Promise<void> => {
  await db.query('UPDATE personal_data SET ? WHERE record_id = ?', [data, recordId]);
};

// Delete personal data
export const deletePersonalData = async (recordId: number): Promise<void> => {
  await db.query('DELETE FROM personal_data WHERE record_id = ?', [recordId]);
};

// Check if a cedula already exists
export const checkCedulaExists = async (cedula: string, excludeRecordId?: number): Promise<boolean> => {
  let query = 'SELECT COUNT(*) as count FROM personal_data WHERE cedula = ?';
  const params = [cedula];
  
  if (excludeRecordId) {
    query += ' AND record_id != ?';
    params.push(excludeRecordId.toString());
  }
  
  const [rows] = await db.query(query, params);
  return (rows as any)[0].count > 0;
};

// Search by cedula
export const searchByCedula = async (cedula: string): Promise<PersonalData | null> => {
  const [rows] = await db.query('SELECT * FROM personal_data WHERE cedula = ?', [cedula]);
  const data = rows as PersonalData[];
  return data.length > 0 ? data[0] : null;
};

// Search by name
export const searchByName = async (name: string): Promise<PersonalData[]> => {
  const [rows] = await db.query(
    'SELECT * FROM personal_data WHERE full_name LIKE ? OR pcd_name LIKE ?',
    [`%${name}%`, `%${name}%`]
  );
  return rows as PersonalData[];
}; 