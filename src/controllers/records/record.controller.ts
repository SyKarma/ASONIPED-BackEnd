import { Request, Response } from 'express';
import * as RecordModel from '../../models/records/record.model';
import * as PersonalDataModel from '../../models/records/personal_data.model';
import { createOrUpdateCompletePersonalData } from '../../models/records/complete_personal_data.model';
import { db } from '../../db';
import jwt from 'jsonwebtoken';
// @ts-ignore
import googleDriveService from '../../services/googleDriveOAuth.service';

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

// Create record directly by admin (bypass workflow)
export const createAdminDirectRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = (req as any).user?.userId || (req as any).user?.id;
    
    if (!adminId) {
      res.status(401).json({ error: 'Admin not authenticated' });
      return;
    }
    
    // Verify admin permissions (optional - you can add admin role checking here)
    // For now, we'll assume any authenticated user can create admin records
    
    // Process form data (same structure as completeRecord)
    const formData = req.body.data ? JSON.parse(req.body.data) : req.body;
    
    const {
      complete_personal_data,
      family_information,
      disability_information,
      socioeconomic_information,
      documentation_requirements
    } = formData;
    
    // Create main record with admin-created status
    const recordId = await RecordModel.createRecord({
      status: 'active', // Skip all workflow phases
      phase: 'completed', // Mark as completed immediately
      created_by: adminId,
      admin_created: true // New field to track admin-created records
    });
    
    console.log('=== ADMIN DIRECT RECORD CREATION ===');
    console.log('Record ID:', recordId);
    console.log('Admin ID:', adminId);
    
    // Create/update complete personal data
    if (complete_personal_data) {
      console.log('=== ADMIN: SAVING COMPLETE PERSONAL DATA ===');
      console.log('Record ID:', recordId);
      console.log('Complete Personal Data:', JSON.stringify(complete_personal_data, null, 2));
      await createOrUpdateCompletePersonalData(recordId, complete_personal_data);
      console.log('Complete personal data saved successfully');
    } else {
      console.log('WARNING: No complete_personal_data provided to admin direct record creation');
    }
    
    // Create/update family information
    if (family_information) {
      await RecordModel.createOrUpdateFamilyInformation(recordId, family_information);
    }
    
    // Create/update disability information
    if (disability_information) {
      console.log('=== ADMIN: SAVING DISABILITY DATA ===');
      console.log('Record ID:', recordId);
      console.log('Disability Information:', JSON.stringify(disability_information, null, 2));
      await RecordModel.createOrUpdateDisabilityData(recordId, disability_information);
      
      // Also create enrollment_form entry with medical information
      if (disability_information.medical_additional) {
        console.log('=== ADMIN: CREATING ENROLLMENT FORM WITH MEDICAL DATA ===');
        const enrollmentData = {
          enrollment_date: new Date().toISOString().split('T')[0], // Today's date
          applicant_full_name: complete_personal_data?.full_name || '',
          applicant_cedula: complete_personal_data?.cedula || '',
          blood_type: disability_information.medical_additional.blood_type || null,
          medical_conditions: disability_information.medical_additional.diseases || null,
          // Add other fields as needed
        };
        
        console.log('Enrollment Data:', JSON.stringify(enrollmentData, null, 2));
        await RecordModel.createOrUpdateEnrollmentForm(recordId, enrollmentData);
      }
    }
    
    // Create/update documentation requirements
    if (documentation_requirements) {
      await RecordModel.createOrUpdateRegistrationRequirements(recordId, documentation_requirements);
    }
    
    // Create/update socioeconomic information
    if (socioeconomic_information) {
      console.log('=== ADMIN: SAVING SOCIOECONOMIC DATA ===');
      console.log('Record ID:', recordId);
      console.log('Socioeconomic Information:', JSON.stringify(socioeconomic_information, null, 2));
      await RecordModel.createOrUpdateSocioeconomicData(recordId, socioeconomic_information);
    }
    
    // Create user folder in ASONIPED-Records-Shared (regardless of files)
    let userFolderId = null;
    try {
      if (complete_personal_data && complete_personal_data.full_name && complete_personal_data.cedula) {
        const folderName = `${complete_personal_data.full_name} - ${complete_personal_data.cedula}`;
        const parentFolderId = '1g8DwK78x4SOXSRo2jyqQWBCMVkonH38e'; // ASONIPED-Records-Shared folder ID
        
        console.log('=== ADMIN: CREATING GOOGLE DRIVE FOLDER ===');
        console.log('Folder Name:', folderName);
        console.log('Parent Folder ID:', parentFolderId);
        
        // Initialize Google Drive service if needed
        const isInitialized = await googleDriveService.initialize();
        if (!isInitialized) {
          console.error('Failed to initialize Google Drive service');
          throw new Error('Google Drive service initialization failed');
        }
        
        // Check if folder already exists in the parent folder
        const existingFolders = await googleDriveService.listFiles(parentFolderId);
        const existingFolder = existingFolders.find(folder => folder.name === folderName);
        
        if (existingFolder) {
          userFolderId = existingFolder.id;
          console.log('Using existing user folder:', existingFolder);
        } else {
          const folderResult = await googleDriveService.createFolder(folderName, parentFolderId);
          userFolderId = folderResult.id;
          console.log('User folder created successfully in ASONIPED-Records-Shared:', folderResult);
        }
      } else {
        console.log('WARNING: Cannot create Google Drive folder - missing complete_personal_data or name/cedula');
      }
    } catch (folderError) {
      console.error('Error creating user folder:', folderError);
      // Continue without folder if creation fails
    }

    // Process documents if they exist
    console.log('=== ADMIN: CHECKING FOR FILES ===');
    console.log('req.files exists:', !!req.files);
    console.log('req.files is array:', Array.isArray(req.files));
    console.log('req.files length:', req.files ? req.files.length : 'N/A');
    if (req.files && Array.isArray(req.files)) {
      console.log('Files received:', req.files.map(f => ({
        fieldname: f.fieldname,
        originalname: f.originalname,
        size: f.size,
        mimetype: f.mimetype
      })));
    }
    
    if (req.files && Array.isArray(req.files)) {

      for (const file of req.files) {
        // Map frontend field name to backend document type (same logic as completeRecord)
        const mapDocumentType = (fieldname: string, originalName: string): string => {
          const fieldnameMapping: { [key: string]: string } = {
            'dictamen_medico': 'medical_diagnosis',
            'constancia_nacimiento': 'birth_certificate',
            'copia_cedula': 'cedula',
            'copias_cedulas_familia': 'copias_cedulas_familia',
            'foto_pasaporte': 'photo',
            'constancia_pension_ccss': 'pension_certificate',
            'constancia_pension_alimentaria': 'pension_alimentaria',
            'constancia_estudio': 'study_certificate',
            'cuenta_banco_nacional': 'cuenta_banco_nacional',
            'informacion_pago': 'payment_info'
          };
          
          if (fieldname && fieldname !== 'documents' && fieldnameMapping[fieldname]) {
            return fieldnameMapping[fieldname];
          }
          
          if (fieldname === 'documents' || fieldname === '') {
            const fileName = originalName.toLowerCase();
            
            if (fileName.includes('dictamen') || fileName.includes('medico')) {
              return 'medical_diagnosis';
            }
            if (fileName.includes('nacimiento') || fileName.includes('birth')) {
              return 'birth_certificate';
            }
            if (fileName.includes('cedula') && fileName.includes('familia')) {
              return 'copias_cedulas_familia';
            }
            if (fileName.includes('cedula') || fileName.includes('identificacion')) {
              return 'cedula';
            }
            if (fileName.includes('foto') || fileName.includes('photo')) {
              return 'photo';
            }
            if (fileName.includes('pension') && fileName.includes('alimentaria')) {
              return 'pension_alimentaria';
            }
            if (fileName.includes('pension') || fileName.includes('ccss')) {
              return 'pension_certificate';
            }
            if (fileName.includes('estudio') || fileName.includes('study')) {
              return 'study_certificate';
            }
            if (fileName.includes('banco') || fileName.includes('nacional')) {
              return 'cuenta_banco_nacional';
            }
            if (fileName.includes('pago') || fileName.includes('payment')) {
              return 'payment_info';
            }
          }
          
          return 'other';
        };
        
        const documentType = mapDocumentType(file.fieldname || '', file.originalname || '');
        
        // Upload to Google Drive
        let googleDriveData = null;
        try {
          console.log('=== ADMIN: UPLOADING FILE TO GOOGLE DRIVE ===');
          console.log('File Name:', file.originalname);
          console.log('Document Type:', documentType);
          console.log('User Folder ID:', userFolderId);
          console.log('File Size:', file.size);
          
          const driveFileName = googleDriveService.generateFileName(documentType, recordId, file.originalname);
          const mimeType = file.mimetype || 'application/octet-stream';
          
          console.log('Generated Drive File Name:', driveFileName);
          console.log('MIME Type:', mimeType);
          
          const driveResult = await googleDriveService.uploadFile(
            file.buffer,
            driveFileName,
            mimeType,
            userFolderId
          );
          
          googleDriveData = {
            google_drive_id: driveResult.id,
            google_drive_url: driveResult.webViewLink,
            google_drive_name: driveResult.name
          };
          
          console.log('File uploaded to Google Drive successfully:', driveResult);
        } catch (driveError) {
          console.error('Error uploading to Google Drive:', driveError);
          const detail = driveError instanceof Error ? driveError.message : String(driveError);
          console.error('Drive Error Details:', detail);
        }
        
        // Create document record
        await RecordModel.createDocument(recordId, {
          document_type: documentType,
          file_path: '',
          file_name: googleDriveData?.google_drive_name || file.originalname || '',
          file_size: file.size || 0,
          original_name: file.originalname || '',
          uploaded_by: adminId,
          ...googleDriveData
        });
      }
    }
    
    // Add admin creation note with detailed attribution
    try {
      // Get admin information for attribution
      const [adminRows] = await db.query(
        'SELECT username, full_name FROM users WHERE id = ?',
        [adminId]
      ) as [any[], any];
      
      const adminInfo = adminRows.length > 0 ? adminRows[0] : null;
      const adminName = adminInfo?.full_name || adminInfo?.username || 'Administrador';
      const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      await RecordModel.addNote(recordId, {
        note: `Expediente creado directamente por administrador: ${adminName} (${currentDate})`,
        type: 'milestone',
        created_by: adminId
      });
      
      console.log(`Admin attribution note added: ${adminName} on ${currentDate}`);
    } catch (noteError) {
      console.error('Error adding admin creation note:', noteError);
    }
    
    res.status(201).json({ 
      message: 'Admin record created successfully',
      record_id: recordId
    });
  } catch (err) {
    console.error('Error creating admin record:', err);
    res.status(500).json({ 
      error: 'Error creating admin record',
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
    const creator = req.query.creator as string | undefined;
    
    console.log('🔍 Controller - getRecords called with:', { page, limit, status, phase, search, creator });
    
    const { records, total } = await RecordModel.getRecords(page, limit, status, phase, search, creator);
    
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

// Get geographic analytics data only
export const getGeographicAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const geographicData = await RecordModel.getGeographicAnalytics();
    res.json(geographicData);
  } catch (error) {
    console.error('Error getting geographic analytics:', error);
    res.status(500).json({ error: 'Error getting geographic analytics' });
  }
};

// Get disability analytics data only
export const getDisabilityAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const disabilityData = await RecordModel.getDisabilityAnalytics();
    res.json(disabilityData);
  } catch (error) {
    console.error('Error getting disability analytics:', error);
    res.status(500).json({ error: 'Error getting disability analytics' });
  }
};

export const getFamilyAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await RecordModel.getFamilyAnalytics();
    res.json(data);
  } catch (error) {
    console.error('Error getting family analytics:', error);
    res.status(500).json({ error: 'Error getting family analytics' });
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
      complete_personal_data,
      family_information,
      disability_information,
      socioeconomic_information,
      documentation_requirements
    } = formData;
    
    // Update record to phase 3
    await RecordModel.updateRecord(id, {
      phase: 'phase3',
      status: 'pending'
    });
    
    // Create/update complete personal data
    if (complete_personal_data) {
      await createOrUpdateCompletePersonalData(id, complete_personal_data);
    }
    
    // Create/update family information
    if (family_information) {
      await RecordModel.createOrUpdateFamilyInformation(id, family_information);
    }
    
    // Create/update disability information
    if (disability_information) {
      console.log('=== CONTROLLER: SAVING DISABILITY DATA ===');
      console.log('Record ID:', id);
      console.log('Disability Information:', JSON.stringify(disability_information, null, 2));
      await RecordModel.createOrUpdateDisabilityData(id, disability_information);
    } else {
      console.log('No disability information provided');
    }
    
    // Create/update documentation requirements
    if (documentation_requirements) {
      await RecordModel.createOrUpdateRegistrationRequirements(id, documentation_requirements);
    }
    
    // Create/update socioeconomic information
    if (socioeconomic_information) {
      console.log('=== CONTROLLER: SAVING SOCIOECONOMIC DATA ===');
      console.log('Record ID:', id);
      console.log('Socioeconomic Information:', JSON.stringify(socioeconomic_information, null, 2));
      await RecordModel.createOrUpdateSocioeconomicData(id, socioeconomic_information);
    } else {
      console.log('No socioeconomic information provided');
    }
    
    // Process documents if they exist
    if (req.files && Array.isArray(req.files)) {
      // Create user folder in ASONIPED-Records-Shared
      let userFolderId = null;
      try {
        if (complete_personal_data && complete_personal_data.full_name && complete_personal_data.cedula) {
          const folderName = `${complete_personal_data.full_name} - ${complete_personal_data.cedula}`;
          const parentFolderId = '1g8DwK78x4SOXSRo2jyqQWBCMVkonH38e'; // ASONIPED-Records-Shared folder ID
          
          console.log('Creating user folder in ASONIPED-Records-Shared:', folderName);
          
          // Check if folder already exists in the parent folder
          const existingFolders = await googleDriveService.listFiles(parentFolderId);
          const existingFolder = existingFolders.find(folder => folder.name === folderName);
          
          if (existingFolder) {
            userFolderId = existingFolder.id;
            console.log('Using existing user folder:', existingFolder);
          } else {
            const folderResult = await googleDriveService.createFolder(folderName, parentFolderId);
            userFolderId = folderResult.id;
            console.log('User folder created successfully in ASONIPED-Records-Shared:', folderResult);
          }
        }
      } catch (folderError) {
        console.error('Error creating user folder:', folderError);
        // Continue without folder if creation fails
      }

      for (const file of req.files) {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        
        // Map frontend field name to backend document type
        const mapDocumentType = (fieldname: string, originalName: string): string => {
          // Direct mapping by fieldname first
          const fieldnameMapping: { [key: string]: string } = {
            'dictamen_medico': 'medical_diagnosis',
            'constancia_nacimiento': 'birth_certificate',
            'copia_cedula': 'cedula',
            'copias_cedulas_familia': 'copias_cedulas_familia',
            'foto_pasaporte': 'photo',
            'constancia_pension_ccss': 'pension_certificate',
            'constancia_pension_alimentaria': 'pension_alimentaria',
            'constancia_estudio': 'study_certificate',
            'cuenta_banco_nacional': 'cuenta_banco_nacional',
            'informacion_pago': 'payment_info'
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
            if (fileName.includes('cedula') && fileName.includes('familia')) {
              return 'copias_cedulas_familia';
            }
            if (fileName.includes('cedula') || fileName.includes('identificacion') || fileName.includes('identificación') || fileName.includes('dni') || fileName.includes('carnet')) {
              return 'cedula';
            }
            if (fileName.includes('foto') || fileName.includes('photo') || fileName.includes('imagen') || fileName.includes('retrato')) {
              return 'photo';
            }
            if (fileName.includes('pension') && fileName.includes('alimentaria')) {
              return 'pension_alimentaria';
            }
            if (fileName.includes('pension') || fileName.includes('ccss') || fileName.includes('pensión')) {
              return 'pension_certificate';
            }
            if (fileName.includes('estudio') || fileName.includes('study') || fileName.includes('academico') || fileName.includes('académico')) {
              return 'study_certificate';
            }
            if (fileName.includes('banco') || fileName.includes('nacional')) {
              return 'cuenta_banco_nacional';
            }
            if (fileName.includes('pago') || fileName.includes('payment') || fileName.includes('informacion')) {
              return 'payment_info';
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
        
        // Upload to Google Drive
        let googleDriveData = null;
        try {
          console.log('Uploading file to Google Drive:', file.originalname);
          const driveFileName = googleDriveService.generateFileName(documentType, id, file.originalname);
          const mimeType = file.mimetype || 'application/octet-stream';
          
          const driveResult = await googleDriveService.uploadFile(
            file.buffer, // Use buffer data directly
            driveFileName,
            mimeType,
            userFolderId // Upload to user's specific folder
          );
          
          googleDriveData = {
            google_drive_id: driveResult.id,
            google_drive_url: driveResult.webViewLink,
            google_drive_name: driveResult.name
          };
          
          console.log('File uploaded to Google Drive successfully:', driveResult);
        } catch (driveError) {
          console.error('Error uploading to Google Drive:', driveError);
          // Continue without Google Drive data if upload fails
        }
        
        // Create document for any user (not just admin) - only store Google Drive data
        await RecordModel.createDocument(id, {
          document_type: documentType,
          file_path: '', // Don't store local path since we're using Google Drive
          file_name: googleDriveData?.google_drive_name || file.originalname || '',
          file_size: file.size || 0,
          original_name: file.originalname || '',
          uploaded_by: userId,
          ...googleDriveData
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
          note: 'Expediente completado - Fase 3',
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

// Create a signed QR token for Attendance (owner or admin)
export const createIdQr = async (req: Request, res: Response): Promise<void> => {
  try {
    const recordId = parseInt(req.params.id);
    const requesterId = (req as any).user?.userId || (req as any).user?.id;
    const roles: string[] = (req as any).user?.roles || [];

    if (!requesterId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Load full record with joined details to access names safely
    const record = await RecordModel.getRecordWithDetails(recordId);
    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    const isOwner = record.created_by === requesterId || (record.handed_over_to_user && record.handed_over_to === requesterId);
    const isAdmin = roles.includes('admin');
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const fullName = record.complete_personal_data?.full_name || record.personal_data?.full_name || undefined;
    const userId = isOwner ? requesterId : undefined;

    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const token = jwt.sign(
      {
        type: 'attendance',
        record_id: recordId,
        user_id: userId,
        full_name: fullName,
      },
      secret,
      { expiresIn: '8h' }
    );

    res.json({ token });
  } catch (err) {
    console.error('Error creating ID QR:', err);
    res.status(500).json({ error: 'Error creating QR token' });
  }
};

// Verify a scanned QR token and stub attendance registration
export const scanAttendance = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body || {};
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }
    const secret = process.env.JWT_SECRET || 'your_jwt_secret_key';
    const payload = jwt.verify(token, secret) as any;
    if (payload?.type !== 'attendance' || !payload?.record_id) {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }
    // Stub: persist attendance later
    res.json({ status: 'ok', record_id: payload.record_id, user_id: payload.user_id, full_name: payload.full_name, verified_at: new Date().toISOString() });
  } catch (err) {
    console.error('Error scanning attendance:', err);
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

// Generate static QR code data for beneficiario attendance
export const generateAttendanceQRData = async (req: Request, res: Response): Promise<void> => {
  try {
    const recordId = parseInt(req.params.id);
    const requesterId = (req as any).user?.userId || (req as any).user?.id;
    const roles: string[] = (req as any).user?.roles || [];

    if (!requesterId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    // Load full record with joined details to access names safely
    const record = await RecordModel.getRecordWithDetails(recordId);
    if (!record) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    const isOwner = record.created_by === requesterId || (record.handed_over_to_user && record.handed_over_to === requesterId);
    const isAdmin = roles.includes('admin');
    if (!isOwner && !isAdmin) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    // Check if record is active (approved and completed)
    if (record.status !== 'active') {
      res.status(400).json({ error: 'Only active records can generate attendance QR codes' });
      return;
    }

    const fullName = record.complete_personal_data?.full_name || record.personal_data?.full_name || undefined;
    
    if (!fullName) {
      res.status(400).json({ error: 'Record must have a full name to generate attendance QR code' });
      return;
    }

    // Generate static QR data as agreed in our design
    const qrData = {
      record_id: recordId,
      name: fullName
    };

    res.json({ 
      qrData,
      record: {
        id: recordId,
        record_number: record.record_number,
        full_name: fullName,
        status: record.status
      }
    });
  } catch (err) {
    console.error('Error generating attendance QR data:', err);
    res.status(500).json({ error: 'Error generating attendance QR data' });
  }
};

// Approve phase 1
export const approvePhase1 = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { comment } = req.body;
    
    console.log('=== APPROVAL PROCESS START ===');
    console.log('Record ID:', id);
    console.log('Comment:', comment);
    console.log('User ID:', (req as any).user?.userId || (req as any).user?.id);
    
    await RecordModel.approvePhase1(id);
    console.log('Record status updated to phase3');
    
    // Add approval comment
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      
      const noteData = {
        note: comment ? `Fase 1 aprobada por el administrador: ${comment}` : 'Fase 1 aprobada por el administrador',
        type: 'activity',
        created_by: userId || null
      };
      
      console.log('Creating approval comment:', noteData);
      await RecordModel.addNote(id, noteData);
      console.log('Approval comment created successfully');
    } catch (noteError) {
      console.error('Error adding approval comment:', noteError);
      
      // Try to add note without created_by if there's an error
      try {
        const fallbackNoteData = {
          note: comment ? `Fase 1 aprobada por el administrador: ${comment}` : 'Fase 1 aprobada por el administrador',
          type: 'activity',
          created_by: undefined
        };
        console.log('Trying fallback note creation:', fallbackNoteData);
        await RecordModel.addNote(id, fallbackNoteData);
        console.log('Fallback approval comment created successfully');
      } catch (fallbackError) {
        console.error('Fallback approval note creation also failed:', fallbackError);
      }
    }
    
    console.log('=== APPROVAL PROCESS COMPLETE ===');
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
    
    // Verify the record exists
    const [recordCheck] = await db.query('SELECT id, record_number, status FROM records WHERE id = ?', [id]) as [any[], any];
    
    if (recordCheck.length === 0) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    
    await RecordModel.rejectPhase1(id);
    
    // Add comment if provided
    if (comment) {
      try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        
        const noteData = {
          note: comment ? `Expediente rechazado por el administrador: ${comment}` : 'Expediente rechazado por el administrador',
          type: 'activity',
          created_by: userId || null
        };
        
        await RecordModel.addNote(id, noteData);
      } catch (noteError) {
        console.error('Error adding rejection comment:', noteError);
        
        // Try to add note without created_by if there's an error
        try {
          const fallbackNoteData = {
            note: comment ? `Expediente rechazado por el administrador: ${comment}` : 'Expediente rechazado por el administrador',
            type: 'activity',
            created_by: undefined
          };
          await RecordModel.addNote(id, fallbackNoteData);
        } catch (fallbackError) {
          console.error('Fallback note creation also failed:', fallbackError);
        }
      }
    }
    
    res.json({ message: 'Phase 1 rejected successfully' });
  } catch (err) {
    console.error('Error rejecting phase 1:', err);
    res.status(500).json({ error: 'Error rejecting phase 1' });
  }
};

// Request modification for phase 1
export const requestPhase1Modification = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { comment } = req.body;
    
    // Verify the record exists
    const [recordCheck] = await db.query('SELECT id, record_number, status FROM records WHERE id = ?', [id]) as [any[], any];
    
    if (recordCheck.length === 0) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    
    await RecordModel.requestPhase1Modification(id);
    
    // Add comment if provided
    if (comment) {
      try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        
        const noteData = {
          note: comment ? `Modificación solicitada por el administrador: ${comment}` : 'Modificación solicitada por el administrador',
          type: 'activity',
          created_by: userId || null
        };
        
        await RecordModel.addNote(id, noteData);
      } catch (noteError) {
        console.error('Error adding modification comment:', noteError);
        
        // Try to add note without created_by if there's an error
        try {
          const fallbackNoteData = {
            note: comment ? `Modificación solicitada por el administrador: ${comment}` : 'Modificación solicitada por el administrador',
            type: 'activity',
            created_by: undefined
          };
          await RecordModel.addNote(id, fallbackNoteData);
        } catch (fallbackError) {
          console.error('Fallback note creation also failed:', fallbackError);
        }
      }
    }
    
    res.json({ message: 'Modification requested successfully' });
  } catch (err) {
    console.error('Error requesting modification:', err);
    res.status(500).json({ error: 'Error requesting modification' });
  }
};

// Request modification for phase 3
export const requestPhase3Modification = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const { comment, sections_to_modify, documents_to_replace } = req.body;
    
    console.log('=== REQUEST PHASE 3 MODIFICATION ===');
    console.log('Record ID:', id);
    console.log('Comment:', comment);
    console.log('Sections to modify:', sections_to_modify);
    console.log('Sections to modify type:', typeof sections_to_modify);
    console.log('Sections to modify length:', sections_to_modify?.length);
    console.log('Documents to replace:', documents_to_replace);
    console.log('Documents to replace type:', typeof documents_to_replace);
    console.log('Documents to replace length:', documents_to_replace?.length);
    
    // Verify the record exists
    const [recordCheck] = await db.query('SELECT id, record_number, status, phase FROM records WHERE id = ?', [id]) as [any[], any];
    
    if (recordCheck.length === 0) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    
    // Check if record is in phase 3
    if (recordCheck[0].phase !== 'phase3') {
      res.status(400).json({ error: 'Record must be in Phase 3 to request modifications' });
      return;
    }
    
    // Update record status to needs_modification
    await RecordModel.updateRecordStatus(id, 'needs_modification');
    
    // Create structured note with sections and documents
    
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      console.log('User ID:', userId);
      
      // Check if user exists in admins table
      let validCreatedBy = null;
      if (userId) {
        try {
          const [adminRows] = await db.query('SELECT id FROM admins WHERE id = ?', [userId]) as [any[], any];
          if (adminRows.length > 0) {
            validCreatedBy = userId;
            console.log('User found in admins table, using as created_by');
          } else {
            console.log('User not found in admins table, setting created_by to null');
          }
        } catch (adminCheckError) {
          console.error('Error checking admin table:', adminCheckError);
          console.log('Setting created_by to null due to error');
        }
      }
      
      // Use the structured note format
      const noteData = {
        note: `Modificación de Fase 3 solicitada por el administrador: ${comment || 'Sin comentarios específicos'}`,
        admin_comment: comment || null,
        sections_to_modify: sections_to_modify ? JSON.stringify(sections_to_modify) : null,
        documents_to_replace: documents_to_replace ? JSON.stringify(documents_to_replace) : null,
        modification_metadata: JSON.stringify({
          requested_at: new Date().toISOString(),
          requested_by: userId || null,
          modification_type: 'phase3_modification'
        }),
        type: 'activity',
        modification_type: 'phase3_modification',
        created_by: validCreatedBy
      };
      
      await RecordModel.addStructuredNote(id, noteData);
      console.log('Structured note created successfully');
    } catch (noteError) {
      console.error('Error adding Phase 3 modification comment:', noteError);
      console.error('Error details:', {
        message: noteError instanceof Error ? noteError.message : 'Unknown error',
        stack: noteError instanceof Error ? noteError.stack : undefined,
        name: noteError instanceof Error ? noteError.name : undefined
      });
      
      // Fallback to simple note if structured note fails
      try {
        const fallbackNoteData = {
          note: `Modificación de Fase 3 solicitada por el administrador: ${comment || 'Sin comentarios específicos'}`,
          type: 'activity',
          created_by: undefined
        };
        console.log('Trying fallback note creation:', fallbackNoteData);
        await RecordModel.addNote(id, fallbackNoteData);
        console.log('Fallback note created successfully');
      } catch (fallbackError) {
        console.error('Fallback note creation also failed:', fallbackError);
      }
    }
    
    res.json({ message: 'Phase 3 modification requested successfully' });
  } catch (err) {
    console.error('Error requesting Phase 3 modification:', err);
    res.status(500).json({ error: 'Error requesting Phase 3 modification' });
  }
};

// Update phase 1 data (for modifications)
export const updatePhase1Data = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const personalData = req.body;
    
    await RecordModel.updatePhase1Data(id, personalData);
    
    res.json({ message: 'Phase 1 data updated successfully' });
  } catch (err) {
    console.error('Error updating phase 1 data:', err);
    res.status(500).json({ error: 'Error updating phase 1 data' });
  }
};

// Update Phase 3 data
export const updatePhase3Data = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const phase3Data = req.body;
    
    console.log('=== UPDATE PHASE 3 DATA CONTROLLER ===');
    console.log('Record ID:', id);
    console.log('Phase 3 Data received:', JSON.stringify(phase3Data, null, 2));
    
    await RecordModel.updatePhase3Data(id, phase3Data);
    
    res.json({ message: 'Phase 3 data updated successfully' });
  } catch (err) {
    console.error('Error updating phase 3 data:', err);
    res.status(500).json({ error: 'Error actualizando datos de fase 3' });
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
    
    // Verify the record exists
    const [recordCheck] = await db.query('SELECT id, record_number, status FROM records WHERE id = ?', [id]) as [any[], any];
    
    if (recordCheck.length === 0) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
    
    await RecordModel.rejectRecord(id);
    
    // Add comment if provided
    if (comment) {
      try {
        const userId = (req as any).user?.userId || (req as any).user?.id;
        
        const noteData = {
          note: comment ? `Expediente rechazado por el administrador: ${comment}` : 'Expediente rechazado por el administrador',
          type: 'activity',
          created_by: userId || null
        };
        
        await RecordModel.addNote(id, noteData);
      } catch (noteError) {
        console.error('Error adding rejection comment:', noteError);
        
        // Try to add note without created_by if there's an error
        try {
          const fallbackNoteData = {
            note: comment ? `Expediente rechazado por el administrador: ${comment}` : 'Expediente rechazado por el administrador',
            type: 'activity',
            created_by: undefined
          };
          await RecordModel.addNote(id, fallbackNoteData);
        } catch (fallbackError) {
          console.error('Fallback note creation also failed:', fallbackError);
        }
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

// Admin record edit with override capability
export const updateRecordAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const recordId = parseInt(req.params.id);
    const adminId = (req as any).user?.userId || (req as any).user?.id;
    
    if (!adminId) {
      res.status(401).json({ error: 'Admin not authenticated' });
      return;
    }

    if (!recordId) {
      res.status(400).json({ error: 'Invalid record ID' });
      return;
    }

    // Check if record exists
    const existingRecord = await RecordModel.getRecordById(recordId);
    if (!existingRecord) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    const formData = req.body.data ? JSON.parse(req.body.data) : req.body;
    const {
      complete_personal_data, family_information, disability_information,
      socioeconomic_information, documentation_requirements
    } = formData;

    console.log('=== ADMIN RECORD UPDATE ===');
    console.log('Record ID:', recordId);
    console.log('Admin ID:', adminId);
    console.log('Form Data:', formData);

    // Update complete personal data
    if (complete_personal_data) {
      try {
        console.log('Updating complete personal data for record:', recordId);
        await createOrUpdateCompletePersonalData(recordId, complete_personal_data);
        console.log('Complete personal data updated successfully');
      } catch (error) {
        console.error('Error updating complete personal data:', error);
        throw error;
      }
    }

    // Update family information
    if (family_information) {
      try {
        console.log('Updating family information for record:', recordId);
        await RecordModel.createOrUpdateFamilyInformation(recordId, family_information);
        console.log('Family information updated successfully');
      } catch (error) {
        console.error('Error updating family information:', error);
        throw error;
      }
    }

    // Update disability information
    if (disability_information) {
      try {
        console.log('Updating disability information for record:', recordId);
        await RecordModel.createOrUpdateDisabilityData(recordId, disability_information);
        console.log('Disability information updated successfully');
      } catch (error) {
        console.error('Error updating disability information:', error);
        throw error;
      }
    }

    // Update socioeconomic information
    if (socioeconomic_information) {
      try {
        console.log('Updating socioeconomic information for record:', recordId);
        await RecordModel.createOrUpdateSocioeconomicData(recordId, socioeconomic_information);
        console.log('Socioeconomic information updated successfully');
      } catch (error) {
        console.error('Error updating socioeconomic information:', error);
        throw error;
      }
    }

    // Handle documentation requirements and file uploads
    if (documentation_requirements) {
      // Process existing documents
      if (documentation_requirements.existing_documents) {
        for (const doc of documentation_requirements.existing_documents) {
          if (doc.id) {
            await RecordModel.updateDocument(doc.id, {
              document_type: doc.document_type,
              original_name: doc.original_name
            });
          }
        }
      }

      // Process new document uploads
      if (documentation_requirements.documents) {
        for (const doc of documentation_requirements.documents) {
          if (doc.file) {
            try {
              // Upload to Google Drive
              const googleDriveData = await googleDriveService.uploadFile(
                doc.file,
                `expedientes/expediente-${recordId}/documentos`,
                doc.original_name
              );

              // Create document record
              await RecordModel.createDocument(recordId, {
                document_type: doc.document_type,
                file_path: googleDriveData.webViewLink,
                file_name: googleDriveData.name,
                file_size: doc.file.size,
                original_name: doc.original_name,
                uploaded_by: adminId,
                ...googleDriveData
              });
            } catch (uploadError) {
              console.error('Error uploading document:', uploadError);
              // Continue with other documents even if one fails
            }
          }
        }
      }
    }

    // Add admin edit note
    try {
      // Get admin information for attribution
      const [adminRows] = await db.query(
        'SELECT username, full_name FROM users WHERE id = ?',
        [adminId]
      ) as [any[], any];
      
      const adminInfo = adminRows.length > 0 ? adminRows[0] : null;
      const adminName = adminInfo?.full_name || adminInfo?.username || 'Administrador';
      const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      await RecordModel.addNote(recordId, {
        note: `Expediente editado por administrador: ${adminName} (${currentDate})`,
        type: 'activity',
        created_by: adminId
      });
      
      console.log(`Admin edit note added: ${adminName} on ${currentDate}`);
    } catch (noteError) {
      console.error('Error adding admin edit note:', noteError);
    }

    res.status(200).json({ 
      message: 'Record updated successfully by admin',
      record_id: recordId
    });
  } catch (err) {
    console.error('Error updating admin record:', err);
    res.status(500).json({
      error: 'Error updating admin record',
      details: (err as Error).message || String(err)
    });
  }
};

// Hand over admin-created record to user
export const handoverRecordToUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const recordId = parseInt(req.params.id);
    const adminId = (req as any).user?.userId || (req as any).user?.id;
    const { userId } = req.body;
    
    if (!adminId) {
      res.status(401).json({ error: 'Admin not authenticated' });
      return;
    }

    if (!recordId || !userId) {
      res.status(400).json({ error: 'Record ID and User ID are required' });
      return;
    }

    // Check if record exists and is admin-created
    const existingRecord = await RecordModel.getRecordById(recordId);
    if (!existingRecord) {
      res.status(404).json({ error: 'Record not found' });
      return;
    }

    if (!existingRecord.admin_created) {
      res.status(400).json({ error: 'Only admin-created records can be handed over' });
      return;
    }

    // If already handed over, allow reassignment only if to a different user
    if (existingRecord.handed_over_to_user) {
      if (existingRecord.handed_over_to === userId) {
        res.status(400).json({ error: 'Record is already handed over to this user' });
        return;
      }
      // else: allow reassignment below after validations
    }

    // Check if user exists
    const [userRows] = await db.query(
      'SELECT id, username, full_name FROM users WHERE id = ?',
      [userId]
    ) as [any[], any];

    if (userRows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = userRows[0];

    // Ensure target user is not admin
    const [roleRows] = await db.query(
      `SELECT 1 FROM user_role_assignments ura
       JOIN user_roles ur ON ur.id = ura.role_id
       WHERE ura.user_id = ? AND ur.name = 'admin' LIMIT 1`,
      [userId]
    ) as [any[], any];
    if (roleRows.length > 0) {
      res.status(400).json({ error: 'Cannot hand over records to admin users' });
      return;
    }

    // Ensure target user does not already have another record
    const [recordCountRows] = await db.query(
      `SELECT COUNT(*) AS cnt FROM records 
       WHERE (created_by = ? OR (handed_over_to_user = TRUE AND handed_over_to = ?))
         AND id <> ?`,
      [userId, userId, recordId]
    ) as [any[], any];
    const hasOtherRecord = (recordCountRows[0]?.cnt || 0) > 0;
    if (hasOtherRecord) {
      res.status(400).json({ error: 'User already has a record' });
      return;
    }

    // Update record with handover or reassignment information
    await db.query(
      `UPDATE records 
       SET handed_over_to_user = TRUE,
           handed_over_to = ?,
           handed_over_at = NOW(),
           handed_over_by = ?
       WHERE id = ?`,
      [userId, adminId, recordId]
    );

    // Add handover note
    try {
      // Get admin information for attribution
      const [adminRows] = await db.query(
        'SELECT username, full_name FROM users WHERE id = ?',
        [adminId]
      ) as [any[], any];
      
      const adminInfo = adminRows.length > 0 ? adminRows[0] : null;
      const adminName = adminInfo?.full_name || adminInfo?.username || 'Administrador';
      const currentDate = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const actionVerb = existingRecord.handed_over_to_user ? 'reasignado' : 'entregado';
      await RecordModel.addNote(recordId, {
        note: `Expediente ${actionVerb} al usuario ${user.full_name || user.username} por administrador: ${adminName} (${currentDate})`,
        type: 'milestone',
        created_by: adminId
      });
      
      console.log(`Handover note added: ${adminName} handed over to ${user.full_name || user.username} on ${currentDate}`);
    } catch (noteError) {
      console.error('Error adding handover note:', noteError);
    }

    res.status(200).json({ 
      message: existingRecord.handed_over_to_user ? 'Record successfully reassigned to user' : 'Record successfully handed over to user',
      record_id: recordId,
      user: {
        id: user.id,
        username: user.username,
        full_name: user.full_name
      }
    });
  } catch (err) {
    console.error('Error handing over record:', err);
    res.status(500).json({
      error: 'Error handing over record',
      details: (err as Error).message || String(err)
    });
  }
};