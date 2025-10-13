import express from 'express';
import path from 'path';
import { uploadRecordDocuments, uploadSingleDocument, validateUpload, handleUploadError } from '../../../middleware/upload.middleware';
import { authenticateToken } from '../../../middleware/auth.middleware';
import { getFileUrl, deleteFile } from '../../../utils/fileUtils';
// @ts-ignore
import googleDriveService from '../../services/googleDriveOAuth.service';
import * as RecordModel from '../models/record.model';

const router = express.Router();

// Upload multiple documents for a record
router.post('/:recordId/documents', 
  authenticateToken,
  uploadRecordDocuments,
  validateUpload,
  handleUploadError,
  async (req: any, res: any) => {
    try {
      const { recordId } = req.params;
      const { documentType } = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;
      
      // Get user folder ID from Google Drive
      let userFolderId = null;
      try {
        const parentFolderId = '1g8DwK78x4SOXSRo2jyqQWBCMVkonH38e'; // ASONIPED-Records-Shared folder ID
        const existingFolders = await googleDriveService.listFiles(parentFolderId);
        const recordIdStr = recordId.toString();
        const existingFolder = existingFolders.find(folder => folder.name.includes(recordIdStr));
        
        if (existingFolder) {
          userFolderId = existingFolder.id;
        }
      } catch (folderError) {
        console.error('Error finding user folder:', folderError);
      }

      const uploadedFiles = [];
      
      for (const file of req.files) {
        // Map frontend field name to backend document type
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
          }
          
          return documentType || 'other';
        };
        
        const docType = mapDocumentType(file.fieldname || '', file.originalname || '');
        
        // Upload to Google Drive
        let googleDriveData = null;
        try {
          const driveFileName = googleDriveService.generateFileName(docType, recordId, file.originalname);
          const mimeType = file.mimetype || 'application/octet-stream';
          
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
        } catch (driveError) {
          console.error('Error uploading to Google Drive:', driveError);
        }
        
        // Create document record in database
        await RecordModel.createDocument(recordId, {
          document_type: docType,
          file_path: '', // Don't store local path since we're using Google Drive
          file_name: googleDriveData?.google_drive_name || file.originalname || '',
          file_size: file.size || 0,
          original_name: file.originalname || '',
          uploaded_by: userId,
          ...googleDriveData
        });
        
        uploadedFiles.push({
          originalName: file.originalname,
          fileName: googleDriveData?.google_drive_name || file.originalname,
          fileSize: file.size,
          documentType: docType,
          url: googleDriveData?.google_drive_url || getFileUrl(recordId, file.originalname)
        });
      }
      
      res.json({
        message: 'Documents uploaded successfully',
        files: uploadedFiles
      });
    } catch (error) {
      console.error('Error uploading documents:', error);
      res.status(500).json({ error: 'Error uploading documents' });
    }
  }
);

// Upload single document
router.post('/:recordId/document',
  authenticateToken,
  uploadSingleDocument,
  validateUpload,
  handleUploadError,
  async (req: any, res: any) => {
    try {
      const { recordId } = req.params;
      const { documentType } = req.body;
      const userId = (req as any).user?.userId || (req as any).user?.id;
      
      // Get user folder ID from Google Drive
      let userFolderId = null;
      try {
        const parentFolderId = '1g8DwK78x4SOXSRo2jyqQWBCMVkonH38e'; // ASONIPED-Records-Shared folder ID
        const existingFolders = await googleDriveService.listFiles(parentFolderId);
        const recordIdStr = recordId.toString();
        const existingFolder = existingFolders.find(folder => folder.name.includes(recordIdStr));
        
        if (existingFolder) {
          userFolderId = existingFolder.id;
        }
      } catch (folderError) {
        console.error('Error finding user folder:', folderError);
      }

      const file = req.file;
      
      // Map frontend field name to backend document type
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
        }
        
        return documentType || 'other';
      };
      
      const docType = mapDocumentType(file.fieldname || '', file.originalname || '');
      
      // Upload to Google Drive
      let googleDriveData = null;
      try {
        const driveFileName = googleDriveService.generateFileName(docType, recordId, file.originalname);
        const mimeType = file.mimetype || 'application/octet-stream';
        
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
      } catch (driveError) {
        console.error('Error uploading to Google Drive:', driveError);
      }
      
      // Create document record in database
      await RecordModel.createDocument(recordId, {
        document_type: docType,
        file_path: '', // Don't store local path since we're using Google Drive
        file_name: googleDriveData?.google_drive_name || file.originalname || '',
        file_size: file.size || 0,
        original_name: file.originalname || '',
        uploaded_by: userId,
        ...googleDriveData
      });
      
      const fileInfo = {
        originalName: file.originalname,
        fileName: googleDriveData?.google_drive_name || file.originalname,
        fileSize: file.size,
        documentType: docType,
        url: googleDriveData?.google_drive_url || getFileUrl(recordId, file.originalname)
      };
      
      res.json({
        message: 'Document uploaded successfully',
        file: fileInfo
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Error uploading document' });
    }
  }
);

// Delete document
router.delete('/:recordId/documents/:fileName',
  authenticateToken,
  async (req: any, res: any) => {
    try {
      const { recordId, fileName } = req.params;
      const filePath = path.join(__dirname, `../../uploads/records/${recordId}/${fileName}`);
      
      const deleted = deleteFile(filePath);
      
      if (deleted) {

        
        res.json({ message: 'Document deleted successfully' });
      } else {
        res.status(404).json({ error: 'Document not found' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error deleting document' });
    }
  }
);

export default router;