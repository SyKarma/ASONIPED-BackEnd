import { db } from '../../../db';

export interface PersonalData {
  id?: number;
  record_id: number;
  full_name: string;
  pcd_name: 'fisica' | 'visual' | 'auditiva' | 'psicosocial' | 'cognitiva' | 'intelectual' | 'multiple';
  cedula: string;
  gender?: 'male' | 'female' | 'other';
  birth_date?: Date;
  birth_place?: string;
  address?: string;
  province?: string;
  canton?: string;
  district?: string;
  phone?: string;
  mother_name?: string;
  mother_cedula?: string;
  mother_phone?: string;
  father_name?: string;
  father_cedula?: string;
  father_phone?: string;
  legal_guardian_name?: string;
  legal_guardian_cedula?: string;
  legal_guardian_phone?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Create personal data
export const createPersonalData = async (data: PersonalData): Promise<void> => {
  await db.query(
    `INSERT INTO personal_data 
      (record_id, full_name, pcd_name, cedula, gender, birth_date, birth_place, address, province, canton, district, phone, mother_name, mother_cedula, mother_phone, father_name, father_cedula, father_phone, legal_guardian_name, legal_guardian_cedula, legal_guardian_phone) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
      data.canton,
      data.district,
      data.phone,
      data.mother_name,
      data.mother_cedula,
      data.mother_phone,
      data.father_name,
      data.father_cedula,
      data.father_phone,
      data.legal_guardian_name,
      data.legal_guardian_cedula,
      data.legal_guardian_phone
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
    'SELECT * FROM personal_data WHERE full_name LIKE ? OR mother_name LIKE ? OR father_name LIKE ? OR legal_guardian_name LIKE ?',
    [`%${name}%`, `%${name}%`, `%${name}%`, `%${name}%`]
  );
  return rows as PersonalData[];
}; 