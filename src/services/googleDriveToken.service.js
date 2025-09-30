const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

class GoogleDriveTokenService {
  constructor() {
    this.oauth2Client = null;
    this.drive = null;
    this.db = null;
    this.credentials = null;
  }

  async initialize() {
    try {
      // Load credentials
      const credentialsPath = path.join(__dirname, '../../credentials/oauth-credentials.json');
      
      if (!fs.existsSync(credentialsPath)) {
        throw new Error('Credentials file not found. Please ensure oauth-credentials.json exists in the credentials directory.');
      }

      this.credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      
      // Initialize database connection
      this.db = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'asonipeddigitaltest',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      // Initialize OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        this.credentials.web.client_id,
        this.credentials.web.client_secret,
        'http://localhost:3000/admin/google-drive/auth/callback'
      );

      // Load token from database
      await this.loadTokenFromDatabase();

      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      return true;
    } catch (error) {
      console.error('Error initializing Google Drive Token Service:', error);
      return false;
    }
  }

  async loadTokenFromDatabase() {
    try {
      const [rows] = await this.db.execute(
        'SELECT access_token, refresh_token, expiry_date FROM google_drive_tokens ORDER BY created_at DESC LIMIT 1'
      );

      if (rows.length > 0) {
        const token = rows[0];
        const tokenData = {
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expiry_date: token.expiry_date
        };

        this.oauth2Client.setCredentials(tokenData);
        console.log('✅ Google Drive token loaded from database');
        
        // Check if token needs refresh
        if (this.isTokenExpired(tokenData)) {
          console.log('🔄 Token expired, refreshing...');
          await this.refreshToken();
        }
      } else {
        console.log('⚠️ No token found in database. Manual authorization required.');
        throw new Error('No valid token found. Please run the authorization flow.');
      }
    } catch (error) {
      console.error('Error loading token from database:', error);
      throw error;
    }
  }

  async saveTokenToDatabase(tokenData) {
    try {
      // Ensure all token values are properly defined
      const accessToken = tokenData.access_token || null;
      const refreshToken = tokenData.refresh_token || null;
      
      // Convert expiry_date from Unix timestamp to MySQL datetime format
      let expiryDate = null;
      if (tokenData.expiry_date) {
        try {
          expiryDate = new Date(tokenData.expiry_date).toISOString().slice(0, 19).replace('T', ' ');
        } catch (error) {
          console.error('Error converting expiry date:', error);
          expiryDate = null;
        }
      }
      
      console.log('Token data to save:', {
        accessToken: accessToken ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing',
        expiryDate: expiryDate || 'missing'
      });
      
      await this.db.execute(
        'INSERT INTO google_drive_tokens (access_token, refresh_token, expiry_date, created_at) VALUES (?, ?, ?, NOW())',
        [accessToken, refreshToken, expiryDate]
      );
      console.log('✅ Token saved to database');
    } catch (error) {
      console.error('Error saving token to database:', error);
      throw error;
    }
  }

  isTokenExpired(tokenData) {
    if (!tokenData.expiry_date) return true;
    
    // Handle both Unix timestamp and MySQL datetime formats
    let expiryTime;
    if (typeof tokenData.expiry_date === 'number') {
      // Unix timestamp (milliseconds)
      expiryTime = tokenData.expiry_date;
    } else {
      // MySQL datetime string
      expiryTime = new Date(tokenData.expiry_date).getTime();
    }
    
    const currentTime = new Date().getTime();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    
    return currentTime >= (expiryTime - bufferTime);
  }

  async refreshToken() {
    try {
      console.log('🔄 Refreshing Google Drive token...');
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update OAuth2 client with new credentials
      this.oauth2Client.setCredentials(credentials);
      
      // Save new token to database
      await this.saveTokenToDatabase(credentials);
      
      console.log('✅ Token refreshed successfully');
      return credentials;
    } catch (error) {
      console.error('❌ Error refreshing token:', error);
      
      // If refresh fails, try to get a new token using the refresh token
      if (error.message.includes('invalid_grant')) {
        console.log('🔄 Refresh token expired, attempting to get new token...');
        return await this.getNewToken();
      }
      
      throw error;
    }
  }

  async getNewToken() {
    try {
      console.log('🔑 Getting new Google Drive token...');
      
      // Generate authorization URL
      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/drive.file']
      });

      console.log('⚠️ Manual authorization required!');
      console.log('Please visit this URL to authorize the application:');
      console.log(authUrl);
      console.log('After authorization, the token will be automatically saved.');
      
      // In production, you might want to implement a webhook or admin interface
      // to handle the authorization callback
      throw new Error('Manual authorization required. Please visit the authorization URL.');
      
    } catch (error) {
      console.error('Error getting new token:', error);
      throw error;
    }
  }

  async ensureValidToken() {
    try {
      if (!this.oauth2Client.credentials) {
        await this.loadTokenFromDatabase();
      }

      if (this.isTokenExpired(this.oauth2Client.credentials)) {
        await this.refreshToken();
      }

      return true;
    } catch (error) {
      console.error('Error ensuring valid token:', error);
      return false;
    }
  }

  async createDatabaseTable() {
    try {
      // Create table if it doesn't exist
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS google_drive_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          access_token TEXT NOT NULL,
          refresh_token TEXT NULL,
          expiry_date DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Try to modify existing table to allow NULL values (in case table already exists)
      try {
        await this.db.execute('ALTER TABLE google_drive_tokens MODIFY COLUMN refresh_token TEXT NULL');
        console.log('✅ Updated refresh_token column to allow NULL');
      } catch (alterError) {
        // Column might already be nullable, ignore this error
        console.log('ℹ️ refresh_token column already nullable or table is new');
      }
      
      try {
        await this.db.execute('ALTER TABLE google_drive_tokens MODIFY COLUMN expiry_date DATETIME NULL');
        console.log('✅ Updated expiry_date column to allow NULL');
      } catch (alterError) {
        // Column might already be nullable, ignore this error
        console.log('ℹ️ expiry_date column already nullable or table is new');
      }
      
      console.log('✅ Google Drive tokens table created/verified');
    } catch (error) {
      console.error('Error creating tokens table:', error);
      throw error;
    }
  }

  async getServiceStatus() {
    try {
      const [rows] = await this.db.execute(
        'SELECT COUNT(*) as count FROM google_drive_tokens'
      );
      
      const hasToken = rows[0].count > 0;
      const isExpired = hasToken ? this.isTokenExpired(this.oauth2Client.credentials) : true;
      
      return {
        hasToken,
        isExpired,
        isInitialized: !!this.drive,
        credentialsLoaded: !!this.credentials
      };
    } catch (error) {
      console.error('Error getting service status:', error);
      return {
        hasToken: false,
        isExpired: true,
        isInitialized: false,
        credentialsLoaded: false
      };
    }
  }
}

module.exports = new GoogleDriveTokenService();
