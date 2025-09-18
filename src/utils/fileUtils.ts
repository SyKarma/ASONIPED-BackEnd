import fs from 'fs';
import path from 'path';

// Get file information
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

// Delete file
export const deleteFile = (filePath: string): boolean => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
};

// Delete directory and all its contents
export const deleteDirectory = (dirPath: string): boolean => {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting directory:', error);
    return false;
  }
};

// Get public URL of file
export const getFileUrl = (recordId: string, fileName: string, googleDriveUrl?: string): string => {
  return googleDriveUrl || `/uploads/records/${recordId}/${fileName}`;
};

// Validate file type
export const isValidFileType = (fileName: string, allowedTypes: string[]): boolean => {
  const extension = path.extname(fileName).toLowerCase();
  return allowedTypes.includes(extension);
};

// Get file size in readable format
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Create directory if it doesn't exist
export const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};