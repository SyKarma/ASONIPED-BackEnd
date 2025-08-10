import express from 'express';
import path from 'path';
import { uploadRecordDocuments, uploadSingleDocument, validateUpload, handleUploadError } from '../../middleware/upload.middleware';
import { authenticateToken } from '../../middleware/auth.middleware';
import { getFileUrl, deleteFile } from '../../utils/fileUtils';

const router = express.Router();

// Upload de múltiples documentos para un expediente
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
      
      // Aquí guardarías la información en la base de datos
      // await saveDocumentsToDatabase(recordId, uploadedFiles);
      
      res.json({
        message: 'Documentos subidos exitosamente',
        files: uploadedFiles
      });
    } catch (error) {
      res.status(500).json({ error: 'Error subiendo documentos' });
    }
  }
);

// Upload de un solo documento
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
      
      // Aquí guardarías la información en la base de datos
      // await saveDocumentToDatabase(recordId, fileInfo);
      
      res.json({
        message: 'Documento subido exitosamente',
        file: fileInfo
      });
    } catch (error) {
      res.status(500).json({ error: 'Error subiendo documento' });
    }
  }
);

// Eliminar documento
router.delete('/:recordId/documents/:fileName',
  authenticateToken,
  async (req: any, res: any) => {
    try {
      const { recordId, fileName } = req.params;
      const filePath = path.join(__dirname, `../../uploads/records/${recordId}/${fileName}`);
      
      const deleted = deleteFile(filePath);
      
      if (deleted) {
        // Aquí eliminarías la información de la base de datos
        // await deleteDocumentFromDatabase(recordId, fileName);
        
        res.json({ message: 'Documento eliminado exitosamente' });
      } else {
        res.status(404).json({ error: 'Documento no encontrado' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Error eliminando documento' });
    }
  }
);

export default router;