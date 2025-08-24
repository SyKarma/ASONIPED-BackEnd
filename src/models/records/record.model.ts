import { db } from '../../db';

export interface Record {
  id?: number;
  record_number: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  phase?: 'phase1' | 'phase2' | 'phase3' | 'phase4' | 'completed';
  created_at?: Date;
  updated_at?: Date;
  created_by?: number;
}

export interface RecordWithDetails extends Record {
  personal_data?: any;
  disability_data?: any;
  registration_requirements?: any;
  enrollment_form?: any;
  socioeconomic_data?: any;
  documents?: any[];
  notes?: any[];
}

// Generar número único de expediente
export const generateRecordNumber = async (): Promise<string> => {
  const [rows] = await db.query('SELECT COUNT(*) as count FROM records') as [any[], any];
  const count = rows[0].count;
  const year = new Date().getFullYear();
  const paddedCount = String(count + 1).padStart(4, '0');
  return `EXP-${year}-${paddedCount}`;
};

// Crear nuevo expediente
export const createRecord = async (record: Record): Promise<number> => {
  const recordNumber = await generateRecordNumber();
  const [result] = await db.query(
    'INSERT INTO records (record_number, status, phase, created_by) VALUES (?, ?, ?, ?)',
    [recordNumber, record.status || 'draft', record.phase || 'phase1', record.created_by]
  );
  return (result as any).insertId;
};

// Obtener expediente por ID
export const getRecordById = async (id: number): Promise<Record | null> => {
  const [rows] = await db.query('SELECT * FROM records WHERE id = ?', [id]);
  const records = rows as Record[];
  return records.length > 0 ? records[0] : null;
};

// Obtener expediente completo con todos los datos
export const getRecordWithDetails = async (id: number): Promise<RecordWithDetails | null> => {
  try {
    console.log('=== OBTENIENDO DETALLES DEL EXPEDIENTE ===');
    console.log('Record ID:', id);
    
    // Obtener el expediente con datos personales usando LEFT JOIN
    const [rows] = await db.query(
      `SELECT r.*, 
              pd.id as pd_id, pd.full_name, pd.cedula, pd.pcd_name, pd.gender, 
              pd.birth_date, pd.birth_place, pd.address, pd.province, pd.district,
              pd.mother_name, pd.mother_cedula, pd.father_name, pd.father_cedula,
              pd.created_at as pd_created_at, pd.updated_at as pd_updated_at
       FROM records r 
       LEFT JOIN personal_data pd ON r.id = pd.record_id 
       WHERE r.id = ?`,
      [id]
    ) as [any[], any];
    
    if (rows.length === 0) {
      console.log('No se encontró el expediente');
      return null;
    }
    
    const row = rows[0];
    console.log('Expediente encontrado:', row);
    
    // Construir el objeto personal_data si existe
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
        district: row.district,
        mother_name: row.mother_name,
        mother_cedula: row.mother_cedula,
        father_name: row.father_name,
        father_cedula: row.father_cedula,
        created_at: row.pd_created_at,
        updated_at: row.pd_updated_at
      };
    }
    
    // Obtener datos de discapacidad
    let disabilityData = null;
    try {
      const [disabilityRows] = await db.query('SELECT * FROM disability_data WHERE record_id = ?', [id]) as [any[], any];
      if (disabilityRows.length > 0) {
        disabilityData = disabilityRows[0];
        console.log('Datos de discapacidad encontrados:', disabilityData);
      }
    } catch (err) {
      console.log('Error obteniendo datos de discapacidad (tabla puede no existir):', err);
    }
    
    // Obtener requisitos de inscripción
    let registrationRequirements = null;
    try {
      const [requirementsRows] = await db.query('SELECT * FROM registration_requirements WHERE record_id = ?', [id]) as [any[], any];
      if (requirementsRows.length > 0) {
        registrationRequirements = requirementsRows[0];
        console.log('Requisitos de inscripción encontrados:', registrationRequirements);
      }
    } catch (err) {
      console.log('Error obteniendo requisitos de inscripción (tabla puede no existir):', err);
    }
    
    // Obtener boleta de matrícula
    let enrollmentForm = null;
    try {
      const [enrollmentRows] = await db.query('SELECT * FROM enrollment_form WHERE record_id = ?', [id]) as [any[], any];
      if (enrollmentRows.length > 0) {
        enrollmentForm = enrollmentRows[0];
        console.log('Boleta de matrícula encontrada:', enrollmentForm);
      }
    } catch (err) {
      console.log('Error obteniendo boleta de matrícula (tabla puede no existir):', err);
    }
    
    // Obtener datos socioeconómicos
    let socioeconomicData = null;
    try {
      const [socioeconomicRows] = await db.query('SELECT * FROM socioeconomic_data WHERE record_id = ?', [id]) as [any[], any];
      if (socioeconomicRows.length > 0) {
        socioeconomicData = socioeconomicRows[0];
        console.log('Datos socioeconómicos encontrados:', socioeconomicData);
      }
    } catch (err) {
      console.log('Error obteniendo datos socioeconómicos (tabla puede no existir):', err);
    }
    
    // Obtener documentos
    let documents = [];
    try {
      const [documentsRows] = await db.query('SELECT * FROM record_documents WHERE record_id = ? ORDER BY uploaded_at DESC', [id]) as [any[], any];
      documents = documentsRows;
      console.log('Documentos encontrados:', documents.length);
      console.log('Detalle de documentos:', documents);
      
      // Log detallado de cada documento
      documents.forEach((doc, index) => {
        console.log(`Documento ${index + 1}:`, {
          id: doc.id,
          record_id: doc.record_id,
          document_type: doc.document_type,
          file_name: doc.file_name,
          original_name: doc.original_name,
          uploaded_at: doc.uploaded_at
        });
      });
    } catch (err) {
      console.log('Error obteniendo documentos (tabla puede no existir):', err);
    }
    
    // Obtener notas
    let notesRows = [];
    try {
      const [notesResult] = await db.query('SELECT * FROM record_notes WHERE record_id = ? ORDER BY created_at DESC', [id]) as [any[], any];
      notesRows = notesResult;
      console.log('Notas encontradas:', notesRows.length);
    } catch (err) {
      console.log('Error obteniendo notas (tabla puede no existir):', err);
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
      disability_data: disabilityData,
      registration_requirements: registrationRequirements,
      enrollment_form: enrollmentForm,
      socioeconomic_data: socioeconomicData,
      documents: documents,
      notes: notesRows
    };
    
    console.log('Resultado final:', result);
    return result;
  } catch (err) {
    console.error('Error en getRecordWithDetails:', err);
    throw err;
  }
};

// Obtener todos los expedientes con paginación y filtros
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

  // Transformar los datos para que coincidan con el tipo Record
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

    // Si hay datos personales, crear el objeto personal_data
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

// Actualizar expediente
export const updateRecord = async (id: number, data: Partial<Record>): Promise<void> => {
  const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
  const values = Object.values(data);
  await db.query(`UPDATE records SET ${fields} WHERE id = ?`, [...values, id]);
};

// Eliminar expediente
export const deleteRecord = async (id: number): Promise<void> => {
  try {
    console.log('=== ELIMINANDO EXPEDIENTE ===');
    console.log('Record ID:', id);
    
    // Primero eliminar las notas asociadas
    try {
      const [notesResult] = await db.query('DELETE FROM record_notes WHERE record_id = ?', [id]) as [any, any];
      console.log('Notas eliminadas:', notesResult.affectedRows);
    } catch (err) {
      console.log('Error eliminando notas (tabla puede no existir):', err);
    }
    
    // Luego eliminar los datos personales
    try {
      const [personalDataResult] = await db.query('DELETE FROM personal_data WHERE record_id = ?', [id]) as [any, any];
      console.log('Datos personales eliminados:', personalDataResult.affectedRows);
    } catch (err) {
      console.log('Error eliminando datos personales:', err);
    }
    
    // Finalmente eliminar el expediente
    const [result] = await db.query('DELETE FROM records WHERE id = ?', [id]) as [any, any];
    
    console.log('Resultado de la eliminación del expediente:', result);
    
    if (result.affectedRows === 0) {
      throw new Error(`No se encontró el expediente con ID ${id}`);
    }
    
    console.log('Expediente eliminado exitosamente');
  } catch (err) {
    console.error('Error en deleteRecord:', err);
    throw err;
  }
};

// Cambiar estado del expediente
export const updateRecordStatus = async (id: number, status: Record['status']): Promise<void> => {
  await db.query('UPDATE records SET status = ? WHERE id = ?', [status, id]);
};

// Aprobar fase 1
export const approvePhase1 = async (id: number): Promise<void> => {
  try {
    console.log('=== APROBANDO FASE 1 ===');
    console.log('Record ID:', id);
    
    const [result] = await db.query('UPDATE records SET status = ?, phase = ? WHERE id = ?', ['approved', 'phase2', id]) as [any, any];
    
    console.log('Resultado de la actualización:', result);
    
    if (result.affectedRows === 0) {
      throw new Error(`No se encontró el expediente con ID ${id}`);
    }
    
    console.log('Fase 1 aprobada exitosamente');
  } catch (err) {
    console.error('Error en approvePhase1:', err);
    throw err;
  }
};

// Rechazar fase 1
export const rejectPhase1 = async (id: number): Promise<void> => {
  try {
    console.log('=== RECHAZANDO FASE 1 ===');
    console.log('Record ID:', id);
    
    const [result] = await db.query('UPDATE records SET status = ?, phase = ? WHERE id = ?', ['rejected', 'phase1', id]) as [any, any];
    
    console.log('Resultado de la actualización:', result);
    
    if (result.affectedRows === 0) {
      throw new Error(`No se encontró el expediente con ID ${id}`);
    }
    
    console.log('Fase 1 rechazada exitosamente');
  } catch (err) {
    console.error('Error en rejectPhase1:', err);
    throw err;
  }
};

// Aprobar expediente completo
export const approveRecord = async (id: number): Promise<void> => {
  try {
    console.log('=== APROBANDO EXPEDIENTE COMPLETO ===');
    console.log('Record ID:', id);
    
    const [result] = await db.query('UPDATE records SET status = ?, phase = ? WHERE id = ?', ['active', 'completed', id]) as [any, any];
    
    console.log('Resultado de la actualización:', result);
    
    if (result.affectedRows === 0) {
      throw new Error(`No se encontró el expediente con ID ${id}`);
    }
    
    console.log('Expediente aprobado exitosamente');
  } catch (err) {
    console.error('Error en approveRecord:', err);
    throw err;
  }
};

// Rechazar expediente completo
export const rejectRecord = async (id: number): Promise<void> => {
  try {
    console.log('=== RECHAZANDO EXPEDIENTE COMPLETO ===');
    console.log('Record ID:', id);
    
    const [result] = await db.query('UPDATE records SET status = ?, phase = ? WHERE id = ?', ['rejected', 'phase3', id]) as [any, any];
    
    console.log('Resultado de la actualización:', result);
    
    if (result.affectedRows === 0) {
      throw new Error(`No se encontró el expediente con ID ${id}`);
    }
    
    console.log('Expediente rechazado exitosamente');
  } catch (err) {
    console.error('Error en rejectRecord:', err);
    throw err;
  }
};

// Obtener expediente del usuario actual
export const getUserRecord = async (userId: number): Promise<RecordWithDetails | null> => {
  const [rows] = await db.query('SELECT * FROM records WHERE created_by = ?', [userId]) as [Record[], any];
  
  if (rows.length === 0) {
    return null;
  }
  
  const record = rows[0];
  return await getRecordWithDetails(record.id!);
};

// Verificar si cédula existe
export const checkCedulaExists = async (cedula: string): Promise<boolean> => {
  const [rows] = await db.query('SELECT id FROM personal_data WHERE cedula = ?', [cedula]) as [any[], any];
  return rows.length > 0;
};

// Agregar nota a un expediente
export const addNote = async (recordId: number, noteData: { note: string; type: string; created_by?: number }): Promise<void> => {
  try {
    console.log('=== AGREGANDO NOTA ===');
    console.log('Record ID:', recordId);
    console.log('Note data:', noteData);
    
    const [result] = await db.query(
      'INSERT INTO record_notes (record_id, note, type, created_by) VALUES (?, ?, ?, ?)',
      [recordId, noteData.note, noteData.type, noteData.created_by]
    ) as [any, any];
    
    console.log('Resultado de la inserción de nota:', result);
    console.log('Nota agregada exitosamente');
  } catch (err) {
    console.error('Error en addNote:', err);
    throw err;
  }
};

// Actualizar nota existente
export const updateNote = async (noteId: number, noteData: { note: string; type?: string }): Promise<void> => {
  try {
    console.log('=== ACTUALIZANDO NOTA ===');
    console.log('Note ID:', noteId);
    console.log('Note data:', noteData);
    
    const [result] = await db.query(
      'UPDATE record_notes SET note = ?, type = ? WHERE id = ?',
      [noteData.note, noteData.type || 'note', noteId]
    ) as [any, any];
    
    console.log('Resultado de la actualización de nota:', result);
    
    if (result.affectedRows === 0) {
      throw new Error(`No se encontró la nota con ID ${noteId}`);
    }
    
    console.log('Nota actualizada exitosamente');
  } catch (err) {
    console.error('Error en updateNote:', err);
    throw err;
  }
};

// Eliminar nota
export const deleteNote = async (noteId: number): Promise<void> => {
  try {
    console.log('=== ELIMINANDO NOTA ===');
    console.log('Note ID:', noteId);
    
    const [result] = await db.query(
      'DELETE FROM record_notes WHERE id = ?',
      [noteId]
    ) as [any, any];
    
    console.log('Resultado de la eliminación de nota:', result);
    
    if (result.affectedRows === 0) {
      throw new Error(`No se encontró la nota con ID ${noteId}`);
    }
    
    console.log('Nota eliminada exitosamente');
  } catch (err) {
    console.error('Error en deleteNote:', err);
    throw err;
  }
};

// Obtener estadísticas de expedientes
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

// ===== FUNCIONES PARA FASE 3 =====

// Helper function para limpiar valores
const cleanValue = (value: any): any => {
  if (value === 'null' || value === null || value === undefined) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? JSON.stringify(value) : null;
  }
  return value;
};

// Crear o actualizar datos de discapacidad
export const createOrUpdateDisabilityData = async (recordId: number, disabilityData: any): Promise<void> => {
  try {
    console.log('=== CREANDO/ACTUALIZANDO DATOS DE DISCAPACIDAD ===');
    console.log('Record ID:', recordId);
    console.log('Disability data:', disabilityData);
    
    // Verificar si ya existen datos de discapacidad
    const [existingRows] = await db.query(
      'SELECT id FROM disability_data WHERE record_id = ?',
      [recordId]
    ) as [any[], any];
    
    if (existingRows.length > 0) {
      // Actualizar datos existentes
      await db.query(
        `UPDATE disability_data SET 
         disability_type = ?, medical_diagnosis = ?, insurance_type = ?, 
         biomechanical_benefit = ?, permanent_limitations = ?, limitation_degree = ?,
         disability_origin = ?, disability_certificate = ?, conapdis_registration = ?,
         observations = ?, updated_at = CURRENT_TIMESTAMP
         WHERE record_id = ?`,
        [
          cleanValue(disabilityData.disability_type),
          cleanValue(disabilityData.medical_diagnosis),
          cleanValue(disabilityData.insurance_type),
          cleanValue(disabilityData.biomechanical_benefit),
          cleanValue(disabilityData.permanent_limitations),
          cleanValue(disabilityData.limitation_degree),
          cleanValue(disabilityData.disability_origin),
          cleanValue(disabilityData.disability_certificate),
          cleanValue(disabilityData.conapdis_registration),
          cleanValue(disabilityData.observations),
          recordId
        ]
      );
      console.log('Datos de discapacidad actualizados');
    } else {
      // Crear nuevos datos
      await db.query(
        `INSERT INTO disability_data 
         (record_id, disability_type, medical_diagnosis, insurance_type, biomechanical_benefit,
          permanent_limitations, limitation_degree, disability_origin, disability_certificate,
          conapdis_registration, observations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          recordId,
          cleanValue(disabilityData.disability_type),
          cleanValue(disabilityData.medical_diagnosis),
          cleanValue(disabilityData.insurance_type),
          cleanValue(disabilityData.biomechanical_benefit),
          cleanValue(disabilityData.permanent_limitations),
          cleanValue(disabilityData.limitation_degree),
          cleanValue(disabilityData.disability_origin),
          cleanValue(disabilityData.disability_certificate),
          cleanValue(disabilityData.conapdis_registration),
          cleanValue(disabilityData.observations)
        ]
      );
      console.log('Datos de discapacidad creados');
    }
  } catch (err) {
    console.error('Error en createOrUpdateDisabilityData:', err);
    throw err;
  }
};

// Crear o actualizar requisitos de inscripción
export const createOrUpdateRegistrationRequirements = async (recordId: number, requirements: any): Promise<void> => {
  try {
    console.log('=== CREANDO/ACTUALIZANDO REQUISITOS DE INSCRIPCIÓN ===');
    console.log('Record ID:', recordId);
    console.log('Requirements:', requirements);
    
    // Verificar si ya existen requisitos
    const [existingRows] = await db.query(
      'SELECT id FROM registration_requirements WHERE record_id = ?',
      [recordId]
    ) as [any[], any];
    
    if (existingRows.length > 0) {
      // Actualizar requisitos existentes
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
      console.log('Requisitos de inscripción actualizados');
    } else {
      // Crear nuevos requisitos
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
      console.log('Requisitos de inscripción creados');
    }
  } catch (err) {
    console.error('Error en createOrUpdateRegistrationRequirements:', err);
    throw err;
  }
};

// Crear o actualizar boleta de matrícula
export const createOrUpdateEnrollmentForm = async (recordId: number, enrollmentData: any): Promise<void> => {
  try {
    console.log('=== CREANDO/ACTUALIZANDO BOLETA DE MATRÍCULA ===');
    console.log('Record ID:', recordId);
    console.log('Enrollment data:', enrollmentData);
    
    // Verificar si ya existe boleta
    const [existingRows] = await db.query(
      'SELECT id FROM enrollment_form WHERE record_id = ?',
      [recordId]
    ) as [any[], any];
    
    if (existingRows.length > 0) {
      // Actualizar boleta existente
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
      console.log('Boleta de matrícula actualizada');
    } else {
      // Crear nueva boleta
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
      console.log('Boleta de matrícula creada');
    }
  } catch (err) {
    console.error('Error en createOrUpdateEnrollmentForm:', err);
    throw err;
  }
};

// Crear o actualizar ficha socioeconómica
export const createOrUpdateSocioeconomicData = async (recordId: number, socioeconomicData: any): Promise<void> => {
  try {
    console.log('=== CREANDO/ACTUALIZANDO FICHA SOCIOECONÓMICA ===');
    console.log('Record ID:', recordId);
    console.log('Socioeconomic data:', socioeconomicData);
    console.log('Family income:', socioeconomicData.family_income);
    console.log('Available services:', socioeconomicData.available_services);
    console.log('Working family members:', socioeconomicData.working_family_members);
    
    // Verificar si ya existe ficha
    const [existingRows] = await db.query(
      'SELECT id FROM socioeconomic_data WHERE record_id = ?',
      [recordId]
    ) as [any[], any];
    
    // Preparar datos para inserción
    const servicesJson = Array.isArray(socioeconomicData.available_services) 
      ? JSON.stringify(socioeconomicData.available_services) 
      : socioeconomicData.available_services;
    
    const workingPeopleJson = Array.isArray(socioeconomicData.working_family_members) 
      ? JSON.stringify(socioeconomicData.working_family_members) 
      : socioeconomicData.working_family_members;
    
    console.log('Services JSON:', servicesJson);
    console.log('Working people JSON:', workingPeopleJson);
    
    if (existingRows.length > 0) {
      // Actualizar ficha existente
      await db.query(
        `UPDATE socioeconomic_data SET 
         housing_type = ?, services = ?, family_income = ?, 
         working_people = ?, updated_at = CURRENT_TIMESTAMP
         WHERE record_id = ?`,
        [
          cleanValue(socioeconomicData.housing_type),
          cleanValue(servicesJson),
          cleanValue(socioeconomicData.family_income),
          cleanValue(workingPeopleJson),
          recordId
        ]
      );
      console.log('Ficha socioeconómica actualizada');
    } else {
      // Crear nueva ficha
      await db.query(
        `INSERT INTO socioeconomic_data 
         (record_id, housing_type, services, family_income, working_people)
         VALUES (?, ?, ?, ?, ?)`,
        [
          recordId,
          cleanValue(socioeconomicData.housing_type),
          cleanValue(servicesJson),
          cleanValue(socioeconomicData.family_income),
          cleanValue(workingPeopleJson)
        ]
      );
      console.log('Ficha socioeconómica creada');
    }
  } catch (err) {
    console.error('Error en createOrUpdateSocioeconomicData:', err);
    throw err;
  }
};

// Crear documento
export const createDocument = async (recordId: number, documentData: any): Promise<void> => {
  try {
    console.log('=== CREANDO DOCUMENTO ===');
    console.log('Record ID:', recordId);
    console.log('Document data:', documentData);
    
         await db.query(
       `INSERT INTO record_documents 
        (record_id, document_type, file_path, file_name, file_size, original_name, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
       [
         recordId,
         cleanValue(documentData.document_type),
         cleanValue(documentData.file_path),
         cleanValue(documentData.file_name),
         cleanValue(documentData.file_size),
         cleanValue(documentData.original_name),
         cleanValue(documentData.uploaded_by) || null // Permitir NULL si no hay uploaded_by
       ]
     );
    
    console.log('Documento creado exitosamente');
  } catch (err) {
    console.error('Error en createDocument:', err);
    throw err;
  }
}; 