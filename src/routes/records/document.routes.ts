import express from 'express';
import path from 'path';
import { uploadRecordDocuments, uploadSingleDocument, validateUpload, handleUploadError } from '../../middleware/upload.middleware';
import { authenticateToken } from '../../middleware/auth.middleware';
import { getFileUrl, deleteFile } from '../../utils/fileUtils';

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
      
      const uploadedFiles = req.files.map((file: any) => ({
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        documentType: documentType || 'other',
        url: getFileUrl(recordId, file.filename)
      }));
      
      res.json({
        message: 'Documents uploaded successfully',
        files: uploadedFiles
      });
    } catch (error) {
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
      
      const file = req.file;
      const fileInfo = {
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        documentType: documentType || 'other',
        url: getFileUrl(recordId, file.filename)
      };
      
      // Here you would save the information to the database
      // await saveDocumentToDatabase(recordId, fileInfo);
      
      res.json({
        message: 'Document uploaded successfully',
        file: fileInfo
      });
    } catch (error) {
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