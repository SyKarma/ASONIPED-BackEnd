import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Tipos de documentos permitidos para expedientes
const ALLOWED_DOCUMENT_TYPES: Record<string, string[]> = {
  'medical_diagnosis': ['.pdf', '.jpg', '.jpeg', '.png'],
  'birth_certificate': ['.pdf', '.jpg', '.jpeg', '.png'],
  'cedula': ['.pdf', '.jpg', '.jpeg', '.png'],
  'photo': ['.jpg', '.jpeg', '.png'],
  'pension_certificate': ['.pdf', '.jpg', '.jpeg', '.png'],
  'study_certificate': ['.pdf', '.jpg', '.jpeg', '.png'],
  'other': ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx']
};

// Configuración de almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const recordId = req.params.recordId || 'temp';
    const uploadPath = path.join(__dirname, '../../uploads/records', recordId);
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generar nombre único: timestamp_originalname
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `${timestamp}_${originalName}`;
    cb(null, uniqueName);
  }
});

// Filtro de archivos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const documentType = req.body.documentType || 'other';
  const allowedExtensions = ALLOWED_DOCUMENT_TYPES[documentType] || ALLOWED_DOCUMENT_TYPES.other;
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de archivo no permitido. Tipos permitidos: ${allowedExtensions.join(', ')}`));
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 10 // Máximo 10 archivos por expediente
  }
});

// Middleware para upload de documentos de expediente - acepta cualquier campo
export const uploadRecordDocuments = upload.any();

// Middleware para upload de un solo documento
export const uploadSingleDocument = upload.single('document');

// Middleware para validar archivos antes de procesar
export const validateUpload = (req: any, res: any, next: any) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ 
      error: 'No se han subido archivos' 
    });
  }
  
  // Validar que todos los archivos sean válidos
  const invalidFiles = req.files.filter((file: any) => file.size === 0);
  if (invalidFiles.length > 0) {
    return res.status(400).json({ 
      error: 'Algunos archivos están corruptos o vacíos' 
    });
  }
  
  next();
};

// Middleware para manejar errores de upload
export const handleUploadError = (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'El archivo es demasiado grande. Máximo 10MB' 
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ 
        error: 'Demasiados archivos. Máximo 10 archivos' 
      });
    }
}
  
if (error.message.includes('Tipo de archivo no permitido')) {
  return res.status(400).json({ 
    error: error.message 
  });
}

next(error);
};

