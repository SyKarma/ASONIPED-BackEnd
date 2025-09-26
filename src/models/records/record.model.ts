import { db } from '../../db';
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

// Generate unique record number
export const generateRecordNumber = async (): Promise<string> => {
  const [rows] = await db.query('SELECT COUNT(*) as count FROM records') as [any[], any];
  const count = rows[0].count;
  const year = new Date().getFullYear();
  const paddedCount = String(count + 1).padStart(4, '0');
  return `EXP-${year}-${paddedCount}`;
};

// Create new record
export const createRecord = async (record: Record): Promise<number> => {
  const recordNumber = await generateRecordNumber();
  const [result] = await db.query(
    'INSERT INTO records (record_number, status, phase, created_by) VALUES (?, ?, ?, ?)',
    [recordNumber, record.status || 'draft', record.phase || 'phase1', record.created_by]
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
    // Get record with personal data using LEFT JOIN
    const [rows] = await db.query(
      `SELECT r.*, 
              pd.id as pd_id, pd.full_name, pd.cedula, pd.pcd_name, pd.gender, 
              pd.birth_date, pd.birth_place, pd.address, pd.province, pd.canton, pd.district, pd.phone,
              pd.mother_name, pd.mother_cedula, pd.mother_phone, pd.father_name, pd.father_cedula, pd.father_phone,
              pd.legal_guardian_name, pd.legal_guardian_cedula, pd.legal_guardian_phone,
              pd.created_at as pd_created_at, pd.updated_at as pd_updated_at
       FROM records r 
       LEFT JOIN personal_data pd ON r.id = pd.record_id 
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
      console.log('Retrieved notes for record', id, ':', notesRows);
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
  search?: string
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
    where += '(record_number LIKE ? OR id IN (SELECT record_id FROM personal_data WHERE full_name LIKE ? OR cedula LIKE ?))';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause = where ? `WHERE ${where}` : '';
  
  const [rows] = await db.query(
    `SELECT r.*, 
            pd.id as pd_id, pd.full_name, pd.cedula, pd.pcd_name, pd.gender, 
            pd.birth_date, pd.birth_place, pd.address, pd.province, pd.district,
            pd.mother_name, pd.mother_cedula, pd.father_name, pd.father_cedula,
            pd.created_at as pd_created_at, pd.updated_at as pd_updated_at
     FROM records r 
     LEFT JOIN personal_data pd ON r.id = pd.record_id 
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
      created_by: row.created_by
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
  const [rows] = await db.query('SELECT * FROM records WHERE created_by = ?', [userId]) as [Record[], any];
  
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
    console.log('addNote called with:', { recordId, noteData });
    const [result] = await db.query(
      'INSERT INTO record_notes (record_id, note, type, created_by) VALUES (?, ?, ?, ?)',
      [recordId, noteData.note, noteData.type, noteData.created_by]
    ) as [any, any];
    console.log('Note inserted successfully:', result);
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
    console.log('addStructuredNote called with:', { recordId, noteData });
    
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
    console.log('Structured note inserted successfully:', result);
    
    // Verify what was actually inserted
    const [verifyResult] = await db.query(
      'SELECT * FROM record_notes WHERE id = ?',
      [result.insertId]
    ) as [any[], any];
    console.log('Verification - inserted note:', verifyResult[0]);
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
         enrollment_date = ?, program_type = ?, special_needs = ?, 
         emergency_contact = ?, emergency_phone = ?, updated_at = CURRENT_TIMESTAMP
         WHERE record_id = ?`,
        [
          cleanValue(enrollmentData.enrollment_date),
          cleanValue(enrollmentData.program_type),
          cleanValue(enrollmentData.special_needs),
          cleanValue(enrollmentData.emergency_contact),
          cleanValue(enrollmentData.emergency_phone),
          recordId
        ]
      );
    } else {
      // Create new form
      await db.query(
        `INSERT INTO enrollment_form 
         (record_id, enrollment_date, program_type, special_needs, emergency_contact, emergency_phone)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          cleanValue(enrollmentData.enrollment_date),
          cleanValue(enrollmentData.program_type),
          cleanValue(enrollmentData.special_needs),
          cleanValue(enrollmentData.emergency_contact),
          cleanValue(enrollmentData.emergency_phone)
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
    console.log('=== SAVING SOCIOECONOMIC DATA ===');
    console.log('Record ID:', recordId);
    console.log('Socioeconomic Data:', JSON.stringify(socioeconomicData, null, 2));
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

export const createOrUpdateFamilyInformation = async (recordId: number, familyInformation: any): Promise<void> => {
  try {
    console.log('Creating/updating family information for record:', recordId);
    console.log('Family information:', familyInformation);
    
    await createOrUpdateFamilyInfo(recordId, familyInformation);
    console.log('Family information created/updated successfully');
  } catch (err) {
    console.error('Error in createOrUpdateFamilyInformation:', err);
    throw err;
  }
};

// Update Phase 3 data (for modifications)
export const updatePhase3Data = async (id: number, phase3Data: any): Promise<void> => {
  try {
    console.log('=== UPDATING PHASE 3 DATA ===');
    console.log('Record ID:', id);
    console.log('Phase 3 Data:', JSON.stringify(phase3Data, null, 2));

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

    console.log('Phase 3 data updated successfully');
  } catch (err) {
    console.error('Error in updatePhase3Data:', err);
    throw err;
  }
}; 