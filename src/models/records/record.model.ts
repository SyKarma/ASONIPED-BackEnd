import { db } from '../../db';

export interface Record {
  id?: number;
  record_number: string;
  status?: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
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
    'INSERT INTO records (record_number, status, created_by) VALUES (?, ?, ?)',
    [recordNumber, record.status || 'draft', record.created_by]
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
  const [rows] = await db.query('SELECT * FROM records WHERE id = ?', [id]);
  const records = rows as Record[];
  
  if (records.length === 0) return null;
  
  const record = records[0];
  
  // Obtener datos personales
  const [personalData] = await db.query('SELECT * FROM personal_data WHERE record_id = ?', [id]);
  
  // Obtener datos de discapacidad
  const [disabilityData] = await db.query('SELECT * FROM disability_data WHERE record_id = ?', [id]);
  
  // Obtener requisitos de inscripción
  const [registrationRequirements] = await db.query('SELECT * FROM registration_requirements WHERE record_id = ?', [id]);
  
  // Obtener boleta de matrícula
  const [enrollmentForm] = await db.query('SELECT * FROM enrollment_form WHERE record_id = ?', [id]);
  
  // Obtener datos socioeconómicos
  const [socioeconomicData] = await db.query('SELECT * FROM socioeconomic_data WHERE record_id = ?', [id]);
  
  // Obtener documentos
  const [documents] = await db.query('SELECT * FROM record_documents WHERE record_id = ?', [id]);
  
  // Obtener notas
  const [notes] = await db.query('SELECT * FROM record_notes WHERE record_id = ? ORDER BY created_at DESC', [id]);
  
  return {
    ...record,
    personal_data: personalData[0] || null,
    disability_data: disabilityData[0] || null,
    registration_requirements: registrationRequirements[0] || null,
    enrollment_form: enrollmentForm[0] || null,
    socioeconomic_data: socioeconomicData[0] || null,
    documents: documents,
    notes: notes
  };
};

// Obtener todos los expedientes con paginación y filtros
export const getRecords = async (
  page = 1,
  limit = 10,
  status?: string,
  search?: string
): Promise<{ records: Record[]; total: number }> => {
  const offset = (page - 1) * limit;
  let where = '';
  const params: any[] = [];

  if (status) {
    where += 'status = ?';
    params.push(status);
  }
  
  if (search) {
    if (where) where += ' AND ';
    where += '(record_number LIKE ? OR id IN (SELECT record_id FROM personal_data WHERE full_name LIKE ? OR cedula LIKE ?))';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const whereClause = where ? `WHERE ${where}` : '';
  
  const [rows] = await db.query(
    `SELECT * FROM records ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  
  const [countRows] = await db.query(
    `SELECT COUNT(*) as count FROM records ${whereClause}`,
    params
  );
  
  const total = (countRows as any)[0].count;
  return { records: rows as Record[], total };
};

// Actualizar expediente
export const updateRecord = async (id: number, data: Partial<Record>): Promise<void> => {
  await db.query('UPDATE records SET ? WHERE id = ?', [data, id]);
};

// Eliminar expediente
export const deleteRecord = async (id: number): Promise<void> => {
  await db.query('DELETE FROM records WHERE id = ?', [id]);
};

// Cambiar estado del expediente
export const updateRecordStatus = async (id: number, status: Record['status']): Promise<void> => {
  await db.query('UPDATE records SET status = ? WHERE id = ?', [status, id]);
};

// Obtener estadísticas de expedientes
export const getRecordStats = async () => {
  const [statusStats] = await db.query(`
    SELECT status, COUNT(*) as count 
    FROM records 
    GROUP BY status
  `);
  
  const [monthlyStats] = await db.query(`
    SELECT 
      DATE_FORMAT(created_at, '%Y-%m') as month,
      COUNT(*) as count
    FROM records 
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
    GROUP BY month
    ORDER BY month DESC
  `);
  
  return {
    statusStats,
    monthlyStats
  };
}; 