const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const tokenService = require('./googleDriveToken.service');

class GoogleDriveOAuthService {
  constructor() {
    this.oauth2Client = null;
    this.drive = null;
    this.initialized = false;
  }

  async initialize() {
    try {
      if (this.initialized) {
        return true;
      }

      console.log('🔄 Initializing Google Drive service...');
      
      // Initialize token service first
      const tokenServiceInitialized = await tokenService.initialize();
      if (!tokenServiceInitialized) {
        throw new Error('Failed to initialize token service');
      }

      // Create database table if it doesn't exist
      await tokenService.createDatabaseTable();

      // Ensure we have a valid token
      const hasValidToken = await tokenService.ensureValidToken();
      if (!hasValidToken) {
        throw new Error('No valid Google Drive token available');
      }

      // Get OAuth2 client from token service
      this.oauth2Client = tokenService.oauth2Client;
      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      
      this.initialized = true;
      console.log('✅ Google Drive service initialized successfully');
      return true;
    } catch (error) {
      console.error('❌ Error initializing Google Drive OAuth:', error);
      this.initialized = false;
      return false;
    }
  }

  async uploadFile(fileData, fileName, mimeType, folderId = null) {
    try {
      if (!this.drive) {
        await this.initialize();
      }

      // If still not initialized (e.g., token service failed), prevent null access
      if (!this.drive || !this.oauth2Client) {
        throw new Error('Google Drive service not initialized');
      }

      // Ensure token is valid before making API call
      await tokenService.ensureValidToken();

      const fileMetadata = {
        name: fileName,
        parents: folderId ? [folderId] : undefined
      };

      // Convert Buffer to stream for Google Drive API
      let bodyStream;
      if (Buffer.isBuffer(fileData)) {
        const { Readable } = require('stream');
        bodyStream = Readable.from(fileData);
      } else {
        bodyStream = fs.createReadStream(fileData);
      }

      const media = {
        mimeType: mimeType,
        body: bodyStream
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink'
      });

      return {
        id: response.data.id,
        name: response.data.name,
        webViewLink: response.data.webViewLink
      };
    } catch (error) {
      console.error('Error uploading file to Google Drive:', error);
      throw error;
    }
  }

  async getFile(fileId) {
    try {
      if (!this.drive) {
        await this.initialize();
      }

      // Ensure token is valid before making API call
      await tokenService.ensureValidToken();

      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'id,name,webViewLink,size,createdTime,modifiedTime'
      });

      return response.data;
    } catch (error) {
      console.error('Error getting file from Google Drive:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      if (!this.drive) {
        await this.initialize();
      }

      // Ensure token is valid before making API call
      await tokenService.ensureValidToken();

      await this.drive.files.delete({
        fileId: fileId
      });

      return true;
    } catch (error) {
      console.error('Error deleting file from Google Drive:', error);
      throw error;
    }
  }

  generateFileName(documentType, recordId, originalName) {
    const documentTypeNames = {
      'medical_diagnosis': 'Dictamen Medico',
      'birth_certificate': 'Constancia de Nacimiento',
      'cedula': 'Copia de Cedula',
      'copias_cedulas_familia': 'Copias Cedulas Familia',
      'photo': 'Foto Pasaporte',
      'pension_certificate': 'Constancia de Pension CCSS',
      'pension_alimentaria': 'Constancia de Pension Alimentaria',
      'study_certificate': 'Constancia de Estudio',
      'cuenta_banco_nacional': 'Cuenta Banco Nacional',
      'payment_info': 'Informacion de Pago',
      'other': 'Documento Adicional'
    };

    const typeName = documentTypeNames[documentType] || 'Documento';
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = path.extname(originalName);
    
    return `${typeName}_Expediente#${recordId}_${timestamp}${extension}`;
  }

  async createFolder(folderName, parentFolderId = null) {
    try {
      if (!this.drive) {
        await this.initialize();
      }

      // Ensure token is valid before making API call
      await tokenService.ensureValidToken();

      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentFolderId ? [parentFolderId] : undefined
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id,name'
      });

      return response.data;
    } catch (error) {
      console.error('Error creating folder in Google Drive:', error);
      throw error;
    }
  }

  async listFiles(folderId = null, pageSize = 10) {
    try {
      if (!this.drive) {
        await this.initialize();
      }

      // Ensure token is valid before making API call
      await tokenService.ensureValidToken();

      const query = folderId ? `'${folderId}' in parents` : undefined;
      
      const response = await this.drive.files.list({
        q: query,
        pageSize: pageSize,
        fields: 'nextPageToken, files(id, name, webViewLink, size, createdTime)'
      });

      return response.data.files;
    } catch (error) {
      console.error('Error listing files from Google Drive:', error);
      throw error;
    }
  }

  async getServiceStatus() {
    try {
      const tokenStatus = await tokenService.getServiceStatus();
      return {
        ...tokenStatus,
        serviceInitialized: this.initialized,
        driveAvailable: !!this.drive
      };
    } catch (error) {
      console.error('Error getting service status:', error);
      return {
        hasToken: false,
        isExpired: true,
        isInitialized: false,
        credentialsLoaded: false,
        serviceInitialized: false,
        driveAvailable: false
      };
    }
  }
}

module.exports = new GoogleDriveOAuthService();
