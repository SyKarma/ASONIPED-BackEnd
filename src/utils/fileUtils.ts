import fs from 'fs';
import path from 'path';

// Obtener información del archivo
export const getFileInfo = (filePath: string) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      exists: true
    };
  } catch (error) {
    return { exists: false };
  }
};

// Eliminar archivo
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    return false;
  }
};

// Eliminar directorio y todo su contenido
export const deleteDirectory = (dirPath: string): boolean => {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error eliminando directorio:', error);
    return false;
  }
};

// Obtener URL pública del archivo
export const getFileUrl = (recordId: string, fileName: string): string => {
  return `/uploads/records/${recordId}/${fileName}`;
};

// Validar tipo de archivo
export const isValidFileType = (fileName: string, allowedTypes: string[]): boolean => {
  const extension = path.extname(fileName).toLowerCase();
  return allowedTypes.includes(extension);
};

// Obtener tamaño de archivo en formato legible
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Crear directorio si no existe
export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};