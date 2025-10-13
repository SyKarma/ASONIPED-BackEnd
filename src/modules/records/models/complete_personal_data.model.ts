import { db } from '../../../db';

export interface CompletePersonalData {
  id?: number;
  record_id: number;
  record_number?: string;
  registration_date: string;
  full_name: string;
  pcd_name?: string;
  cedula: string;
  gender: 'male' | 'female' | 'other';
  birth_date: string;
  age?: number;
  birth_place: string;
  exact_address: string;
  province: string;
  canton?: string;
  district: string;
  primary_phone: string;
  secondary_phone?: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export const createCompletePersonalData = async (data: CompletePersonalData): Promise<number> => {
  try {
    const sql = `
      INSERT INTO complete_personal_data 
      (record_id, record_number, registration_date, full_name, pcd_name, cedula, gender, 
       birth_date, age, birth_place, exact_address, province, canton, district, 
       primary_phone, secondary_phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.record_id,
      data.record_number,
      data.registration_date,
      data.full_name,
      data.pcd_name,
      data.cedula,
      data.gender,
      data.birth_date,
      data.age,
      data.birth_place,
      data.exact_address,
      data.province,
      data.canton,
      data.district,
      data.primary_phone,
      data.secondary_phone,
      data.email
    ];
    
    const [result] = await db.query(sql, values) as any[];
    return result.insertId;
  } catch (error) {
    console.error('Error creating complete personal data:', error);
    throw error;
  }
};

export const updateCompletePersonalData = async (recordId: number, data: Partial<CompletePersonalData>): Promise<void> => {
  try {
    const fields = [];
    const values = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'record_id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (fields.length === 0) return;
    
    // Add updated_at field
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(recordId);
    
    const sql = `UPDATE complete_personal_data SET ${fields.join(', ')} WHERE record_id = ?`;
    await db.query(sql, values);
  } catch (error) {
    console.error('Error updating complete personal data:', error);
    throw error;
  }
};

export const getCompletePersonalData = async (recordId: number): Promise<CompletePersonalData | null> => {
  try {
    const sql = 'SELECT * FROM complete_personal_data WHERE record_id = ?';
    const [rows] = await db.query(sql, [recordId]) as [CompletePersonalData[], any];
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('Error getting complete personal data:', error);
    throw error;
  }
};

export const createOrUpdateCompletePersonalData = async (recordId: number, data: CompletePersonalData): Promise<void> => {
  try {
    const existing = await getCompletePersonalData(recordId);
    
    if (existing) {
      await updateCompletePersonalData(recordId, data);
    } else {
      await createCompletePersonalData({ ...data, record_id: recordId });
    }
  } catch (error) {
    console.error('Error creating or updating complete personal data:', error);
    throw error;
  }
};

