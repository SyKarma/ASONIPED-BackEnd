import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Allowed document types for records
const ALLOWED_DOCUMENT_TYPES: Record<string, string[]> = {
  'medical_diagnosis': ['.pdf', '.jpg', '.jpeg', '.png'],
  'birth_certificate': ['.pdf', '.jpg', '.jpeg', '.png'],
  'cedula': ['.pdf', '.jpg', '.jpeg', '.png'],
  'photo': ['.jpg', '.jpeg', '.png'],
  'pension_certificate': ['.pdf', '.jpg', '.jpeg', '.png'],
  'study_certificate': ['.pdf', '.jpg', '.jpeg', '.png'],
  'other': ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const recordId = req.params.recordId || 'temp';
    const uploadPath = path.join(__dirname, '../../uploads/records', recordId);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique name: timestamp_originalname
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${timestamp}_${originalName}`;
    cb(null, uniqueName);
  }
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const documentType = req.body.documentType || 'other';
  const allowedExtensions = ALLOWED_DOCUMENT_TYPES[documentType] || ALLOWED_DOCUMENT_TYPES.other;
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedExtensions.join(', ')}`));
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum
    files: 10 // Maximum 10 files per record
  }
});

// Middleware for record document upload - accepts any field
export const uploadRecordDocuments = upload.any();

// Middleware for single document upload
export const uploadSingleDocument = upload.single('document');

// Middleware to validate files before processing
export const validateUpload = (req: any, res: any, next: any) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      error: 'No files have been uploaded' 
    });
  }
  
  // Validate that all files are valid
  const invalidFiles = req.files.filter((file: any) => file.size === 0);
  if (invalidFiles.length > 0) {
    return res.status(400).json({ 
      error: 'Some files are corrupted or empty' 
    });
  }
  
  next();
};

// Middleware to handle upload errors
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File is too large. Maximum 10MB' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Too many files. Maximum 10 files' 
      });
    }
  }
  
  if (error.message.includes('File type not allowed')) {
    return res.status(400).json({ 
      error: error.message 
    });
  }

  next(error);
};

