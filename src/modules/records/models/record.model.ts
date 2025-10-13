import { db } from '../../../db';
import { createOrUpdateFamilyInformation as createOrUpdateFamilyInfo } from './family_information.model';
import { createOrUpdateDisabilityData, getDisabilityData } from './disability_data.model';

export interface Record {
  id?: number;
  record_number: string;
  status?: 'draft' | 'pending' | 'needs_modification' | 'approved' | 'rejected' | 'active' | 'inactive';
  phase?: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'completed';
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
  admin_created?: boolean;
  // Handover tracking fields
  handed_over_to_user?: boolean;
  handed_over_to?: number;
  handed_over_at?: Date;
  handed_over_by?: number;
}

export interface RecordWithDetails extends Record {
  personal_data?: any;
  family_information?: any;
  complete_personal_data?: any;
  disability_data?: any;
  registration_requirements?: any;
  enrollment_form?: any;
  socioeconomic_data?: any;
  documents?: any[];
  notes?: any[];
}

// Utility function to validate record number format
export const isValidRecordNumber = (recordNumber: string): boolean => {
  const pattern = /^EXP-\d{4}-\d{4}$/;
  return pattern.test(recordNumber);
};

// Utility function to extract year from record number
export const getYearFromRecordNumber = (recordNumber: string): number | null => {
  const match = recordNumber.match(/^EXP-(\d{4})-\d{4}$/);
  return match ? parseInt(match[1], 10) : null;
};

// Generate unique record number
export const generateRecordNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  
  // Get the highest record number for this year to ensure sequential numbering
  const [rows] = await db.query(
    'SELECT record_number FROM records WHERE record_number LIKE ? ORDER BY record_number DESC LIMIT 1',
    [`EXP-${year}-%`]
  ) as [any[], any];
  
  let nextNumber = 1;
  
  if (rows.length > 0) {
    // Extract the number from the existing record number (format: EXP-YYYY-NNNN)
    const lastRecordNumber = rows[0].record_number;
    const numberMatch = lastRecordNumber.match(/EXP-\d{4}-(\d{4})/);
    
    if (numberMatch) {
      nextNumber = parseInt(numberMatch[1], 10) + 1;
    }
  }
  
  const paddedCount = String(nextNumber).padStart(4, '0');
  const newRecordNumber = `EXP-${year}-${paddedCount}`;
  
  // Double-check that this record number doesn't already exist (safety measure)
  const [existingRecord] = await db.query(
    'SELECT id FROM records WHERE record_number = ?',
    [newRecordNumber]
  ) as [any[], any];
  
  if (existingRecord.length > 0) {
    // If somehow the record exists, try the next number
    nextNumber += 1;
    const paddedCountRetry = String(nextNumber).padStart(4, '0');
    return `EXP-${year}-${paddedCountRetry}`;
  }
  
  return newRecordNumber;
};

// Create new record
export const createRecord = async (record: Record): Promise<number> => {
  const recordNumber = await generateRecordNumber();
  const [result] = await db.query(
    'INSERT INTO records (record_number, status, phase, created_by, admin_created) VALUES (?, ?, ?, ?, ?)',
    [recordNumber, record.status || 'draft', record.phase || 'phase1', record.created_by, record.admin_created || false]
  );
  return (result as any).insertId;
};

// Get record by ID
export const getRecordById = async (id: number): Promise<Record | null> => {
  const [rows] = await db.query('SELECT * FROM records WHERE id = ?', [id]);
  const records = rows as Record[];
  return records.length > 0 ? records[0] : null;
};

// Get complete record with all data
export const getRecordWithDetails = async (id: number): Promise<RecordWithDetails | null> => {
  try {
    // Get record with personal data and creator information using LEFT JOIN
    const [rows] = await db.query(
      `SELECT r.*, 
              pd.id as pd_id, pd.full_name, pd.cedula, pd.pcd_name, pd.gender, 
              pd.birth_date, pd.birth_place, pd.address, pd.province, pd.canton, pd.district, pd.phone,
              pd.mother_name, pd.mother_cedula, pd.mother_phone, pd.father_name, pd.father_cedula, pd.father_phone,
              pd.legal_guardian_name, pd.legal_guardian_cedula, pd.legal_guardian_phone,
              pd.created_at as pd_created_at, pd.updated_at as pd_updated_at,
              u.username as creator_username, u.full_name as creator_full_name
       FROM records r 
       LEFT JOIN personal_data pd ON r.id = pd.record_id 
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.id = ?`,
      [id]
    ) as [any[], any];
    
    if (rows.length === 0) {
      return null;
    }
    
    const row = rows[0];
    
    // Build personal_data object if it exists
    let personalData = null;
    if (row.full_name) {
      personalData = {
        id: row.pd_id,
        record_id: row.id,
        full_name: row.full_name,
        cedula: row.cedula,
        pcd_name: row.pcd_name,
        gender: row.gender,
        birth_date: row.birth_date,
        birth_place: row.birth_place,
        address: row.address,
        province: row.province,
        canton: row.canton,
        district: row.district,
        phone: row.phone,
        mother_name: row.mother_name,
        mother_cedula: row.mother_cedula,
        mother_phone: row.mother_phone,
        father_name: row.father_name,
        father_cedula: row.father_cedula,
        father_phone: row.father_phone,
        legal_guardian_name: row.legal_guardian_name,
        legal_guardian_cedula: row.legal_guardian_cedula,
        legal_guardian_phone: row.legal_guardian_phone,
        created_at: row.pd_created_at,
        updated_at: row.pd_updated_at
      };
    }
    
    // Get disability data
    let disabilityData = null;
    try {
      disabilityData = await getDisabilityData(id);
    } catch (err) {
      console.error('Error loading disability data:', err);
      // Continue without disability data
    }
    
    // Get registration requirements
    let registrationRequirements = null;
    try {
      const [requirementsRows] = await db.query('SELECT * FROM registration_requirements WHERE record_id = ?', [id]) as [any[], any];
      if (requirementsRows.length > 0) {
        registrationRequirements = requirementsRows[0];
      }
    } catch (err) {
      // Table may not exist
    }
    
    // Get enrollment form
    let enrollmentForm = null;
    try {
      const [enrollmentRows] = await db.query('SELECT * FROM enrollment_form WHERE record_id = ?', [id]) as [any[], any];
      if (enrollmentRows.length > 0) {
        enrollmentForm = enrollmentRows[0];
      }
    } catch (err) {
      // Table may not exist
    }
    
    // Get family information (Phase 3)
    let familyInformation = null;
    try {
      const [familyRows] = await db.query('SELECT * FROM family_information WHERE record_id = ?', [id]) as [any[], any];
      if (familyRows.length > 0) {
        const familyRow = familyRows[0];
        familyInformation = {
          ...familyRow,
          family_members: (() => {
            try {
              if (familyRow.family_members && familyRow.family_members !== '[]' && familyRow.family_members !== 'null') {
                return JSON.parse(familyRow.family_members);
              }
              return [];
            } catch (e) {
              return [];
            }
          })()
        };
      }
    } catch (err) {
      console.error('Error loading family information:', err);
      // Table may not exist
    }

    // Get complete personal data (Phase 3)
    let completePersonalData = null;
    try {
      const [completeRows] = await db.query('SELECT * FROM complete_personal_data WHERE record_id = ?', [id]) as [any[], any];
      if (completeRows.length > 0) {
        completePersonalData = completeRows[0];
      }
    } catch (err) {
      // Table may not exist
    }

    // Get socioeconomic data
    let socioeconomicData = null;
    try {
      const [socioeconomicRows] = await db.query('SELECT * FROM socioeconomic_data WHERE record_id = ?', [id]) as [any[], any];
      if (socioeconomicRows.length > 0) {
        const row = socioeconomicRows[0];
        socioeconomicData = {
          ...row,
          available_services: row.available_services ? 
            (typeof row.available_services === 'string' ? JSON.parse(row.available_services) : row.available_services) : [],
          working_family_members: row.working_family_members ? 
            (typeof row.working_family_members === 'string' ? JSON.parse(row.working_family_members) : row.working_family_members) : []
        };
      }
    } catch (err) {
      console.error('Error loading socioeconomic data:', err);
      // Table may not exist
    }
    
    // Get documents
    let documents = [];
    try {
      const [documentsRows] = await db.query('SELECT * FROM record_documents WHERE record_id = ? ORDER BY uploaded_at DESC', [id]) as [any[], any];
      documents = documentsRows;
    } catch (err) {
      // Table may not exist
    }
    
    // Get notes
    let notesRows = [];
    try {
      const [notesResult] = await db.query('SELECT * FROM record_notes WHERE record_id = ? ORDER BY created_at DESC', [id]) as [any[], any];
      notesRows = notesResult;
    } catch (err) {
      console.error('Error retrieving notes:', err);
      // Table may not exist
    }
    
    const result = {
      id: row.id,
      record_number: row.record_number,
      status: row.status,
      phase: row.phase,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      admin_created: row.admin_created,
      // Creator attribution information
      creator_username: row.creator_username,
      creator_full_name: row.creator_full_name,
      personal_data: personalData,
      family_information: familyInformation,
      complete_personal_data: completePersonalData,
      disability_data: disabilityData,
      disability_information: disabilityData,
      registration_requirements: registrationRequirements,
      enrollment_form: enrollmentForm,
      socioeconomic_data: socioeconomicData,
      socioeconomic_information: socioeconomicData,
      documents: documents,
      notes: notesRows
    };
    
    return result;
  } catch (err) {
    console.error('Error in getRecordWithDetails:', err);
    throw err;
  }
};

// Get all records with pagination and filters
export const getRecords = async (
  page = 1,
  limit = 10,
  status?: string,
  phase?: string,
  search?: string,
  creator?: string
): Promise<{ records: Record[]; total: number }> => {
  const offset = (page - 1) * limit;
  let where = '';
  const params: any[] = [];

  if (status) {
    where += 'status = ?';
    params.push(status);
  }
  
  if (phase) {
    if (where) where += ' AND ';
    where += 'phase = ?';
    params.push(phase);
  }
  
  if (search) {
    if (where) where += ' AND ';
    where += `(
      LOWER(r.record_number) LIKE LOWER(?)
      OR r.id IN (
        SELECT pd.record_id FROM personal_data pd
        WHERE LOWER(pd.full_name) LIKE LOWER(?) OR LOWER(pd.cedula) LIKE LOWER(?)
      )
      OR r.id IN (
        SELECT cpd.record_id FROM complete_personal_data cpd
        WHERE LOWER(cpd.full_name) LIKE LOWER(?) OR LOWER(cpd.cedula) LIKE LOWER(?)
      )
    )`;
    params.push(
      `%${search}%`,
      `%${search}%`, `%${search}%`,
      `%${search}%`, `%${search}%`
    );
  }
  
  if (creator) {
    if (where) where += ' AND ';
    if (creator === 'admin') {
      where += 'admin_created = true';
    } else if (creator === 'user') {
      where += 'admin_created = false OR admin_created IS NULL';
    }
  }

  const whereClause = where ? `WHERE ${where}` : '';
  
  const [rows] = await db.query(
    `SELECT r.*, 
            pd.id as pd_id, pd.full_name, pd.cedula, pd.pcd_name, pd.gender, 
            pd.birth_date, pd.birth_place, pd.address, pd.province, pd.district,
            pd.mother_name, pd.mother_cedula, pd.father_name, pd.father_cedula,
            pd.created_at as pd_created_at, pd.updated_at as pd_updated_at,
            cpd.id as cpd_id, cpd.record_id as cpd_record_id, cpd.registration_date, 
            cpd.full_name as cpd_full_name, cpd.cedula as cpd_cedula, cpd.gender as cpd_gender,
            cpd.birth_date as cpd_birth_date, cpd.birth_place as cpd_birth_place, 
            cpd.exact_address, cpd.province as cpd_province, cpd.canton as cpd_canton, 
            cpd.district as cpd_district, cpd.primary_phone, cpd.secondary_phone, 
            cpd.email, cpd.age, cpd.pcd_name as cpd_pcd_name,
            cpd.created_at as cpd_created_at, cpd.updated_at as cpd_updated_at,
            u.username as creator_username, u.full_name as creator_full_name
     FROM records r 
     LEFT JOIN personal_data pd ON r.id = pd.record_id 
     LEFT JOIN complete_personal_data cpd ON r.id = cpd.record_id
     LEFT JOIN users u ON r.created_by = u.id
     ${whereClause} 
     ORDER BY r.created_at DESC 
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  ) as [any[], any];


  // Transform data to match Record type
  const transformedRows = rows.map((row: any) => {
    const record: any = {
      id: row.id,
      record_number: row.record_number,
      status: row.status,
      phase: row.phase,
      created_at: row.created_at,
      updated_at: row.updated_at,
      created_by: row.created_by,
      admin_created: row.admin_created,
      handed_over_to_user: row.handed_over_to_user ? true : false,
      handed_over_to: row.handed_over_to,
      handed_over_at: row.handed_over_at,
      handed_over_by: row.handed_over_by,
      // Creator attribution information
      creator_username: row.creator_username,
      creator_full_name: row.creator_full_name
    };

    // If personal data exists, create personal_data object
    if (row.full_name) {
      record.personal_data = {
        id: row.pd_id,
        record_id: row.id,
        full_name: row.full_name,
        cedula: row.cedula,
        pcd_name: row.pcd_name,
        gender: row.gender,
        birth_date: row.birth_date,
        birth_place: row.birth_place,
        address: row.address,
        province: row.province,
        district: row.district,
        mother_name: row.mother_name,
        mother_cedula: row.mother_cedula,
        father_name: row.father_name,
        father_cedula: row.father_cedula,
        created_at: row.pd_created_at,
        updated_at: row.pd_updated_at
      };
    }

    // Include complete_personal_data if it exists (all fields dynamically)
    if (row.cpd_id && row.cpd_record_id) {
      record.complete_personal_data = {
        id: row.cpd_id,
        record_id: row.cpd_record_id,
        registration_date: row.registration_date,
        full_name: row.cpd_full_name,
        cedula: row.cpd_cedula,
        gender: row.cpd_gender,
        birth_date: row.cpd_birth_date,
        birth_place: row.cpd_birth_place,
        exact_address: row.exact_address,
        province: row.cpd_province,
        canton: row.cpd_canton,
        district: row.cpd_district,
        primary_phone: row.primary_phone,
        secondary_phone: row.secondary_phone,
        email: row.email,
        age: row.age,
        pcd_name: row.cpd_pcd_name,
        created_at: row.cpd_created_at,
        updated_at: row.cpd_updated_at
      } as any;
    
    }

    return record as Record;
  });
  
  const [countRows] = await db.query(
    `SELECT COUNT(*) as count FROM records r ${whereClause}`,
    params
  ) as [any[], any];
  
  const total = countRows[0].count;
  return { records: transformedRows, total };
};

// Update record
export const updateRecord = async (id: number, data: Partial<Record>): Promise<void> => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  await db.query(`UPDATE records SET ${fields} WHERE id = ?`, [...values, id]);
};

// Delete record
export const deleteRecord = async (id: number): Promise<void> => {
  try {
    // First delete associated notes
    try {
      await db.query('DELETE FROM record_notes WHERE record_id = ?', [id]) as [any, any];
    } catch (err) {
      // Table may not exist
    }
    
    // Then delete personal data
    try {
      await db.query('DELETE FROM personal_data WHERE record_id = ?', [id]) as [any, any];
    } catch (err) {
      // Handle error
    }
    
    // Finally delete the record
    const [result] = await db.query('DELETE FROM records WHERE id = ?', [id]) as [any, any];
    
    if (result.affectedRows === 0) {
      throw new Error(`Record with ID ${id} not found`);
    }
  } catch (err) {
    console.error('Error in deleteRecord:', err);
    throw err;
  }
};

// Update record status
export const updateRecordStatus = async (id: number, status: Record['status']): Promise<void> => {
  await db.query('UPDATE records SET status = ? WHERE id = ?', [status, id]);
};

// Approve phase 1
export const approvePhase1 = async (id: number): Promise<void> => {
  try {
    const [result] = await db.query('UPDATE records SET status = ?, phase = ? WHERE id = ?', ['approved', 'phase2', id]) as [any, any];
    
    if (result.affectedRows === 0) {
      throw new Error(`Record with ID ${id} not found`);
    }
  } catch (err) {
    console.error('Error in approvePhase1:', err);
    throw err;
  }
};

// Reject phase 1
export const rejectPhase1 = async (id: number): Promise<void> => {
  try {
    const [result] = await db.query('UPDATE records SET status = ?, phase = ? WHERE id = ?', ['rejected', 'phase1', id]) as [any, any];
    
    if (result.affectedRows === 0) {
      throw new Error(`Record with ID ${id} not found`);
    }
  } catch (err) {
    console.error('Error in rejectPhase1:', err);
    throw err;
  }
};

// Request modification for phase 1
export const requestPhase1Modification = async (id: number): Promise<void> => {
  try {
    const [result] = await db.query('UPDATE records SET status = ?, phase = ? WHERE id = ?', ['needs_modification', 'phase1', id]) as [any, any];
    
    if (result.affectedRows === 0) {
      throw new Error(`Record with ID ${id} not found`);
    }
  } catch (err) {
    console.error('Error in requestPhase1Modification:', err);
    throw err;
  }
};

// Update phase 1 data (for modifications)
export const updatePhase1Data = async (id: number, personalData: any): Promise<void> => {
  try {
    // Update the personal_data table
    const [result] = await db.query(`
      UPDATE personal_data 
      SET full_name = ?, pcd_name = ?, cedula = ?, gender = ?, birth_date = ?, 
          birth_place = ?, address = ?, province = ?, canton = ?, district = ?,
          mother_name = ?, mother_cedula = ?, father_name = ?, father_cedula = ?,
          legal_guardian_name = ?, legal_guardian_cedula = ?
      WHERE record_id = ?
    `, [
      personalData.full_name,
      personalData.pcd_name,
      personalData.cedula,
      personalData.gender,
      personalData.birth_date,
      personalData.birth_place,
      personalData.address,
      personalData.province,
      personalData.canton,
      personalData.district,
      personalData.mother_name,
      personalData.mother_cedula,
      personalData.father_name,
      personalData.father_cedula,
      personalData.legal_guardian_name,
      personalData.legal_guardian_cedula,
      id
    ]) as [any, any];

    if (result.affectedRows === 0) {
      throw new Error(`Personal data for record ID ${id} not found`);
    }

    // Update the record status back to pending
    await db.query('UPDATE records SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['pending', id]) as [any, any];
  } catch (err) {
    console.error('Error in updatePhase1Data:', err);
    throw err;
  }
};

// Approve complete record
export const approveRecord = async (id: number): Promise<void> => {
  try {
    const [result] = await db.query('UPDATE records SET status = ?, phase = ? WHERE id = ?', ['active', 'completed', id]) as [any, any];
    
    if (result.affectedRows === 0) {
      throw new Error(`Record with ID ${id} not found`);
    }
  } catch (err) {
    console.error('Error in approveRecord:', err);
    throw err;
  }
};

// Reject complete record
export const rejectRecord = async (id: number): Promise<void> => {
  try {
    const [result] = await db.query('UPDATE records SET status = ?, phase = ? WHERE id = ?', ['rejected', 'phase3', id]) as [any, any];
    
    if (result.affectedRows === 0) {
      throw new Error(`Record with ID ${id} not found`);
    }
  } catch (err) {
    console.error('Error in rejectRecord:', err);
    throw err;
  }
};

// Get current user's record
export const getUserRecord = async (userId: number): Promise<RecordWithDetails | null> => {
  const [rows] = await db.query(
    `SELECT * FROM records 
     WHERE created_by = ? 
        OR (handed_over_to_user = TRUE AND handed_over_to = ?)
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, userId]
  ) as [Record[], any];
  
  if (rows.length === 0) {
    return null;
  }
  
  const record = rows[0];
  return await getRecordWithDetails(record.id!);
};

// Check if cedula exists
export const checkCedulaExists = async (cedula: string): Promise<boolean> => {
  const [rows] = await db.query('SELECT id FROM personal_data WHERE cedula = ?', [cedula]) as [any[], any];
  return rows.length > 0;
};

// Add note to a record
export const addNote = async (recordId: number, noteData: { note: string; type: string; created_by?: number }): Promise<void> => {
  try {
    const [result] = await db.query(
      'INSERT INTO record_notes (record_id, note, type, created_by) VALUES (?, ?, ?, ?)',
      [recordId, noteData.note, noteData.type, noteData.created_by]
    ) as [any, any];
  } catch (err) {
    console.error('Error in addNote:', err);
    throw err;
  }
};

// Add structured note to a record (with sections, documents, etc.)
export const addStructuredNote = async (recordId: number, noteData: { 
  note: string; 
  admin_comment?: string | null;
  sections_to_modify?: string | null;
  documents_to_replace?: string | null;
  modification_metadata?: string | null;
  type: string; 
  modification_type?: string;
  created_by?: number | null;
}): Promise<void> => {
  try {
    const [result] = await db.query(
      `INSERT INTO record_notes 
       (record_id, note, admin_comment, sections_to_modify, documents_to_replace, 
        modification_metadata, type, modification_type, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId, 
        noteData.note, 
        noteData.admin_comment || null,
        noteData.sections_to_modify || null,
        noteData.documents_to_replace || null,
        noteData.modification_metadata || null,
        noteData.type, 
        noteData.modification_type || 'general',
        noteData.created_by || null
      ]
    ) as [any, any];
  } catch (err) {
    console.error('Error in addStructuredNote:', err);
    throw err;
  }
};

// Update existing note
export const updateNote = async (noteId: number, noteData: { note: string; type?: string }): Promise<void> => {
  try {
    const [result] = await db.query(
      'UPDATE record_notes SET note = ?, type = ? WHERE id = ?',
      [noteData.note, noteData.type || 'note', noteId]
    ) as [any, any];
    
    if (result.affectedRows === 0) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
  } catch (err) {
    console.error('Error in updateNote:', err);
    throw err;
  }
};

// Delete note
export const deleteNote = async (noteId: number): Promise<void> => {
  try {
    const [result] = await db.query(
      'DELETE FROM record_notes WHERE id = ?',
      [noteId]
    ) as [any, any];
    
    if (result.affectedRows === 0) {
      throw new Error(`Note with ID ${noteId} not found`);
    }
  } catch (err) {
    console.error('Error in deleteNote:', err);
    throw err;
  }
};

// Get record statistics
export const getRecordStats = async (): Promise<any> => {
  const [totalRows] = await db.query('SELECT COUNT(*) as count FROM records') as [any[], any];
  const [pendingRows] = await db.query("SELECT COUNT(*) as count FROM records WHERE status = 'pending'") as [any[], any];
  const [approvedRows] = await db.query("SELECT COUNT(*) as count FROM records WHERE status = 'approved'") as [any[], any];
  const [rejectedRows] = await db.query("SELECT COUNT(*) as count FROM records WHERE status = 'rejected'") as [any[], any];
  const [activeRows] = await db.query("SELECT COUNT(*) as count FROM records WHERE status = 'active'") as [any[], any];
  const [inactiveRows] = await db.query("SELECT COUNT(*) as count FROM records WHERE status = 'inactive'") as [any[], any];
  const [thisMonthRows] = await db.query("SELECT COUNT(*) as count FROM records WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())") as [any[], any];
  const [phase1Rows] = await db.query("SELECT COUNT(*) as count FROM records WHERE phase = 'phase1'") as [any[], any];
  const [phase2Rows] = await db.query("SELECT COUNT(*) as count FROM records WHERE phase = 'phase2'") as [any[], any];
  const [phase3Rows] = await db.query("SELECT COUNT(*) as count FROM records WHERE phase = 'phase3'") as [any[], any];
  const [phase4Rows] = await db.query("SELECT COUNT(*) as count FROM records WHERE phase = 'phase4'") as [any[], any];
  const [completedRows] = await db.query("SELECT COUNT(*) as count FROM records WHERE phase = 'completed'") as [any[], any];

  return {
    total: totalRows[0].count,
    pending: pendingRows[0].count,
    approved: approvedRows[0].count,
    rejected: rejectedRows[0].count,
    active: activeRows[0].count,
    inactive: inactiveRows[0].count,
    thisMonth: thisMonthRows[0].count,
    phase1: phase1Rows[0].count,
    phase2: phase2Rows[0].count,
    phase3: phase3Rows[0].count,
    phase4: phase4Rows[0].count,
    completed: completedRows[0].count,
  };
};

// ===== PHASE 3 FUNCTIONS =====

// Helper function to clean values
const cleanValue = (value: any): any => {
  if (value === 'null' || value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? JSON.stringify(value) : null;
  }
  return value;
};

// Re-export the disability data functions from the dedicated model
export { createOrUpdateDisabilityData, getDisabilityData };

// Create or update registration requirements
export const createOrUpdateRegistrationRequirements = async (recordId: number, requirements: any): Promise<void> => {
  try {
    // Check if requirements already exist
    const [existingRows] = await db.query(
      'SELECT id FROM registration_requirements WHERE record_id = ?',
      [recordId]
    ) as [any[], any];
    
    if (existingRows.length > 0) {
      // Update existing requirements
      await db.query(
        `UPDATE registration_requirements SET 
         medical_diagnosis_doc = ?, birth_certificate_doc = ?, family_cedulas_doc = ?, 
         passport_photo_doc = ?, pension_certificate_doc = ?, study_certificate_doc = ?, 
         bank_account_info = ?, affiliation_fee_paid = ?, updated_at = CURRENT_TIMESTAMP
         WHERE record_id = ?`,
        [
          cleanValue(requirements.medical_diagnosis_doc),
          cleanValue(requirements.birth_certificate_doc),
          cleanValue(requirements.family_cedulas_doc),
          cleanValue(requirements.passport_photo_doc),
          cleanValue(requirements.pension_certificate_doc),
          cleanValue(requirements.study_certificate_doc),
          cleanValue(requirements.bank_account_info),
          cleanValue(requirements.affiliation_fee_paid),
          recordId
        ]
      );
    } else {
      // Create new requirements
      await db.query(
        `INSERT INTO registration_requirements 
         (record_id, medical_diagnosis_doc, birth_certificate_doc, family_cedulas_doc, 
          passport_photo_doc, pension_certificate_doc, study_certificate_doc,
          bank_account_info, affiliation_fee_paid)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          cleanValue(requirements.medical_diagnosis_doc),
          cleanValue(requirements.birth_certificate_doc),
          cleanValue(requirements.family_cedulas_doc),
          cleanValue(requirements.passport_photo_doc),
          cleanValue(requirements.pension_certificate_doc),
          cleanValue(requirements.study_certificate_doc),
          cleanValue(requirements.bank_account_info),
          cleanValue(requirements.affiliation_fee_paid)
        ]
      );
    }
  } catch (err) {
    console.error('Error in createOrUpdateRegistrationRequirements:', err);
    throw err;
  }
};

// Create or update enrollment form
export const createOrUpdateEnrollmentForm = async (recordId: number, enrollmentData: any): Promise<void> => {
  try {
    // Check if enrollment form already exists
    const [existingRows] = await db.query(
      'SELECT id FROM enrollment_form WHERE record_id = ?',
      [recordId]
    ) as [any[], any];
    
    if (existingRows.length > 0) {
      // Update existing form
      await db.query(
        `UPDATE enrollment_form SET 
         enrollment_date = ?, applicant_full_name = ?, applicant_cedula = ?, 
         blood_type = ?, medical_conditions = ?, updated_at = CURRENT_TIMESTAMP
         WHERE record_id = ?`,
        [
          cleanValue(enrollmentData.enrollment_date),
          cleanValue(enrollmentData.applicant_full_name),
          cleanValue(enrollmentData.applicant_cedula),
          cleanValue(enrollmentData.blood_type),
          cleanValue(enrollmentData.medical_conditions),
          recordId
        ]
      );
    } else {
      // Create new form
      await db.query(
        `INSERT INTO enrollment_form 
         (record_id, enrollment_date, applicant_full_name, applicant_cedula, 
          blood_type, medical_conditions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          cleanValue(enrollmentData.enrollment_date),
          cleanValue(enrollmentData.applicant_full_name),
          cleanValue(enrollmentData.applicant_cedula),
          cleanValue(enrollmentData.blood_type),
          cleanValue(enrollmentData.medical_conditions)
        ]
      );
    }
  } catch (err) {
    console.error('Error in createOrUpdateEnrollmentForm:', err);
    throw err;
  }
};

// Create or update socioeconomic data
export const createOrUpdateSocioeconomicData = async (recordId: number, socioeconomicData: any): Promise<void> => {
  try {
    // Check if socioeconomic data already exists
    const [existingRows] = await db.query(
      'SELECT id FROM socioeconomic_data WHERE record_id = ?',
      [recordId]
    ) as [any[], any];
    
    // Prepare data for insertion
    const servicesJson = Array.isArray(socioeconomicData.available_services) 
      ? JSON.stringify(socioeconomicData.available_services) 
      : socioeconomicData.available_services;
    
    const workingPeopleJson = Array.isArray(socioeconomicData.working_family_members) 
      ? JSON.stringify(socioeconomicData.working_family_members) 
      : socioeconomicData.working_family_members;
    
    if (existingRows.length > 0) {
      // Update existing data
      await db.query(
        `UPDATE socioeconomic_data SET 
         housing_type = ?, available_services = ?, family_income = ?, 
         working_family_members = ?, updated_at = CURRENT_TIMESTAMP
         WHERE record_id = ?`,
        [
          cleanValue(socioeconomicData.housing_type),
          cleanValue(servicesJson),
          cleanValue(socioeconomicData.family_income),
          cleanValue(workingPeopleJson),
          recordId
        ]
      );
    } else {
      // Create new data
      await db.query(
        `INSERT INTO socioeconomic_data 
         (record_id, housing_type, available_services, family_income, working_family_members)
         VALUES (?, ?, ?, ?, ?)`,
        [
          recordId,
          cleanValue(socioeconomicData.housing_type),
          cleanValue(servicesJson),
          cleanValue(socioeconomicData.family_income),
          cleanValue(workingPeopleJson)
        ]
      );
    }
  } catch (err) {
    console.error('Error in createOrUpdateSocioeconomicData:', err);
    throw err;
  }
};

// Create document
export const createDocument = async (recordId: number, documentData: any): Promise<void> => {
  try {
    await db.query(
      `INSERT INTO record_documents 
       (record_id, document_type, file_path, file_name, file_size, original_name, uploaded_by, google_drive_id, google_drive_url, google_drive_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recordId,
        cleanValue(documentData.document_type),
        cleanValue(documentData.file_path),
        cleanValue(documentData.file_name),
        cleanValue(documentData.file_size),
        cleanValue(documentData.original_name),
        cleanValue(documentData.uploaded_by) || null, // Allow NULL if no uploaded_by
        cleanValue(documentData.google_drive_id) || null,
        cleanValue(documentData.google_drive_url) || null,
        cleanValue(documentData.google_drive_name) || null
      ]
    );
  } catch (err) {
    console.error('Error in createDocument:', err);
    throw err;
  }
};

// Update existing document metadata
export const updateDocument = async (
  documentId: number,
  data: Partial<{
    document_type: string;
    file_path: string;
    file_name: string;
    file_size: number;
    original_name: string;
    uploaded_by: number;
    google_drive_id: string | null;
    google_drive_url: string | null;
    google_drive_name: string | null;
  }>
): Promise<void> => {
  try {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (fields.length === 0) return;

    await db.query(
      `UPDATE record_documents SET ${fields.join(', ')} WHERE id = ?`,
      [...values, documentId]
    );
  } catch (err) {
    console.error('Error in updateDocument:', err);
    throw err;
  }
};

export const createOrUpdateFamilyInformation = async (recordId: number, familyInformation: any): Promise<void> => {
  try {
    await createOrUpdateFamilyInfo(recordId, familyInformation);
  } catch (err) {
    console.error('Error in createOrUpdateFamilyInformation:', err);
    throw err;
  }
};

// Update Phase 3 data (for modifications)
export const updatePhase3Data = async (id: number, phase3Data: any): Promise<void> => {
  try {
    // Update complete personal data
    if (phase3Data.complete_personal_data) {
      const [existingRows] = await db.query(
        'SELECT id FROM complete_personal_data WHERE record_id = ?',
        [id]
      ) as [any[], any];

      if (existingRows.length > 0) {
        // Update existing data
        await db.query(
          `UPDATE complete_personal_data SET 
           registration_date = ?, full_name = ?, pcd_name = ?, cedula = ?, gender = ?, 
           birth_date = ?, age = ?, birth_place = ?, exact_address = ?, province = ?, 
           canton = ?, district = ?, primary_phone = ?, secondary_phone = ?, email = ?,
           updated_at = CURRENT_TIMESTAMP
           WHERE record_id = ?`,
          [
            cleanValue(phase3Data.complete_personal_data.registration_date),
            cleanValue(phase3Data.complete_personal_data.full_name),
            cleanValue(phase3Data.complete_personal_data.pcd_name),
            cleanValue(phase3Data.complete_personal_data.cedula),
            cleanValue(phase3Data.complete_personal_data.gender),
            cleanValue(phase3Data.complete_personal_data.birth_date),
            cleanValue(phase3Data.complete_personal_data.age),
            cleanValue(phase3Data.complete_personal_data.birth_place),
            cleanValue(phase3Data.complete_personal_data.exact_address),
            cleanValue(phase3Data.complete_personal_data.province),
            cleanValue(phase3Data.complete_personal_data.canton),
            cleanValue(phase3Data.complete_personal_data.district),
            cleanValue(phase3Data.complete_personal_data.primary_phone),
            cleanValue(phase3Data.complete_personal_data.secondary_phone),
            cleanValue(phase3Data.complete_personal_data.email),
            id
          ]
        );
      } else {
        // Create new data
        await db.query(
          `INSERT INTO complete_personal_data 
           (record_id, registration_date, full_name, pcd_name, cedula, gender, 
            birth_date, age, birth_place, exact_address, province, canton, district, 
            primary_phone, secondary_phone, email)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            cleanValue(phase3Data.complete_personal_data.registration_date),
            cleanValue(phase3Data.complete_personal_data.full_name),
            cleanValue(phase3Data.complete_personal_data.pcd_name),
            cleanValue(phase3Data.complete_personal_data.cedula),
            cleanValue(phase3Data.complete_personal_data.gender),
            cleanValue(phase3Data.complete_personal_data.birth_date),
            cleanValue(phase3Data.complete_personal_data.age),
            cleanValue(phase3Data.complete_personal_data.birth_place),
            cleanValue(phase3Data.complete_personal_data.exact_address),
            cleanValue(phase3Data.complete_personal_data.province),
            cleanValue(phase3Data.complete_personal_data.canton),
            cleanValue(phase3Data.complete_personal_data.district),
            cleanValue(phase3Data.complete_personal_data.primary_phone),
            cleanValue(phase3Data.complete_personal_data.secondary_phone),
            cleanValue(phase3Data.complete_personal_data.email)
          ]
        );
      }
    }

    // Update family information
    if (phase3Data.family_information) {
      await createOrUpdateFamilyInformation(id, phase3Data.family_information);
    }

    // Update disability information
    if (phase3Data.disability_information) {
      await createOrUpdateDisabilityData(id, phase3Data.disability_information);
    }

    // Update socioeconomic information
    if (phase3Data.socioeconomic_information) {
      await createOrUpdateSocioeconomicData(id, phase3Data.socioeconomic_information);
    }

    // Update documentation requirements
    if (phase3Data.documentation_requirements) {
      await createOrUpdateRegistrationRequirements(id, phase3Data.documentation_requirements);
    }

    // Update record status back to pending
    await db.query('UPDATE records SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', ['pending', id]) as [any, any];
  } catch (err) {
    console.error('Error in updatePhase3Data:', err);
    throw err;
  }
};

// Get geographic analytics data only (lightweight)
export const getGeographicAnalytics = async (): Promise<Array<{
  id: number;
  record_number: string;
  province: string | null;
  canton: string | null;
  district: string | null;
  created_at: Date;
}>> => {
  const [rows] = await db.query(
    `SELECT r.id, r.record_number, r.created_at,
            COALESCE(pd.province, cpd.province) as province,
            COALESCE(pd.canton, cpd.canton) as canton,
            COALESCE(pd.district, cpd.district) as district
     FROM records r 
     LEFT JOIN personal_data pd ON r.id = pd.record_id 
     LEFT JOIN complete_personal_data cpd ON r.id = cpd.record_id
     WHERE r.status = 'active'
     ORDER BY r.created_at DESC`,
    []
  ) as [any[], any];

  return rows.map(row => ({
    id: row.id,
    record_number: row.record_number,
    province: row.province,
    canton: row.canton,
    district: row.district,
    created_at: row.created_at
  }));
};

// Get family analytics data only (lightweight)
export const getFamilyAnalytics = async (): Promise<Array<{
  id: number;
  record_number: string;
  created_at: Date;
  family_information: {
    mother_name?: string | null;
    father_name?: string | null;
    responsible_person?: string | null;
    family_members: Array<{
      name: string;
      age: number;
      relationship: string;
      occupation: string;
      marital_status: string;
    }> | [];
  } | null;
}>> => {
  const [rows] = await db.query(
    `SELECT r.id, r.record_number, r.created_at,
            fi.mother_name, fi.father_name, fi.responsible_person, fi.family_members
     FROM records r
     LEFT JOIN family_information fi ON r.id = fi.record_id
     WHERE r.status = 'active'
     ORDER BY r.created_at DESC`
  ) as [any[], any];

  return rows.map(row => {
    // family_members may be JSON string or null
    let members: any[] = [];
    try {
      if (row.family_members && typeof row.family_members === 'string') {
        const parsed = JSON.parse(row.family_members);
        if (Array.isArray(parsed)) members = parsed;
      } else if (Array.isArray(row.family_members)) {
        members = row.family_members;
      }
    } catch (_e) {
      members = [];
    }

    return {
      id: row.id,
      record_number: row.record_number,
      created_at: row.created_at,
      family_information: (row.mother_name || row.father_name || row.responsible_person || members.length > 0) ? {
        mother_name: row.mother_name || null,
        father_name: row.father_name || null,
        responsible_person: row.responsible_person || null,
        family_members: members
      } : null
    };
  });
};

// Get disability analytics data only (lightweight)

export const getDisabilityAnalytics = async (): Promise<Array<{
  id: number;
  record_number: string;
  created_at: Date;
  disability_information: {
    disability_type: string | null;
    insurance_type: string | null;
    disability_origin: string | null;
    disability_certificate: string | null;
    conapdis_registration: string | null;
    medical_diagnosis: string | null;
    medical_additional: {
      blood_type: string | null;
      diseases: string | null;
      permanent_limitations: Array<{
        limitation: string;
        degree: string;
        observations?: string;
      }> | null;
      biomechanical_benefits: Array<{
        type: string;
        other_description?: string;
      }> | null;
    } | null;
  } | null;
  complete_personal_data: {
    blood_type: string | null;
    diseases: string | null;
  } | null;
}>> => {
  // 1) Fetch base analytics rows
  const [rows] = await db.query(
    `SELECT r.id, r.record_number, r.created_at,
            dd.id AS dd_id,
            dd.disability_type, dd.insurance_type, dd.disability_origin, 
            dd.disability_certificate, dd.conapdis_registration, dd.medical_diagnosis,
            ef.blood_type, ef.medical_conditions
     FROM records r 
     LEFT JOIN disability_data dd ON r.id = dd.record_id 
     LEFT JOIN enrollment_form ef ON r.id = ef.record_id
     WHERE r.status = 'active'
     ORDER BY r.created_at DESC`,
    []
  ) as [any[], any];

  // Collect disability_data ids to aggregate related arrays
  const disabilityDataIds: number[] = rows
    .map((r: any) => r.dd_id)
    .filter((id: any) => !!id);

  let benefitsByDdId = new Map<number, Array<{ type: string; other_description?: string }>>();
  let limitationsByDdId = new Map<number, Array<{ limitation: string; degree: string; observations?: string }>>();

  if (disabilityDataIds.length > 0) {
    // 2) Load biomechanical benefits in one query
    const [benefitRows] = await db.query(
      `SELECT disability_data_id, type, other_description 
       FROM biomechanical_benefits 
       WHERE disability_data_id IN (${disabilityDataIds.map(() => '?').join(',')})`,
      disabilityDataIds
    ) as [any[], any];

    for (const row of benefitRows) {
      const list = benefitsByDdId.get(row.disability_data_id) || [];
      list.push({ type: row.type, other_description: row.other_description || undefined });
      benefitsByDdId.set(row.disability_data_id, list);
    }

    // 3) Load permanent limitations in one query
    const [limitRows] = await db.query(
      `SELECT disability_data_id, limitation, degree, observations 
       FROM permanent_limitations 
       WHERE disability_data_id IN (${disabilityDataIds.map(() => '?').join(',')})`,
      disabilityDataIds
    ) as [any[], any];

    for (const row of limitRows) {
      const list = limitationsByDdId.get(row.disability_data_id) || [];
      list.push({ limitation: row.limitation, degree: row.degree, observations: row.observations || undefined });
      limitationsByDdId.set(row.disability_data_id, list);
    }
  }

  // 4) Build response including arrays when available
  return rows.map(row => {
    const ddId = row.dd_id as number | null;
    const biomechanical_benefits = ddId ? (benefitsByDdId.get(ddId) || null) : null;
    const permanent_limitations = ddId ? (limitationsByDdId.get(ddId) || null) : null;

    return {
      id: row.id,
      record_number: row.record_number,
      created_at: row.created_at,
      disability_information: row.disability_type ? {
        disability_type: row.disability_type,
        insurance_type: row.insurance_type,
        disability_origin: row.disability_origin,
        disability_certificate: row.disability_certificate,
        conapdis_registration: row.conapdis_registration,
        medical_diagnosis: row.medical_diagnosis,
        medical_additional: {
          blood_type: row.blood_type,
          diseases: row.medical_conditions,
          permanent_limitations,
          biomechanical_benefits
        }
      } : null,
      complete_personal_data: row.blood_type || row.medical_conditions ? {
        blood_type: row.blood_type,
        diseases: row.medical_conditions
      } : null
    };
  });
}; 