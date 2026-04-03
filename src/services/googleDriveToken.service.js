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
      // Load credentials from environment variables or file
      let credentials;
      
      // Support both GOOGLE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_ID (legacy)
      const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_DRIVE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_DRIVE_CLIENT_SECRET;
      
      if (clientId && clientSecret) {
        // Use environment variables (production/Railway)
        credentials = {
          web: {
            client_id: clientId,
            client_secret: clientSecret
          }
        };
      } else {
        // Fallback to file (local development)
        const credentialsPath = path.join(__dirname, '../../credentials/oauth-credentials.json');
        
        if (!fs.existsSync(credentialsPath)) {
          return false;
        }

        credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
      }

      this.credentials = credentials;
      
      // Initialize database connection - use same logic as main db.ts
      let dbHost = process.env.DB_HOST || 'localhost';
      let dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT.trim()) : 3306;
      
      // Check if MYSQL_PUBLIC_URL is available first (more reliable than internal URL)
      if (process.env.MYSQL_PUBLIC_URL) {
        try {
          const publicUrl = process.env.MYSQL_PUBLIC_URL.trim();
          const match = publicUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
          if (match) {
            dbHost = match[3]; // host (e.g., turntable.proxy.rlwy.net)
            dbPort = Number(match[4]); // port
          }
        } catch {
          // ignore parse errors
        }
      }
      
      // Check if MYSQL_URL is available (only if MYSQL_PUBLIC_URL didn't set dbHost)
      // If dbHost is still the original DB_HOST value, try MYSQL_URL
      const originalDbHost = process.env.DB_HOST || 'localhost';
      if (dbHost === originalDbHost && process.env.MYSQL_URL) {
        try {
          const mysqlUrl = process.env.MYSQL_URL.trim();
          const match = mysqlUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
          if (match) {
            const hostname = match[3];
            // Prefer public URLs over internal ones
            if (hostname.includes('proxy.rlwy.net') || hostname.includes('turntable.proxy.rlwy.net')) {
              dbHost = hostname;
              dbPort = Number(match[4]);
            } else if (hostname.includes('railway.internal')) {
              // Only use internal URL if public URL is not available
              dbHost = hostname;
              dbPort = Number(match[4]);
            }
          }
        } catch {
          // ignore parse errors
        }
      }
      
      // If DB_HOST is still railway.internal, try to use MYSQL_PUBLIC_URL as fallback
      if (dbHost && dbHost.includes('railway.internal') && !dbHost.includes('proxy.rlwy.net')) {
        if (process.env.MYSQL_PUBLIC_URL) {
          try {
            const publicUrl = process.env.MYSQL_PUBLIC_URL.trim();
            const match = publicUrl.match(/mysql:\/\/[^@]+@([^:]+):(\d+)\//);
            if (match) {
              dbHost = match[1];
              dbPort = Number(match[2]);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
      
      this.db = mysql.createPool({
        host: dbHost,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'asonipeddigitaltest',
        port: dbPort,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000
      });

      // Get redirect URI from environment or use default
      const redirectUri = process.env.GOOGLE_REDIRECT_URI || 
                         (process.env.BACKEND_URL ? process.env.BACKEND_URL + '/admin/google-drive/auth/callback' : null) ||
                         'http://localhost:3000/admin/google-drive/auth/callback';

      // Initialize OAuth2 client
      this.oauth2Client = new google.auth.OAuth2(
        this.credentials.web.client_id,
        this.credentials.web.client_secret,
        redirectUri
      );

      // Load token from database
      await this.loadTokenFromDatabase();

      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      return true;
    } catch {
      return false;
    }
  }

  async loadTokenFromDatabase() {
    try {
      // Prefer the most recent token that has a non-null refresh_token
      const [rows] = await this.db.execute(
        `(
          SELECT access_token, refresh_token, expiry_date
          FROM google_drive_tokens
          WHERE refresh_token IS NOT NULL
          ORDER BY created_at DESC
          LIMIT 1
        )
        UNION ALL
        (
          SELECT access_token, refresh_token, expiry_date
          FROM google_drive_tokens
          WHERE refresh_token IS NULL
          ORDER BY created_at DESC
          LIMIT 1
        )
        LIMIT 1`
      );

      if (rows.length > 0) {
        const token = rows[0];
        const tokenData = {
          access_token: token.access_token,
          refresh_token: token.refresh_token,
          expiry_date: token.expiry_date
        };

        // Backfill refresh_token if missing before setting credentials
        if (!tokenData.refresh_token) {
          try {
            const [rtRows] = await this.db.execute(
              `SELECT refresh_token FROM google_drive_tokens
               WHERE refresh_token IS NOT NULL
               ORDER BY created_at DESC
               LIMIT 1`
            );
            if (rtRows && rtRows.length > 0) {
              tokenData.refresh_token = rtRows[0].refresh_token;
            }
          } catch (_e) {}
        }

        this.oauth2Client.setCredentials(tokenData);
        
        // Check if token needs refresh
        if (this.isTokenExpired(tokenData)) {
          // Only attempt refresh if we have a refresh_token after backfill
          if (!this.oauth2Client.credentials.refresh_token) {
            // skip refresh
          } else {
            await this.refreshToken();
          }
        }
      } else {
        throw new Error('No valid token found. Please run the authorization flow.');
      }
    } catch (error) {
      throw error;
    }
  }

  async saveTokenToDatabase(tokenData) {
    try {
      // Ensure all token values are properly defined
      const accessToken = tokenData.access_token || null;
      let refreshToken = tokenData.refresh_token || null;
      
      // Convert expiry_date from Unix timestamp to MySQL datetime format
      let expiryDate = null;
      if (tokenData.expiry_date) {
        try {
          expiryDate = new Date(tokenData.expiry_date).toISOString().slice(0, 19).replace('T', ' ');
        } catch {
          expiryDate = null;
        }
      }
      
      // If Google did not return a refresh_token, reuse the latest non-null one from DB
      if (!refreshToken) {
        try {
          const [rtRows] = await this.db.execute(
            `SELECT refresh_token FROM google_drive_tokens
             WHERE refresh_token IS NOT NULL
             ORDER BY created_at DESC
             LIMIT 1`
          );
          if (rtRows && rtRows.length > 0) {
            refreshToken = rtRows[0].refresh_token;
          }
        } catch (_e) {
          // ignore, fallback to null
        }
      }

      if (refreshToken) {
        // Normal path: insert a new snapshot including refresh token
        await this.db.execute(
          'INSERT INTO google_drive_tokens (access_token, refresh_token, expiry_date, created_at) VALUES (?, ?, ?, NOW())',
          [accessToken, refreshToken, expiryDate]
        );
      } else {
        // No refresh_token returned: update the most recent row that has a refresh_token
        const [existingRtRows] = await this.db.execute(
          `SELECT id FROM google_drive_tokens
           WHERE refresh_token IS NOT NULL
           ORDER BY created_at DESC
           LIMIT 1`
        );

        if (existingRtRows && existingRtRows.length > 0) {
          const id = existingRtRows[0].id;
          await this.db.execute(
            'UPDATE google_drive_tokens SET access_token = ?, expiry_date = ?, created_at = NOW() WHERE id = ?',
            [accessToken, expiryDate, id]
          );
        } else {
          // No prior refresh token in DB; insert anyway (first run scenario)
          await this.db.execute(
            'INSERT INTO google_drive_tokens (access_token, refresh_token, expiry_date, created_at) VALUES (?, ?, ?, NOW())',
            [accessToken, null, expiryDate]
          );
        }
      }
    } catch (error) {
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
      if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.refresh_token) {
        // Try to reload the token from database
        await this.loadTokenFromDatabase();
        
        // Check again after reloading
        if (!this.oauth2Client.credentials || !this.oauth2Client.credentials.refresh_token) {
          throw new Error('No refresh token available after reloading from database.');
        }
      }

      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      // Update OAuth2 client with new credentials
      this.oauth2Client.setCredentials(credentials);
      
      // Save new token to database
      await this.saveTokenToDatabase(credentials);
      
      return credentials;
    } catch (error) {
      // If refresh fails, try to get a new token using the refresh token
      if (typeof error.message === 'string' && error.message.includes('invalid_grant')) {
        return await this.getNewToken();
      }
      
      throw error;
    }
  }

  async getNewToken() {
    throw new Error('Manual authorization required. Please visit the authorization URL.');
  }

  async ensureValidToken() {
    try {
      if (!this.oauth2Client.credentials) {
        await this.loadTokenFromDatabase();
      }

      const isExpired = this.isTokenExpired(this.oauth2Client.credentials);

      if (isExpired) {
        // Ensure we have a refresh_token before attempting refresh
        if (!this.oauth2Client.credentials.refresh_token) {
          // Try to backfill refresh_token from DB
          try {
            const [rtRows] = await this.db.execute(
              `SELECT refresh_token FROM google_drive_tokens
               WHERE refresh_token IS NOT NULL
               ORDER BY created_at DESC
               LIMIT 1`
            );
            if (rtRows && rtRows.length > 0) {
              this.oauth2Client.setCredentials({
                ...this.oauth2Client.credentials,
                refresh_token: rtRows[0].refresh_token
              });
            }
          } catch (_e) {
            // ignore
          }
        }

        await this.refreshToken();
      }

      return true;
    } catch {
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
      } catch (_alterError) {
        // Column might already be nullable, ignore this error
      }
      
      try {
        await this.db.execute('ALTER TABLE google_drive_tokens MODIFY COLUMN expiry_date DATETIME NULL');
      } catch (_alterError) {
        // Column might already be nullable, ignore this error
      }
    } catch (error) {
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
    } catch {
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
