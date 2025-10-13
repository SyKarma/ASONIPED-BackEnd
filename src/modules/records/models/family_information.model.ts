import { db } from '../../../db';

export interface FamilyMember {
  name: string;
  work_type: string;
  work_place: string;
  work_phone: string;
}

export interface FamilyInformation {
  id?: number;
  record_id: number;
  mother_name?: string;
  mother_cedula?: string;
  mother_occupation?: string;
  mother_phone?: string;
  father_name?: string;
  father_cedula?: string;
  father_occupation?: string;
  father_phone?: string;
  responsible_person?: string;
  responsible_address?: string;
  responsible_cedula?: string;
  responsible_occupation?: string;
  responsible_phone?: string;
  family_members: FamilyMember[];
  created_at?: string;
  updated_at?: string;
}

export const createFamilyInformation = async (data: FamilyInformation): Promise<number> => {
  try {
    const sql = `
      INSERT INTO family_information 
      (record_id, mother_name, mother_cedula, mother_occupation, mother_phone,
       father_name, father_cedula, father_occupation, father_phone,
       responsible_person, responsible_address, responsible_cedula, responsible_occupation, responsible_phone, family_members)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      data.record_id,
      data.mother_name,
      data.mother_cedula,
      data.mother_occupation,
      data.mother_phone,
      data.father_name,
      data.father_cedula,
      data.father_occupation,
      data.father_phone,
      data.responsible_person,
      data.responsible_address,
      data.responsible_cedula,
      data.responsible_occupation,
      data.responsible_phone,
      JSON.stringify(data.family_members)
    ];
    
    const [result] = await db.query(sql, values) as any[];
    return result.insertId;
  } catch (error) {
    console.error('Error creating family information:', error);
    throw error;
  }
};

export const updateFamilyInformation = async (recordId: number, data: Partial<FamilyInformation>): Promise<void> => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'record_id' && key !== 'created_at' && key !== 'updated_at') {
        if (key === 'family_members') {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    });
    
    if (fields.length === 0) return;
    
    // Add updated_at field
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(recordId);
    
    const sql = `UPDATE family_information SET ${fields.join(', ')} WHERE record_id = ?`;
    await db.query(sql, values);
  } catch (error) {
    console.error('Error updating family information:', error);
    throw error;
  }
};

export const getFamilyInformation = async (recordId: number): Promise<FamilyInformation | null> => {
  try {
    const sql = 'SELECT * FROM family_information WHERE record_id = ?';
    const [rows] = await db.query(sql, [recordId]) as [FamilyInformation[], any];
    if (rows.length > 0) {
      const row = rows[0];
      return {
        ...row,
        family_members: row.family_members ? (() => {
          try {
            return JSON.parse(row.family_members as unknown as string);
          } catch (e) {
            console.warn('Invalid JSON in family_members field, returning empty array:', row.family_members);
            return [];
          }
        })() : []
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting family information:', error);
    throw error;
  }
};

export const createOrUpdateFamilyInformation = async (recordId: number, data: FamilyInformation): Promise<void> => {
  try {
    const existing = await getFamilyInformation(recordId);
    
    if (existing) {
      await updateFamilyInformation(recordId, data);
    } else {
      await createFamilyInformation({ ...data, record_id: recordId });
    }
  } catch (error) {
    console.error('Error creating or updating family information:', error);
    throw error;
  }
};

