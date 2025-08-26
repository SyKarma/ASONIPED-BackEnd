import { Request, Response } from 'express';
import * as RecordModel from '../../models/records/record.model';
import * as PersonalDataModel from '../../models/records/personal_data.model';
import { db } from '../../db';

// Create new record
export const createRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { personal_data, ...recordData } = req.body;
    const userId = (req as any).user?.userId || (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    // Create main record
    const recordId = await RecordModel.createRecord({
      ...recordData,
      status: 'pending',
      created_by: userId
    });
    
    // Create personal data if provided
    if (personal_data) {
      try {
        await PersonalDataModel.createPersonalData({
          ...personal_data,
          record_id: recordId
        });
      } catch (personalDataError) {
        console.error('ERROR creating personal data:', personalDataError);
        throw personalDataError;
      }
    }
    
    res.status(201).json({ 
      message: 'Record created successfully',
      record_id: recordId
    });
  } catch (err) {
    console.error('Error creating record:', err);
    res.status(500).json({ 
      error: 'Error creating record',
      details: (err as Error).message || String(err)
    });
  }
};

// Get record by ID
export const getRecordById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const record = await RecordModel.getRecordWithDetails(id);
    
    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    
    res.json(record);
  } catch (err) {
    console.error('Error getting record:', err);
    res.status(500).json({ error: 'Error getting record' });
  }
};

// Get all records with filters
export const getRecords = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;
    const phase = req.query.phase as string | undefined;
    const search = req.query.search as string | undefined;
    
    const { records, total } = await RecordModel.getRecords(page, limit, status, phase, search);
    
    res.json({
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err) {
    console.error('Error getting records:', err);
    res.status(500).json({ error: 'Error getting records' });
  }
};

// Update record
export const updateRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { personal_data, ...recordData } = req.body;
    
    // Update main record
    await RecordModel.updateRecord(id, recordData);
    
    // Update personal data if provided
    if (personal_data) {
      const existingPersonalData = await PersonalDataModel.getPersonalDataByRecordId(id);
      
      if (existingPersonalData) {
        await PersonalDataModel.updatePersonalData(id, personal_data);
      } else {
        await PersonalDataModel.createPersonalData({
          ...personal_data,
          record_id: id
        });
      }
    }
    
    res.json({ message: 'Record updated successfully' });
  } catch (err) {
    console.error('Error updating record:', err);
    res.status(500).json({ error: 'Error updating record' });
  }
};

// Complete record (Phase 3)
export const completeRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid record ID' });
      return;
    }
    
    // Verify record exists and is in phase 2
    const existingRecord = await RecordModel.getRecordById(id);
    if (!existingRecord) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    
    if (existingRecord.phase !== 'phase2') {
      res.status(400).json({ error: 'Record must be in Phase 2 to be completed' });
      return;
    }
    
    // Process form data
    const formData = req.body.data ? JSON.parse(req.body.data) : req.body;
    
    const {
      disability_information,
      socioeconomic_information,
      documentation_requirements
    } = formData;
    
    // Update record to phase 3
    await RecordModel.updateRecord(id, {
      phase: 'phase3',
      status: 'pending'
    });
    
    // Create/update disability information
    if (disability_information) {
      await RecordModel.createOrUpdateDisabilityData(id, disability_information);
    }
    
    // Create/update documentation requirements
    if (documentation_requirements) {
      await RecordModel.createOrUpdateRegistrationRequirements(id, documentation_requirements);
    }
    
    // Create/update socioeconomic information
    if (socioeconomic_information) {
      await RecordModel.createOrUpdateSocioeconomicData(id, socioeconomic_information);
    }
    
    // Process documents if they exist
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        
        // Map frontend field name to backend document type
        const mapDocumentType = (fieldname: string, originalName: string): string => {
          // Direct mapping by fieldname first
          const fieldnameMapping: { [key: string]: string } = {
            'dictamen_medico': 'medical_diagnosis',
            'constancia_nacimiento': 'birth_certificate',
            'copia_cedula': 'cedula',
            'copias_cedulas_familia': 'cedula',
            'foto_pasaporte': 'photo',
            'constancia_pension_ccss': 'pension_certificate',
            'constancia_pension_alimentaria': 'pension_certificate',
            'constancia_estudio': 'study_certificate',
            'cuenta_banco_nacional': 'other'
          };
          
          // If we have a specific fieldname, use it
          if (fieldname && fieldname !== 'documents' && fieldnameMapping[fieldname]) {
            return fieldnameMapping[fieldname];
          }
          
          // If fieldname is generic, try to extract type from filename
          if (fieldname === 'documents' || fieldname === '') {
            // First, check if filename already includes type (format: type_filename.pdf)
            const fileNameParts = originalName.split('_');
            if (fileNameParts.length > 1) {
              const possibleType = fileNameParts[0];
              if (fieldnameMapping[possibleType]) {
                return fieldnameMapping[possibleType];
              }
            }
            
            // Search for patterns in filename
            const fileName = originalName.toLowerCase();
            
            // Patterns to identify document types
            if (fileName.includes('dictamen') || fileName.includes('medico') || fileName.includes('diagnostico') || fileName.includes('diagnóstico')) {
              return 'medical_diagnosis';
            }
            if (fileName.includes('nacimiento') || fileName.includes('birth') || fileName.includes('partida')) {
              return 'birth_certificate';
            }
            if (fileName.includes('cedula') || fileName.includes('identificacion') || fileName.includes('identificación') || fileName.includes('dni') || fileName.includes('carnet')) {
              return 'cedula';
            }
            if (fileName.includes('foto') || fileName.includes('photo') || fileName.includes('imagen') || fileName.includes('retrato')) {
              return 'photo';
            }
            if (fileName.includes('pension') || fileName.includes('ccss') || fileName.includes('pensión')) {
              return 'pension_certificate';
            }
            if (fileName.includes('estudio') || fileName.includes('study') || fileName.includes('academico') || fileName.includes('académico')) {
              return 'study_certificate';
            }
            if (fileName.includes('socioeconomica') || fileName.includes('socioeconómica') || fileName.includes('beca') || fileName.includes('solicitud')) {
              return 'other';
            }
            
            // Try to detect by extension and size (heuristic)
            if (fileName.endsWith('.pdf')) {
              // If it's a small PDF, it could be an ID card
              if (originalName.includes('cedula') || originalName.includes('identificacion')) {
                return 'cedula';
              }
              // If it's a PDF with numbers, it could be an official order or document
              if (/\d{4,}/.test(originalName)) {
                return 'other';
              }
            }
          }
          
          return 'other';
        };
        
        const documentType = mapDocumentType(file.fieldname || '', file.originalname || '');
        
        // Create document for any user (not just admin)
        await RecordModel.createDocument(id, {
          document_type: documentType,
          file_path: file.path || '',
          file_name: file.filename || '',
          file_size: file.size || 0,
          original_name: file.originalname || '',
          uploaded_by: userId
        });
      }
    }
    
    // Add completion note (only if user is admin)
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      // Check if user exists in admins table
      const [adminRows] = await db.query('SELECT id FROM admins WHERE id = ?', [userId]) as [any[], any];
      
      if (adminRows.length > 0) {
        await RecordModel.addNote(id, {
          note: 'Record completed - Phase 3',
          type: 'milestone',
          created_by: userId
        });
      }
    } catch (noteError) {
      console.error('Error adding completion note:', noteError);
      // Don't fail operation if note fails
    }
    
    res.json({ 
      message: 'Record completed successfully',
      record_id: id
    });
  } catch (err) {
    console.error('Error completing record:', err);
    res.status(500).json({ 
      error: 'Error completing record',
      details: (err as Error).message || String(err)
    });
  }
};

// Delete record
export const deleteRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    
    if (!id || isNaN(id)) {
      res.status(400).json({ error: 'Invalid record ID' });
      return;
    }
    
    await RecordModel.deleteRecord(id);
    
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error('Error deleting record:', err);
    res.status(500).json({ error: 'Error deleting record' });
  }
};

// Update record status
export const updateRecordStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    
    if (!status || !['draft', 'pending', 'approved', 'rejected', 'active', 'inactive'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }
    
    await RecordModel.updateRecordStatus(id, status);
    
    res.json({ message: 'Record status updated successfully' });
  } catch (err) {
    console.error('Error updating record status:', err);
    res.status(500).json({ error: 'Error updating record status' });
  }
};

// Get record statistics
export const getRecordStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await RecordModel.getRecordStats();
    res.json(stats);
  } catch (err) {
    console.error('Error getting record stats:', err);
    res.status(500).json({ error: 'Error getting statistics' });
  }
};

// Search record by cedula
export const searchRecordByCedula = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cedula } = req.params;
    
    const personalData = await PersonalDataModel.searchByCedula(cedula);
    
    if (!personalData) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    
    const record = await RecordModel.getRecordWithDetails(personalData.record_id);
    
    res.json(record);
  } catch (err) {
    console.error('Error searching record by cedula:', err);
    res.status(500).json({ error: 'Error searching record' });
  }
};

// Check if cedula exists
export const checkCedulaExists = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cedula } = req.params;
    const excludeRecordId = req.query.excludeRecordId ? parseInt(req.query.excludeRecordId as string) : undefined;
    
    const exists = await PersonalDataModel.checkCedulaExists(cedula, excludeRecordId);
    
    res.json({ exists });
  } catch (err) {
    console.error('Error checking cedula:', err);
    res.status(500).json({ error: 'Error checking cedula' });
  }
};

// Get current user's record
export const getMyRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const record = await RecordModel.getUserRecord(userId);
    
    if (!record) {
      res.status(404).json({ error: 'No record found for this user' });
      return;
    }
    
    res.json(record);
  } catch (err) {
    console.error('Error getting user record:', err);
    res.status(500).json({ error: 'Error getting user record' });
  }
};

// Approve phase 1
export const approvePhase1 = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { comment } = req.body;
    
    await RecordModel.approvePhase1(id);
    
    // Add comment if provided (only if user is admin)
    if (comment) {
      try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        // Check if user exists in admins table
        const [adminRows] = await db.query('SELECT id FROM admins WHERE id = ?', [userId]) as [any[], any];
        
        if (adminRows.length > 0) {
          await RecordModel.addNote(id, {
            note: comment,
            type: 'activity',
            created_by: userId
          });
        }
      } catch (noteError) {
        console.error('Error adding comment:', noteError);
        // Don't fail operation if comment fails
      }
    }
    
    res.json({ message: 'Phase 1 approved successfully' });
  } catch (err) {
    console.error('Error approving phase 1:', err);
    res.status(500).json({ error: 'Error approving phase 1' });
  }
};

// Reject phase 1
export const rejectPhase1 = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { comment } = req.body;
    
    await RecordModel.rejectPhase1(id);
    
    // Add comment if provided (only if user is admin)
    if (comment) {
      try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        // Check if user exists in admins table
        const [adminRows] = await db.query('SELECT id FROM admins WHERE id = ?', [userId]) as [any[], any];
        
        if (adminRows.length > 0) {
          await RecordModel.addNote(id, {
            note: comment,
            type: 'activity',
            created_by: userId
          });
        }
      } catch (noteError) {
        console.error('Error adding rejection comment:', noteError);
        // Don't fail operation if comment fails
      }
    }
    
    res.json({ message: 'Phase 1 rejected successfully' });
  } catch (err) {
    console.error('Error rejecting phase 1:', err);
    res.status(500).json({ error: 'Error rejecting phase 1' });
  }
};

// Approve complete record
export const approveRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { comment } = req.body;
    
    await RecordModel.approveRecord(id);
    
    // Add comment if provided (only if user is admin)
    if (comment) {
      try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        // Check if user exists in admins table
        const [adminRows] = await db.query('SELECT id FROM admins WHERE id = ?', [userId]) as [any[], any];
        
        if (adminRows.length > 0) {
          await RecordModel.addNote(id, {
            note: comment,
            type: 'milestone',
            created_by: userId
          });
        }
      } catch (noteError) {
        console.error('Error adding approval comment:', noteError);
        // Don't fail operation if comment fails
      }
    }
    
    res.json({ message: 'Record approved successfully' });
  } catch (err) {
    console.error('Error approving record:', err);
    res.status(500).json({ error: 'Error approving record' });
  }
};

// Reject complete record
export const rejectRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { comment } = req.body;
    
    await RecordModel.rejectRecord(id);
    
    // Add comment if provided (only if user is admin)
    if (comment) {
      try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        // Check if user exists in admins table
        const [adminRows] = await db.query('SELECT id FROM admins WHERE id = ?', [userId]) as [any[], any];
        
        if (adminRows.length > 0) {
          await RecordModel.addNote(id, {
            note: comment,
            type: 'activity',
            created_by: userId
          });
        }
      } catch (noteError) {
        console.error('Error adding rejection comment:', noteError);
        // Don't fail operation if comment fails
      }
    }
    
    res.json({ message: 'Record rejected successfully' });
  } catch (err) {
    console.error('Error rejecting record:', err);
    res.status(500).json({ error: 'Error rejecting record' });
  }
};

// Check cedula availability
export const checkCedulaAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cedula } = req.params;
    const excludeRecordId = req.query.excludeRecordId ? parseInt(req.query.excludeRecordId as string) : undefined;
    
    const exists = await PersonalDataModel.checkCedulaExists(cedula, excludeRecordId);
    
    if (exists) {
      res.status(409).json({ error: 'Cedula already registered' });
      return;
    }
    
    res.json({ available: true });
  } catch (err) {
    console.error('Error checking cedula availability:', err);
    res.status(500).json({ error: 'Error checking cedula availability' });
  }
};

// Update note
export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const noteId = parseInt(req.params.noteId);
    const { note, type } = req.body;
    
    if (!note || note.trim() === '') {
      res.status(400).json({ error: 'Note cannot be empty' });
      return;
    }
    
    await RecordModel.updateNote(noteId, { note: note.trim(), type });
    
    res.json({ message: 'Note updated successfully' });
  } catch (err) {
    console.error('Error updating note:', err);
    res.status(500).json({ error: 'Error updating note' });
  }
};

// Delete note
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const noteId = parseInt(req.params.noteId);
    
    await RecordModel.deleteNote(noteId);
    
    res.json({ message: 'Note deleted successfully' });
  } catch (err) {
    console.error('Error deleting note:', err);
    res.status(500).json({ error: 'Error deleting note' });
  }
};

// Temporary function to verify database structure
export const debugDatabase = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check records table
    const [recordsStructure] = await db.query('DESCRIBE records');
    
    // Check personal_data table
    try {
      const [personalDataStructure] = await db.query('DESCRIBE personal_data');
      
      // Check if there are records in personal_data
      const [personalDataCount] = await db.query('SELECT COUNT(*) as count FROM personal_data');
      
      res.json({ 
        message: 'Debug info logged to console',
        recordsStructure,
        personalDataStructure,
        personalDataCount,
        personalDataExists: true
      });
    } catch (personalDataError) {
      // Check if there are records in records
      const [recordsCount] = await db.query('SELECT COUNT(*) as count FROM records');
      
      res.json({ 
        message: 'Debug info logged to console',
        recordsStructure,
        recordsCount,
        personalDataExists: false,
        personalDataError: (personalDataError as Error).message
      });
    }
  } catch (err) {
    console.error('Error in debugDatabase:', err);
    res.status(500).json({ error: 'Error getting debug info', details: (err as Error).message || err });
  }
};

// Simple function to check if personal_data exists
export const checkPersonalDataTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const [result] = await db.query('SHOW TABLES LIKE "personal_data"');
    const exists = (result as any[]).length > 0;
    
    if (exists) {
      const [structure] = await db.query('DESCRIBE personal_data');
      res.json({ exists: true, structure });
    } else {
      res.json({ exists: false, message: 'personal_data table does not exist' });
    }
  } catch (err) {
    console.error('Error checking personal_data table:', err);
    res.status(500).json({ error: 'Error checking table', details: (err as Error).message });
  }
};

 